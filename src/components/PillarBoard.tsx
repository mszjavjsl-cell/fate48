import type { PillarInfo } from '../domain/manse'

interface PillarBoardProps {
  pillars: PillarInfo[]
}

export function PillarBoard({ pillars }: PillarBoardProps) {
  return (
    <section className="pillar-section" aria-labelledby="pillars-title">
      <div className="section-heading compact">
        <h2 id="pillars-title">사주 원국</h2>
        <span className="reading-order">{pillars.length === 4 ? '시 · 일 · 월 · 년' : '일 · 월 · 년'}</span>
      </div>

      <div className="pillar-board" data-pillar-count={pillars.length} role="group" aria-label="사주 원국">
        {pillars.toReversed().map((pillar) => (
          <article
            className="pillar-column"
            key={pillar.key}
            role="group"
            aria-label={`${pillar.label} ${pillar.pillar}`}
          >
            <span className="pillar-label">{pillar.label}</span>
            <span className="relation relation-stem" aria-label={`천간 십성 ${pillar.tenGod}`}>
              {pillar.tenGod}
            </span>
            <span className="element-label" data-element={pillar.stemElement}>
              {pillar.stemReading}{pillar.stemElementLabel}
            </span>
            <strong
              className="ganji stem"
              data-element={pillar.stemElement}
              data-yin-yang={pillar.stemYinYang}
            >
              {pillar.stem}
            </strong>
            <strong
              className="ganji branch"
              data-element={pillar.branchElement}
              data-yin-yang={pillar.branchYinYang}
            >
              {pillar.branch}
            </strong>
            <span className="element-label" data-element={pillar.branchElement}>
              {pillar.branchReading}{pillar.branchElementLabel}
            </span>
            <span className="relation relation-branch" aria-label={`지지 십성 ${pillar.branchTenGod}`}>
              {pillar.branchTenGod}
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
