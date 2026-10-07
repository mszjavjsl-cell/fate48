import { useState, type FormEvent } from 'react'

import type { BirthInput } from '../domain/manse'
import { DEFAULT_BIRTH_LOCATION, getBirthLocation, KOREAN_BIRTH_LOCATIONS } from '../domain/locations'

interface BirthFormProps {
  initialValue: BirthInput
  onCalculate: (input: BirthInput) => void
}

function toDigits(input: BirthInput): string {
  return `${input.date.replace(/\D/g, '')}${input.time?.replace(/\D/g, '').slice(0, 4) ?? ''}`
}

export function BirthForm({ initialValue, onCalculate }: BirthFormProps) {
  const [digits, setDigits] = useState(() => toDigits(initialValue))
  const [calendar, setCalendar] = useState<NonNullable<BirthInput['calendar']>>(
    initialValue.calendar ?? 'solar',
  )
  const [leapMonth, setLeapMonth] = useState(initialValue.leapMonth ?? false)
  const [sex, setSex] = useState(initialValue.sex)
  const [locationId, setLocationId] = useState(initialValue.location?.id ?? DEFAULT_BIRTH_LOCATION.id)

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!/^(?:\d{8}|\d{12})$/.test(digits)) return

    onCalculate({
      calendar,
      leapMonth: calendar === 'lunar' && leapMonth,
      date: `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`,
      time: digits.length === 12 ? `${digits.slice(8, 10)}:${digits.slice(10, 12)}` : undefined,
      sex,
      location: getBirthLocation(locationId),
    })
  }

  return (
    <form className="birth-form" onSubmit={submit}>
      <div className="form-heading">
        <h2>출생 정보</h2>
        <span className="required-note">숫자 8자리 또는 12자리</span>
      </div>

      <fieldset className="calendar-field">
        <legend>달력 기준</legend>
        <div className="segmented-control calendar-control">
          <label>
            <input
              type="radio"
              name="calendar"
              value="solar"
              checked={calendar === 'solar'}
              onChange={() => setCalendar('solar')}
            />
            <span>양력</span>
          </label>
          <label>
            <input
              type="radio"
              name="calendar"
              value="lunar"
              checked={calendar === 'lunar'}
              onChange={() => setCalendar('lunar')}
            />
            <span>음력</span>
          </label>
        </div>
      </fieldset>

      <label className="field field-wide">
        <span>생년월일 또는 생년월일시분 숫자</span>
        <input
          className="birth-digits"
          aria-label="생년월일 또는 생년월일시분 숫자"
          type="text"
          inputMode="numeric"
          maxLength={12}
          pattern="(?:[0-9]{8}|[0-9]{12})"
          placeholder="19001230 또는 201012311525"
          autoComplete="bday"
          value={digits}
          required
          onChange={(event) => setDigits(event.target.value.replace(/\D/g, '').slice(0, 12))}
        />
        <small className="input-guide">생년월일 8자리 · 시각을 알면 시분 4자리 추가</small>
      </label>

      <fieldset className="sex-field">
        <legend>성별</legend>
        <div className="segmented-control">
          <label>
            <input
              type="radio"
              name="sex"
              value="female"
              checked={sex === 'female'}
              onChange={() => setSex('female')}
            />
            <span>여성</span>
          </label>
          <label>
            <input
              type="radio"
              name="sex"
              value="male"
              checked={sex === 'male'}
              onChange={() => setSex('male')}
            />
            <span>남성</span>
          </label>
        </div>
      </fieldset>

      <label className="field location-field">
        <span>출생지</span>
        <select
          aria-label="출생지"
          value={locationId}
          onChange={(event) => setLocationId(event.target.value)}
        >
          {KOREAN_BIRTH_LOCATIONS.map((location) => (
            <option key={location.id} value={location.id}>{location.name}</option>
          ))}
        </select>
      </label>

      {calendar === 'lunar' ? (
        <label className="leap-field">
          <input
            aria-label="윤달"
            type="checkbox"
            checked={leapMonth}
            onChange={(event) => setLeapMonth(event.target.checked)}
          />
          <span><strong>윤달</strong><small>윤달 생일일 때만 선택</small></span>
        </label>
      ) : null}

      <button className="calculate-button" type="submit">
        <span>만세력 계산</span>
        <span aria-hidden="true">→</span>
      </button>
    </form>
  )
}
