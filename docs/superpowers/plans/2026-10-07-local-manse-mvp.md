# Local Manse MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 양력 생년월일·생시·성별을 입력하면 사주 원국, 정밀 대운 교운시점, 클릭 가능한 10년 대운과 연도·나이 병기 세운을 로컬 웹에서 보여주는 MVP를 만든다.

**Architecture:** 계산은 순수 TypeScript 도메인 모듈로 격리하고, `tyme4ts`는 간지·절기 원자료 공급자로만 사용한다. 시각은 `Temporal`의 instant와 IANA 시간대로 정규화하며 React 화면은 계산 결과를 읽어 대운과 세운 선택 상태만 관리한다.

**Tech Stack:** React 19.3.0, TypeScript 7.0.2, Vite 8.3.3, Vitest 5.0.3, Testing Library 16.3.3, tyme4ts 1.5.3, @js-temporal/polyfill 0.5.1, CSS

**Spec:** `docs/calendar-engine-spec-v0.1.md`

## Global Constraints

- 프로필 ID는 `kr-traditional-v1-draft`로 유지한다.
- 내부 절기 비교는 UTC instant로 수행하고 표시는 입력 IANA 시간대로 변환한다.
- 일주 경계는 현지 민간시 00:00, 자시는 23:00:00 이상 01:00:00 미만으로 계산한다.
- 대운 기산은 `luckDurationSeconds = elapsedSeconds * 120` 정수 산술을 사용한다.
- 첫 교운은 현지 달력에서 년 → 월 → 일 → 시 → 분 → 초 순으로 더한다.
- 계산 결과에는 공급자와 버전, 선택 절기, 경과 초, 환산기간을 노출한다.
- 첫 화면은 360px 폭부터 사용할 수 있는 모바일 우선 레이아웃이며 모든 선택 버튼은 최소 44px 터치 영역을 가진다.
- 이 폴더는 Git 저장소가 아니므로 각 작업은 테스트 통과 상태를 체크포인트로 삼는다.

---

## File Map

- `package.json`, `vite.config.ts`, `tsconfig*.json`, `index.html`: 실행·빌드·테스트 기반.
- `src/domain/manse.ts`: 입력·출력 타입과 만세력 계산 조정 함수.
- `src/domain/terms.ts`: tyme4ts 절기 시각을 UTC instant로 변환하는 어댑터.
- `src/domain/luck.ts`: 순역, 3일=1년 환산, 교운과 대운·세운 생성.
- `src/domain/ganji.ts`: 일주·시주와 십신·오행 표시 보조 함수.
- `src/domain/*.test.ts`: 골든 케이스와 경계 계산 회귀 테스트.
- `src/App.tsx`, `src/components/*.tsx`: 입력, 원국, 대운 자, 세운 표, 상세 영역.
- `src/styles.css`: 현대적 역서(ledger) 콘셉트의 반응형 디자인 토큰과 레이아웃.
- `src/App.test.tsx`: 사용자 입력과 대운·세운 클릭 상호작용 테스트.

### Task 1: 프로젝트 기반과 정확한 기간 환산

**Files:**
- Create: `package.json`
- Create: `vite.config.ts`
- Create: `tsconfig.json`
- Create: `tsconfig.app.json`
- Create: `tsconfig.node.json`
- Create: `src/test/setup.ts`
- Create: `src/domain/luck.test.ts`
- Create: `src/domain/luck.ts`

**Interfaces:**
- Consumes: 골든 벡터의 `elapsedSeconds`와 현지 출생일시.
- Produces: `convertElapsedToLuckPeriod(elapsedSeconds: number): LuckPeriod`, `addLuckPeriod(birth: Temporal.ZonedDateTime, period: LuckPeriod): Temporal.ZonedDateTime`.

- [ ] **Step 1: 계산 테스트를 먼저 작성한다**

```ts
expect(convertElapsedToLuckPeriod(2_055_014)).toEqual({
  years: 7, months: 11, days: 4, hours: 4, minutes: 28, seconds: 0,
})
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npm test -- --run src/domain/luck.test.ts`
Expected: `src/domain/luck` 모듈이 없어 실패.

