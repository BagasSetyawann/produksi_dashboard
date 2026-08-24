import Papa from 'papaparse';

/**
 * Parses the raw 2D array from CSV or Google Sheets API into a structured JSON array.
 * @param {Array<Array<string>>} data - The 2D array of strings from the sheet.
 * @returns {Array<Object>} The parsed enumerator data.
 */
export const parseSheetData = (data) => {
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(10, data.length); i++) {
    const row = data[i];
    if (row && row.length > 1 && row[0]?.toString().trim().toUpperCase() === 'NO' && row[1]?.toString().trim().toUpperCase() === 'NAMA') {
      headerRowIndex = i;
      break;
    }
  }

  if (headerRowIndex === -1 || data.length <= headerRowIndex + 1) return [];

  const row4 = data[headerRowIndex].map(h => h ? h.toString().trim() : '');
  const row5 = data[headerRowIndex + 1].map(h => h ? h.toString().trim() : '');

  const leftNamaIdx = row4.indexOf('NAMA');
  const rightNamaIdx = row4.indexOf('NAMA', leftNamaIdx + 1);

  if (leftNamaIdx === -1 || rightNamaIdx === -1) {
    console.error("Format CSV tidak sesuai: Tidak menemukan dua kolom NAMA.");
    return [];
  }

  const activityMapping = [];

  // Find all activities on the left side (Volumes)
  for (let i = leftNamaIdx + 1; i < rightNamaIdx; i++) {
    const actName = row5[i];
    if (actName && actName !== '') {
      // Find corresponding honor column on the right side
      let honorIdx = -1;
      for (let j = rightNamaIdx + 1; j < row5.length; j++) {
        if (row5[j] === actName) {
          honorIdx = j;
          break;
        }
      }
      activityMapping.push({
        name: actName,
        volIdx: i,
        honorIdx: honorIdx
      });
    }
  }

  const parsedData = [];

  for (let i = headerRowIndex + 2; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length === 0 || !row[leftNamaIdx] || row[leftNamaIdx].toString().trim() === '') continue;

    // Stop parsing if we hit the TOTAL row at the bottom
    if (row[0]?.toString().trim().toUpperCase() === 'TOTAL') break;

    const nama = row[leftNamaIdx].toString().trim();

    const activities = [];

    for (const act of activityMapping) {
      const volume = parseNumber(row[act.volIdx]);
      if (volume > 0) {
        const nominal = act.honorIdx !== -1 ? parseNumber(row[act.honorIdx]) : 0;
        activities.push({
          name: act.name,
          volume: volume,
          nominal: nominal,
          honorPerActivity: volume > 0 ? (nominal / volume) : 0
        });
      }
    }

    // Calculate Total Honor manually by summing the nominals of the activities
    const totalHonor = activities.reduce((sum, act) => sum + act.nominal, 0);

    // Extract Kelebihan from the last non-empty column
    const rowValues = row.map(v => v ? v.toString().trim() : '').filter(v => v !== '');
    let kelebihanValue = 0;

    if (rowValues.length >= 1) {
      kelebihanValue = parseNumber(rowValues[rowValues.length - 1]);
    }

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
  if (!val) return 0;
  const str = val.toString().replace(/[^0-9.-]+/g, "");
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};

// =========================================================================
// PENGATURAN GOOGLE SHEETS
// Ganti URL di bawah ini dengan link "Publish to Web" (format CSV) 
// dari masing-masing tab (sheet) bulan di Google Spreadsheet Anda.
// =========================================================================
export const GOOGLE_SHEET_URLS = {
  'JANUARI 2026': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT_IPhNskFG-j5LVvtgiwNsuAmSPZaO9T500rjqajkghYWCBgaI3raXPd0o122Jq1xn4iFm0CXOOY1O/pub?gid=1202138463&single=true&output=csv',
  'FEBRUARI 2026': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT_IPhNskFG-j5LVvtgiwNsuAmSPZaO9T500rjqajkghYWCBgaI3raXPd0o122Jq1xn4iFm0CXOOY1O/pub?gid=993347180&single=true&output=csv',
  'MARET 2026': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT_IPhNskFG-j5LVvtgiwNsuAmSPZaO9T500rjqajkghYWCBgaI3raXPd0o122Jq1xn4iFm0CXOOY1O/pub?gid=1247206189&single=true&output=csv',
  'APRIL 2026': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT_IPhNskFG-j5LVvtgiwNsuAmSPZaO9T500rjqajkghYWCBgaI3raXPd0o122Jq1xn4iFm0CXOOY1O/pub?gid=1255539316&single=true&output=csv',
  'MEI 2026': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT_IPhNskFG-j5LVvtgiwNsuAmSPZaO9T500rjqajkghYWCBgaI3raXPd0o122Jq1xn4iFm0CXOOY1O/pub?gid=2033917721&single=true&output=csv',
  'JUNI 2026': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT_IPhNskFG-j5LVvtgiwNsuAmSPZaO9T500rjqajkghYWCBgaI3raXPd0o122Jq1xn4iFm0CXOOY1O/pub?gid=257103065&single=true&output=csv',
  'JULI 2026': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT_IPhNskFG-j5LVvtgiwNsuAmSPZaO9T500rjqajkghYWCBgaI3raXPd0o122Jq1xn4iFm0CXOOY1O/pub?gid=761766670&single=true&output=csv',
  'AGUSTUS 2026': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT_IPhNskFG-j5LVvtgiwNsuAmSPZaO9T500rjqajkghYWCBgaI3raXPd0o122Jq1xn4iFm0CXOOY1O/pub?gid=1441140252&single=true&output=csv',
  'SEPTEMBER 2026': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT_IPhNskFG-j5LVvtgiwNsuAmSPZaO9T500rjqajkghYWCBgaI3raXPd0o122Jq1xn4iFm0CXOOY1O/pub?gid=834130802&single=true&output=csv',
  'OKTOBER 2026': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT_IPhNskFG-j5LVvtgiwNsuAmSPZaO9T500rjqajkghYWCBgaI3raXPd0o122Jq1xn4iFm0CXOOY1O/pub?gid=29910910&single=true&output=csv',
  'NOVEMBER 2026': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT_IPhNskFG-j5LVvtgiwNsuAmSPZaO9T500rjqajkghYWCBgaI3raXPd0o122Jq1xn4iFm0CXOOY1O/pub?gid=263818052&single=true&output=csv',
  'DESEMBER 2026': 'https://docs.google.com/spreadsheets/d/e/2PACX-1vT_IPhNskFG-j5LVvtgiwNsuAmSPZaO9T500rjqajkghYWCBgaI3raXPd0o122Jq1xn4iFm0CXOOY1O/pub?gid=1872506315&single=true&output=csv',
};

export const fetchSheetData = async (monthKey) => {
  const url = GOOGLE_SHEET_URLS[monthKey];

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
