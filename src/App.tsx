import { useState } from 'react'

import { BirthForm } from './components/BirthForm'
import { LuckRail } from './components/LuckRail'
import { PillarBoard } from './components/PillarBoard'
import { YearGrid } from './components/YearGrid'
import { calculateManse, type BirthInput, type ManseResult } from './domain/manse'
import { DEFAULT_BIRTH_LOCATION } from './domain/locations'

const DEFAULT_INPUT: BirthInput = {
  date: '',
  sex: 'female',
  calendar: 'solar',
  location: DEFAULT_BIRTH_LOCATION,
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
  const calendar = result.input.calendar === 'lunar' ? '음력' : '양력'
  if (!result.input.time) return `${calendar} ${year}년 ${month}월 ${day}일 · 출생시각 미상`
  const [hour, minute] = result.input.time.split(':')
  return `${calendar} ${year}년 ${month}월 ${day}일 ${hour}시 ${minute}분`
}

function formatSolarDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number)
  return `양력 환산 ${year}년 ${month}월 ${day}일`
}

function formatLongitudeCorrection(totalSeconds: number): string {
  const sign = totalSeconds < 0 ? '-' : totalSeconds > 0 ? '+' : ''
  const absolute = Math.abs(totalSeconds)
  const minutes = Math.floor(absolute / 60)
  const seconds = absolute % 60
  return `${sign}${minutes}분 ${String(seconds).padStart(2, '0')}초`
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

export default function App() {
  const [result, setResult] = useState<ManseResult | null>(null)
  const [selectedCycleIndex, setSelectedCycleIndex] = useState(0)
  const [selectedYearIndex, setSelectedYearIndex] = useState(0)
  const [isCalculationOpen, setIsCalculationOpen] = useState(true)
  const [error, setError] = useState('')

  const selectedCycle = result?.luck.cycles[selectedCycleIndex]
  const selectedYear = selectedCycle?.years[selectedYearIndex]

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
    if (!result) return
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
          {result ? (
            <>
              <PillarBoard pillars={result.pillars} />

              <section className={`calculation-ledger${isCalculationOpen ? ' is-open' : ''}`} aria-labelledby="calculation-title">
                <div className="section-heading compact">
                  <h2 id="calculation-title">
                    <button
                      className="calculation-toggle"
                      type="button"
                      aria-expanded={isCalculationOpen}
                      aria-controls="calculation-details"
                      onClick={() => setIsCalculationOpen((open) => !open)}
                    >
                      <span>계산 근거</span>
                      <span className="calculation-chevron" aria-hidden="true">⌄</span>
                    </button>
                  </h2>
                </div>
                <div id="calculation-details" role="region" aria-label="계산 근거 상세" hidden={!isCalculationOpen}>
                  <dl>
                    <div><dt>음력</dt><dd>{result.lunarDate.year}년 {result.lunarDate.leap ? '윤' : ''}{result.lunarDate.month}월 {result.lunarDate.day}일</dd></div>
                    <div><dt>출생지</dt><dd>{result.input.location ? `${result.input.location.name} · ${result.input.location.longitude}°E` : '미지정'}</dd></div>
                    {result.normalizedBirth.timeKnown ? (
                      <>
                        <div><dt>경도 보정</dt><dd>{formatLongitudeCorrection(result.normalizedBirth.longitudeCorrectionSeconds!)}</dd></div>
                        <div><dt>보정 시각</dt><dd>{formatDateTime(result.normalizedBirth.solarLocalDateTime!)}</dd></div>
                      </>
                    ) : (
                      <div><dt>출생시각</dt><dd>미상 · 정오 기준 추정</dd></div>
                    )}
                    <div><dt>대운 방향</dt><dd>{result.luck.directionLabel}</dd></div>
                    <div><dt>기준 절기</dt><dd>{result.luck.basisTerm.name} <small>{result.luck.basisTerm.hanja}</small></dd></div>
                    <div><dt>절입 시각</dt><dd>{formatDateTime(result.luck.basisTerm.localDateTime)}</dd></div>
                    <div><dt>{result.normalizedBirth.timeKnown ? '기산 기간' : '기산 기간(추정)'}</dt><dd>{formatPeriod(result.luck.convertedPeriod)}</dd></div>
                    <div className="primary-row"><dt>{result.normalizedBirth.timeKnown ? '첫 교운' : '첫 교운(추정)'}</dt><dd>{formatDateTime(result.luck.firstTransitionLocal)}</dd></div>
                  </dl>
                </div>
              </section>
            </>
          ) : null}
        </aside>

        {result && selectedCycle && selectedYear ? (
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
            <div className="selection-caption" role="group" aria-label="선택한 대운">
              <span>{selectedCycle.ordinal}번째 대운</span>
              <strong>
                <span>{selectedCycle.pillar}</span>
                <small>{selectedCycle.pillarReading}</small>
              </strong>
              <span>{formatDateTime(selectedCycle.transitionLocal)} {result.normalizedBirth.timeKnown ? '교운' : '추정 교운'}</span>
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
        ) : (
          <section className="fortune-column fortune-empty" aria-label="계산 전 안내">
            <div className="empty-state" role="status">
              <span aria-hidden="true">曆</span>
              <h2>출생 정보를 입력해 주세요</h2>
              <p>생년월일을 입력하고 만세력 계산을 누르면 사주 원국과 대운·세운이 표시됩니다.</p>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
