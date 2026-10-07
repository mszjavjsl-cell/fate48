import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const playwrightModule = 'file:///C:/Users/jeyon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs'
const { chromium } = await import(playwrightModule)

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const artifacts = path.join(scriptDirectory, '..', 'artifacts')
await mkdir(artifacts, { recursive: true })

function assertNoBodyOverflow(sizes, label) {
  if (sizes.body > sizes.viewport || sizes.document > sizes.viewport) {
    throw new Error(`${label} body overflow: ${JSON.stringify(sizes)}`)
  }
}

const browser = await chromium.launch({ headless: true })
const consoleErrors = []

const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 })
mobile.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text())
})
await mobile.goto('http://127.0.0.1:5173')
await mobile.waitForLoadState('networkidle')
await mobile.getByRole('heading', { name: '정밀 만세력' }).waitFor()
const birthDigits = mobile.getByRole('textbox', { name: '생년월일 또는 생년월일시분 숫자' })
if (await birthDigits.inputValue() !== '') {
  throw new Error('Birth input is not empty on initial load.')
}
if (await mobile.getByRole('group', { name: '사주 원국' }).count()) {
  throw new Error('Calculated birth results are visible on initial load.')
}
await mobile.getByLabel('출생지').selectOption('seoul')
await birthDigits.fill('198604021525')
await mobile.getByRole('radio', { name: '남성' }).check()
await mobile.getByRole('button', { name: '만세력 계산' }).click()
await mobile.getByText('양력 1986년 4월 2일 15시 25분', { exact: true }).waitFor()
await mobile.getByRole('group', { name: '시주 乙未' }).waitFor()
await mobile.getByText('-32분 05초', { exact: true }).waitFor()
const calculationToggle = mobile.getByRole('button', { name: '계산 근거' })
const calculationDetails = mobile.getByRole('region', { name: '계산 근거 상세' })
if (await calculationToggle.getAttribute('aria-expanded') !== 'true') {
  throw new Error('Calculation details are not expanded by default.')
}
await calculationToggle.click()
if (await calculationToggle.getAttribute('aria-expanded') !== 'false' || await calculationDetails.isVisible()) {
  throw new Error('Calculation details did not collapse.')
}
await calculationToggle.click()
await calculationDetails.waitFor({ state: 'visible' })

await birthDigits.fill('19860402')
await mobile.getByRole('button', { name: '만세력 계산' }).click()
await mobile.getByText('양력 1986년 4월 2일 · 출생시각 미상', { exact: true }).waitFor()
await mobile.getByRole('group', { name: '일주 丙子' }).waitFor()
if (await mobile.getByRole('group', { name: /^시주/ }).count()) {
  throw new Error('Unknown birth time still rendered an hour pillar.')
}
if (await mobile.locator('.pillar-board').getAttribute('data-pillar-count') !== '3') {
  throw new Error('Unknown birth time did not switch the chart to three pillars.')
}
await mobile.getByText('미상 · 정오 기준 추정', { exact: true }).waitFor()
await mobile.screenshot({ path: path.join(artifacts, 'manse-mobile-unknown-time.png'), fullPage: true })

await mobile.getByRole('radio', { name: '음력' }).check()
await birthDigits.fill('198904090715')
await mobile.getByRole('radio', { name: '여성' }).check()
await mobile.getByRole('button', { name: '만세력 계산' }).click()
await mobile.getByText('음력 1989년 4월 9일 07시 15분', { exact: true }).waitFor()
await mobile.getByText('양력 환산 1989년 5월 13일', { exact: true }).waitFor()
const hourPillar = mobile.getByRole('group', { name: '시주 乙卯' })
await hourPillar.getByText('을목', { exact: true }).waitFor()
if (await hourPillar.locator('strong.ganji.stem').getAttribute('data-yin-yang') !== '음') {
  throw new Error('Corrected yin hour glyph is missing its weight marker.')
}
const dayPillar = mobile.getByRole('group', { name: '일주 癸酉' })
await dayPillar.getByText('계수', { exact: true }).waitFor()
if (await dayPillar.getByText('癸', { exact: true }).getAttribute('data-yin-yang') !== '음') {
  throw new Error('Yin pillar glyph is missing its weight marker.')
}
if (await mobile.getByText('대한민국 표준시 기준', { exact: true }).count()) {
  throw new Error('The removed standard-time card is still visible.')
}
assertNoBodyOverflow(await mobile.evaluate(() => ({
  viewport: document.documentElement.clientWidth,
  body: document.body.scrollWidth,
  document: document.documentElement.scrollWidth,
})), 'mobile')
await mobile.getByRole('button', { name: '辛未 대운, 2007년 시작, 19세' }).click()
await mobile.getByRole('group', { name: '선택한 대운' }).getByText('신미', { exact: true }).waitFor()
const selectedAnnual = mobile.getByRole('button', { name: '2007년, 19세, 丁亥 세운' })
await selectedAnnual.getByText('정해', { exact: true }).waitFor()
await selectedAnnual.click()
if (!(await mobile.getByRole('heading', { name: '2007년 세운' }).isVisible())) {
  throw new Error('Annual fortune detail did not update on mobile.')
}
await mobile.screenshot({ path: path.join(artifacts, 'manse-mobile.png'), fullPage: true })

const desktop = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 })
desktop.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text())
})
await desktop.goto('http://127.0.0.1:5173')
await desktop.waitForLoadState('networkidle')
assertNoBodyOverflow(await desktop.evaluate(() => ({
  viewport: document.documentElement.clientWidth,
  body: document.body.scrollWidth,
  document: document.documentElement.scrollWidth,
})), 'desktop')
await desktop.screenshot({ path: path.join(artifacts, 'manse-desktop.png'), fullPage: true })

if (consoleErrors.length > 0) {
  throw new Error(`Browser console errors: ${consoleErrors.join(' | ')}`)
}

console.log('PASS initial=empty mobile=390x844 desktop=1280x900 inputs=solar+lunar+unknown-time interactions=calculation-toggle+decade+annual consoleErrors=0')
await browser.close()
