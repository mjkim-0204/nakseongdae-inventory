# Vibe Log — Parts Inventory

---


## 2026-06-30 | 재고관리 확장 Spec 작성

### 작업 내용
- **inventory-management-enhancement** Spec 요구사항 문서(requirements.md) 작성 완료
- 11개 요구사항 정의:
  - UI 탭 구조 분리 (도감/재고/AS가이드/대시보드)
  - 부품 위치 관리 (창고 3곳 + 작업자 차량)
  - 반출/반납 추적 및 선지출 시트 연동
  - 작업자 프로필 및 차량 재고 관리
  - 총재고 수량 관리 (최소 재고 경고 포함)
  - 에러코드-부품 연동 AS 가이드
  - 자주 쓰는 품목 관리 (최대 30개)
  - 부품 코드 체계 개선 (WB-D-FM-01 형식)
  - 구글 시트 일괄 가져오기 (자동 컬럼 매핑)
  - 재고 데이터 동기화 및 영속성
  - 운영 효율 대시보드

### 결정 사항
- 기존 index.html 단일파일 구조에서 탭 기반 확장 구조로 전환 예정
- localStorage + Google Sheet 이중 저장 방식 유지
- Apps Script 백엔드(v3) 기반으로 선지출 시트 연동 구현 예정
- 레거시 부품 코드(KS-XX-NN)와 신규 코드 병행 운영

### 다음 단계
- Tech Design 문서 작성 (design.md)
- Task List 생성 (tasks.md)
- 구현 착수

---
