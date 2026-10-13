# UI/UX Design & Interaction Specification Document

**Project:** Personal Portfolio & Studio Showcase  
**Document Version:** 2.0 (Hybrid Single-Page & Editorial Motion Edition)  
**Target Platform:** Web (Desktop & Mobile Responsive, High-DPI Displays)  
**Aesthetic Core:** Editorial Modern, Monochrome Depth, Glassmorphism, Fluid Motion  

---

## 1. Aesthetic Philosophy & Visual Identity

Desain portofolio ini dibangun di atas tiga prinsip visual utama:
1. **Editorial Restraint (Menahan Diri):** Mengutamakan tipografi berani, ruang kosong (*whitespace*) yang bernapas lega, dan hierarki visual yang tegas dibanding ornamen dekoratif yang tidak fungsional.
2. **Monochrome Depth:** Basis palet hitam, putih, dan spektrum abu-abu netral memberikan kesan abadi (*timeless*), mewah, dan berwibawa. Warna karya portofolio menjadi bintang utama melalui interaksi hover dinamis.
3. **Tactile & Fluid Motion:** Setiap interaksi pengguna diperlakukan seperti menyentuh materi fisik—memiliki massa, inersia, dan pantulan halus (*spring physics*) tanpa menghambat kecepatan navigasi.

---

## 2. Design System Tokens

### A. Palet Warna (Dual-Theme Tokens)

Sistem warna menggunakan CSS Custom Properties yang terpetakan ke Tailwind CSS:

| Token Key | Dark Mode (Default) | Light Mode | Peran Desain |
| :--- | :--- | :--- | :--- |
| `--bg-base` | `#09090b` (Zinc 950) | `#fafafa` (Zinc 50) | Latar kanvas utama |
| `--bg-subtle` | `#121215` (Zinc 925) | `#f4f4f5` (Zinc 100) | Latar seksi selang-seling |
| `--surface-card` | `#18181b` (Zinc 900) | `#ffffff` (Pure White) | Kartu proyek, modal, drawer |
| `--surface-glass` | `rgba(9, 9, 11, 0.65)` | `rgba(255, 255, 255, 0.70)` | Kontainer kaca terapung |
| `--border-subtle` | `rgba(255, 255, 255, 0.08)`| `rgba(0, 0, 0, 0.08)` | Pembatas struktural, hairline border |
| `--border-hover` | `rgba(255, 255, 255, 0.22)`| `rgba(0, 0, 0, 0.20)` | Highlight interaktif hover |
| `--text-primary` | `#fafafa` (Zinc 50) | `#09090b` (Zinc 950) | Headline, nama proyek, judul |
| `--text-secondary`| `#a1a1aa` (Zinc 400) | `#52525b` (Zinc 600) | Deskripsi, body copy, ringkasan |
| `--text-muted` | `#71717a` (Zinc 500) | `#a1a1aa` (Zinc 400) | Label teknis, timestamp, indeks |
| `--accent-emerald`| `#22c55e` (Emerald 500) | `#16a34a` (Emerald 600) | Indikator *Available for Work* |
| `--accent-glow` | `rgba(34, 197, 94, 0.35)` | `rgba(22, 163, 74, 0.25)` | Cahaya pulse status pill |

### B. Glassmorphism Formula Specification
Efek kaca harus mempertahankan tingkat kontras teks minimal 4.5:1 (WCAG AA).
* **Floating Header & Badges:**
  * Dark: `backdrop-blur-md bg-zinc-950/60 border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.37)]`
  * Light: `backdrop-blur-md bg-white/70 border border-black/10 shadow-[0_8px_32px_rgba(0,0,0,0.06)]`
* **Card Overlay & Drawer Background:**
  * Backdrop Mask: `backdrop-blur-xl bg-black/60`
  * Drawer Panel Surface: `bg-zinc-950/95 border-l border-white/10`

### C. Tipografi & Skala Teks
Kombinasi tiga tipografi dengan fungsi yang terpisah secara tegas:
1. **Plus Jakarta Sans (Display & Headings):** Geometris, tegas, dan modern.
   * `Hero Title`: `text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tighter leading-[0.95]`
   * `Section Heading`: `text-3xl sm:text-4xl font-bold tracking-tight`
   * `Project Title`: `text-2xl sm:text-3xl font-bold tracking-tight`
