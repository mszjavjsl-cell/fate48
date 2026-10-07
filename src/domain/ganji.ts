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
  tenGod: string
  hiddenStems: string[]
}

const LABELS: Record<PillarKey, string> = {
  year: '연주',
  month: '월주',
  day: '일주',
  hour: '시주',
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

export function getTenGod(dayStem: string, targetStem: string): string {
  return HeavenStem.fromName(dayStem).getTenStar(HeavenStem.fromName(targetStem)).getName()
}

export function makePillarInfo(
  key: PillarKey,
  cycle: SixtyCycle,
  dayMaster: HeavenStem,
): PillarInfo {
  const stem = cycle.getHeavenStem()
  const branch = cycle.getEarthBranch()

  return {
    key,
    label: LABELS[key],
    pillar: cycle.getName(),
    stem: stem.getName(),
    branch: branch.getName(),
    stemElement: stem.getElement().getName(),
    branchElement: branch.getElement().getName(),
    tenGod: dayMaster.getTenStar(stem).getName(),
    hiddenStems: branch.getHideHeavenStems().map((item) => item.getHeavenStem().getName()),
  }
}
