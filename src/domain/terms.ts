import { Temporal } from '@js-temporal/polyfill'
import { SolarTerm } from 'tyme4ts'

export type LuckDirection = 'forward' | 'reverse'

export interface TermPoint {
  name: string
  hanja: string
  sourceName: string
  instant: Temporal.Instant
  localDateTime: string
}

const TERM_LABELS: Record<string, { name: string; hanja: string }> = {
  小寒: { name: '소한', hanja: '小寒' },
  立春: { name: '입춘', hanja: '立春' },
  惊蛰: { name: '경칩', hanja: '驚蟄' },
  清明: { name: '청명', hanja: '清明' },
  立夏: { name: '입하', hanja: '立夏' },
  芒种: { name: '망종', hanja: '芒種' },
  小暑: { name: '소서', hanja: '小暑' },
  立秋: { name: '입추', hanja: '立秋' },
  白露: { name: '백로', hanja: '白露' },
  寒露: { name: '한로', hanja: '寒露' },
  立冬: { name: '입동', hanja: '立冬' },
  大雪: { name: '대설', hanja: '大雪' },
}

function toTermPoint(term: SolarTerm, displayTimeZone: string): TermPoint {
  const source = term.getJulianDay().getSolarTime()
  const sourceDateTime = Temporal.ZonedDateTime.from({
    // tyme4ts publishes solar-term clock values in fixed China Standard Time.
    // An IANA Asia/Shanghai zone would incorrectly apply historical DST.
    timeZone: '+08:00',
    year: source.getYear(),
    month: source.getMonth(),
    day: source.getDay(),
    hour: source.getHour(),
    minute: source.getMinute(),
    second: source.getSecond(),
  })
  const sourceName = term.getName()
  const label = TERM_LABELS[sourceName]
  if (!label) {
    throw new RangeError(`Unsupported solar term: ${sourceName}`)
  }
  const instant = sourceDateTime.toInstant()

  return {
    ...label,
    sourceName,
    instant,
    localDateTime: instant.toZonedDateTimeISO(displayTimeZone).toString({ smallestUnit: 'second' }),
  }
}

export function getJieTermsAround(year: number, displayTimeZone: string): TermPoint[] {
  const terms: TermPoint[] = []
  for (let termYear = year - 1; termYear <= year + 1; termYear += 1) {
    for (let index = 1; index < 24; index += 2) {
      terms.push(toTermPoint(SolarTerm.fromIndex(termYear, index), displayTimeZone))
    }
  }
  return terms.toSorted((a, b) => Temporal.Instant.compare(a.instant, b.instant))
}

export function findBasisTerm(
  birth: Temporal.ZonedDateTime,
  direction: LuckDirection,
): TermPoint {
  const terms = getJieTermsAround(birth.year, birth.timeZoneId)
  const birthInstant = birth.toInstant()
  const match = direction === 'forward'
    ? terms.find((term) => Temporal.Instant.compare(term.instant, birthInstant) > 0)
    : terms.findLast((term) => Temporal.Instant.compare(term.instant, birthInstant) < 0)

  if (!match) {
    throw new RangeError('No adjacent solar term found for the supplied birth time.')
  }
  return match
}
