/**
 * 부품 도감 — Apps Script 백엔드 (v3, pokedex.html 연동)
 *
 * ───────── 설정 순서 ─────────
 * 1) 구글 시트 새로 만들기 (아무 빈 시트면 됨)
 * 2) 상단 메뉴: 확장 프로그램 > Apps Script
 * 3) 기존 코드 다 지우고 이 파일 전체 복붙
 * 4) 아래 DRIVE_FOLDER_ID 에 사진 저장할 드라이브 폴더 ID 입력 (선택)
 * 5) 우상단 [배포] > [새 배포] > 유형: 웹 앱
 *      - 설명: 아무거나
 *      - 다음 사용자로 실행: 나
 *      - 액세스 권한: 모든 사용자   (← 중요)
 * 6) [배포] 누르고 권한 승인 → 나온 웹앱 URL 복사
 * 7) pokedex.html 의 설정 탭에 그 URL 붙여넣기
 * 8) 설정 탭 "연결 테스트" 버튼으로 확인
 *
 * ※ 코드를 수정하면 반드시 [배포] > [배포 관리] > 연필(편집) > 버전 "새 버전" > 배포
 *    (새 배포를 또 만들면 URL이 바뀌니 주의)
 */

const SHEET_NAME = '부품DB';
const DRIVE_FOLDER_ID = '1A3aub62XupBZL8mxVwb8Szvv6hC_4xDh';   // 낙성대 부품사진 폴더

// ★ 시트 URL에서 /d/ 와 /edit 사이의 긴 문자열을 여기 붙여넣기 ★
//   예: https://docs.google.com/spreadsheets/d/[★이부분★]/edit
//   비워두면 "현재 연결된 시트"를 쓰지만, 연결이 안 되어 있으면 동기화가 실패함.
const SPREADSHEET_ID = '1WMNIm_ww-7-CdbKzd0PvMdLkzkVEDpt3TViLuLTouoU';

// 시트 컬럼 순서 (HTML 부품 필드와 1:1)
const HEADERS = ['id','name','name_en','brand','group','device','machines',
  'price_exec','price_bill','sap','tags','desc','memo','photo_url','updated_at'];

function doPost(e) {
  let result = { ok:false };
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;

    if (action === 'ping') {
      result = { ok:true, msg:'연결 성공', time:new Date().toISOString() };
    } else if (action === 'savePart' || action === 'addPart') {
      result = savePart(body.part || body.data || body);
    } else if (action === 'bulkSync') {
      result = bulkSync(body.parts || []);
    } else if (action === 'uploadPhoto') {
      result = uploadPhoto(body);
    } else {
      result = { ok:false, error:'알 수 없는 action: ' + action };
    }
  } catch (err) {
    result = { ok:false, error: err.toString() };
  }
  return json_(result);
}

function doGet(e) {
  let result = { ok:false };
  try {
    const action = (e.parameter && e.parameter.action) || 'ping';
    if (action === 'ping')      result = { ok:true, msg:'GET 연결 성공' };
    else if (action === 'getParts') result = { ok:true, parts: getAllParts() };
    else result = { ok:false, error:'알 수 없는 action: ' + action };
  } catch (err) {
    result = { ok:false, error: err.toString() };
  }
  return json_(result);
}

// ──────────── 부품 1건 저장 (있으면 갱신, 없으면 추가) ────────────
function savePart(p) {
  if (!p || !p.id) return { ok:false, error:'부품 id 없음' };
  const sheet = getSheet_();
  const row = rowFromPart_(p);

  const ids = sheet.getRange(1, 1, Math.max(sheet.getLastRow(),1), 1).getValues().flat();
  let target = -1;
  for (let i = 1; i < ids.length; i++) { if (ids[i] === p.id) { target = i + 1; break; } }

  if (target > 0) sheet.getRange(target, 1, 1, HEADERS.length).setValues([row]);
  else sheet.appendRow(row);

  return { ok:true, id:p.id, mode: target>0 ? 'update' : 'insert' };
}

// ──────────── 전체 부품 한번에 동기화 ────────────
function bulkSync(parts) {
  const sheet = getSheet_();
  sheet.clearContents();
  sheet.appendRow(HEADERS);
  if (parts.length) {
    const rows = parts.map(rowFromPart_);
    sheet.getRange(2, 1, rows.length, HEADERS.length).setValues(rows);
  }
  return { ok:true, count: parts.length };
}

function rowFromPart_(p) {
  return HEADERS.map(h => {
    if (h === 'machines') return Array.isArray(p.machines) ? p.machines.join(' | ') : (p.machines || '');
    if (h === 'updated_at') return new Date().toISOString();
    return p[h] !== undefined && p[h] !== null ? p[h] : '';
  });
}

function getAllParts() {
  const sheet = getSheet_();
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return [];
  const head = rows[0];
  return rows.slice(1).map(r => {
    const o = {};
    head.forEach((h, i) => o[h] = r[i]);
    if (typeof o.machines === 'string') o.machines = o.machines ? o.machines.split(' | ') : [];
    return o;
  });
}

// ──────────── 사진을 드라이브에 업로드, 공개 링크 반환 ────────────
function uploadPhoto(data) {
  const dataUrl = data.imageData || data.imageBase64 || '';
  if (!dataUrl || dataUrl.indexOf(',') < 0) return { ok:false, error:'이미지 데이터 없음' };
  const base64 = dataUrl.split(',')[1];
  const mime = dataUrl.split(';')[0].split(':')[1] || 'image/png';
  const ext = mime.indexOf('png') >= 0 ? '.png' : '.jpg';
  const blob = Utilities.newBlob(Utilities.base64Decode(base64), mime,
    (data.partId || 'part') + '_' + Date.now() + ext);

  const folderId = data.folderId || DRIVE_FOLDER_ID;
  const folder = folderId ? DriveApp.getFolderById(folderId) : DriveApp.getRootFolder();
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  const id = file.getId();
  return { ok:true, fileId:id, url:'https://drive.google.com/uc?export=view&id=' + id };
}

function getSheet_() {
  const ss = SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('시트를 찾을 수 없음 — 코드 상단 SPREADSHEET_ID에 시트 ID를 입력하세요');
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) { sheet = ss.insertSheet(SHEET_NAME); sheet.appendRow(HEADERS); }
  return sheet;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
