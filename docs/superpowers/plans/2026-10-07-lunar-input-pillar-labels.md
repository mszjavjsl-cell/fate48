# Lunar Input and Pillar Labels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 표준시간대 입력을 제거하고 숫자 12자리 양력·음력 입력, 음양오행 색상, 천간·지지의 한글 십성 분류를 제공한다.

**Architecture:** 화면 입력은 `calendar`와 `leapMonth`를 계산 엔진에 전달하며, 음력은 `tyme4ts`로 양력 날짜를 구한 뒤 기존 한국 표준시 계산 파이프라인을 재사용한다. 십성의 한글 이름과 비겁·식상·재성·관성·인성 분류는 도메인에서 계산해 화면은 표시만 담당한다.

**Tech Stack:** React 19, TypeScript 7, Vite 8, Vitest 5, tyme4ts 1.5.3, Testing Library

**Spec:** `docs/calendar-engine-spec-v0.1.md`

## Global Constraints

- 사용자 시간대 입력은 제거하고 MVP 계산 시간대는 `Asia/Seoul`로 고정한다.
- 화면 입력은 `yyyymmddhhmm` 숫자 12자리 한 칸을 사용하고 제출 시 `date`와 `time`으로 분리한다.
- 음력 윤달은 음력 월을 음수로 전달하는 `tyme4ts` 계약을 사용한다.
- 음력 입력은 실제 양력 날짜로 변환된 뒤 원국·대운 계산에 사용한다.
- 십성은 한글 정확 명칭과 비겁·식상·재성·관성·인성 분류를 함께 반환한다.
- 오행 색상은 목·화·토·금·수의 기존 팔레트를 유지하고 음양은 한글 텍스트로 병기한다.
- 모바일 360px에서 네 원국 열이 잘리지 않아야 한다.

---

### Task 1: 음력 입력과 십성 도메인 모델

**Files:**
- Modify: `src/domain/manse.test.ts`
- Modify: `src/domain/ganji.ts`
- Modify: `src/domain/manse.ts`

**Interfaces:**
- Consumes: `BirthInput { date, time, sex, calendar?, leapMonth? }`.
- Produces: 음력 입력을 양력으로 정규화한 `calculateManse`, 한글 `tenGod`, `tenGodGroup`, `branchTenGod`, `branchTenGodGroup`, `stemYinYang`, `branchYinYang`.

- [ ] **Step 1: 음력 변환과 한글 십성 테스트를 작성한다**

```ts
const lunar = calculateManse({ date: '1989-04-09', time: '07:15', sex: 'female', calendar: 'lunar' })
expect(lunar.normalizedBirth.solarDate).toBe('1989-05-13')
expect(lunar.pillars[3]).toMatchObject({ tenGod: '정재', tenGodGroup: '재성', branchTenGod: '정관', branchTenGodGroup: '관성' })
```

- [ ] **Step 2: 테스트가 기존 코드에서 실패하는지 확인한다**

Run: `npm test -- --run src/domain/manse.test.ts`
Expected: 음력 날짜가 변환되지 않고 한글 십성 필드가 없어 FAIL.

- [ ] **Step 3: 음력 정규화와 십성·음양 매핑을 구현한다**

```ts
const lunarMonth = input.leapMonth ? -month : month
const solar = LunarDay.fromYmd(year, lunarMonth, day).getSolarDay()
const tenGod = getTenGodInfo(dayMaster.getName(), stem.getName())
```

- [ ] **Step 4: 도메인 테스트를 통과시킨다**

Run: `npm test -- --run src/domain/manse.test.ts`
Expected: 음력 변환, 윤달 검증, 한글 십성·분류 PASS.

### Task 2: 입력 화면과 원국 정보축

**Files:**
- Modify: `src/App.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/BirthForm.tsx`
- Modify: `src/components/PillarBoard.tsx`
- Modify: `src/styles.css`
- Modify: `README.local-app.md`

**Interfaces:**
- Consumes: Task 1의 `BirthInput`과 확장된 `PillarInfo`.
- Produces: 양력·음력 토글, 조건부 윤달 선택, 숫자 12자리 입력 폼, 우측 상단 출생정보, 천간·지지 음양오행 및 한글 십성 표시.

- [ ] **Step 1: 사용자 화면 테스트를 작성한다**

```tsx
expect(screen.queryByLabelText('표준 시간대')).not.toBeInTheDocument()
await user.click(screen.getByLabelText('음력'))
expect(screen.getByLabelText('윤달')).toBeInTheDocument()
await user.type(screen.getByLabelText('생년월일시분 숫자 12자리'), '198904090715')
expect(screen.getByText('음력 1989년 4월 9일 07시 15분')).toBeInTheDocument()
expect(within(screen.getByRole('group', { name: '시주 丙辰' })).getByText('재성')).toBeInTheDocument()
```

- [ ] **Step 2: 화면 테스트가 실패하는지 확인한다**

Run: `npm test -- --run src/App.test.tsx`
Expected: 시간대·분리 입력이 남아 있고 숫자 입력·음력·원국 한글 분류가 없어 FAIL.

- [ ] **Step 3: 입력과 원국 레이아웃을 구현한다**

```tsx
<input inputMode="numeric" maxLength={12} aria-label="생년월일시분 숫자 12자리" />
<input type="radio" aria-label="음력" checked={value.calendar === 'lunar'} />
<span className="relation-group">{pillar.tenGodGroup}</span>
<span data-element={pillar.stemElement}>{pillar.stemYinYang}{pillar.stemElementLabel}</span>
```

- [ ] **Step 4: 전체 자동화와 브라우저 검증을 실행한다**

Run: `npm test -- --run && npm run build`
Expected: 전체 테스트와 빌드 PASS; 모바일·데스크톱에서 입력과 원국 정보가 잘리지 않음.

## Self-Review

- 네 사용자 요구사항은 Task 1의 계산·표기 모델과 Task 2의 화면에 모두 연결된다.
- 음력은 표시 토글이 아니라 실제 날짜 변환으로 검증한다.
- 기존 대운·세운 상호작용과 배포 경로는 변경하지 않는다.
- 인터페이스 이름은 `calendar`, `leapMonth`, `tenGodGroup`, `branchTenGodGroup`으로 일관된다.
