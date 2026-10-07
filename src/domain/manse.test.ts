import { describe, expect, it } from 'vitest'

import { calculateManse } from './manse'

describe('calculateManse', () => {
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
})
