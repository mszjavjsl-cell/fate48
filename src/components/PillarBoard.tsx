import type { PillarInfo } from '../domain/manse'

interface PillarBoardProps {
  pillars: PillarInfo[]
}

export function PillarBoard({ pillars }: PillarBoardProps) {
  return (
    <section className="pillar-section" aria-labelledby="pillars-title">
      <div className="section-heading compact">
        <h2 id="pillars-title">사주 원국</h2>
        <span className="reading-order">시 · 일 · 월 · 년</span>
      </div>

      <div className="pillar-board" role="group" aria-label="사주 원국">
        {pillars.toReversed().map((pillar) => (
          <article
            className="pillar-column"
            key={pillar.key}
            role="group"
            aria-label={`${pillar.label} ${pillar.pillar}`}
          >
            <span className="pillar-label">{pillar.label}</span>
            <span className="relation relation-stem" aria-label={`천간 ${pillar.tenGodGroup} ${pillar.tenGod}`}>
              <strong>{pillar.tenGodGroup}</strong>
              <span>{pillar.tenGod}</span>
            </span>
            <span className="element-label" data-element={pillar.stemElement}>
              {pillar.stemYinYang}{pillar.stemElementLabel}
            </span>
            <strong className="ganji stem" data-element={pillar.stemElement}>{pillar.stem}</strong>
            <strong className="ganji branch" data-element={pillar.branchElement}>{pillar.branch}</strong>
            <span className="element-label" data-element={pillar.branchElement}>
              {pillar.branchYinYang}{pillar.branchElementLabel}
            </span>
            <span className="relation relation-branch" aria-label={`지지 ${pillar.branchTenGodGroup} ${pillar.branchTenGod}`}>
              <strong>{pillar.branchTenGodGroup}</strong>
              <span>{pillar.branchTenGod}</span>
            </span>
            <span className="hidden-stems" aria-label={`지장간 ${pillar.hiddenStems.join(' ')}`}>
              {pillar.hiddenStems.join(' · ')}
            </span>
          </article>
        ))}
      </div>
    </section>
  )
}
