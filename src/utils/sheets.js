import Papa from 'papaparse';

const MONTHLY_LIMIT = 3108000;
const PUBLISHED_SHEET_BASE =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vT_IPhNskFG-j5LVvtgiwNsuAmSPZaO9T500rjqajkghYWCBgaI3raXPd0o122Jq1xn4iFm0CXOOY1O';

const normalizeHeader = (val) =>
  val === null || val === undefined
    ? ''
    : val.toString().trim().replace(/\s+/g, ' ').toUpperCase();

const findColumnIndex = (row, targetUpper, startIdx = 0) => {
  for (let i = startIdx; i < row.length; i++) {
    if (normalizeHeader(row[i]) === targetUpper) return i;
  }
  return -1;
};

const findFirstHeaderRow = (data) => {
  const scanLimit = Math.min(15, data.length);
  for (let i = 0; i < scanLimit; i++) {
    const row = data[i];
    if (
      row &&
      row.length > 1 &&
      normalizeHeader(row[0]) === 'NO' &&
      normalizeHeader(row[1]) === 'NAMA'
    ) {
      return i;
    }
  }
  return -1;
};

const findMatchingRightColumn = (subHeaderRow, rawName, startIdx, endIdx, usedCols) => {
  const normalizedTarget = normalizeHeader(rawName);
  // Prefer exact trimmed match before falling back to normalized whitespace/case match
  for (let j = startIdx; j < endIdx; j++) {
    if (!usedCols.has(j) && subHeaderRow[j] === rawName) return j;
  }
  for (let j = startIdx; j < endIdx; j++) {
    if (!usedCols.has(j) && normalizeHeader(subHeaderRow[j]) === normalizedTarget) return j;
  }
  return -1;
};

const buildActivityMapping = (subHeaderRow, leftNamaIdx, rightNamaIdx, honorSectionEnd) => {
  const mapping = [];
  const usedRightCols = new Set();

  for (let i = leftNamaIdx + 1; i < rightNamaIdx; i++) {
    const actName = subHeaderRow[i];
    if (!actName) continue;

    const honorIdx = findMatchingRightColumn(
      subHeaderRow,
      actName,
      rightNamaIdx + 1,
      honorSectionEnd,
      usedRightCols
    );
    if (honorIdx !== -1) usedRightCols.add(honorIdx);

    mapping.push({
      name: actName,
      volIdx: i,
      honorIdx
    });
  }

  return mapping;
};

const resolveSisaColumnIndex = (subHeaderRow, summaryStartIdx) => {
  const directSisaIdx = findColumnIndex(subHeaderRow, 'SISA', summaryStartIdx);
  if (directSisaIdx !== -1) return directSisaIdx;

  // Jan-Mar sheets omit the "sisa" header; layout is honor tim lain (+0), total gabungan (+1), sisa (+2)
  const honorTimLainIdx = findColumnIndex(subHeaderRow, 'HONOR TIM LAIN', summaryStartIdx);
  return honorTimLainIdx !== -1 ? honorTimLainIdx + 2 : -1;
};

/**
 * Parses the raw 2D array from CSV or Google Sheets API into a structured JSON array.
 * Reads the top summary table ("tabel atas") and stops at its TOTAL row.
 * @param {Array<Array<string>>} data - The 2D array of strings from the sheet.
 * @returns {Array<Object>} The parsed enumerator data.
 */
export const parseSheetData = (data) => {
  if (!Array.isArray(data) || data.length === 0) return [];

  const headerRowIndex = findFirstHeaderRow(data);
  if (headerRowIndex === -1 || data.length <= headerRowIndex + 1) return [];

  const headerRow = data[headerRowIndex].map(h => (h ? h.toString().trim() : ''));
  const subHeaderRow = data[headerRowIndex + 1].map(h => (h ? h.toString().trim() : ''));

  const leftNamaIdx = findColumnIndex(headerRow, 'NAMA');
  const rightNamaIdx = leftNamaIdx !== -1 ? findColumnIndex(headerRow, 'NAMA', leftNamaIdx + 1) : -1;

  if (leftNamaIdx === -1 || rightNamaIdx === -1) {
    console.error("Format CSV tidak sesuai: Tidak menemukan dua kolom NAMA.");
    return [];
  }

  const totalColIdx = findColumnIndex(headerRow, 'TOTAL', rightNamaIdx + 1);
  const honorSectionEnd = totalColIdx !== -1 ? totalColIdx : subHeaderRow.length;
  const activityMapping = buildActivityMapping(
    subHeaderRow,
    leftNamaIdx,
    rightNamaIdx,
    honorSectionEnd
  );
  const sisaColIdx = resolveSisaColumnIndex(
    subHeaderRow,
    totalColIdx !== -1 ? totalColIdx : rightNamaIdx + 1
  );

  const parsedData = [];

  for (let i = headerRowIndex + 2; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0) continue;

    // Check termination rows before skipping blank NAMA rows because TOTAL rows have an empty NAMA cell
    const firstCell = normalizeHeader(row[0]);
    if (firstCell === 'TOTAL') break;
    if (firstCell === 'NO' && normalizeHeader(row[1]) === 'NAMA') break;

    const nama = row[leftNamaIdx] ? row[leftNamaIdx].toString().trim() : '';
    if (!nama) continue;

    const activities = [];
    for (const act of activityMapping) {
      const volume = parseNumber(row[act.volIdx]);
      if (volume > 0) {
        const nominal = act.honorIdx !== -1 ? parseNumber(row[act.honorIdx]) : 0;
        activities.push({
          name: act.name,
          volume,
          nominal,
          honorPerActivity: nominal / volume
        });
      }
    }

    const totalHonor = activities.reduce((sum, act) => sum + act.nominal, 0);
    const hasSisaCell =
      sisaColIdx !== -1 &&
      sisaColIdx < row.length &&
      row[sisaColIdx] !== null &&
      row[sisaColIdx] !== undefined &&
      row[sisaColIdx].toString().trim() !== '';
    const kelebihanValue = hasSisaCell ? parseNumber(row[sisaColIdx]) : MONTHLY_LIMIT - totalHonor;
    const status = kelebihanValue < 0 ? 'MELEBIHI' : 'AMAN';

    parsedData.push({
      nama,
      totalHonor,
      status,
      kelebihanValue,
      activities
    });
  }

  return parsedData;
};

