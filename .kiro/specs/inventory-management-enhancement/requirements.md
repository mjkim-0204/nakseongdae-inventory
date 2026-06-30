# Requirements Document

## Introduction

기계 부품 재고관리 시스템(부품 도감)의 기능을 확장하여, **탭 기반 UI 구조(도감/재고/AS가이드/대시보드)**, **실시간 재고 수량 관리**, **창고 및 작업자 차량 위치 추적**, **반출·반납 추적과 선지출 연동**, **작업자 프로필 관리**, **에러코드 연동 AS 가이드**, **자주 쓰는 품목 관리**, **효율적 부품 코드 체계**, **구글 시트 자동 컬럼 매핑 일괄 가져오기** 기능을 추가한다. 최종 목적은 **불필요한 운영비 지출 감소**, **신속한 AS 대응으로 재방문율 감소**, **부품 소재 파악 즉시 가능**이다.

## Glossary

- **Inventory_System**: 기계 부품 재고관리 웹 애플리케이션 (부품 도감)
- **Part**: 시스템에 등록된 개별 부품 항목
- **Stock_Record**: 특정 부품의 재고 수량 및 상태를 나타내는 데이터 레코드
- **Location**: 부품이 물리적으로 보관된 위치. 고정 창고(창고A, 창고B, 창고C) 또는 작업자 차량(예: 홍길동 차량)
- **Fixed_Warehouse**: 고정 보관 장소 (창고A, 창고B, 창고C 총 3곳)
- **Worker_Vehicle**: 작업자 개인 차량으로서 이동식 부품 보관 장소 (예: 홍길동 차량, 김철수 차량)
- **Checkout**: 부품을 고정 창고에서 작업자 차량으로 반출하는 행위 (수량 차감, 위치 이동)
- **Return**: 작업자 차량에서 고정 창고로 부품을 반납하는 행위 (수량 복구, 위치 이동)
- **Pre_Expenditure_Sheet**: 선지출 기록용 구글 시트. 반출 시 자동으로 행이 추가됨
- **Worker_Profile**: 작업자 개인 정보(이름, 연락처)와 소속 차량, 현재 보유 부품 목록을 포함하는 프로필
- **Error_Code**: 기기에서 발생하는 고장/에러 식별 코드 (예: AL2, E5 등)
- **AS_Guide**: 특정 에러코드 발생 시 필요한 부품 목록과 보관 위치를 안내하는 대응 가이드
- **Frequent_Part**: 사용 빈도가 높아 우선 관리 대상으로 지정된 부품
- **Part_Code**: 부품을 고유하게 식별하는 코드 (현행: KS-[브랜드]-[순번])
- **Bulk_Import**: 외부 데이터 소스(구글 시트/CSV)에서 다량의 부품 데이터를 일괄 가져오는 기능
- **Column_Mapping**: 구글 시트 헤더(첫 행)의 컬럼명을 시스템 필드에 자동 대응시키는 매핑
- **Operator**: 시스템을 사용하는 매장 운영자 또는 AS 엔지니어
- **Google_Sheet**: 부품 데이터가 저장된 외부 구글 스프레드시트
- **Minimum_Stock**: 부품별 설정된 최소 재고 수량 (이하로 떨어지면 경고)
- **Navigation_Tab**: 앱 하단 또는 상단에 위치한 주요 기능 탭 (도감, 재고, AS가이드, 대시보드)

---

## Requirements

### Requirement 1: UI 탭 구조 분리

**User Story:** As an Operator, I want the app to be organized into separate tabs for catalog, inventory, AS guide, and dashboard, so that I can quickly navigate to the function I need without confusion.

#### Acceptance Criteria

1. THE Inventory_System SHALL provide a Navigation_Tab bar with four tabs: 도감(카탈로그), 재고, AS가이드, 대시보드.
2. WHEN an Operator taps a Navigation_Tab, THE Inventory_System SHALL display the corresponding view within 500 milliseconds without a full page reload.
3. THE Inventory_System SHALL visually highlight the currently active Navigation_Tab and display it in a distinct color compared to inactive tabs.
4. WHEN an Operator views a Part detail in the 도감 tab, THE Inventory_System SHALL display that Part's current stock quantity and Location as a cross-link section within the detail view.
5. THE Inventory_System SHALL persist the last active Navigation_Tab selection across browser sessions using localStorage.
6. THE Inventory_System SHALL render the Navigation_Tab bar as a fixed element visible at all scroll positions.

---

### Requirement 2: 부품 위치 관리 (창고 + 작업자 차량)

**User Story:** As an Operator, I want to assign parts to one of three fixed warehouses or a worker's vehicle, so that I can quickly locate where a specific part is stored.

