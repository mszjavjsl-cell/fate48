import type { PillarInfo } from '../domain/manse'

interface PillarBoardProps {
  pillars: PillarInfo[]
}

export function PillarBoard({ pillars }: PillarBoardProps) {
  return (
    <section className="pillar-section" aria-labelledby="pillars-title">
      <div className="section-heading compact">
        <div>
          <span className="eyebrow">FOUR PILLARS</span>
          <h2 id="pillars-title">사주 원국</h2>
        </div>
        <span className="reading-order">시 · 일 · 월 · 년</span>
      </div>

      <div className="pillar-board" role="group" aria-label="사주 원국">
        {pillars.toReversed().map((pillar) => (
          <article className="pillar-column" key={pillar.key}>
            <span className="pillar-label">{pillar.label}</span>
            <span className="ten-god">{pillar.tenGod}</span>
            <strong className="ganji stem" data-element={pillar.stemElement}>{pillar.stem}</strong>
            <strong className="ganji branch" data-element={pillar.branchElement}>{pillar.branch}</strong>
            <span className="hidden-stems" aria-label={`지장간 ${pillar.hiddenStems.join(' ')}`}>
              {pillar.hiddenStems.join(' · ')}
            </span>
          </article>
        ))}
      </div>
    </section>
  )
}