2. **Inter (Body Text & Prose):** Sangat mudah dibaca pada berbagai ukuran layar.
   * `Body Large`: `text-lg sm:text-xl font-normal leading-relaxed text-zinc-400`
   * `Body Base`: `text-base font-normal leading-relaxed text-zinc-400`
   * `Body Small`: `text-sm font-normal leading-normal text-zinc-500`
3. **Geist Mono (Metadata, Kategori, & Code Snippets):**
   * `Tag / Chip`: `text-xs font-mono uppercase tracking-widest text-zinc-400`
   * `Editorial Index`: `text-xs sm:text-sm font-mono tracking-widest text-zinc-500`

---

## 3. Komposisi Tata Letak (Layout & Wireframes)

### A. Floating Navigation Pill (Menempel di Tengah Atas)
* **Wujud:** Kapsul kaca mengambang melayang di `top-6 inset-x-0 mx-auto w-max z-50`.
* **Anatomi:**
  * Logo Monogram `[ initials ]` di sisi kiri.
  * Navigasi Anchor: `Works`, `Services`, `Articles`, `Contact`.
  * Separator vertikal tipis `1px`.
  * Theme Toggle Button (Ikon Matahari / Bulan).
  * Quick Resume Trigger (Ikon Download).
* **Scroll Response:** Pada scroll posisi `y > 80px`, navbar bertransisi mengecil halus (`scale-95`), background blur menguat, dan border menjadi lebih terlihat.

```
┌─────────────────────────────────────────────────────────────┐
│  [ MY ]   •  Works   Services   Articles   Contact  │ ☼ │ ⤓ │
└─────────────────────────────────────────────────────────────┘
```

---

### B. Hero Section: Editorial Layering Concept
Menciptakan ilusi 3D tipografis di mana foto potret monokrom berada di antara teks latar dan teks depan:

* **Layer 1 (Background Ambient):** 
  * Radial gradient spotlight lembut berdiameter 600px yang mengikuti koordinat kursor mouse secara *damped* (lerp 0.08).
* **Layer 2 (Background Massive Typography):**
  * Teks raksasa monokrom dengan saturasi rendah: `"ENGINEER"` atau `"ARCHITECT"` (`text-[15vw] select-none text-zinc-900/60 dark:text-zinc-900/40 pointer-events-none`).
* **Layer 3 (Middle Foreground - Cutout Monochrome Portrait):**
  * Foto monokrom vertikal resolusi tinggi dengan teknik pencahayaan editorial (high contrast chiaroscuro).
  * Foto diletakkan asimetris tengah-kanan dengan masking halus di bagian bawah yang menyatu ke latar web.
  * *Status Pill:* Mengambang di atas sudut foto, memuat titik hijau berpendar dengan label:
    `🟢 Available for Q4 Projects` (dinamis via Supabase).
* **Layer 4 (Front Foreground - Value Proposition & CTA):**
  * Headline utama: *"Crafting high-impact digital systems with architectural precision."*
  * Dua tombol tindakan:
    * Primary CTA: *"Start a Project"* (Magnetic Glass Button dengan border berpendar).
    * Secondary CTA: *"Explore Works"* (Teks dengan panah scroll ke bawah).

---

### C. Featured Works: Cinematic Single-Column List
Format pameran satu kolom lebar berirama tinggi:
* **Struktur Kartu Proyek:**
  * **Header Row:** Nomor indeks editorial `[ 01 / 06 ]` bersanding dengan nama kategori produk (misal: `FINTECH / HIGH-SCALE ARCHITECTURE`).
  * **Media Window (Rasio 16:10):**
    * Gambar cover resolusi tinggi.
    * Efek default: Desaturasi monokrom penuh (`grayscale`).
    * Efek hover: Gambar bertransisi mulus ke warna aslinya (`grayscale-0`), skala membesar perlahan `scale-[1.02]`.
  * **Content Meta (Bawah Media):**
    * Judul proyek berukuran besar (`text-2xl sm:text-3xl font-bold`).
    * 2 baris ringkasan masalah & hasil bisnis.
    * Kumpulan pill badge tech stack menggunakan Geist Mono: `[ Next.js ]`, `[ PostgreSQL ]`, `[ Redis ]`.
    * Tombol pemicu: *"View Case Study"* dengan panah `↗` yang berputar rotasi 45 derajat saat di-hover.

---

