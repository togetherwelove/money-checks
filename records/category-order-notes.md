# 분류 순서 조정 기록

최종 갱신: 2026-04-03
상태: 적용 완료

## 유스케이스

- 기록 화면에서 수입/지출 분류는 정사각형 카드 그리드로 표시한다.
- 사용자가 분류 카드를 길게 누르면 순서 변경 상태가 된다.
- 사용자가 다른 분류 카드를 누르면, 길게 누른 분류 카드가 그 위치로 이동한다.
- 같은 카드를 다시 누르면 순서 변경 상태만 해제한다.
- 수입과 지출의 분류 순서는 서로 독립적으로 저장한다.

## 자동 테스트

- [categoryOrder.test.ts](/C:/git/money-checks/apps/mobile/src/lib/categoryOrder.test.ts)
  - 저장된 순서와 기본 분류 병합 규칙
  - 선택한 분류를 다른 위치로 이동시키는 순서 계산

## 구현 메모

- 순서 계산은 [categoryOrder.ts](/C:/git/money-checks/apps/mobile/src/lib/categoryOrder.ts)에서 처리한다.
- 로컬 저장은 [categoryOrderStorage.ts](/C:/git/money-checks/apps/mobile/src/lib/categoryOrderStorage.ts)에서 처리한다.
- 화면 상태는 [useCategoryOrder.ts](/C:/git/money-checks/apps/mobile/src/hooks/useCategoryOrder.ts)에서 관리한다.
