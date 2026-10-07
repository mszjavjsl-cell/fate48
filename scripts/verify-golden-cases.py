#!/usr/bin/env python3
"""Verify golden-case arithmetic without using the future calendar engine."""

from __future__ import annotations

import calendar
import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo


ROOT = Path(__file__).resolve().parents[1]
VECTORS = ROOT / "test-vectors" / "golden-cases.v0.1.json"
SCHEMA = ROOT / "test-vectors" / "golden-cases.schema.json"


def fail(case_id: str, field: str, actual: object, expected: object) -> None:
    raise AssertionError(
        f"{case_id}: {field} mismatch: actual={actual!r}, expected={expected!r}"
    )


def parse_z(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def add_calendar_period(value: datetime, period: dict[str, int]) -> datetime:
    total_months = value.year * 12 + (value.month - 1)
    total_months += period["years"] * 12 + period["months"]
    year, month0 = divmod(total_months, 12)
    month = month0 + 1
    day = min(value.day, calendar.monthrange(year, month)[1])
    result = value.replace(year=year, month=month, day=day)
    return result + timedelta(
        days=period["days"],
        hours=period["hours"],
        minutes=period["minutes"],
        seconds=period["seconds"],
    )


def decompose_elapsed(seconds: int) -> dict[str, int]:
    days, remainder = divmod(seconds, 86_400)
    hours, remainder = divmod(remainder, 3_600)
    minutes, seconds = divmod(remainder, 60)
    return {"days": days, "hours": hours, "minutes": minutes, "seconds": seconds}


def convert_luck_period(elapsed_seconds: int) -> dict[str, int]:
    luck_seconds = elapsed_seconds * 120
    years, remainder = divmod(luck_seconds, 360 * 86_400)
    months, remainder = divmod(remainder, 30 * 86_400)
    days, remainder = divmod(remainder, 86_400)
    hours, remainder = divmod(remainder, 3_600)
    minutes, seconds = divmod(remainder, 60)
    return {
        "years": years,
        "months": months,
        "days": days,
        "hours": hours,
        "minutes": minutes,
        "seconds": seconds,
    }


def validate_schema(data: dict[str, object]) -> str:
    try:
        import jsonschema  # type: ignore[import-not-found]
    except ImportError:
        return "skipped (install jsonschema for structural validation)"

    schema = json.loads(SCHEMA.read_text(encoding="utf-8"))
    jsonschema.Draft202012Validator(schema).validate(data)
    return "ok"


def verify_case(case: dict[str, object]) -> None:
    case_id = str(case["id"])
    input_data = case["input"]
    fixtures = case["fixtures"]
    expected = case["expected"]
    assert isinstance(input_data, dict)
    assert isinstance(fixtures, dict)
    assert isinstance(expected, dict)

    zone = ZoneInfo(str(input_data["timeZone"]))
    birth = datetime.fromisoformat(str(input_data["localDateTime"])).replace(tzinfo=zone)
    actual_offset = birth.strftime("%z")
    formatted_offset = f"{actual_offset[:3]}:{actual_offset[3:]}"
    if formatted_offset != input_data["utcOffset"]:
        fail(case_id, "input.utcOffset", formatted_offset, input_data["utcOffset"])

    term = parse_z(str(fixtures["basisTermLocalDateTime"]))
    term_utc = term.astimezone(timezone.utc)
    expected_term_utc = parse_z(str(fixtures["basisTermUtc"]))
    if term_utc != expected_term_utc:
        fail(case_id, "fixtures.basisTermUtc", term_utc, expected_term_utc)

    direction = str(expected["direction"])
    elapsed = term_utc - birth.astimezone(timezone.utc)
    if direction == "reverse":
        elapsed = -elapsed
    elapsed_seconds = int(elapsed.total_seconds())
    if elapsed_seconds != expected["elapsedSeconds"]:
        fail(case_id, "expected.elapsedSeconds", elapsed_seconds, expected["elapsedSeconds"])

    elapsed_parts = decompose_elapsed(elapsed_seconds)
    if elapsed_parts != expected["elapsedParts"]:
        fail(case_id, "expected.elapsedParts", elapsed_parts, expected["elapsedParts"])

    period = convert_luck_period(elapsed_seconds)
    if period != expected["convertedPeriod"]:
        fail(case_id, "expected.convertedPeriod", period, expected["convertedPeriod"])

    first_transition = add_calendar_period(birth, period)
    expected_transition = parse_z(str(expected["firstTransitionLocalDateTime"]))
    if first_transition != expected_transition:
        fail(
            case_id,
            "expected.firstTransitionLocalDateTime",
            first_transition.isoformat(),
            expected_transition.isoformat(),
        )

    cycles = expected["cycles"]
    assert isinstance(cycles, list)
    for cycle in cycles:
        assert isinstance(cycle, dict)
        period_for_cycle = {
            "years": period["years"] + (int(cycle["ordinal"]) - 1) * 10,
            "months": period["months"],
            "days": period["days"],
            "hours": period["hours"],
            "minutes": period["minutes"],
            "seconds": period["seconds"],
        }
        actual_cycle = add_calendar_period(birth, period_for_cycle)
        expected_cycle = parse_z(str(cycle["transitionLocalDateTime"]))
        if actual_cycle != expected_cycle:
            fail(
                case_id,
                f"cycles[{cycle['ordinal']}].transitionLocalDateTime",
                actual_cycle.isoformat(),
                expected_cycle.isoformat(),
            )


def main() -> int:
    data = json.loads(VECTORS.read_text(encoding="utf-8"))
    schema_result = validate_schema(data)
    cases = data["cases"]
    for case in cases:
        verify_case(case)
        print(f"PASS {case['id']}")
    print(f"Schema: {schema_result}")
    print(f"Verified {len(cases)} golden cases")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"FAIL {exc}", file=sys.stderr)
        raise
