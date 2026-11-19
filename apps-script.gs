/**
 * SERVER PENILAIAN UJIAN BIOLOGI X (Google Apps Script)
 *
 * Cara pasang:
 * 1. Buat Google Sheet baru > Ekstensi > Apps Script.
 * 2. Hapus isi bawaan, tempel seluruh file ini, lalu Simpan.
 * 3. Deploy > Deployment baru > Jenis: Aplikasi web
 *      Jalankan sebagai: Saya | Yang memiliki akses: Siapa saja
 *    Setujui izin akses yang diminta.
 * 4. Salin URL aplikasi web (berakhiran /exec) ke konstanta ENDPOINT di index.html, lalu commit.
 *
 * Setiap kali file ini diubah, buat Deployment baru (atau Kelola deployment > Edit > Versi baru).
 * Kunci jawaban hanya ada di file ini, tidak pernah dikirim ke browser siswa.
 */

var SHEET_NAME = "Hasil";

var KUNCI_PG = {"1": "C", "2": "E", "3": "A", "4": "D", "5": "B", "6": "D", "7": "A", "8": "C", "9": "E", "10": "B", "11": "A", "12": "B", "13": "D", "14": "B", "15": "E", "16": "B", "17": "D", "18": "A", "19": "E", "20": "C", "21": "C", "22": "E", "23": "B", "24": "A", "25": "D"};
var KUNCI_PGK = {"26": "ABC", "27": "CDE", "28": "ADE", "29": "BCD", "30": "ABE", "31": "AC", "32": "BD", "33": "CE", "34": "AD", "35": "BE"};
var KUNCI_ISIAN = {"36": ["lisozim"], "37": ["transduksi"], "38": ["metanogen", "bakteri metanogen", "archaebacteria metanogen"], "39": ["profag"], "40": ["kapsomer"]};
var NOMOR_ESAI = [41, 42, 43, 44, 45];

var HEADER = ["Waktu","ID","Nama","Kelas","Absen","Status","Alasan","Kamera","Durasi (menit)",
  "PG","PG kompleks","Isian","Skor otomatis","Skor maks otomatis","Esai terisi",
  "Esai 41","Esai 42","Esai 43","Esai 44","Esai 45","Nilai esai (isi guru)","Total","Jawaban (JSON)"];

function doGet() { return json_({ ok: true, info: "Server penilaian aktif" }); }

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(25000);
    var d = JSON.parse(e.postData.contents);
    if (!d || !d.id || !d.nama) return json_({ ok: false, error: "data tidak lengkap" });

    var sh = sheet_();
    var last = sh.getLastRow();

    // Pengiriman ulang dengan ID yang sama tidak membuat baris ganda.
    if (last > 1) {
      var ids = sh.getRange(2, 2, last - 1, 1).getValues();
      for (var i = 0; i < ids.length; i++) {
        if (String(ids[i][0]) === String(d.id)) {
          var r = sh.getRange(i + 2, 10, 1, 6).getValues()[0];
          return json_({ ok: true, skor: skor_(r[0], r[1], r[2], r[5]) });
        }
      }
    }

    var jawab = d.jawab || {};
    var n = nilai_(jawab);
    var esai = NOMOR_ESAI.map(function (no) { return String(jawab[no] || "").slice(0, 5000); });
    var row = last + 1;
    var rowData = [
      new Date(), String(d.id), cut_(d.nama), cut_(d.kelas), cut_(d.absen), cut_(d.status), cut_(d.alasan),
      d.kamera ? "aktif" : "tanpa kamera", d.durasiMenit,
      n.pg, n.pgk, n.isian, n.otomatis, n.max, n.esaiTerisi
    ].concat(esai).concat(["", "=M" + row + "+N(U" + row + ")", JSON.stringify(jawab).slice(0, 45000)]);
    sh.getRange(row, 1, 1, rowData.length).setValues([rowData]);
    return json_({ ok: true, skor: skor_(n.pg, n.pgk, n.isian, n.esaiTerisi) });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADER);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADER.length).setFontWeight("bold");
  }
  return sh;
}

function norm_(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}

function nilai_(jawab) {
  var pg = 0, pgk = 0, isian = 0, esai = 0, no;
  for (no in KUNCI_PG) {
    if (jawab[no] === KUNCI_PG[no]) pg++;
  }
  for (no in KUNCI_PGK) {
    var a = Array.isArray(jawab[no]) ? jawab[no] : [];
    var kunci = KUNCI_PGK[no].split("");
    var benar = 0, salah = 0, dipilih = {};
    a.forEach(function (x) {
      if (dipilih[x]) return;
      dipilih[x] = true;
      if (kunci.indexOf(x) >= 0) benar++; else salah++;
    });
    pgk += Math.max(0, (benar - salah) / kunci.length);
  }
  for (no in KUNCI_ISIAN) {
    var j = jawab[no];
    if (j && KUNCI_ISIAN[no].indexOf(norm_(j)) >= 0) isian++;
  }
  NOMOR_ESAI.forEach(function (no) {
    if (jawab[no] && String(jawab[no]).trim()) esai++;
  });
  pgk = Math.round(pgk * 100) / 100;
  var max = Object.keys(KUNCI_PG).length + Object.keys(KUNCI_PGK).length + Object.keys(KUNCI_ISIAN).length;
  return { pg: pg, pgk: pgk, isian: isian, esaiTerisi: esai, otomatis: Math.round((pg + pgk + isian) * 100) / 100, max: max };
}

function skor_(pg, pgk, isian, esaiTerisi) {
  return {
    pg: pg, pgMax: Object.keys(KUNCI_PG).length,
    pgk: pgk, pgkMax: Object.keys(KUNCI_PGK).length,
    isian: isian, isianMax: Object.keys(KUNCI_ISIAN).length,
    otomatis: Math.round((Number(pg) + Number(pgk) + Number(isian)) * 100) / 100,
    max: Object.keys(KUNCI_PG).length + Object.keys(KUNCI_PGK).length + Object.keys(KUNCI_ISIAN).length,
    esaiTerisi: esaiTerisi, esaiMax: NOMOR_ESAI.length
  };
}

function cut_(v) { return String(v == null ? "" : v).slice(0, 200); }

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
