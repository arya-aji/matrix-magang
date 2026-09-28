# Panduan Deploy INMA di Coolify

Panduan langkah-demi-langkah men-deploy **INMA (Internship Performance Matrix)**
ke [Coolify](https://coolify.io) memakai Dockerfile yang sudah ada di repo ini.

> Ringkasnya: Coolify build image dari `Dockerfile`, container **otomatis
> menjalankan migrasi** setiap start, dan opsional **menjalankan seed** pada
> deploy pertama lewat `RUN_SEED_ON_START=true`.

---

## 1. Yang dibutuhkan

| Kebutuhan | Keterangan |
| --------- | ---------- |
| Server | VPS dengan Coolify terpasang (Docker + Traefik sudah disiapkan Coolify) |
| Database | PostgreSQL 17 — dibuat dari Coolify (recommended) atau eksternal |
| Repo | Akses GitHub/GitLab ke repo ini (deploy via Git, bukan upload manual) |
| Domain | Opsional tapi disarankan (mis. `inma.domain.com`) + aktifkan HTTPS |

Build image memakai Node 22 Alpine dan **tidak butuh** toolchain dev di produksi,
karena script migrasi & seed sudah di-bundle (`npm run build` menghasilkan
`.next/db/migrate.mjs` dan `.next/db/seed.mjs`).

---

## 2. Buat database PostgreSQL di Coolify

1. Buka project → **+ New** → **Resource** → **Database** → **PostgreSQL**.
2. Pilih versi **17**, isi nama database (mis. `intern_matrix`), lalu **Deploy**.
3. Catat kredensialnya. Coolify menyediakan **Connection String (Internal)** —
   bentuknya seperti:

   ```
   postgresql://postgres:<PASSWORD>@<service-name>:5432/intern_matrix
   ```

Gunakan **URL internal** (`<service-name>:5432`), **bukan** public host/port.
Container app dan database berjalan di network Docker yang sama, jadi lebih cepat
dan tidak perlu mengekspos database ke internet.

Pastikan juga port database **tidak** di-publish publik di Production.

---

## 3. Buat resource aplikasi

1. Project → **+ New** → **Resource** → **Application** → **Public/Private Repository**.
2. Pilih repo ini dan branch yang akan di-deploy (mis. `main`).
3. Pada **Build Pack**, pilih **Dockerfile**.
4. **Dockerfile Location**: `/Dockerfile` (root repo).
5. **Base Directory**: kosongkan (root repo).
6. **Ports Exposes**: `3000` — harus sama dengan `EXPOSE` di Dockerfile.

> Jangan set *Start Command* manual. Image sudah punya `ENTRYPOINT` +
> `CMD ["node", "server.js"]`; menimpanya akan melewati migrasi otomatis.

---

## 4. Isi Environment Variables

Buka tab **Environment Variables** pada application, lalu isi. Tandai semua
nilai rahasia sebagai **secret** (kecuali yang diawali `NEXT_PUBLIC_`).

### Wajib

| Variabel | Contoh / Catatan |
| -------- | ---------------- |
| `DATABASE_URL` | Connection string **internal** dari langkah 2 |
| `AUTH_SECRET` | String acak panjang — **[wajib diganti](#membuat-auth_secret)** |
| `APP_TIMEZONE` | `Asia/Jakarta` |
| `NEXT_PUBLIC_APP_URL` | URL publik app, mis. `https://inma.domain.com` |

### Untuk seed (digunakan saat kontainer start)

| Variabel | Default | Catatan |
| -------- | ------- | ------- |
| `RUN_SEED_ON_START` | `false` | Set `true` pada deploy pertama, lalu kembalikan ke `false` |
| `SEED_ADMIN_EMAIL` | `admin@example.com` | Email login admin |
| `SEED_ADMIN_NAME` | `Administrator` | |
| `SEED_ADMIN_PASSWORD` | `Password123!` | **WAJIB diganti** |
| `SEED_MENTOR_EMAIL` | `mentor@bpsjakpus.cloud` | Mentor pemilik seluruh roster |
| `SEED_MENTOR_NAME` | `Mentor BPS Jakpus` | |
| `SEED_MENTOR_PASSWORD` | `Password123!` | **WAJIB diganti** |
| `SEED_INTERN_PASSWORD` | `Password123!` | Password untuk 24 akun intern — **WAJIB diganti** |
| `SEED_INTERNSHIP_START` | hari ini | Format `YYYY-MM-DD`, mis. `2026-09-01` |
| `SEED_INTERNSHIP_DAYS` | `90` | Lama magang dalam hari |

> `DATABASE_URL` di bawah tidak perlu ditambahkan manual — cukup referensikan
> nilai dari resource database agar tidak duplikatif, mis.
> `DATABASE_URL=${POSTGRES_URL}` atau isi langsung connection string internalnya.

### Membuat AUTH_SECRET

```bash
openssl rand -base64 32
```

atau tanpa openssl:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 5. Deploy pertama (dengan seeding)

1. Set `RUN_SEED_ON_START=true`.
2. Klik **Deploy**.
3. Pantau tab **Logs**. Alur yang benar akan terlihat seperti:

   ```
   [entrypoint] applying database migrations...
   [migrate] migrations applied
   [entrypoint] running bootstrap seed (idempotent)...
   Seed selesai.
     interns:              24
     akun dibuat:          26
     intern → GEMPITA:     24
   ...
   Ready
   ```

4. Setelah aplikasi hidup, **kembalikan `RUN_SEED_ON_START` ke `false`** dan
   deploy ulang (atau sekadar Save; perubahan env akan memicu redeploy).

### Kenapa harus dimatikan lagi?

Seed memang idempotent dan aman diulang, tapi lebih baik tidak dijalankan pada
setiap restart container. Setelah akun awal terbentuk, pengelolaan akun
selanjutnya dilakukan dari UI **Users**.

---

## 6. Domain, HTTPS, dan health check

1. Tab **Domains** → isi domain (mis. `https://inma.domain.com`).
2. Aktifkan **HTTPS** (Let's Encrypt otomatis via Traefik).
3. Samakan `NEXT_PUBLIC_APP_URL` dengan domain tersebut, lalu redeploy.
4. Health check (sudah ada di Dockerfile, tapi pastikan): path `/api/health`,
   port `3000`.

   Verifikasi manual:

   ```bash
   curl -s https://inma.domain.com/api/health
   # {"status":"ok"}
   ```

   Balasan `503 {"status":"degraded"}` berarti **database tidak terjangkau** —
   periksa `DATABASE_URL`.

---

## 7. Setelah deploy: checklist

- [ ] `curl /api/health` → `{"status":"ok"}`
- [ ] Login admin memakai `SEED_ADMIN_EMAIL` + password baru
- [ ] Ganti password admin (klik avatar → **Keluar** setelah ganti, lalu login ulang)
- [ ] Login mentor (`mentor@bpsjakpus.cloud`) → **Interns** menampilkan 24 intern GEMPITA
- [ ] Login salah satu intern → dashboard muncul, tombol **Catat pekerjaan hari ini** ada
- [ ] Ganti password bersama untuk intern (via **Users** bila perlu)
- [ ] `RUN_SEED_ON_START` sudah kembali `false`
- [ ] Port database tidak terbuka publik

> **Catatan keamanan:** aplikasi ini **belum** punya fitur "ganti password sendiri".
> Untuk merotasi password, admin masuk ke **Users** → pilih user → **Reset password**.

---

## 8. Deploy ulang & update

Setiap kali kode baru di-push:

1. Klik **Deploy** (atau aktifkan **Auto Deploy** via webhook Git).
2. Migrasi baru otomatis diterapkan oleh entrypoint.
3. `RUN_SEED_ON_START=false` → seed tidak jalan (aman, data tidak tersentuh).

**Seed tidak pernah menghapus data domain.** Ia hanya membuat yang belum ada dan
memperbarui nama/role/penempatan. Password akun yang sudah ada **tidak** ditimpa.

---

## 9. Rollback

1. Tab **Deployments** → pilih deployment terakhir yang sehat → **Redeploy**.
2. Kalau perubahan melibatkan migrasi database, rollback kode **tidak**
   membatalkan migrasi. Turunkan skema secara manual (mis. buat migrasi baru)
   sebelum redeploy versi lama.

---

## 10. Troubleshooting

| Gejala | Penyebab & solusi |
| ------ | ----------------- |
| Build gagal di `npm ci` | `package-lock.json` tidak ikut ter-commit. Push lockfile-nya. |
| Build gagal `npm run build` | Buka log build; build **wajib** sukses karena menghasilkan bundle migrate/seed |
| `[entrypoint] DATABASE_URL is not set — skipping migrations` | `DATABASE_URL` belum diisi di environment aplikasi |
| `[entrypoint] migrations failed — refusing to start` | Kredensial/host database salah, atau database belum siap. Cek connection string internal & status service DB |
| `[entrypoint] seed failed — continuing anyway` | Aplikasi tetap jalan tanpa akun awal. Cek detail error di log (biasanya `SEED_*` atau koneksi DB) |
| Container restart berulang | Health check gagal → lihat log; biasanya `northflank`/`DATABASE_URL` atau `AUTH_SECRET` kosong |
| `/api/health` balas `degraded` | App hidup tapi DB tidak terjangkau |
| Halaman putih / 500 setelah login | `AUTH_SECRET` belum di-set atau berubah setelah login — set ulang lalu logout/login |
| Login gagal untuk akun intern | Password masih default atau pernah direset. Pakai **Reset password** di Users |
| Data lama muncul kembali setelah deploy | `RUN_SEED_ON_START=false` tidak mengembalikan data apa pun; seed tidak pernah membuat data kerja (tugas/aktivitas). Periksa apakah ada seed lain yang dijalankan manual |

---

## 11. Referensi cepat

### Perintah lokal yang setara

```bash
npm run db:migrate            # migrasi via drizzle-kit (dev)
npm run db:seed               # bootstrap seed (idempotent)
npm run db:seed:demo          # HANYA untuk database lokal (menambah data contoh)
npm run db:bundle             # bundle migrate+seed untuk image produksi
```

Di dalam container, padanannya:

```bash
node ./db/migrate.mjs         # dipanggil otomatis oleh entrypoint
node ./db/seed.mjs            # dipanggil bila RUN_SEED_ON_START=true
```

### Kenapa `npm start` memunculkan warning?

Build memakai `output: "standalone"`, sehingga `next start` memberi peringatan.
Di produksi container menjalankan `node server.js` dari output standalone —
bukan `next start`. Warning ini tidak muncul di container.

### Isi seed saat ini

| Item | Nilai |
| ---- | ----- |
| Admin | 1 akun |
| Mentor | 1 akun (`mentor@bpsjakpus.cloud`) — pemilik seluruh roster |
| Intern | 24 akun (GEMPITA), status ACTIVE |
| Departemen | `GEMPITA` (satu-satunya departemen aktif) |
| Kriteria performa | 5 kriteria, total bobot 100 |
| Data kerja | **tidak dibuat** (tugas/aktivitas/feedback/review kosong) |
```