#### Acceptance Criteria

1. THE Inventory_System SHALL support the following Location types: Fixed_Warehouse (창고A, 창고B, 창고C) and Worker_Vehicle (작업자 이름 + "차량" 형식, 예: 홍길동 차량).
2. WHEN an Operator assigns a Location to a Part, THE Inventory_System SHALL present a dropdown list containing the three Fixed_Warehouses and all registered Worker_Vehicles.
3. WHEN an Operator views a Part detail, THE Inventory_System SHALL display the assigned Location within the top section of the detail view, visible without scrolling.
4. THE Inventory_System SHALL provide a location-based filter view that groups all Parts by their Location, sorted by Fixed_Warehouse first (alphabetical) then Worker_Vehicle (alphabetical by worker name).
5. WHEN an Operator searches for a Part, THE Inventory_System SHALL include Location as a searchable field, supporting partial text match (예: "창고A", "홍길동").
6. IF a Part has no assigned Location, THEN THE Inventory_System SHALL display "위치 미지정" as a placeholder with a prompt to assign one.
7. WHEN a new Worker_Profile is registered, THE Inventory_System SHALL automatically add the corresponding Worker_Vehicle to the available Location list.

---

### Requirement 3: 반출/반납 추적 및 선지출 연동

**User Story:** As an Operator, I want to record when parts are checked out to a worker and returned to the warehouse, so that I can track who has which parts and maintain accurate inventory counts.

#### Acceptance Criteria

1. WHEN an Operator initiates a Checkout, THE Inventory_System SHALL require the Operator to enter: worker name (selected from registered Worker_Profiles), quantity (integer, 1 to 999), and destination store name (free-text, maximum 50 characters).
2. WHEN a Checkout is confirmed, THE Inventory_System SHALL subtract the checkout quantity from the Part's Stock_Record, change the Part's Location from the source Fixed_Warehouse to the selected Worker_Vehicle, and record the transaction with ISO 8601 timestamp.
3. IF a Checkout quantity exceeds the Part's current available stock at the source Fixed_Warehouse, THEN THE Inventory_System SHALL reject the Checkout and display an error message indicating insufficient stock.
4. WHEN an Operator initiates a Return, THE Inventory_System SHALL require the Operator to select: worker name, Part, return quantity (integer, 1 to 999), and destination Fixed_Warehouse.
5. WHEN a Return is confirmed, THE Inventory_System SHALL add the return quantity back to the Part's Stock_Record, change the Part's Location from the Worker_Vehicle to the selected Fixed_Warehouse, and record the transaction with ISO 8601 timestamp.
6. WHEN a Checkout is confirmed, THE Inventory_System SHALL add a new row to the Pre_Expenditure_Sheet via Apps Script containing: date, worker name, Part name, Part_Code, quantity, and destination store name.
7. THE Inventory_System SHALL provide a transaction history view filtered by worker name, showing all Checkout and Return records for that worker with Part name, quantity, date, and current status (반출중 or 반납완료).
8. WHEN an Operator filters by worker name, THE Inventory_System SHALL display a summary list of all Parts currently held by that worker (반출중 status), with Part name, quantity, and checkout date.
9. IF the Pre_Expenditure_Sheet sync fails during a Checkout, THEN THE Inventory_System SHALL complete the local Checkout transaction, queue the sheet sync for retry, and display a notification indicating that the sheet update is pending.

---

### Requirement 4: 작업자 프로필 및 차량 재고

**User Story:** As an Operator, I want to register worker profiles and view what parts each worker currently has in their vehicle, so that I can instantly find who has a specific part.

#### Acceptance Criteria

1. THE Inventory_System SHALL allow an Operator to register a Worker_Profile with the following fields: name (required, maximum 20 characters), contact number (required, Korean phone format 010-XXXX-XXXX or 01X-XXX-XXXX), and vehicle identifier (auto-generated as "[이름] 차량").
2. THE Inventory_System SHALL display a worker list view showing all registered Worker_Profiles with their name, contact number, and count of currently held parts.
3. WHEN an Operator selects a Worker_Profile, THE Inventory_System SHALL display that worker's current holdings: list of Parts with Part name, Part_Code, quantity, and checkout date for each item.
4. THE Inventory_System SHALL provide a "부품 소재 검색" function where an Operator enters a Part name, and THE Inventory_System SHALL return all Locations (Fixed_Warehouses and Worker_Vehicles) where that Part exists with the quantity at each Location.
5. WHEN an Operator searches for a Part via "부품 소재 검색", THE Inventory_System SHALL display results in the format: "[Location] — [수량]개" (예: "김철수 차량 — 1개", "창고A — 3개").
6. IF a Worker_Profile is deleted while the worker still has checked-out Parts, THEN THE Inventory_System SHALL reject the deletion and display a message listing the Parts that must be returned before deletion.
7. THE Inventory_System SHALL allow an Operator to edit Worker_Profile fields (name, contact number) and SHALL propagate the name change to all associated Location labels and transaction history records.

