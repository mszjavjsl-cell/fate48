import { describe, expect, it } from 'vitest'

import { calculateManse } from './manse'

describe('calculateManse', () => {
  it('omits the hour pillar when birth time is unknown', () => {
    const result = calculateManse({
      date: '1986-04-02',
      sex: 'male',
      location: { id: 'seoul', name: '서울', longitude: 126.978 },
    })

    expect(result.normalizedBirth.timeKnown).toBe(false)
    expect(result.normalizedBirth.localDateTime).toContain('1986-04-02T12:00:00')
    expect(result.normalizedBirth.longitudeCorrectionSeconds).toBeNull()
    expect(result.normalizedBirth.solarLocalDateTime).toBeNull()
    expect(result.pillars.map((item) => item.key)).toEqual(['year', 'month', 'day'])
    expect(result.pillars.map((item) => item.pillar)).toEqual(['丙寅', '辛卯', '丙子'])
  })

  it('calculates the four pillars and forward luck cycles for the 1989 female case', () => {
    const result = calculateManse({
      date: '1989-05-13',
      time: '07:15',
      sex: 'female',
      timeZone: 'Asia/Seoul',
    })

    expect(result.pillars.map((item) => item.pillar)).toEqual(['己巳', '己巳', '癸酉', '丙辰'])
    expect(result.luck.direction).toBe('forward')
    expect(result.luck.basisTerm.name).toBe('망종')
    expect(result.luck.basisTerm.localDateTime).toContain('1989-06-06T02:05:13+09:00')
    expect(result.luck.elapsedSeconds).toBe(2_055_013)
    expect(result.luck.convertedPeriod).toEqual({
      years: 7,
      months: 11,
      days: 4,
      hours: 4,
      minutes: 26,
      seconds: 0,
    })
    expect(result.luck.firstTransitionLocal).toContain('1997-04-17T11:41:00+09:00')
    expect(result.luck.cycles.slice(0, 5).map((cycle) => cycle.pillar)).toEqual([
      '庚午', '辛未', '壬申', '癸酉', '甲戌',
    ])
  })

  it('calculates the forward 1986 male case with the observed Cheongmyeong instant', () => {
    const result = calculateManse({
      date: '1986-04-02',
      time: '15:25',
      sex: 'male',
      timeZone: 'Asia/Seoul',
    })

    expect(result.pillars[0].pillar).toBe('丙寅')
    expect(result.pillars[1].pillar).toBe('辛卯')
    expect(result.luck.basisTerm.name).toBe('청명')
    expect(result.luck.elapsedSeconds).toBe(243_667)
    expect(result.luck.firstTransitionLocal).toContain('1987-03-11T01:39:00+09:00')
    expect(result.luck.cycles[0].pillar).toBe('壬辰')
  })

  it('uses longitude-corrected local mean solar time for the 1986 Seoul hour pillar', () => {
    const input = {
      date: '1986-04-02',
      time: '15:25',
      sex: 'male',
      location: { id: 'seoul', name: '서울', longitude: 126.978 },
    } as Parameters<typeof calculateManse>[0]

    const result = calculateManse(input)

    expect(result.normalizedBirth.solarLocalDateTime).toContain('1986-04-02T14:52:55')
    expect(result.normalizedBirth.longitudeCorrectionSeconds).toBe(-1925)
    expect(result.pillars[3].pillar).toBe('乙未')
  })

  it('keeps the civil-date day pillar when longitude correction crosses midnight', () => {
    const civilInput = {
      date: '1989-05-14',
      time: '00:10',
      sex: 'female',
    } as const
    const standardTime = calculateManse(civilInput)
    const longitudeCorrected = calculateManse({
      ...civilInput,
      location: { id: 'seoul', name: '서울', longitude: 126.978 },
    })

    expect(longitudeCorrected.normalizedBirth.solarLocalDateTime).toContain('1989-05-13T23:37:55')
    expect(longitudeCorrected.pillars[2].pillar).toBe(standardTime.pillars[2].pillar)
  })

  it('uses the calculated year stem and sex to select reverse motion', () => {
    const result = calculateManse({
      date: '1989-05-13',
      time: '07:15',
      sex: 'male',
      timeZone: 'Asia/Seoul',
    })

    expect(result.luck.direction).toBe('reverse')
    expect(result.luck.basisTerm.name).toBe('입하')
    expect(result.luck.cycles[0].pillar).toBe('戊辰')
  })

  it('keeps the civil date pillar at 23:30 while assigning the Zi hour', () => {
    const beforeMidnight = calculateManse({
      date: '1989-05-13',
      time: '23:30',
      sex: 'female',
      timeZone: 'Asia/Seoul',
    })
    const afterMidnight = calculateManse({
      date: '1989-05-14',
      time: '00:30',
      sex: 'female',
      timeZone: 'Asia/Seoul',
    })

    expect(beforeMidnight.pillars[2].pillar).toBe('癸酉')
    expect(beforeMidnight.pillars[3].branch).toBe('子')
    expect(afterMidnight.pillars[2].pillar).not.toBe(beforeMidnight.pillars[2].pillar)
    expect(afterMidnight.pillars[3].branch).toBe('子')
  })

  it('builds ten annual entries with Gregorian year, Korean age, and annual pillar', () => {
    const result = calculateManse({
      date: '1989-05-13',
      time: '07:15',
      sex: 'female',
      timeZone: 'Asia/Seoul',
    })

    expect(result.luck.cycles[1].years).toHaveLength(10)
    expect(result.luck.cycles[1].years[0]).toMatchObject({ year: 2007, age: 19, pillar: '丁亥' })
    expect(result.luck.cycles[1].years[9]).toMatchObject({ year: 2016, age: 28, pillar: '丙申' })
  })

  it('converts a lunar birth date to the same solar instant before calculation', () => {
    const result = calculateManse({
      calendar: 'lunar',
      date: '1989-04-09',
      time: '07:15',
      sex: 'female',
    })

    expect(result.normalizedBirth.solarDate).toBe('1989-05-13')
    expect(result.pillars.map((item) => item.pillar)).toEqual(['己巳', '己巳', '癸酉', '丙辰'])
  })

  it('supports a valid lunar leap month', () => {
    const result = calculateManse({
      calendar: 'lunar',
      leapMonth: true,
      date: '2023-02-01',
      time: '12:00',
      sex: 'female',
    })

    expect(result.normalizedBirth.solarDate).toBe('2023-03-22')
    expect(result.lunarDate).toMatchObject({ year: 2023, month: 2, day: 1, leap: true })
  })

  it('returns Korean ten-god groups and yin-yang element labels for both stem and branch', () => {
    const result = calculateManse({
      date: '1989-05-13',
      time: '07:15',
      sex: 'female',
      timeZone: 'Asia/Seoul',
    })

    expect(result.pillars[3]).toMatchObject({
      tenGod: '정재',
      tenGodGroup: '재성',
      branchTenGod: '정관',
      branchTenGodGroup: '관성',
      stemYinYang: '양',
      stemElementLabel: '화',
      branchYinYang: '양',
      branchElementLabel: '토',
    })
  })
})
