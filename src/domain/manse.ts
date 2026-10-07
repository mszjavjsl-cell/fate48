import { Temporal } from '@js-temporal/polyfill'
import { LunarDay, SixtyCycle, SixtyCycleYear, SolarDay, SolarTime } from 'tyme4ts'

import { getCivilDayCycle, getHourCycle, getPillarReading, getTenGod, makePillarInfo, type PillarInfo } from './ganji'
import type { BirthLocation } from './locations'
import { addLuckPeriod, convertElapsedToLuckPeriod, splitElapsedSeconds, type ElapsedParts, type LuckPeriod } from './luck'
import { findBasisTerm, type LuckDirection } from './terms'

export interface BirthInput {
  date: string
  time?: string
  sex: 'male' | 'female'
  calendar?: 'solar' | 'lunar'
  leapMonth?: boolean
  timeZone?: string
  location?: BirthLocation
}

export interface AnnualFortune {
  year: number
  age: number
  pillar: string
  pillarReading: string
  tenGod: string
}

export interface DecadeFortune {
  ordinal: number
  pillar: string
  pillarReading: string
  transitionLocal: string
  startYear: number
  startAge: number
  years: AnnualFortune[]
}

export interface ManseResult {
  input: BirthInput
  normalizedBirth: {
    localDateTime: string
    utc: string
    solarDate: string
    solarLocalDateTime: string | null
    longitudeCorrectionSeconds: number | null
    timeKnown: boolean
  }
  lunarDate: {
    year: number
    month: number
    day: number
    leap: boolean
  }
  pillars: PillarInfo[]
  luck: {
    direction: LuckDirection
    directionLabel: string
    basisTerm: {
      name: string
      hanja: string
      localDateTime: string
    }
    elapsedSeconds: number
    elapsedParts: ElapsedParts
    convertedPeriod: LuckPeriod
    traditionalStartAge: number
    firstTransitionLocal: string
    cycles: DecadeFortune[]
  }
  metadata: {
    profileId: string
    profileVersion: string
    ephemerisProvider: string
    ephemerisVersion: string
    termBoundaryPolicy: string
    warnings: string[]
  }
}

const YANG_STEMS = new Set(['甲', '丙', '戊', '庚', '壬'])
const KOREA_STANDARD_MERIDIAN = 135

function parseBirth(input: BirthInput): Temporal.ZonedDateTime {
  const dateParts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(input.date)
  if (!dateParts) {
    throw new RangeError('생년월일은 YYYY-MM-DD 형식이어야 합니다.')
  }

  let solarDate = input.date
  if (input.calendar === 'lunar') {
    const year = Number(dateParts[1])
    const month = Number(dateParts[2])
    const day = Number(dateParts[3])
    const lunarMonth = input.leapMonth ? -month : month
    const solarDay = LunarDay.fromYmd(year, lunarMonth, day).getSolarDay()
    solarDate = [solarDay.getYear(), solarDay.getMonth(), solarDay.getDay()]
      .map((value, index) => index === 0 ? String(value).padStart(4, '0') : String(value).padStart(2, '0'))
      .join('-')
  }

  const plain = Temporal.PlainDateTime.from(`${solarDate}T${input.time ?? '12:00'}`)
  return plain.toZonedDateTime(input.timeZone ?? 'Asia/Seoul', { disambiguation: 'reject' })
}

function getLuckDirection(yearStem: string, sex: BirthInput['sex']): LuckDirection {
  const isYang = YANG_STEMS.has(yearStem)
  return (isYang && sex === 'male') || (!isYang && sex === 'female') ? 'forward' : 'reverse'
}

function getLongitudeCorrectionSeconds(location?: BirthLocation): number {
  return location ? Math.round((location.longitude - KOREA_STANDARD_MERIDIAN) * 4 * 60) : 0
}

function calculatePillars(
  birth: Temporal.ZonedDateTime,
  solarLocalBirth: Temporal.ZonedDateTime,
  includeHour: boolean,
): PillarInfo[] {
  // tyme4ts uses fixed UTC+8 civil fields, not historical Asia/Shanghai DST.
  const providerTime = birth.toInstant().toZonedDateTimeISO('+08:00')
  const providerEightChar = SolarTime.fromYmdHms(
    providerTime.year,
    providerTime.month,
    providerTime.day,
    providerTime.hour,
    providerTime.minute,
    providerTime.second,
  ).getLunarHour().getEightChar()

  const yearCycle = providerEightChar.getYear()
  const monthCycle = providerEightChar.getMonth()
  const dayCycle = getCivilDayCycle(birth.year, birth.month, birth.day)
  const dayMaster = dayCycle.getHeavenStem()

  const pillars = [
    makePillarInfo('year', yearCycle, dayMaster),
    makePillarInfo('month', monthCycle, dayMaster),
    makePillarInfo('day', dayCycle, dayMaster),
  ]

  if (includeHour) {
    const hourCycle = getHourCycle(dayCycle, solarLocalBirth.hour)
    pillars.push(makePillarInfo('hour', hourCycle, dayMaster))
  }
  return pillars
}