### D. Core Competencies & Services
Penyajian 3 pilar kapabilitas untuk meyakinkan calon klien dan partner bisnis:
* Grid 3 kolom horizontal bergaris pembatas halus (*hairline border*):
  1. **System & Web Architecture:** Pembangunan platform skala besar, SSR, optimasi database, dan performa tinggi.
  2. **Product Engineering & UI/UX:** Penerjemahan desain ke dalam antarmuka interaktif yang presisi secara visual dan aksesibilitas.
  3. **Technical Consulting:** Audit performa, perbaikan Core Web Vitals, dan modernisasi sistem legacy.

---

### E. Selected Writings / Insights (Hybrid Hub)
Seksi ringkas sebelum kontak untuk mendukung mesin SEO:
* Grid 3 kolom kartu artikel terbaru:
  * Tanggal publikasi editorial & estimasi waktu baca (`OCT 2026 • 5 MIN READ`).
  * Judul artikel provokatif & teknis.
  * Excerpt ringkas 2 baris.
  * Tombol navigasi ke arsip penuh: *"View All Articles ↗"* mengarah ke `/articles`.

---

### F. Contact & Direct Touchpoint (Footer)
* Headline emosional: *"Have a project in mind, or looking for your next tech lead?"*
* **Form Interaktif Minimalis:**
  * Input Nama, Email, Jenis Kolaborasi (Pills: *Freelance / Fulltime / Consulting*), dan Pesan.
  * *Bottom-border only styling*: Garis bawah menyala gradien saat input berfokus.
* **Direct Channels & Action:**
  * Tombol besar *"Download CV (PDF)"* dengan indikator ukuran file dan tanggal update.
  * Tautan langsung: LinkedIn, GitHub, X (Twitter), dan WhatsApp.
  * Copyright & timezone clock: *"Jakarta, ID • 17:14 WIB (GMT+7)"*.

---

## 4. Drawer & Modal System

### A. Desktop Slide-over Drawer (`/projects/:slug` preview state)
* **Trigger:** Klik pada kartu proyek mana pun di halaman utama.
* **Animasi Masuk:**
  * Layar utama di belakang drawer menerima transformasi skala mengecil `scale-[0.97]` dan blur ringan `filter blur-[2px]`.
  * Panel drawer meluncur dari sisi kanan layar (`width: 55vw`, min-width: 640px).
* **Konten di Dalam Drawer:**
  1. **Sticky Header:** Tombol Close `Esc / ✕` dan tombol aksi cepat (*Visit Live Demo ↗* & *Source Code*).
  2. **Hero Proyek:** Gambar cover penuh dengan tag kategori.
  3. **The Challenge (Problem Statement):** Paragraf mendalam mengenai kendala teknis atau kebutuhan bisnis klien.
  4. **The Architecture (Solution):** Rincian solusi teknis yang kamu rancang, diagram alur/arsitektur, dan metodologi.
  5. **Tech Stack Breakdown:** Daftar lengkap teknologi beserta alasan pemilihannya.
  6. **Interactive Gallery:** Screenshot detail fitur dalam rasio asli dengan lightbox zoom.
  7. **Footer Navigation:** Tombol *"← Previous Project"* dan *"Next Project →"* untuk berpindah antar proyek secara instan tanpa menutup drawer.

### B. Mobile Adaptive Bottom Sheet (< 768px Viewport)
* Drawer bertransisi menjadi **Bottom Sheet**:
  * Muncul dari bawah dengan ketinggian 92% viewport.
  * Sudut atas melengkung (`rounded-t-3xl`).
  * Dilengkapi **Drag Handle Bar** di bagian paling atas:
    * Mendukung gestur sentuh *swipe-down to dismiss*.
    * Scroll konten internal terkunci sampai sheet ditarik maksimal ke atas.

---

## 5. Article Directory & Dedicated Reader UI

### A. Article Directory (`/articles`)
* Header bersih dengan form pencarian instan berbasis teks dan deretan tombol filter kategori (*All, Architecture, Frontend, Performance*).
* List artikel bergaya majalah arsitektur dengan tanggal terformat rapi dan efek highlight baris saat kursor melintas.

### B. Article Dedicated Reader (`/articles/:slug`)
* **Reading Progress Bar:** Garis tipis 2px di bagian paling atas layar (*fixed*) yang mengisi dari 0% ke 100% mengikuti posisi pembacaan artikel.
* **Prose Typography:** 
  * Menggunakan kelas `@tailwindcss/typography` yang disesuaikan:
  * Paragraf berukuran nyaman (`text-lg text-zinc-300 leading-relaxed font-normal`).
  * Headings `h2` dan `h3` otomatis memiliki link anchor `#` saat di-hover.
