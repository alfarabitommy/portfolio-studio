# Development Roadmap & Implementation Plan

**Project:** Personal Portfolio & Studio Showcase  
**Document Version:** 1.0 (Engineering Execution Blueprint)  
**Target Architecture:** Hybrid Single-Page with SSR, Markdown Article Engine, & Secure Admin  
**Tech Stack:** TanStack Start, Supabase (Postgres, Auth, Storage), Tailwind CSS, Vercel  

---

## 1. Overview & Timeline Phasing

Pengerjaan dibagi ke dalam 6 fase terstruktur dengan pendekatan bertahap (*milestone-driven*). Setiap fase memiliki kriteria pengujian (*Definition of Done*) yang wajib terpenuhi sebelum melangkah ke fase berikutnya.

```text
[Phase 1] ───> [Phase 2] ───> [Phase 3] ───> [Phase 4] ───> [Phase 5] ───> [Phase 6]
Foundations    Public UI      Hybrid Engine   Admin Command   Hardening &     Production
& Backend      & Motions      & SEO System    Center          Performance     Deployment
(Sprint 1)     (Sprint 2)     (Sprint 3)      (Sprint 4)      (Sprint 5)      (Launch)
```

---

## 2. Phase Breakdown

### Phase 1: Foundation, Infrastructure & Database Setup
**Tujuan:** Menyiapkan fondasi monorepo/proyek yang solid, skema database dengan keamanan data ketat (RLS), dan sistem token desain visual.

* [ ] **1.1 Inisialisasi Proyek TanStack Start**
  * Scaffold proyek TanStack Start berbasis Vite + TypeScript.
  * Konfigurasi struktur folder standar industri (`app/routes`, `app/components`, `app/lib`, `app/styles`).
  * Integrasi ESLint, Prettier, dan TypeScript strict mode.
* [ ] **1.2 Konfigurasi Styling & Design Tokens**
  * Instalasi Tailwind CSS v3/v4 dan `@tailwindcss/typography`.
  * Konfigurasi token CSS kustom (warna Zinc pekat, Bone White, Emerald Accent) sesuai `docs/UX_UX_Spec.md`.
  * Setup *theme engine* (Dark mode default dengan deteksi preferensi sistem dan penyimpanan di `localStorage` tanpa efek kedipan FOUC).
  * Konfigurasi font lokal/Google Fonts: Plus Jakarta Sans, Inter, dan Geist Mono.
* [ ] **1.3 Supabase Database & Security Migration**
  * Eksekusi migrasi skema tabel PostgreSQL:
    * `projects` (slug, cover, gallery, stack, problem/solution statements).
    * `articles` (slug, excerpt, markdown content, cover, tags, reading time).
    * `inbox_messages` (name, email, intent, message, status).
    * `site_configs` (key-value store untuk availability status dan URL CV).
  * Pembuatan Storage Buckets di Supabase: `portfolios`, `articles`, dan `assets` (CV PDF).
  * Penerapan dan pengujian skrip **Row Level Security (RLS)**:
    * Akses publik hanya boleh `SELECT` untuk baris bertanda `is_published = true`.
    * Akses tulis/edit/hapus hanya terbuka untuk peranan `authenticated`.
* [ ] **1.4 Supabase Client Integration**
  * Konfigurasi Supabase client yang aman untuk SSR di TanStack Start (isolasi antara client browser dan server context).
  * Setup TypeScript database type generation dari Supabase CLI (`types/supabase.ts`).

---

### Phase 2: Public Single-Page Architecture & Motion Engineering
**Tujuan:** Membangun antarmuka landing page utama yang elegan, interaktif, responsif, dan menyajikan pengalaman visual bernilai tinggi.

* [ ] **2.1 Global Layout & Floating Glass Pill Navbar**
  * Komponen kapsul navigasi melayang (*fixed top-6*) dengan latar belakang *glassmorphism* (`backdrop-blur-md`).
  * Integrasi tombol Theme Switcher menggunakan **View Transitions API** (efek circular mask reveal).
  * Smooth anchor scrolling ke seksi *Works*, *Services*, *Articles*, dan *Contact*.
* [ ] **2.2 Hero Section (Editorial Layering Experience)**
  * Implementasi tata letak teks raksasa monokrom di layer latar belakang (`select-none pointer-events-none`).
  * Integrasi foto monokrom berkualitas tinggi di layer tengah dengan pencahayaan chiaroscuro.
  * Dynamic *Availability Pill* (mengambil data status live dari tabel `site_configs`).
  * Efek *Interactive Spotlight* halus yang mengikuti pergerakan kursor mouse di latar belakang.
  * Implementasi efek tombol *Magnetic CTA* untuk desktop pointer.
