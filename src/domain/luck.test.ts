import { Temporal } from '@js-temporal/polyfill'
import { describe, expect, it } from 'vitest'

import { addLuckPeriod, convertElapsedToLuckPeriod, splitElapsedSeconds } from './luck'

describe('convertElapsedToLuckPeriod', () => {
  it.each([
    [2_055_014, { years: 7, months: 11, days: 4, hours: 4, minutes: 28, seconds: 0 }],
    [243_667, { years: 0, months: 11, days: 8, hours: 10, minutes: 14, seconds: 0 }],
    [2_387_629, { years: 9, months: 2, days: 16, hours: 3, minutes: 38, seconds: 0 }],
  ])('converts %i civil seconds with the exact 3-days-to-1-year ratio', (elapsedSeconds, expected) => {
    expect(convertElapsedToLuckPeriod(elapsedSeconds)).toEqual(expected)
  })

  it('rejects negative and fractional elapsed seconds', () => {
    expect(() => convertElapsedToLuckPeriod(-1)).toThrow(/non-negative integer/i)
    expect(() => convertElapsedToLuckPeriod(1.5)).toThrow(/non-negative integer/i)
  })
})

describe('splitElapsedSeconds', () => {
  it('returns exact civil day, hour, minute, and second parts', () => {
    expect(splitElapsedSeconds(2_055_014)).toEqual({ days: 23, hours: 18, minutes: 50, seconds: 14 })
  })
})

describe('addLuckPeriod', () => {
  it('adds calendar fields in the documented order', () => {
    const birth = Temporal.ZonedDateTime.from('1989-05-13T07:15:00+09:00[Asia/Seoul]')
    const period = convertElapsedToLuckPeriod(2_055_014)

    expect(addLuckPeriod(birth, period).toString()).toBe('1997-04-17T11:43:00+09:00[Asia/Seoul]')
  })
})
