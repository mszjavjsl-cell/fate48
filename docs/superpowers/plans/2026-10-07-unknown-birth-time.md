# 출생시각 미상 조회 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 생년월일 8자리만 입력하면 임의의 시주를 만들지 않고 연주·월주·일주와 대운·세운을 조회한다.

**Architecture:** `BirthInput.time`을 선택값으로 바꾸고, 출생시각 미상은 내부 계산용 정오(`12:00`)를 사용하되 결과에 `timeKnown: false`를 남긴다. 원국 컴포넌트는 결과의 기둥 수에 따라 3열 또는 4열로 렌더링하며, 화면은 시간 미상 계산의 대운 교운시점이 정오 기준 추정임을 명시한다.

**Tech Stack:** React 19, TypeScript, Temporal polyfill, Vitest, Testing Library, Playwright smoke test

**Spec:** `docs/calendar-engine-spec-v0.1.md`

## Global Constraints

- 입력은 숫자 `yyyymmdd` 8자리 또는 `yyyymmddhhmm` 12자리만 허용한다.
- 8자리 입력은 시주를 생성하지 않는다.
- 출생시각 미상 계산은 정오를 내부 기준으로 사용하며 화면과 경고에서 추정임을 숨기지 않는다.
- 출생시각을 입력한 기존 계산 결과는 변경하지 않는다.

---

### Task 1: 계산 엔진의 출생시각 미상 계약

**Files:**
- Modify: `src/domain/manse.ts`
- Test: `src/domain/manse.test.ts`

**Interfaces:**
- Consumes: `BirthInput { date, time?, sex, calendar?, location? }`
- Produces: `ManseResult.normalizedBirth.timeKnown`과 3개 또는 4개의 `pillars`

- [x] **Step 1: Write the failing test**

```ts
it('omits the hour pillar when birth time is unknown', () => {
  const result = calculateManse({ date: '1986-04-02', sex: 'male' })
  expect(result.normalizedBirth.timeKnown).toBe(false)
  expect(result.pillars.map((item) => item.key)).toEqual(['year', 'month', 'day'])
})
```

- [x] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/domain/manse.test.ts`
Expected: FAIL because `time` is required and the engine always creates an hour pillar.

- [x] **Step 3: Write minimal implementation**

```ts
export interface BirthInput {
  date: string
  time?: string
  sex: 'male' | 'female'
}

const timeKnown = Boolean(input.time)
const plain = Temporal.PlainDateTime.from(`${solarDate}T${input.time ?? '12:00'}`)
const pillars = [yearPillar, monthPillar, dayPillar]
if (timeKnown) pillars.push(hourPillar)
```

- [x] **Step 4: Run test to verify it passes**

Run: `npm test -- --run src/domain/manse.test.ts`
Expected: PASS.

### Task 2: 8자리 입력과 3주 UI

**Files:**
- Modify: `src/components/BirthForm.tsx`
- Modify: `src/components/PillarBoard.tsx`
- Modify: `src/App.tsx`
- Modify: `src/styles.css`
- Test: `src/App.test.tsx`

**Interfaces:**
- Consumes: 8자리 또는 12자리 숫자 문자열
- Produces: 8자리일 때 `time: undefined`, 3열 원국, `출생시각 미상` 출생정보, 정오 기준 추정 안내

- [x] **Step 1: Write the failing test**

```ts
it('accepts yyyymmdd and renders a three-pillar chart without an hour pillar', async () => {
  const user = userEvent.setup()
  render(<App />)
  const digits = screen.getByLabelText('생년월일 또는 생년월일시분 숫자')
  await user.clear(digits)
  await user.type(digits, '19860402')
  await user.click(screen.getByLabelText('남성'))
  await user.click(screen.getByRole('button', { name: '만세력 계산' }))
  const board = screen.getByRole('group', { name: '사주 원국' })
  expect(within(board).queryByRole('group', { name: /^시주/ })).not.toBeInTheDocument()
  expect(within(board).getByRole('group', { name: '일주 丙子' })).toBeInTheDocument()
})
```

- [x] **Step 2: Run test to verify it fails**

Run: `npm test -- --run src/App.test.tsx`
Expected: FAIL because the form accepts only 12 digits.

- [x] **Step 3: Write minimal implementation**

```ts
if (!/^(?:\d{8}|\d{12})$/.test(digits)) return
const time = digits.length === 12 ? `${digits.slice(8, 10)}:${digits.slice(10, 12)}` : undefined
```

```tsx
<div className="pillar-board" data-pillar-count={pillars.length}>
  {pillars.toReversed().map(renderPillar)}
</div>
```

- [x] **Step 4: Run test to verify it passes**

Run: `npm test -- --run src/App.test.tsx`
Expected: PASS.

### Task 3: Documentation and browser verification

**Files:**
- Modify: `README.local-app.md`
- Modify: `docs/calendar-engine-spec-v0.1.md`
- Modify: `scripts/e2e-smoke.mjs`
- Modify: `artifacts/manse-mobile.png`
- Modify: `artifacts/manse-desktop.png`

**Interfaces:**
- Consumes: completed engine and UI behavior
- Produces: documented policy and repeatable mobile/desktop proof

- [x] **Step 1: Extend the browser smoke test**

Add an 8-digit input pass that asserts the 3-pillar board, missing hour pillar, and unknown-time notice.

- [x] **Step 2: Run full verification**

Run: `npm test -- --run`, `npm run build`, then the local browser smoke script.
Expected: all tests and build pass; no console errors or horizontal overflow.

- [x] **Step 3: Commit**

```powershell
git add README.local-app.md docs/calendar-engine-spec-v0.1.md docs/superpowers/plans/2026-10-07-unknown-birth-time.md scripts/e2e-smoke.mjs src artifacts
git commit -m "feat: support birth dates without a known time"
```