* [ ] **2.3 Featured Works (Cinematic Single-Column List)**
  * Tampilan pameran satu kolom lebar dengan nomor editorial `[ 01 ]` dan metadata Geist Mono.
  * Efek interaksi gambar: desaturasi monokrom grayscale yang berubah halus ke warna aslinya saat hover disertai perbesaran skala lembut.
  * *Spring physics hover state* pada seluruh kartu proyek.
* [ ] **2.4 Interactive Project Detail Drawer & Bottom Sheet**
  * **Desktop:** Slide-over drawer meluncur mulus dari sisi kanan layar (`cubic-bezier` spring transition), dengan skala layar latar menyusut halus (`scale-[0.97] blur-[2px]`).
  * **Mobile:** Bottom Sheet adaptif dengan sudut atas membulat dan gesture *swipe-down to dismiss*.
  * Integrasi keyboard accessibility: *focus trap* saat drawer terbuka dan penutupan cepat via tombol `Escape`.
  * Navigasi internal instan antar proyek (*Next/Prev Project*) tanpa perlu menutup drawer.
* [ ] **2.5 Core Competencies & Services**
  * Grid 3 kolom kapabilitas teknis dengan border hairline minimalis.
* [ ] **2.6 Interactive Contact Section & Dynamic Touchpoints**
  * Form pesan interaktif minimalis dengan styling border-bawah berpendar saat aktif.
  * Server function TanStack Start untuk validasi input (Zod) dan penyimpanan pesan ke tabel `inbox_messages`.
  * Tombol unduh CV dinamis yang menarik URL file PDF aktif dari Supabase Storage.

---

### Phase 3: Hybrid Content Engine & Advanced SEO
**Tujuan:** Membangun sistem direktori artikel untuk menjaring trafik organik Google, memperkuat E-E-A-T, dan menempatkan identitas nama di peringkat teratas hasil pencarian.

* [ ] **3.1 Selected Writings Section pada Landing Page**
  * Penarikan 3 artikel teknis terbaru via SSR loader TanStack Start.
  * Kartu artikel dengan tipografi editorial, estimasi waktu baca, dan tombol tautan ke `/articles`.
* [ ] **3.2 Article Directory (`/articles`)**
  * Halaman arsip penuh dengan tata letak majalah arsitektur yang bersih.
  * Input pencarian instan sisi klien (*client-side filtering*) berbasis judul dan tag teknologi.
* [ ] **3.3 Dedicated Article Reader (`/articles/:slug`)**
  * Parser Markdown ke HTML yang aman menggunakan pustaka teruji (disanitasi penuh untuk mencegah XSS).
  * Konfigurasi tipografi `@tailwindcss/typography` dengan tema gelap dan terang yang nyaman dibaca berjam-jam.
  * Indikator *Reading Progress Bar* tipis di bagian paling atas layar (*scroll tracker*).
  * Blok kode teknis (*syntax highlighting*) dengan tombol interaktif salin kode (*copy-to-clipboard*).
  * *Table of Contents* (TOC) otomatis yang menandai posisi bab aktif pembaca.
* [ ] **3.4 Structured Data (JSON-LD) & SEO Meta Machinery**
  * Implementasi schema `Schema.org/Person` pada halaman utama (lengkap dengan array `sameAs` ke LinkedIn, GitHub, dan Twitter).
  * Implementasi schema `Schema.org/TechArticle` atau `BlogPosting` pada tiap rute artikel dinamis.
  * Generator Open Graph (OG) metadata dinamis untuk setiap halaman dan artikel.
  * Pembuatan rute dinamis `/sitemap.xml` dan berkas `/robots.txt`.

---

### Phase 4: Admin Command Center (`/admin`)
**Tujuan:** Memberikan kendali penuh pada pemilik web untuk memperbarui konten portofolio, menulis artikel, mengunggah CV, dan membaca pesan tanpa menyentuh kode program.

* [ ] **4.1 Autentikasi & Route Guarding**
  * Integrasi form login Supabase Auth (email & password).
  * Proteksi tingkat rute TanStack Router: pemeriksaan token sesi pada *route loader*, pengalihan instan pengunjung tak dikenal ke `/admin/login`.
* [ ] **4.2 Portfolio Project Management (`/admin/projects`)**
  * Tabel daftar portofolio dengan kendali *Optimistic UI* untuk toggle publikasi (*Published/Draft*).
  * Form modal/halaman input: Judul, slug generator, kategori, problem statement, solution statement, array tech stack.
  * Dropzone unggah berkas cover dan galeri multi-file langsung ke Supabase Storage bucket `portfolios`.
* [ ] **4.3 Article Management & Split-Screen Markdown Editor (`/admin/articles`)**
  * Daftar manajemen artikel dengan informasi status rilis dan statistik tanggal.
  * **Editor Markdown Split-Screen:**
    * Editor teks kiri dengan pintasan format cepat (Bold, Italic, Code, Heading, Quotes).
    * Sisi kanan: Render pratinjau langsung yang identik dengan tampilan artikel publik.
    * Drag-and-drop unggah gambar langsung di area teks yang otomatis memunculkan URL publik Supabase Storage.