* **Floating Table of Contents (Desktop):**
  * Menempel di kolom samping kiri/kanan pembaca.
  * Menyorot bab yang sedang dibaca (*active scroll-spy*).
* **Code Block UI:**
  * Background gelap pekat (`#0c0c0e`) dengan border tipis.
  * Label bahasa pemrograman di tab atas (misal: `TypeScript`, `SQL`).
  * Tombol interaktif *"Copy Code"* dengan ikon centang saat sukses tersalin.

---

## 6. Micro-Interactions, Physics, & Motion Language

### A. Spring Physics Parameters
Semua transisi interaksi memanfaatkan interpolasi pegas alami, bukan kurva linear kaku:
* **Drawer & Modal:** `stiffness: 320, damping: 32, mass: 1` (Responsif tanpa goncangan berlebih).
* **Scale & Hover Feedback:** `stiffness: 400, damping: 25` (Memberikan sensasi sentuhan elastis).

### B. Magnetic Button Effect (Dekstop Pointer)
* Tombol aksi utama (seperti CTA Hero dan Tombol Kirim Form) mendeteksi posisi pointer dalam radius 35px.
* Tombol bergeser hingga maksimal 8px ke arah kursor, memberikan sensasi hisapan magnetik yang menyenangkan.

### C. Seamless Theme Transition (View Transitions API)
* Mengklik tombol ganti tema memicu `document.startViewTransition`.
* Efek transisi berbentuk lingkaran (*circular reveal mask*) yang meluas dari titik koordinat tombol theme toggle, menyapu seluruh layar dalam waktu 400ms tanpa flicker.

---

## 7. Admin Command Center UX Specification

* **Karakter Antarmuka:** Terkunci di Dark Mode bernuansa minimalis (`bg-zinc-950`). Menghilangkan distraksi visual agar pemilik fokus pada pengelolaan data.
* **Optimistic UI Controls:**
  * Toggle status ketersediaan (*Available / Busy*) dan toggle visibilitas proyek (*Published / Draft*) langsung berubah seketika di layar saat diklik, sementara *mutation query* berjalan di latar belakang. Jika gagal, state otomatis revert dengan toast notifikasi.
* **Markdown Editor dengan Dual Sync Preview (`/admin/articles`):**
  * Sisi Kiri: Textarea kode Markdown dengan font monospace yang nyaman, dilengkapi toolbar formatting (Bold, Italic, Link, Code, Quote, H2, H3).
  * Sisi Kanan: Live Render Preview yang langsung menerapkan styling `@tailwindcss/typography` publik secara real-time.
  * **Drag & Drop Media Ingestion:** Menyeret file gambar ke area editor langsung menampilkan progress bar unggah kecil di posisi kursor, lalu otomatis bertransformasi menjadi `![Deskripsi](https://...supabase.co/storage/v1/object/public/...)`.
* **CV Asset Management:**
  * Kartu khusus dengan drag-zone untuk file PDF. Menampilkan tanggal unggah terakhir, ukuran file, dan tombol *"Open Current PDF in New Tab"* untuk verifikasi cepat sebelum dipublikasikan.

---

## 8. Accessibility (a11y) & Performance Budgets

1. **Keyboard Accessibility:**
   * Seluruh elemen interaktif dapat dijangkau penuh dengan tombol `Tab`.
   * Drawer dan modal wajib menjebak fokus keyboard (*focus trap*), dan tombol `Escape` selalu berfungsi untuk menutup modal kapan pun.
2. **Reduced Motion Support:**
   * Mendukung query `@media (prefers-reduced-motion: reduce)`. Jika pengguna mengaktifkan mode ini pada OS mereka, semua animasi transformasi pegas dan efek parallax dinonaktifkan dan diganti transisi opacity instan.
3. **Contrast Compliance:**
   * Seluruh teks utama dan teks tombol wajib memenuhi rasio kontras minimal 4.5:1 terhadap latar belakangnya.
4. **Core Web Vitals Budget:**
   * Target Cumulative Layout Shift (CLS): `0.00` (semua gambar memiliki `width`, `height`, dan placeholder aspect-ratio).
   * Target Largest Contentful Paint (LCP): `< 1.2 detik` melalui teknik kompresi AVIF/WebP dan SSR TanStack Start.