- [ ] **Step 3: 정수 산술과 순차 달력 덧셈을 구현한다**

```ts
export function convertElapsedToLuckPeriod(elapsedSeconds: number): LuckPeriod {
  let remaining = elapsedSeconds * 120
  const take = (unit: number) => { const value = Math.floor(remaining / unit); remaining %= unit; return value }
  return { years: take(360 * 86400), months: take(30 * 86400), days: take(86400), hours: take(3600), minutes: take(60), seconds: remaining }
}
```

- [ ] **Step 4: 단위 테스트를 통과시킨다**

Run: `npm test -- --run src/domain/luck.test.ts`
Expected: 세 골든 환산 사례와 달력 덧셈 사례 PASS.

### Task 2: 원국·절기·대운 계산 엔진

**Files:**
- Create: `src/domain/ganji.ts`
- Create: `src/domain/terms.ts`
- Create: `src/domain/manse.test.ts`
- Create: `src/domain/manse.ts`

**Interfaces:**
- Consumes: `BirthInput { date: string; time: string; sex: 'male' | 'female'; timeZone: string }`.
- Produces: `calculateManse(input: BirthInput): ManseResult`, `ManseResult`의 `pillars`, `luck`, `metadata`.

- [ ] **Step 1: 1989-05-13 07:15 여성 사례와 자시·절입 경계 테스트를 작성한다**

```ts
const result = calculateManse({ date: '1989-05-13', time: '07:15', sex: 'female', timeZone: 'Asia/Seoul' })
expect(result.pillars.map((item) => item.pillar)).toEqual(['己巳', '己巳', '癸酉', '丙辰'])
expect(result.luck.direction).toBe('forward')
expect(result.luck.basisTerm.name).toBe('망종')
expect(result.luck.cycles[0].pillar).toBe('庚午')
```

- [ ] **Step 2: 실패를 확인한다**

Run: `npm test -- --run src/domain/manse.test.ts`
Expected: `calculateManse`가 없어 실패.

- [ ] **Step 3: tyme4ts 절기 어댑터와 한국 시간 기준 일·시주를 구현한다**

```ts
export function calculateManse(input: BirthInput): ManseResult {
  const birth = Temporal.ZonedDateTime.from(`${input.date}T${input.time}:00[${input.timeZone}]`)
  const pillars = calculatePillars(birth)
  const direction = getLuckDirection(pillars.year.stem, input.sex)
  const basisTerm = findBasisTerm(birth, direction)
  return buildManseResult(input, birth, pillars, direction, basisTerm)
}
```

- [ ] **Step 4: 엔진 테스트를 통과시킨다**

Run: `npm test -- --run src/domain/manse.test.ts src/domain/luck.test.ts`
Expected: 원국, 순역, 절기, 교운, 대운과 세운 회귀 테스트 PASS.

### Task 3: 모바일 입력·원국·대운·세운 상호작용

**Files:**
- Create: `src/main.tsx`
- Create: `src/App.test.tsx`
- Create: `src/App.tsx`
- Create: `src/components/BirthForm.tsx`
- Create: `src/components/PillarBoard.tsx`
- Create: `src/components/LuckRail.tsx`
- Create: `src/components/YearGrid.tsx`

**Interfaces:**
- Consumes: `calculateManse(input)`와 `ManseResult`.
- Produces: 접근 가능한 입력 폼, `aria-pressed` 대운 버튼, 연도·연 나이·세운 간지를 함께 표시하는 세운 버튼.

- [ ] **Step 1: 폼 계산과 대운·세운 선택 테스트를 작성한다**

```tsx
await user.click(screen.getByRole('button', { name: /만세력 계산/ }))
expect(screen.getByText('癸酉')).toBeInTheDocument()
await user.click(screen.getByRole('button', { name: /辛未 대운/ }))
await user.click(screen.getByRole('button', { name: /2007년.*19세/ }))
expect(screen.getByRole('heading', { name: /2007년 세운/ })).toBeInTheDocument()
```

- [ ] **Step 2: UI 테스트 실패를 확인한다**

Run: `npm test -- --run src/App.test.tsx`
Expected: 화면 컴포넌트가 없어 실패.

