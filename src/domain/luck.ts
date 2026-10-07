import { Temporal } from '@js-temporal/polyfill'

export interface LuckPeriod {
  years: number
  months: number
  days: number
  hours: number
  minutes: number
  seconds: number
}

export interface ElapsedParts {
  days: number
  hours: number
  minutes: number
  seconds: number
}

const DAY_SECONDS = 24 * 60 * 60
const MONTH_SECONDS = 30 * DAY_SECONDS
const YEAR_SECONDS = 360 * DAY_SECONDS

function assertWholeSeconds(value: number): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError('Elapsed seconds must be a non-negative integer.')
  }
}

export function splitElapsedSeconds(elapsedSeconds: number): ElapsedParts {
  assertWholeSeconds(elapsedSeconds)

  let remaining = elapsedSeconds
  const days = Math.floor(remaining / DAY_SECONDS)
  remaining %= DAY_SECONDS
  const hours = Math.floor(remaining / 3600)
  remaining %= 3600
  const minutes = Math.floor(remaining / 60)

  return { days, hours, minutes, seconds: remaining % 60 }
}

export function convertElapsedToLuckPeriod(elapsedSeconds: number): LuckPeriod {
  assertWholeSeconds(elapsedSeconds)

  let remaining = elapsedSeconds * 120
  if (!Number.isSafeInteger(remaining)) {
    throw new RangeError('Converted luck duration exceeds safe integer precision.')
  }

  const take = (unit: number): number => {
    const value = Math.floor(remaining / unit)
    remaining %= unit
    return value
  }

  return {
    years: take(YEAR_SECONDS),
    months: take(MONTH_SECONDS),
    days: take(DAY_SECONDS),
    hours: take(3600),
    minutes: take(60),
    seconds: remaining,
  }
}

export function addLuckPeriod(
  birth: Temporal.ZonedDateTime,
  period: LuckPeriod,
): Temporal.ZonedDateTime {
  return birth
    .add({ years: period.years })
    .add({ months: period.months })
    .add({ days: period.days })
    .add({ hours: period.hours })
    .add({ minutes: period.minutes })
    .add({ seconds: period.seconds })
}
