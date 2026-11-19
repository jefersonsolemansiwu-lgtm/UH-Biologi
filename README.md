# Ujian Biologi X: Bakteri dan Virus

Ujian online satu halaman untuk Biologi Kelas X (45 soal: pilihan ganda, pilihan ganda kompleks, isian singkat, esai), dengan timer, pengawasan (pindah tab, layar penuh, kamera), dan skor otomatis di akhir tes.

**Penilaian dilakukan di Google Apps Script.** Kunci jawaban hanya ada di `apps-script.gs` (di akun Google guru), tidak ada di `index.html` dan tidak pernah dikirim ke browser siswa. Browser hanya mengirim jawaban, lalu menerima skor.

## Langkah 1: Pasang server penilaian (Apps Script)

1. Buat Google Sheet baru, lalu buka **Ekstensi > Apps Script**.
2. Hapus isi bawaan, tempel seluruh isi `apps-script.gs`, lalu **Simpan**.
3. **Deploy > Deployment baru > Jenis: Aplikasi web**
   - Jalankan sebagai: **Saya**
   - Yang memiliki akses: **Siapa saja**
4. Setujui izin akses, lalu salin **URL aplikasi web** (berakhiran `/exec`).
5. Buka `index.html`, cari baris `const ENDPOINT = "";`, lalu tempel URL di antara tanda kutip. Commit perubahan.

Setiap kali `apps-script.gs` diubah, buat **Deployment baru** (atau Kelola deployment > Edit > Versi baru), kalau tidak perubahan tidak berlaku.

## Langkah 2: Pasang halaman ujian di GitHub Pages

1. Buat repository **Public** di GitHub, lalu unggah `index.html`, `apps-script.gs`, `README.md`, dan `.nojekyll`.
2. **Settings > Pages > Deploy from a branch**, pilih `main` dan `/ (root)`, lalu **Save**.
3. Link siswa: `https://USERNAME.github.io/NAMA-REPO/`

Kamera hanya berjalan di alamat https, dan GitHub Pages sudah https.

## Hasil di Google Sheet

Setiap siswa menjadi satu baris di sheet **Hasil**: skor pilihan ganda, pilihan ganda kompleks, isian, skor otomatis, lima jawaban esai, dan seluruh jawaban (JSON). Isi kolom **Nilai esai (isi guru)**; kolom **Total** terhitung otomatis (skor otomatis + nilai esai).

Pengiriman ulang dengan ID yang sama (misalnya siswa menekan "Kirim ulang") tidak membuat baris ganda.

## Aturan pengawasan

- Pindah tab, keluar layar penuh, salin/tempel, tombol pintas pengembang, dan kamera mati atau wajah tidak terdeteksi akan menghentikan ujian.
- Klik kanan hanya diblokir dan tidak menghentikan ujian.
- Ujian tidak bisa diulang dari perangkat yang sama.

## Jika pengiriman gagal

Siswa melihat tombol **Kirim ulang** dan kode hasil cadangan (berisi jawaban, bukan kunci). Kalau `ENDPOINT` masih kosong, skor tidak bisa ditampilkan.