- [ ] **Step 3: 계산 결과를 한 번만 만들고 선택 상태만 갱신하는 React 화면을 구현한다**

```tsx
const [result, setResult] = useState(() => calculateManse(DEFAULT_INPUT))
const [selectedCycle, setSelectedCycle] = useState(0)
const selectedYears = result.luck.cycles[selectedCycle].years
```

- [ ] **Step 4: 상호작용 테스트를 통과시킨다**

Run: `npm test -- --run src/App.test.tsx`
Expected: 입력, 계산, 대운 클릭, 세운 클릭, 상세 갱신 모두 PASS.

### Task 4: 현대적 역서 디자인과 전체 검증

**Files:**
- Create: `src/styles.css`
- Create: `src/vite-env.d.ts`
- Create: `README.local-app.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: Task 3의 시맨틱 HTML과 상태 속성.
- Produces: 360px 모바일부터 1200px 데스크톱까지 대응하는 완성 화면과 로컬 실행 안내.

- [ ] **Step 1: 디자인 토큰과 레이아웃을 적용한다**

```css
:root { --paper: #fafbf8; --mist: #edf1f0; --ink: #17262d; --jade: #236a5a; --vermilion: #c45136; }
.luck-rail { display: grid; grid-auto-flow: column; grid-auto-columns: minmax(7rem, 1fr); overflow-x: auto; }
@container app (min-width: 52rem) { .workspace { grid-template-columns: minmax(18rem, 23rem) 1fr; } }
```

- [ ] **Step 2: 반응형·접근성 회귀 테스트를 실행한다**

Run: `npm test -- --run`
Expected: 전체 테스트 PASS.

- [ ] **Step 3: 프로덕션 빌드를 검증한다**

Run: `npm run build`
Expected: TypeScript 오류 없이 `dist/` 생성.

- [ ] **Step 4: 실제 브라우저에서 모바일과 데스크톱을 점검한다**

Run: `npm run dev -- --host 127.0.0.1`
Expected: 390×844와 1280×900에서 가로 본문 넘침이 없고, 대운·세운 버튼 선택과 상세 갱신이 동작.

## Design Plan

- 콘셉트: 둥근 카드 대시보드가 아니라 종이 역서의 격자와 현대 데이터 도구를 결합한 “현대적 만세력 장부”.
- 색: 안개색 바탕과 먹색 글자를 기본으로, 비취색은 구조·계산 정보, 주홍색은 현재 선택 한 곳에만 사용한다.
- 서체: Noto Sans KR Variable은 입력과 설명, Noto Serif KR Variable은 간지와 큰 숫자에 사용한다.
- 모바일 구조:

```text
[제목 / 계산 프로필]
[생년월일 · 생시 · 성별 입력]
[시주 | 일주 | 월주 | 연주]
[순역 · 기준 절기 · 첫 교운]
[대운의 자: 나이 / 연도 / 간지 → 가로 스크롤]
[선택 대운의 세운: 연도 / 연 나이 / 간지]
[선택 세운 상세]
```

- 데스크톱 구조: 왼쪽 입력·원국·계산 근거를 고정 폭 열에, 오른쪽 대운·세운 탐색을 넓은 열에 배치한다.
- 식별 요소: 대운과 세운을 같은 수직축으로 맞춘 “운의 자”에서 연도와 나이를 동시에 읽고, 선택점 하나만 주홍색 선으로 연결한다.
- 모션: 선택선과 상세 교체에만 180ms 전환을 적용하고 `prefers-reduced-motion`에서는 제거한다.

## Self-Review

- Spec coverage: 양력 입력, IANA 시간대, 4주, 12절, 순역, 정밀 교운, 10년 대운, 세운 표시, 감사 정보가 Tasks 1–4에 포함된다.
- Scope boundary: 음력 입력, 진태양시, 해석 문장, 회원·저장 기능은 이 MVP에 포함하지 않는다.
- Type consistency: `BirthInput`, `LuckPeriod`, `ManseResult`, `calculateManse` 이름은 모든 작업에서 동일하다.
- Placeholder scan: 구현을 미루는 표식이나 정의되지 않은 후속 단계가 없다.
