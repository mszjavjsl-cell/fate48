import type { AnnualFortune } from '../domain/manse'

interface YearGridProps {
  years: AnnualFortune[]
  selectedIndex: number
  onSelect: (index: number) => void
}

export function YearGrid({ years, selectedIndex, onSelect }: YearGridProps) {
  return (
    <div className="year-grid" role="group" aria-label="세운 선택">
      {years.map((year, index) => (
        <button
          key={year.year}
          type="button"
          className="year-button"
          aria-pressed={selectedIndex === index}
          aria-label={`${year.year}년, ${year.age}세, ${year.pillar} 세운`}
          onClick={() => onSelect(index)}
        >
          <span className="year-number">{year.year}</span>
          <span className="year-age">{year.age}세</span>
          <strong>{year.pillar}</strong>
          <span className="year-ten-god">{year.tenGod}</span>
        </button>
      ))}
    </div>
  )
}