---

### Requirement 5: 총재고 수량 관리

**User Story:** As an Operator, I want to track the total stock quantity of each part, so that I can prevent stockouts and reduce unnecessary procurement costs.

#### Acceptance Criteria

1. THE Inventory_System SHALL display the current stock quantity as a non-negative integer (0 to 9,999) for each Part on the part list and detail views.
2. WHEN an Operator adds or removes stock for a Part, THE Inventory_System SHALL update the Stock_Record and record the change timestamp (ISO 8601), quantity delta (range: -999 to +999), and the resulting total quantity.
3. WHEN a Part stock quantity falls below the configured Minimum_Stock threshold (default: 2 units per Part), THE Inventory_System SHALL display a distinguishable color-coded low-stock warning indicator on the Part card, and SHALL display a separate out-of-stock indicator when the quantity equals 0.
4. THE Inventory_System SHALL provide a stock summary view in the 재고 tab showing total inventory count, low-stock items count, and out-of-stock items count.
5. WHEN an Operator adjusts stock quantity, THE Inventory_System SHALL require the Operator to select a reason (입고, 출고-AS사용, 출고-폐기, 재고조정) before the adjustment is saved.
6. THE Inventory_System SHALL persist all Stock_Record changes to both localStorage and Google_Sheet via Apps Script.
7. IF a stock adjustment would result in a quantity below 0, THEN THE Inventory_System SHALL reject the adjustment and display an error message indicating that stock cannot be negative.
8. IF the Google_Sheet sync fails, THEN THE Inventory_System SHALL retain the Stock_Record in localStorage, display a sync failure notification to the Operator, and retry the sync on the next stock adjustment or when the Operator manually triggers sync.

---

### Requirement 6: 에러코드-부품 연동 (AS 가이드)

**User Story:** As an Operator, I want to look up which parts are needed for a specific machine error code and where they are stored, so that I can respond to AS calls quickly and reduce repeat visits.

#### Acceptance Criteria

1. THE Inventory_System SHALL maintain a mapping between Error_Code entries and the list of required Parts for resolution, supporting a maximum of 20 Parts per Error_Code entry.
2. WHEN an Operator enters an Error_Code in the AS가이드 tab search, THE Inventory_System SHALL display the list of required Parts with their names, stock quantities, and Locations within 2 seconds of submission.
3. THE Inventory_System SHALL allow an Operator to create, edit, and delete Error_Code-to-Parts mappings, requiring a confirmation prompt before deletion.
4. WHEN an AS_Guide lookup returns required Parts, THE Inventory_System SHALL indicate the stock availability status for each Part as one of: 재고있음 (stock quantity ≥ 2), 부족 (stock quantity = 1), or 재고없음 (stock quantity = 0).
5. THE Inventory_System SHALL allow an Operator to associate each Error_Code with a specific machine brand and device type (예: 우방 건조기 - AL2), where the combination of brand, device type, and Error_Code is unique.
6. WHEN an Operator selects an Error_Code result, THE Inventory_System SHALL display a summary including: error description (free-text, maximum 200 characters), affected machine (brand and device type), required parts list, each part's Location, and recommended action steps (free-text, maximum 500 characters).
7. IF an Operator searches for an Error_Code that does not exist in the mapping, THEN THE Inventory_System SHALL display a message indicating no matching error code was found and offer the option to create a new mapping for that code.
8. IF a Part referenced in an Error_Code mapping has been deleted from the inventory, THEN THE Inventory_System SHALL display that Part as unavailable in the AS Guide results and visually distinguish it from active Parts.

---

### Requirement 7: 자주 쓰는 품목 관리

**User Story:** As an Operator, I want to designate frequently used parts and access them quickly, so that I can prioritize stock management and speed up common AS tasks.

#### Acceptance Criteria

