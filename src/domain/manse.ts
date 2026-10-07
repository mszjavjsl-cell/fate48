import { Temporal } from '@js-temporal/polyfill'
import { HeavenStem, SixtyCycle, SixtyCycleYear, SolarDay, SolarTime } from 'tyme4ts'

import { getCivilDayCycle, getHourCycle, getTenGod, makePillarInfo, type PillarInfo } from './ganji'
import { addLuckPeriod, convertElapsedToLuckPeriod, splitElapsedSeconds, type ElapsedParts, type LuckPeriod } from './luck'
import { findBasisTerm, type LuckDirection } from './terms'

export interface BirthInput {
  date: string
  time: string
  sex: 'male' | 'female'
  timeZone: string
}

export interface AnnualFortune {
  year: number
  age: number
  pillar: string
  tenGod: string
}

export interface DecadeFortune {
  ordinal: number
  pillar: string
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

function parseBirth(input: BirthInput): Temporal.ZonedDateTime {
  const plain = Temporal.PlainDateTime.from(`${input.date}T${input.time}`)
  return plain.toZonedDateTime(input.timeZone, { disambiguation: 'reject' })
}

function getLuckDirection(yearStem: string, sex: BirthInput['sex']): LuckDirection {
  const isYang = YANG_STEMS.has(yearStem)
  return (isYang && sex === 'male') || (!isYang && sex === 'female') ? 'forward' : 'reverse'
}

function calculatePillars(birth: Temporal.ZonedDateTime): PillarInfo[] {
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
  const hourCycle = getHourCycle(dayCycle, birth.hour)
  const dayMaster = dayCycle.getHeavenStem()

  return [
    makePillarInfo('year', yearCycle, dayMaster),
    makePillarInfo('month', monthCycle, dayMaster),
    makePillarInfo('day', dayCycle, dayMaster),
    makePillarInfo('hour', hourCycle, dayMaster),
  ]
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
  const birth = parseBirth(input)
  const pillars = calculatePillars(birth)
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
      profileVersion: '0.1.0',
      ephemerisProvider: 'tyme4ts / ShouXing astronomical calendar',
      ephemerisVersion: 'tyme4ts 1.5.3',
      termBoundaryPolicy: 'strict-adjacent-term',
      warnings: [
        '이 결과는 draft 계산 프로필이며 절입시각 권위 데이터는 아직 잠기지 않았습니다.',
        '세운의 나이는 해당 연도의 연 나이(연도 - 출생연도 + 1)입니다.',
      ],
    },
  }
}

export { type PillarInfo } from './ganji'
export { type LuckDirection } from './terms'
