import { EarthBranch, HeavenStem, SixtyCycle, SolarDay } from 'tyme4ts'

export type PillarKey = 'year' | 'month' | 'day' | 'hour'

export interface PillarInfo {
  key: PillarKey
  label: string
  pillar: string
  stem: string
  branch: string
  stemElement: string
  branchElement: string
  stemElementLabel: string
  branchElementLabel: string
  stemYinYang: string
  branchYinYang: string
  tenGod: string
  tenGodGroup: string
  branchTenGod: string
  branchTenGodGroup: string
  hiddenStems: string[]
}

export interface TenGodInfo {
  name: string
  group: string
}

const LABELS: Record<PillarKey, string> = {
  year: '연주',
  month: '월주',
  day: '일주',
  hour: '시주',
}

const ELEMENT_LABELS: Record<string, string> = {
  木: '목',
  火: '화',
  土: '토',
  金: '금',
  水: '수',
}

const TEN_GOD_LABELS: Record<string, TenGodInfo> = {
  比肩: { name: '비견', group: '비겁' },
  劫财: { name: '겁재', group: '비겁' },
  食神: { name: '식신', group: '식상' },
  伤官: { name: '상관', group: '식상' },
  偏财: { name: '편재', group: '재성' },
  正财: { name: '정재', group: '재성' },
  七杀: { name: '편관', group: '관성' },
  正官: { name: '정관', group: '관성' },
  偏印: { name: '편인', group: '인성' },
  正印: { name: '정인', group: '인성' },
}

export function getCivilDayCycle(year: number, month: number, day: number): SixtyCycle {
  return SolarDay.fromYmd(year, month, day).getLunarDay().getSixtyCycle()
}

export function getHourCycle(dayCycle: SixtyCycle, hour: number): SixtyCycle {
  const branchIndex = hour === 23 ? 0 : Math.floor((hour + 1) / 2)
  const dayStemIndex = dayCycle.getHeavenStem().getIndex()
  const stemIndex = ((dayStemIndex % 5) * 2 + branchIndex) % 10
  return SixtyCycle.fromName(
    `${HeavenStem.fromIndex(stemIndex).getName()}${EarthBranch.fromIndex(branchIndex).getName()}`,
  )
}

export function getTenGodInfo(dayStem: string, targetStem: string): TenGodInfo {
  const sourceName = HeavenStem.fromName(dayStem).getTenStar(HeavenStem.fromName(targetStem)).getName()
  const info = TEN_GOD_LABELS[sourceName]
  if (!info) {
    throw new RangeError(`Unsupported ten-god name: ${sourceName}`)
  }
  return info
}

export function getTenGod(dayStem: string, targetStem: string): string {
  return getTenGodInfo(dayStem, targetStem).name
}

export function makePillarInfo(
  key: PillarKey,
  cycle: SixtyCycle,
  dayMaster: HeavenStem,
): PillarInfo {
  const stem = cycle.getHeavenStem()
  const branch = cycle.getEarthBranch()
  const stemTenGod = getTenGodInfo(dayMaster.getName(), stem.getName())
  const branchMainStem = branch.getHideHeavenStemMain()
  const branchTenGod = getTenGodInfo(dayMaster.getName(), branchMainStem.getName())
  const stemElement = stem.getElement().getName()
  const branchElement = branch.getElement().getName()

  return {
    key,
    label: LABELS[key],
    pillar: cycle.getName(),
    stem: stem.getName(),
    branch: branch.getName(),
    stemElement,
    branchElement,
    stemElementLabel: ELEMENT_LABELS[stemElement],
    branchElementLabel: ELEMENT_LABELS[branchElement],
    stemYinYang: stem.getYinYang() === 1 ? '양' : '음',
    branchYinYang: branch.getYinYang() === 1 ? '양' : '음',
    tenGod: stemTenGod.name,
    tenGodGroup: stemTenGod.group,
    branchTenGod: branchTenGod.name,
    branchTenGodGroup: branchTenGod.group,
    hiddenStems: branch.getHideHeavenStems().map((item) => item.getHeavenStem().getName()),
  }
}