* [ ] **4.4 Site Settings, Assets & Inbox Reader (`/admin/settings` & `/admin/inbox`)**
  * Panel kontrol status ketersediaan kerja (*Available / Busy*) dengan perubahan seketika di halaman utama.
  * Upload penggantian file CV (PDF) dengan verifikasi preview tautan.
  * Antarmuka kotak masuk pesan dari form kontak publik dengan status baca (*Read/Unread*) dan opsi balas via email.

---

### Phase 5: Hardening, Performance Optimization & Accessibility
**Tujuan:** Menguji seluruh aspek web di bawah standar ketat industri sebelum dipublikasikan.

* [ ] **5.1 Audit Core Web Vitals & Lighthouse**
  * Optimasi format gambar ke WebP/AVIF dengan penentuan dimensi eksplisit (`width`, `height`) untuk mencapai CLS = 0.
  * Verifikasi First Contentful Paint (FCP) < 0.8s dan LCP < 1.2s.
  * Verifikasi skor Google Lighthouse: **Performance 95+, Accessibility 100, Best Practices 100, SEO 100**.
* [ ] **5.2 Accessibility & Keyboard Navigation (WCAG AA)**
  * Uji navigasi menyeluruh hanya menggunakan keyboard (`Tab`, `Shift+Tab`, `Enter`, `Escape`).
  * Verifikasi penanganan *focus trapping* pada drawer proyek dan modal admin.
  * Verifikasi kepatuhan rasio kontras teks (minimal 4.5:1) pada tema gelap maupun terang.
  * Pengujian mode `@media (prefers-reduced-motion)` untuk menonaktifkan animasi bagi pengguna sensitif.
* [ ] **5.3 Cross-Browser & Device Stress Testing**
  * Pengujian responsivitas: iOS Safari, Android Chrome, Desktop Chrome/Edge, Firefox, dan Safari macOS.
  * Pengujian ketahanan drawer geser pada layar ponsel beresolusi kecil (< 375px).

---

### Phase 6: Production Deployment & Launch Sequence
**Tujuan:** Peluncuran resmi ke publik, aktivasi mesin pencari, dan setup pemantauan berkelanjutan.

* [ ] **6.1 Deployment ke Vercel Production**
  * Konfigurasi proyek di Vercel dengan preset TanStack Start / Vite SSR.
  * Pengaturan Environment Variables rahasia di Vercel (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
  * Verifikasi CI/CD pipeline otomatis dari branch Git utama (`main`).
* [ ] **6.2 Domain & DNS Resolution**
  * Pemasangan custom domain personal (misal: `namamu.com` atau `namamu.dev`).
  * Konfigurasi sertifikat SSL/TLS otomatis dan redirect `www` ke apex domain.
* [ ] **6.3 Google Search Console & Indexing Kickoff**
  * Verifikasi kepemilikan domain di **Google Search Console (GSC)**.
  * Pengajuan URL Sitemap resmi (`https://domain.com/sitemap.xml`).
  * Permintaan perayapan prioritas (*Request Indexing*) untuk halaman utama guna mempercepat ranking nama personal.
  * Uji validitas JSON-LD Schema di Google Rich Results Test Tool.
* [ ] **6.4 Post-Launch Verification**
  * Uji pengiriman pesan kontak asli di lingkungan live.
  * Uji unduh berkas CV di berbagai perangkat.
  * Uji mutasi data admin di lingkungan produksi.

---

## 3. Risk Mitigation & Contingency Strategy

| Risiko Potensial | Dampak | Strategi Pencegahan / Mitigasi |
| :--- | :--- | :--- |
| **Animation Jank / Lag di Perangkat Mobile** | Pengalaman pengguna menurun drastis. | Gunakan animasi berbasis transform CSS hardware-accelerated (`translate3d`, `opacity`), hindari animasi yang mengubah layout geometri (`width`, `height`, `margin`). |
| **Gambar Portofolio Berat Memperlambat LCP** | Skor performa dan SEO turun. | Terapkan transformasi gambar otomatis dari CDN Supabase, muat gambar berprioritas tinggi (*fetchpriority="high"*) hanya pada hero, sisanya *lazy loaded*. |
| **Akses Rute Admin Bocor** | Keamanan data terancam. | Jangan mengandalkan proteksi client-side saja; kunci tabel database dengan Supabase RLS policies dan validasi token otentikasi di level server TanStack Start. |
| **Nama Belum Muncul di Peringkat #1 Google** | Target akuisisi reputasi terhambat. | Pastikan schema `Person` terhubung dengan akun media sosial bereputasi tinggi (*authority signal*), dan buat minimal 2 artikel teknis berkualitas tinggi di bulan pertama peluncuran. |