# 정밀 만세력 엔진과 로컬 웹 MVP

계산 규칙과 검증 정답을 기반으로, 생년월일시를 입력해 원국·대운·세운을 탐색하는 로컬 웹 MVP를 함께 관리한다.

배포 주소: [https://mszjavjsl-cell.github.io/fate48/](https://mszjavjsl-cell.github.io/fate48/)

- [로컬 웹 앱 실행과 구현 범위](README.local-app.md)

- [계산 규칙 명세서](docs/calendar-engine-spec-v0.1.md)
- [검증용 정답 사례집](docs/golden-cases.md)
- [기계 판독용 테스트 벡터](test-vectors/golden-cases.v0.1.json)
- [테스트 벡터 JSON Schema](test-vectors/golden-cases.schema.json)
- [만세력 앱 디자인 비교 분석](docs/design-research/manse-app-design-comparison.md)
- [자료화면 무결성 목록](docs/design-research/manse-app-screen-manifest.json)
- [8saju 미러 및 계산 규칙 비교](docs/reference-analysis/8saju-mirror-and-engine-comparison.md)
- [8saju 외부 호환 관측 벡터](test-vectors/reference-8saju.v0.1.json)

## 다음 계산 엔진 잠금 순서

1. 절입시각 공급원과 천문 모델을 결정한다.
2. 일주 기준일을 독립 자료로 검증한다.
3. 경계 테스트를 추가하고 잠정 사례를 `locked`로 승격한다.
4. 순수 함수 형태의 코어 엔진을 구현한다.
5. 테스트 벡터를 모든 지원 언어에서 공통으로 실행한다.

## 현재 벡터 검증

Python 3.9 이상에서 다음을 실행한다.

```powershell
python scripts/verify-golden-cases.py
```

스크립트는 시간대 오프셋, 절입 UTC 변환, 시간차, 120배 환산, 달력식 덧셈과 10년 주기를 독립적으로 검산한다. `jsonschema`가 설치되어 있으면 JSON Schema도 함께 검사한다.