const parseNumber = (val) => {
  if (val === null || val === undefined) return 0;
  const raw = val.toString().trim();
  if (!raw || raw.startsWith('#') || raw === '-' || /^Rp\s*-$/i.test(raw)) return 0;

  const isNegative = raw.includes('-');
  let cleaned = raw.replace(/[^0-9.,]/g, '');
  if (!cleaned) return 0;

  // Handle Indonesian dot-separated thousands (e.g. "Rp 531.000", "1.500.000")
  if (/^\d{1,3}(\.\d{3})+$/.test(cleaned) && (cleaned.split('.').length > 2 || /rp/i.test(raw))) {
    cleaned = cleaned.replace(/\./g, '');
  } else if (cleaned.includes(',') && cleaned.includes('.')) {
    if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (/^\d{1,3}(,\d{3})+$/.test(cleaned)) {
    cleaned = cleaned.replace(/,/g, '');
  } else if (cleaned.includes(',') && !cleaned.includes('.')) {
    cleaned = cleaned.replace(',', '.');
  }

  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  return isNegative ? -Math.abs(num) : num;
};

// =========================================================================
// PENGATURAN GOOGLE SHEETS
// Ganti URL di bawah ini dengan link "Publish to Web" (format CSV) 
// dari masing-masing tab (sheet) bulan di Google Spreadsheet Anda.
// =========================================================================
export const GOOGLE_SHEET_URLS = {
  'JANUARI 2026': `${PUBLISHED_SHEET_BASE}/pub?gid=1202138463&single=true&output=csv`,
  'FEBRUARI 2026': `${PUBLISHED_SHEET_BASE}/pub?gid=993347180&single=true&output=csv`,
  'MARET 2026': `${PUBLISHED_SHEET_BASE}/pub?gid=1247206189&single=true&output=csv`,
  'APRIL 2026': `${PUBLISHED_SHEET_BASE}/pub?gid=1255539316&single=true&output=csv`,
  'MEI 2026': `${PUBLISHED_SHEET_BASE}/pub?gid=2033917721&single=true&output=csv`,
  'JUNI 2026': `${PUBLISHED_SHEET_BASE}/pub?gid=257103065&single=true&output=csv`,
  'JULI 2026': `${PUBLISHED_SHEET_BASE}/pub?gid=761766670&single=true&output=csv`,
  'AGUSTUS 2026': `${PUBLISHED_SHEET_BASE}/pub?gid=1441140252&single=true&output=csv`,
  'SEPTEMBER 2026': `${PUBLISHED_SHEET_BASE}/pub?gid=834130802&single=true&output=csv`,
  'OKTOBER 2026': `${PUBLISHED_SHEET_BASE}/pub?gid=533413725&single=true&output=csv`,
  'NOVEMBER 2026': `${PUBLISHED_SHEET_BASE}/pub?gid=263818052&single=true&output=csv`,
  'DESEMBER 2026': `${PUBLISHED_SHEET_BASE}/pub?gid=1872506315&single=true&output=csv`,
};

const parsePublishedTabs = (html) => {
  const tabs = new Map();
  const itemRegex = /items\.push\(\{name:\s*"([^"]+)",[\s\S]*?gid:\s*"(\d+)"/g;
  let match;
  while ((match = itemRegex.exec(html)) !== null) {
    tabs.set(normalizeHeader(match[1]), match[2]);
  }
  return tabs;
};

const resolveSheetCsvUrl = async (monthKey) => {
  try {
    const pubResponse = await fetch(`${PUBLISHED_SHEET_BASE}/pubhtml`);
    if (pubResponse.ok) {
      const html = await pubResponse.text();
      const publishedTabs = parsePublishedTabs(html);
      if (publishedTabs.size > 0) {
        const liveGid = publishedTabs.get(normalizeHeader(monthKey));
        if (!liveGid) {
          throw new Error(
            `Data bulan ${monthKey} belum tersedia atau belum dipublikasikan di Google Sheets.`
          );
        }
        return `${PUBLISHED_SHEET_BASE}/pub?gid=${liveGid}&single=true&output=csv`;
      }
    }
  } catch (err) {
    // Re-throw explicit unpublished-month errors without attempting a failing CSV fetch
    if (err?.message?.includes('belum tersedia')) throw err;
  }

  return GOOGLE_SHEET_URLS[monthKey];
};

export const fetchSheetData = async (monthKey) => {
  const url = await resolveSheetCsvUrl(monthKey);

  if (!url || url.includes('YOUR_ID_HERE')) {
    throw new Error(`Silakan masukkan URL CSV Google Sheet Anda untuk bulan ${monthKey} di file src/utils/sheets.js`);
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Gagal mengambil data dari Google Sheets. Pastikan link Publish to Web sudah benar.");
    }
    const csvText = await response.text();

    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        complete: (results) => {
          resolve(parseSheetData(results.data));
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error("Gagal mengambil data:", error);
    throw error;
  }
};