1. THE Inventory_System SHALL allow an Operator to toggle the Frequent_Part designation on any Part, with a maximum of 30 parts designated as Frequent_Part at any time.
2. THE Inventory_System SHALL provide a dedicated "자주 쓰는 부품" filter view that displays only Frequent_Part items, sorted by the Operator-assigned priority order.
3. WHEN a Part is marked as Frequent_Part, THE Inventory_System SHALL display a star icon on the Part card in all views including the index, search results, and detail view.
4. WHEN an Operator opens the "자주 쓰는 부품" filter view, THE Inventory_System SHALL display Frequent_Parts ranked by stock-out transaction count within the most recent 90 days, with parts having zero transactions placed at the end.
5. WHEN a Frequent_Part current stock quantity falls below that Part's configured Minimum_Stock threshold, THE Inventory_System SHALL display a colored badge on that Part that is visually distinct from non-frequent part low-stock warnings.
6. THE Inventory_System SHALL allow an Operator to manually reorder the Frequent_Part list by drag-and-drop or by assigning a priority number between 1 and 30.
7. IF an Operator attempts to designate a Part as Frequent_Part when 30 parts are already designated, THEN THE Inventory_System SHALL display an error message indicating the maximum limit has been reached and reject the designation.
8. THE Inventory_System SHALL allow an Operator to configure a Minimum_Stock threshold (integer value between 0 and 9999) for each Frequent_Part, defaulting to 1 when first designated.

---

### Requirement 8: 부품 코드 체계 개선

**User Story:** As an Operator, I want a more efficient and intuitive part code system, so that I can identify parts quickly by reading the code alone.

#### Acceptance Criteria

1. THE Inventory_System SHALL support a new Part_Code format: [브랜드 2자리]-[기기 1자리]-[기능분류 2자리]-[순번 2자리] (예: WB-D-FM-01 = 우방-건조기-팬모터-01번), where 순번 ranges from 01 to 99 per brand-device-category combination.
2. THE Inventory_System SHALL maintain backward compatibility by storing and displaying the legacy Part_Code (KS-XX-NN) alongside the new code until all Operators confirm migration completeness and an Administrator explicitly disables legacy code display.
3. WHEN an Operator searches by either legacy or new Part_Code, THE Inventory_System SHALL return the matching Part within 2 seconds.
4. WHEN the code migration utility is executed, THE Inventory_System SHALL generate the new Part_Code for each existing Part based on its brand, device, and functional category fields.
5. IF a Part lacks a brand, device, or functional category value required for new Part_Code generation, THEN THE Inventory_System SHALL skip that Part, flag it as "매핑 불가" in the migration result, and display the count of skipped Parts to the Operator.
6. WHEN generating a new Part_Code, THE Inventory_System SHALL validate uniqueness against all existing Part_Codes and, if a duplicate would be created, display an error message indicating the conflicting Part_Code and the existing Part that holds it.
7. THE Inventory_System SHALL define and display a function category reference table (예: FM=팬모터, DV=배수밸브, BD=보드, DS=디스플레이, SN=센서, SW=스위치, VL=밸브, PM=펌프, DL=도어락, DC=도어캐치) and allow an Administrator to add new 2-character category codes with corresponding Korean descriptions, limited to a maximum of 50 categories.

---

### Requirement 9: 구글 시트 일괄 가져오기 (Bulk Import) — 자동 컬럼 매핑

**User Story:** As an Operator, I want to import parts data from an existing Google Sheet with automatic column mapping, so that I can set up the system quickly regardless of column order differences.

#### Acceptance Criteria

1. WHEN an Operator initiates a Bulk_Import, THE Inventory_System SHALL read the first row (header) of the configured Google_Sheet via Apps Script and extract all column names.
2. THE Inventory_System SHALL automatically generate a Column_Mapping by matching source column names to system fields using predefined alias rules (예: "물품명" or "품명" → Part name, "브랜드코드" or "브랜드" → brand, "실행가" or "원가" → price_exec).
3. WHEN the automatic Column_Mapping is generated, THE Inventory_System SHALL display a mapping preview screen showing each source column name paired with its matched system field, and SHALL highlight any unmatched columns in a distinct color.
4. THE Inventory_System SHALL allow the Operator to manually adjust the Column_Mapping preview by re-assigning source columns to different system fields or marking them as "무시(skip)" before confirming the import.
5. WHEN the Operator confirms the Column_Mapping, THE Inventory_System SHALL parse all data rows using the confirmed mapping and display a preview showing the count of new parts, duplicates, and error rows, supporting up to 500 rows per import operation.
6. THE Inventory_System SHALL validate each imported row for required fields (물품명, 브랜드코드) and report validation errors listing each failed row number and the specific missing field name, while continuing to process remaining rows.
7. WHEN a Bulk_Import contains a Part with an existing Part_Code, THE Inventory_System SHALL ask the Operator to choose between: skip (keep existing record unchanged), overwrite (replace all fields of existing record with imported values), or merge (update only non-empty imported fields while preserving existing values for fields left empty in the import source).
8. WHEN the Bulk_Import is confirmed, THE Inventory_System SHALL add all valid Parts to localStorage and sync to Google_Sheet, then display a summary showing imported count, skipped count, and error count. IF the import does not complete within 30 seconds, THEN THE Inventory_System SHALL display a timeout error message and preserve any data already imported up to that point.
9. THE Inventory_System SHALL support importing the following fields from Google_Sheet columns: 물품명, 실행가, 청구가, 브랜드코드, 순번, 기기, 활성상태, 워런티청구여부, and photo URL (if available). The Part_Code SHALL be derived by combining 비용구분코드, 브랜드코드, and 순번 from the source row (예: "KS-WB-01").
10. IF the Google_Sheet connection fails during Bulk_Import, THEN THE Inventory_System SHALL display an error message indicating the connection failure, retain all previously entered or parsed data in localStorage, and provide a retry button that re-attempts the import from the point of failure.
11. WHEN a Bulk_Import completes successfully, THE Inventory_System SHALL generate a Part_Code for each new Part that does not already have one, following the format [비용구분코드]-[브랜드코드]-[순번].