function createAnnualFortunes(
  startYear: number,
  birthYear: number,
  dayStem: string,
): AnnualFortune[] {
  return Array.from({ length: 10 }, (_, index) => {
    const year = startYear + index
    const cycle = SixtyCycleYear.fromYear(year).getSixtyCycle()
    return {
      year,
      age: year - birthYear + 1,
      pillar: cycle.getName(),
      pillarReading: getPillarReading(cycle.getName()),
      tenGod: getTenGod(dayStem, cycle.getHeavenStem().getName()),
    }
  })
}

function createDecadeFortunes(
  birth: Temporal.ZonedDateTime,
  firstTransition: Temporal.ZonedDateTime,
  monthPillar: string,
  dayStem: string,
  direction: LuckDirection,
): DecadeFortune[] {
  const fortunes: DecadeFortune[] = []
  const step = direction === 'forward' ? 1 : -1
  let transition = firstTransition

  for (let index = 0; index < 10; index += 1) {
    const ordinal = index + 1
    const cycle = SixtyCycle.fromName(monthPillar).next(step * ordinal)
    const startYear = transition.year
    fortunes.push({
      ordinal,
      pillar: cycle.getName(),
      pillarReading: getPillarReading(cycle.getName()),
      transitionLocal: transition.toString({ smallestUnit: 'second' }),
      startYear,
      startAge: startYear - birth.year + 1,
      years: createAnnualFortunes(startYear, birth.year, dayStem),
    })
    transition = transition.add({ years: 10 })
  }

  return fortunes
}

export function calculateManse(input: BirthInput): ManseResult {
  const timeKnown = Boolean(input.time)
  const birth = parseBirth(input)
  const longitudeCorrectionSeconds = timeKnown ? getLongitudeCorrectionSeconds(input.location) : null
  const solarLocalBirth = longitudeCorrectionSeconds === null
    ? birth
    : birth.add({ seconds: longitudeCorrectionSeconds })
  const pillars = calculatePillars(birth, solarLocalBirth, timeKnown)
  const yearStem = pillars[0].stem
  const dayStem = pillars[2].stem
  const direction = getLuckDirection(yearStem, input.sex)
  const basisTerm = findBasisTerm(birth, direction)
  const birthNs = birth.toInstant().epochNanoseconds
  const elapsedNs = direction === 'forward'
    ? basisTerm.instant.epochNanoseconds - birthNs
    : birthNs - basisTerm.instant.epochNanoseconds
  const elapsedSeconds = Number(elapsedNs / 1_000_000_000n)
  const convertedPeriod = convertElapsedToLuckPeriod(elapsedSeconds)
  const firstTransition = addLuckPeriod(birth, convertedPeriod)
  const lunarDay = SolarDay.fromYmd(birth.year, birth.month, birth.day).getLunarDay()
  const lunarMonth = lunarDay.getLunarMonth()

  return {
    input,
    normalizedBirth: {
      localDateTime: birth.toString({ smallestUnit: 'second' }),
      utc: birth.toInstant().toString({ smallestUnit: 'second' }),
      solarDate: `${String(birth.year).padStart(4, '0')}-${String(birth.month).padStart(2, '0')}-${String(birth.day).padStart(2, '0')}`,
      solarLocalDateTime: timeKnown ? solarLocalBirth.toString({ smallestUnit: 'second' }) : null,
      longitudeCorrectionSeconds,
      timeKnown,
    },
    lunarDate: {
      year: lunarMonth.getYear(),
      month: lunarMonth.getMonth(),
      day: lunarDay.getDay(),
      leap: lunarMonth.isLeap(),
    },
    pillars,
    luck: {
      direction,
      directionLabel: direction === 'forward' ? '순행' : '역행',
      basisTerm: {
        name: basisTerm.name,
        hanja: basisTerm.hanja,
        localDateTime: basisTerm.localDateTime,
      },
      elapsedSeconds,
      elapsedParts: splitElapsedSeconds(elapsedSeconds),
      convertedPeriod,
      traditionalStartAge: Math.max(1, Math.floor(elapsedSeconds / (3 * 86400) + 0.5)),
      firstTransitionLocal: firstTransition.toString({ smallestUnit: 'second' }),
      cycles: createDecadeFortunes(
        birth,
        firstTransition,
        pillars[1].pillar,
        dayStem,
        direction,
      ),
    },
    metadata: {
      profileId: 'kr-traditional-v1-draft',
      profileVersion: '0.3.0',
      ephemerisProvider: 'tyme4ts / ShouXing astronomical calendar',
      ephemerisVersion: 'tyme4ts 1.5.3',
      termBoundaryPolicy: 'strict-adjacent-term',
      warnings: [
        '이 결과는 draft 계산 프로필이며 절입시각 권위 데이터는 아직 잠기지 않았습니다.',
        ...(!timeKnown ? ['출생시각 미상 결과의 절입 차이와 교운시점은 정오를 기준으로 한 추정값입니다.'] : []),
        ...(timeKnown ? ['시주는 한국 표준자오선 135도와 출생지 경도에 따른 지방평균시를 사용하며 균시차는 적용하지 않습니다.'] : []),
        '세운의 나이는 해당 연도의 연 나이(연도 - 출생연도 + 1)입니다.',
      ],
    },
  }
}

export { type PillarInfo } from './ganji'
export { type LuckDirection } from './terms'
