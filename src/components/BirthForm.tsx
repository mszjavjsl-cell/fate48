import { useState, type FormEvent } from 'react'

import type { BirthInput } from '../domain/manse'

interface BirthFormProps {
  initialValue: BirthInput
  onCalculate: (input: BirthInput) => void
}

export function BirthForm({ initialValue, onCalculate }: BirthFormProps) {
  const [value, setValue] = useState(initialValue)

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onCalculate(value)
  }

  return (
    <form className="birth-form" onSubmit={submit}>
      <div className="form-heading">
        <div>
          <span className="eyebrow">BIRTH DATA</span>
          <h2>출생 정보</h2>
        </div>
        <span className="required-note">양력 기준</span>
      </div>

      <label className="field field-wide">
        <span>양력 생년월일</span>
        <input
          type="date"
          value={value.date}
          required
          onChange={(event) => setValue((current) => ({ ...current, date: event.target.value }))}
        />
      </label>

      <label className="field">
        <span>출생 시각</span>
        <input
          type="time"
          value={value.time}
          required
          step="60"
          onChange={(event) => setValue((current) => ({ ...current, time: event.target.value }))}
        />
      </label>

      <fieldset className="sex-field">
        <legend>성별</legend>
        <div className="segmented-control">
          <label>
            <input
              type="radio"
              name="sex"
              value="female"
              checked={value.sex === 'female'}
              onChange={() => setValue((current) => ({ ...current, sex: 'female' }))}
            />
            <span>여성</span>
          </label>
          <label>
            <input
              type="radio"
              name="sex"
              value="male"
              checked={value.sex === 'male'}
              onChange={() => setValue((current) => ({ ...current, sex: 'male' }))}
            />
            <span>남성</span>
          </label>
        </div>
      </fieldset>

      <label className="field field-wide">
        <span>표준 시간대</span>
        <select
          value={value.timeZone}
          onChange={(event) => setValue((current) => ({ ...current, timeZone: event.target.value }))}
        >
          <option value="Asia/Seoul">대한민국 · Asia/Seoul</option>
          <option value="Asia/Tokyo">일본 · Asia/Tokyo</option>
          <option value="America/Los_Angeles">미국 서부 · Los Angeles</option>
          <option value="Europe/London">영국 · London</option>
        </select>
      </label>

      <button className="calculate-button" type="submit">
        <span>만세력 계산</span>
        <span aria-hidden="true">→</span>
      </button>
    </form>
  )
}
