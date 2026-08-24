const Papa = require('papaparse');

const text = `,,,,,,,,,,,,,,,,,,,,,,,,,KSA PADI,KSA JAGUNG,LPTB,SEDAPP BULANAN,UBINAN PADI,UBINAN PALAWIJA,PIT,PPTPI,,,VIMK TW 4,IBS TW 4,GALIAN TW 4,AIR BERSIH TW 4,,,,,,,,,,,,
,,,,,,,,,,,,,,,,,,,,,,,,,"110,000","56,000","57,000","62,000","81,000","81,000","53,000","53,000",,,"53,000","75,000","66,000","44,000",,,,,,,,,,,,
,,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,,,,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,,,,,,
NO,NAMA,JANUARI,,,,,,,,,,,,,,,,,,,,,NO,NAMA,JANUARI,,,,,,,,,,,,,,,,,,,,TOTAL,KELEBIHAN KONTRAK 1 BULAN,,,,
,,KSA PADI,KSA JAGUNG,LPTB,SEDAPP BULANAN,UBINAN PADI,UBINAN PALAWIJA,PIT,PPTPI,,,VIMK TW 4,IBS TW 4,GALIAN TW 4,AIR BERSIH TW 4,,,,,,,,,,KSA PADI,KSA JAGUNG,LPTB,SEDAPP BULANAN,UBINAN PADI,UBINAN PALAWIJA,PIT,PPTPI,,,VIMK TW 4,IBS TW 4,GALIAN TW 4,AIR BERSIH TW 4,,,,,,,,,,honor tim lain,,
1,Sueb,4,7,,,,,,,,,,,,,,,,,,,,1,Sueb,"440,000","392,000",0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,"832,000",,,"597,000","1,429,000","1,679,000"
7,Sunik Frentiana,0,0,1,,,,,,,,35,,,,,,,,,,,7,Sunik Frentiana,0,0,"57,000",0,0,0,0,0,0,0,"1,855,000",0,0,0,0,0,0,0,0,0,"1,912,000",,,"1,037,000","2,949,000","-159,000"
TOTAL,,105,88,7,1,0,0,38,1,0,0,51,4,2,1,0,0,0,0,0,0,,,TOTAL,"11,550,000","4,928,000","399,000","62,000",0,0,"2,014,000","53,000",0,0,"2,703,000","300,000","132,000","44,000",0,0,0,0,0,0,"22,185,000",,,,,`;

const parseNumber = (val) => {
  if (!val) return 0;
  const str = val.toString().replace(/[^0-9.-]+/g, "");
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
};

const parseSheetData = (data) => {
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
  
  for (let i = leftNamaIdx + 1; i < rightNamaIdx; i++) {
    const actName = row5[i];
    if (actName && actName !== '') {
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

    const rowValues = row.map(v => v ? v.toString().trim() : '').filter(v => v !== '');
    let kelebihanValue = 0;
    let totalHonor = 0;

    if (rowValues.length >= 2) {
      kelebihanValue = parseNumber(rowValues[rowValues.length - 1]);
      totalHonor = parseNumber(rowValues[rowValues.length - 2]);
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

const res = Papa.parse(text);
const parsed = parseSheetData(res.data);
console.log(JSON.stringify(parsed, null, 2));
