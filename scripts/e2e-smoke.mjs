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
const birthDigits = mobile.getByRole('textbox', { name: '생년월일시분 숫자 12자리' })
await birthDigits.fill('198604021525')
await mobile.getByRole('radio', { name: '남성' }).check()
await mobile.getByRole('button', { name: '만세력 계산' }).click()
await mobile.getByText('양력 1986년 4월 2일 15시 25분', { exact: true }).waitFor()

await mobile.getByRole('radio', { name: '음력' }).check()
await birthDigits.fill('198904090715')
await mobile.getByRole('radio', { name: '여성' }).check()
await mobile.getByRole('button', { name: '만세력 계산' }).click()
await mobile.getByText('음력 1989년 4월 9일 07시 15분', { exact: true }).waitFor()
await mobile.getByText('양력 환산 1989년 5월 13일', { exact: true }).waitFor()
await mobile.getByRole('group', { name: '시주 丙辰' }).getByText('정재', { exact: true }).waitFor()
assertNoBodyOverflow(await mobile.evaluate(() => ({
  viewport: document.documentElement.clientWidth,
  body: document.body.scrollWidth,
  document: document.documentElement.scrollWidth,
})), 'mobile')
await mobile.getByRole('button', { name: '辛未 대운, 2007년 시작, 19세' }).click()
await mobile.getByRole('button', { name: '2007년, 19세, 丁亥 세운' }).click()
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

console.log('PASS mobile=390x844 desktop=1280x900 inputs=solar+lunar interactions=decade+annual consoleErrors=0')
await browser.close()