---

### Requirement 10: 재고 데이터 동기화 및 영속성

**User Story:** As an Operator, I want inventory changes to be saved both locally and in the cloud, so that I don't lose data and can access it from other devices.

#### Acceptance Criteria

1. WHEN an Operator makes any inventory change (stock adjustment, location update, checkout, return, frequent marking), THE Inventory_System SHALL save the change to localStorage within 1 second of the action completing and add the change to a local sync queue for Google_Sheet sync.
2. IF a Google_Sheet sync fails due to network error, THEN THE Inventory_System SHALL retain the change in a local sync queue, display a visual offline indicator to the Operator, and retry automatically on the next sync cycle up to a maximum of 10 consecutive retry attempts per queued item.
3. THE Inventory_System SHALL display a sync status indicator showing the last successful sync timestamp in date and time format (YYYY-MM-DD HH:mm) and the number of pending unsynced changes in the queue.
4. WHEN the Inventory_System loads, THE Inventory_System SHALL compare the local data version identifier with the Google_Sheet data version identifier and, if the versions differ, display a notification to the Operator listing the number of conflicting records and offering the option to keep local data, accept remote data, or cancel.
5. THE Inventory_System SHALL log all inventory transactions (입고, 출고, 반출, 반납, 위치변경) with ISO 8601 timestamp, operator action type, and part identifier, retaining a maximum of 500 log entries in localStorage with oldest entries removed first when the limit is exceeded.
6. IF the local sync queue exceeds 50 pending changes, THEN THE Inventory_System SHALL display a warning message to the Operator indicating that unsynced changes are accumulating and recommend connecting to the network.
7. IF localStorage write fails due to storage quota exceeded, THEN THE Inventory_System SHALL display an error message to the Operator indicating that local storage is full and prevent further changes until the Operator acknowledges the condition.

---

### Requirement 11: 운영 효율 대시보드

**User Story:** As an Operator, I want a dashboard showing key inventory metrics including checkout status, so that I can identify cost-saving opportunities and track AS response effectiveness.

#### Acceptance Criteria

1. THE Inventory_System SHALL display the 대시보드 tab showing: total parts count (number of distinct part IDs), total stock units (sum of current inventory quantities across all parts), low-stock alerts count (parts with current stock quantity at or below Minimum_Stock), out-of-stock count (parts with current stock quantity of 0), and total checked-out units (sum of all currently unreturned Checkout quantities).
2. THE Inventory_System SHALL display the top 10 most frequently used parts ranked in descending order by stock-out transaction count within the last 90 days.
3. IF one or more parts have no 실행가 or 청구가 value recorded, THEN THE Inventory_System SHALL exclude those parts from the respective value total and display the count of parts excluded due to missing price data.
4. WHEN an Operator views the 대시보드 tab, THE Inventory_System SHALL show recent AS activity including error codes resolved and parts consumed in the last 30 days.
5. THE Inventory_System SHALL provide a filter to view dashboard metrics by brand (우방, 다뉴브, IT, 공용, 자판기, 서비스), and WHEN a brand filter is selected, THE Inventory_System SHALL recalculate all displayed metrics to reflect only parts belonging to the selected brand.
6. THE Inventory_System SHALL calculate and display the total inventory value (sum of 실행가 × current stock quantity for each part) and potential billing value (sum of 청구가 × current stock quantity for each part).
7. THE Inventory_System SHALL display a "반출 현황" section showing: total workers with checked-out parts, total checked-out Part types, and a list of workers sorted by checked-out quantity in descending order.
