import { useState } from 'react'

import { BirthForm } from './components/BirthForm'
import { LuckRail } from './components/LuckRail'
import { PillarBoard } from './components/PillarBoard'
import { YearGrid } from './components/YearGrid'
import { calculateManse, type BirthInput, type ManseResult } from './domain/manse'

const DEFAULT_INPUT: BirthInput = {
  date: '1989-05-13',
  time: '07:15',
  sex: 'female',
  calendar: 'solar',
}

function formatDateTime(value: string): string {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  return match ? `${match[1]}년 ${Number(match[2])}월 ${Number(match[3])}일 ${match[4]}:${match[5]}` : value
}

function formatPeriod(period: ManseResult['luck']['convertedPeriod']): string {
  const parts = [
    period.years && `${period.years}년`,
    period.months && `${period.months}개월`,
    period.days && `${period.days}일`,
    period.hours && `${period.hours}시간`,
    period.minutes && `${period.minutes}분`,
    period.seconds && `${period.seconds}초`,
  ].filter(Boolean)
  return parts.join(' ')
}

function formatBirthInformation(result: ManseResult): string {
  const [year, month, day] = result.input.date.split('-').map(Number)
  const [hour, minute] = result.input.time.split(':')
  const calendar = result.input.calendar === 'lunar' ? '음력' : '양력'
  return `${calendar} ${year}년 ${month}월 ${day}일 ${hour}시 ${minute}분`
}

function formatSolarDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number)
  return `양력 환산 ${year}년 ${month}월 ${day}일`
}

function findCurrentCycle(result: ManseResult): number {
  const currentYear = new Date().getFullYear()
  const found = result.luck.cycles.findLastIndex((cycle) => cycle.startYear <= currentYear)
  return Math.max(0, found)
}

function findCurrentYear(result: ManseResult, cycleIndex: number): number {
  const currentYear = new Date().getFullYear()
  const index = result.luck.cycles[cycleIndex].years.findIndex((year) => year.year === currentYear)
  return Math.max(0, index)
}

const DEFAULT_RESULT = calculateManse(DEFAULT_INPUT)
const DEFAULT_CYCLE_INDEX = findCurrentCycle(DEFAULT_RESULT)
const DEFAULT_YEAR_INDEX = findCurrentYear(DEFAULT_RESULT, DEFAULT_CYCLE_INDEX)

export default function App() {
  const [result, setResult] = useState<ManseResult>(DEFAULT_RESULT)
  const [selectedCycleIndex, setSelectedCycleIndex] = useState(DEFAULT_CYCLE_INDEX)
  const [selectedYearIndex, setSelectedYearIndex] = useState(DEFAULT_YEAR_INDEX)
  const [error, setError] = useState('')

  const selectedCycle = result.luck.cycles[selectedCycleIndex]
  const selectedYear = selectedCycle.years[selectedYearIndex]

  const calculate = (input: BirthInput) => {
    try {
      const next = calculateManse(input)
      const cycleIndex = findCurrentCycle(next)
      setResult(next)
      setSelectedCycleIndex(cycleIndex)
      setSelectedYearIndex(findCurrentYear(next, cycleIndex))
      setError('')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '입력값을 확인해 주세요.')
    }
  }

  const selectCycle = (index: number) => {
    setSelectedCycleIndex(index)
    setSelectedYearIndex(findCurrentYear(result, index))
  }

  return (
    <main className="app-shell">
      <header className="masthead">
        <div className="brand-mark" aria-hidden="true">曆</div>
        <div className="brand-copy">
          <h1>정밀 만세력</h1>
          <p>절입 순간부터 교운까지, 계산 근거가 보이는 만세력 연구판</p>
        </div>
      </header>

      <div className="workspace">
        <aside className="control-column">
          <BirthForm initialValue={DEFAULT_INPUT} onCalculate={calculate} />
          {error ? <p className="error-message" role="alert">{error}</p> : null}
          <PillarBoard pillars={result.pillars} />

          <section className="calculation-ledger" aria-labelledby="calculation-title">
            <div className="section-heading compact">
              <h2 id="calculation-title">계산 근거</h2>
            </div>
            <dl>
              <div><dt>음력</dt><dd>{result.lunarDate.year}년 {result.lunarDate.leap ? '윤' : ''}{result.lunarDate.month}월 {result.lunarDate.day}일</dd></div>
              <div><dt>대운 방향</dt><dd>{result.luck.directionLabel}</dd></div>
              <div><dt>기준 절기</dt><dd>{result.luck.basisTerm.name} <small>{result.luck.basisTerm.hanja}</small></dd></div>
              <div><dt>절입 시각</dt><dd>{formatDateTime(result.luck.basisTerm.localDateTime)}</dd></div>
              <div><dt>기산 기간</dt><dd>{formatPeriod(result.luck.convertedPeriod)}</dd></div>
              <div className="primary-row"><dt>첫 교운</dt><dd>{formatDateTime(result.luck.firstTransitionLocal)}</dd></div>
            </dl>
          </section>
        </aside>

        <section className="fortune-column" aria-label="대운과 세운">
          <div className="fortune-intro">
            <div>
              <h2>운의 흐름</h2>
              <p>대운을 누르면 그 10년의 세운이 펼쳐집니다.</p>
            </div>
            <div className="birth-summary" role="group" aria-label="출생정보">
              <span>출생정보</span>
              <strong>{formatBirthInformation(result)}</strong>
              {result.input.calendar === 'lunar' ? (
                <small>{formatSolarDate(result.normalizedBirth.solarDate)}</small>
              ) : null}
            </div>
          </div>

          <section className="fortune-section" aria-labelledby="decade-title">
            <div className="section-heading">
              <div>
                <span className="step-index">01</span>
                <h3 id="decade-title">대운 선택</h3>
              </div>
              <p>연 나이 · 시작 연도 · 간지</p>
            </div>
            <LuckRail cycles={result.luck.cycles} selectedIndex={selectedCycleIndex} onSelect={selectCycle} />
            <div className="selection-caption">
              <span>{selectedCycle.ordinal}번째 대운</span>
              <strong>{selectedCycle.pillar}</strong>
              <span>{formatDateTime(selectedCycle.transitionLocal)} 교운</span>
            </div>
          </section>

          <section className="fortune-section annual-section" aria-labelledby="annual-title">
            <div className="section-heading">
              <div>
                <span className="step-index">02</span>
                <h3 id="annual-title">세운 선택</h3>
              </div>
              <p>{selectedCycle.startYear}—{selectedCycle.startYear + 9}</p>
            </div>
            <YearGrid years={selectedCycle.years} selectedIndex={selectedYearIndex} onSelect={setSelectedYearIndex} />
          </section>

          <section className="annual-detail" aria-labelledby="annual-detail-title">
            <div className="detail-index">{String(selectedYearIndex + 1).padStart(2, '0')}</div>
            <div className="detail-copy">
              <h3 id="annual-detail-title">{selectedYear.year}년 세운</h3>
              <p>연 나이 {selectedYear.age}세 · {selectedCycle.pillar} 대운 안의 흐름</p>
            </div>
            <div className="detail-ganji" role="group" aria-label="선택한 세운 간지">
              <strong>{selectedYear.pillar}</strong>
              <span>{selectedYear.tenGod}</span>
            </div>
          </section>

          <footer className="engine-note">
            <span className="status-dot" aria-hidden="true" />
            <p><strong>{result.metadata.profileId}</strong> · {result.metadata.ephemerisVersion}</p>
            <p>{result.metadata.warnings[0]}</p>
          </footer>
        </section>
      </div>
    </main>
  )
}
