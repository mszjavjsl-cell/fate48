import type { DecadeFortune } from '../domain/manse'

interface LuckRailProps {
  cycles: DecadeFortune[]
  selectedIndex: number
  onSelect: (index: number) => void
}

export function LuckRail({ cycles, selectedIndex, onSelect }: LuckRailProps) {
  return (
    <div className="luck-rail-wrap">
      <div className="rail-axis" aria-hidden="true">
        <span>나이</span><span>연도</span><span>대운</span>
      </div>
      <div className="luck-rail" role="group" aria-label="대운 선택">
        {cycles.map((cycle, index) => (
          <button
            key={`${cycle.ordinal}-${cycle.pillar}`}
            type="button"
            className="decade-button"
            aria-pressed={selectedIndex === index}
            aria-label={`${cycle.pillar} 대운, ${cycle.startYear}년 시작, ${cycle.startAge}세`}
            onClick={() => onSelect(index)}
          >
            <span className="rail-age">{cycle.startAge}<small>세</small></span>
            <span className="rail-year">{cycle.startYear}</span>
            <strong>{cycle.pillar}</strong>
          </button>
        ))}
      </div>
    </div>
  )
}
