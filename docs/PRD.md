# Product Requirements Document (PRD)

**Project Name:** Personal Portfolio & Studio Showcase  
**Document Version:** 2.0 (Hybrid Architecture & SEO-Driven Edition)  
**Author / Lead:** Web Development & Architecture Lead  
**Tech Stack:** TanStack Start, Supabase (PostgreSQL, Auth, Storage), Tailwind CSS, Vercel  
**Status:** Approved for Development  

---

## 1. Executive Summary & Vision

Proyek ini bertujuan membangun situs portofolio personal berkinerja tinggi dengan arsitektur **Hybrid Single-Page**. Situs ini menggabungkan keanggunan estetika visual (editorial modern, monokrom, *glassmorphism*, dan *fluid micro-interactions*) dengan kekuatan sistem manajemen konten mandiri serta mesin SEO berstandar industri.

Tujuan utamanya adalah menciptakan kehadiran digital yang otoritatif untuk mengonversi **calon klien freelance**, **perekrut perusahaan teknologi (tech recruiter)**, dan **calon partner bisnis**, sekaligus mendominasi halaman pertama mesin pencari (Google) untuk pencarian nama personal dan topik keahlian teknis terkait.

---

## 2. Target Audience & Core Objectives

| Stakeholder / Audiens | Ekspektasi & Kebutuhan | Key Metric / CTA Utama |
| :--- | :--- | :--- |
| **Calon Klien Freelance** | Mencari bukti portofolio nyata, pemecahan masalah bisnis, dan jalur komunikasi cepat. | Tombol kontak instan (*Hire Me* / WhatsApp / Form). |
| **Tech Recruiter** | Memeriksa kedalaman teknis, arsitektur yang dikuasai, peran spesifik pada proyek, dan dokumen CV. | Akses *Case Study Drawer* & *Download CV* (PDF terbaru). |
| **Calon Partner Bisnis** | Menilai visi profesional, etos kerja, dan pemikiran strategis. | Integrasi artikel (*Thought Leadership*) & koneksi LinkedIn. |
| **Mesin Pencari (Googlebot)** | Membaca identitas terstruktur, indeks artikel teknis (E-E-A-T), dan kecepatan *rendering*. | Ranking #1 nama personal, Core Web Vitals 95+, 100% Crawlability. |

---

## 3. System Architecture & Tech Stack

```text
                           ┌──────────────────────────────────────────────┐
                           │          Vercel Global Edge Network          │
                           └──────────────────────┬───────────────────────┘
                                                  │
                                                  ▼
                           ┌──────────────────────────────────────────────┐
                           │            TanStack Start (SSR)              │
                           │  - TanStack Router (File-based, Type-safe)   │
                           │  - Server Functions & Data Loaders           │
                           │  - Tailwind CSS + Glassmorphism Tokens       │
                           └───────────────┬──────────────┬───────────────┘
                                           │              │
                    (Public Data Read / RLS)              │ (Admin Mutations & Auth)
                                           ▼              ▼
                     ┌────────────────────────────────────────────────────────┐
                     │                   Supabase Platform                    │
                     │  - PostgreSQL Database (Tables + Row Level Security)   │
                     │  - Supabase Auth (Single-user admin access guard)      │
                     │  - Supabase Storage (Buckets: portfolios, articles, cv)│
                     └────────────────────────────────────────────────────────┘
```

* **Frontend Framework:** TanStack Start (React + Vite) untuk *Server-Side Rendering* (SSR) murni tanpa *client-side blank state*, menjamin SEO dan metadata terbaca langsung oleh robot perayap.
* **Styling & Motion:** Tailwind CSS, `@tailwindcss/typography`, dan pustaka animasi pegas (*spring physics*) untuk interaksi *glassmorphism* dan transisi tema.
* **Backend & Database:** Supabase PostgreSQL dengan *Row-Level Security* (RLS) aktif, Supabase Auth untuk proteksi rute admin, dan Supabase Storage untuk media.
* **Deployment & CDN:** Vercel dengan *automated CI/CD* dan integrasi edge caching.

---

## 4. Route Map & Functional Specifications

### A. Public Facing Routes

#### 1. Landing Page (`/` - Single-Page Experience)
* **Hero Section (Editorial Layering):**
  * Penataan layer tipografi besar di latar belakang dengan foto monokrom berkualitas tinggi di layer tengah.
  * *Status Pill* dinamis (misal: *🟢 Available for Q4 Projects*) yang dapat diaktifkan/dinonaktifkan dari panel admin.
  * Teks proposisi nilai yang lugas, menargetkan solusi masalah klien dan kapabilitas rekayasa perangkat lunak.
* **Featured Projects (Cinematic Single-Column):**
  * Daftar proyek horizontal lebar dengan nomor urut editorial `[ 01 ]`, tag teknologi, dan deskripsi ringkas.
  * Efek *parallax* halus pada gambar dan transisi desaturasi monokrom ke warna asli saat disentuh kursor.
  * Klik pada kartu memicu **Slide-over Drawer** (desktop) atau **Bottom Sheet** (mobile).
* **Project Detail Drawer (In-Page Overlay):**
  * Memuat studi kasus mendalam: *Problem Statement*, *Architecture & Solution*, *Tech Stack Tags*, galeri media pendukung, dan tautan langsung ke *Live Demo* serta *Source Code*.
  * Navigasi internal cepat (*Next / Previous Project*) tanpa menutup drawer.
* **Core Competencies & Services:**
  * Penjabaran pilar keahlian: arsitektur sistem, rekayasa web modern, dan konsultasi teknis.
* **Selected Writings / Insights:**
  * Menampilkan 3 artikel teknis terbaru langsung dari database dengan tautan cepat ke `/articles`.
* **Contact & Direct Touchpoint:**
  * Form pesan langsung dengan validasi schema (*Zod*): Nama, Email, Kategori Pesan (Proyek/Pekerjaan/Diskusi), dan Isi Pesan.
  * Tombol unduh CV (PDF) dinamis yang selalu mengarah ke file CV terbaru di Supabase Storage.
  * Tautan kanal profesional (LinkedIn, GitHub, Email langsung).

#### 2. Article Directory (`/articles`)
* Daftar seluruh artikel yang dipublikasikan dengan pencarian instan berbasis judul/tag dan filter kategori.
* Menampilkan estimasi waktu baca (*reading time*) dan tanggal publikasi.

#### 3. Article Detail (`/articles/:slug`)
* Halaman membaca berdedikasi dengan layout tipografi bersih (`prose prose-zinc dark:prose-invert max-w-3xl mx-auto`).
* *Table of Contents* (TOC) otomatis yang melacak posisi scroll.
* Dukungan blok kode teknis (*syntax highlighting*) dengan tombol *copy-code*.
* Tombol bagikan ke LinkedIn, Twitter/X, dan salin tautan.

---

### B. SEO & Identity Engine Specification

Untuk memenuhi target dominasi halaman pertama Google:
1. **Semantic HTML & Metadata Terstruktur:**
   * Dynamic `<title>`: `Nama Lengkap — Web Developer & Software Architect`.
   * Dynamic `<meta name="description">` teroptimasi untuk CTR pencarian.
   * Open Graph (OG) dan Twitter Cards dinamis untuk tiap rute proyek dan artikel.
2. **JSON-LD Schema Markup (Structured Data):**
   * **Halaman Utama (`Schema.org/Person`):** Memuat nama lengkap, jabatan, URL situs resmi, serta array `sameAs` yang memetakan akun LinkedIn, GitHub, dan profil publik bereputasi tinggi milikmu.
   * **Halaman Artikel (`Schema.org/BlogPosting` / `TechArticle`):** Memuat judul, tanggal publikasi, tanggal pembaruan, nama penulis, dan gambar cover.
3. **Sitemap & Robot Discovery:**
   * Endpoint otomatis `/sitemap.xml` yang mengagregasi URL statis dan seluruh slug dinamis (`/articles/:slug`).
   * Berkas `/robots.txt` standar yang mengizinkan perayapan penuh seluruh rute publik dan melarang akses rute `/admin`.

---

### C. Admin Command Center (`/admin`)

* **Authentication Guard:**
  * Autentikasi berbasis Supabase Auth.
  * Proteksi route loader di level TanStack Router: rute non-otentikasi otomatis dialihkan ke `/admin/login`.
* **Portfolio Management (`/admin/projects`):**
  * CRUD proyek lengkap: Judul, slug (auto-generate dari judul), kategori, ringkasan, narasi masalah & solusi, array tech stack, URL live/repo, nomor urut tampilan, dan toggle *Published/Draft*.
  * Upload cover dan galeri multi-file langsung ke Supabase Storage bucket `portfolios`.
* **Article Management (`/admin/articles`):**
  * CRUD artikel: Judul, slug, ringkasan (excerpt), tags, cover image, status publikasi, dan tanggal rilis.
  * **Markdown Editor dengan Split-Screen Live Preview:**
    * Sisi kiri: Editor Markdown dengan toolbar cepat dan shortcut format.
    * Sisi kanan: Live preview sinkron yang merender output HTML sesuai styling publik.
    * **Drag-and-Drop Image Ingestion:** Mengunggah gambar langsung ke Supabase Storage bucket `articles` dan menyisipkan sintaks `![alt](url)` pada baris teks aktif.
* **Site Settings & Assets (`/admin/settings`):**
  * Toggle status ketersediaan kerja (*Available / Fully Booked*) dan teks status.
  * Upload penggantian file CV (PDF) ke bucket `assets` yang otomatis memperbarui URL unduhan publik.
* **Inbox Reader (`/admin/inbox`):**
  * Daftar pesan masuk dari form kontak publik dengan status baca (*Read/Unread*), rincian pengirim, dan tombol balas via *mailto*.

---

## 5. Database Schema (Supabase PostgreSQL)

### A. Tabel `projects`
```sql
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  category text not null,
  summary text not null,
  problem_statement text not null,
  solution_statement text not null,
  cover_image_url text not null,
  gallery_images text[] default '{}',
  tech_stack text[] not null,
  live_url text,
  repo_url text,
  display_order int default 0,
  is_published boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### B. Tabel `articles`
```sql
create table public.articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  excerpt text not null,
  content text not null, -- Markdown content
  cover_image_url text not null,
  tags text[] default '{}',
  reading_time_minutes int default 1,
  is_published boolean default false,
  published_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### C. Tabel `inbox_messages`
```sql
create table public.inbox_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  intent_type text not null default 'general',
  message text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);
```

### D. Tabel `site_configs`
```sql
create table public.site_configs (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);
```

### E. Row Level Security (RLS) Policies
* **Tabel `projects` & `articles`:**
  * `SELECT`: Diizinkan untuk peranan `anon` jika `is_published = true`.
  * `ALL` (`INSERT`, `UPDATE`, `DELETE`): Khusus untuk peranan `authenticated`.
* **Tabel `inbox_messages`:**
  * `INSERT`: Diizinkan untuk peranan `anon` (dengan validasi payload).
  * `SELECT`, `UPDATE`, `DELETE`: Khusus untuk peranan `authenticated`.
* **Tabel `site_configs`:**
  * `SELECT`: Diizinkan untuk peranan `anon`.
  * `ALL`: Khusus untuk peranan `authenticated`.

---

## 6. Non-Functional Requirements (NFR)

1. **Performa & Core Web Vitals:**
   * First Contentful Paint (FCP) < 0.8s.
   * Largest Contentful Paint (LCP) < 1.5s.
   * Cumulative Layout Shift (CLS) = 0.
   * Skor Google Lighthouse minimal 95 di desktop dan mobile.
2. **Theme State Engine:**
   * Tema default: **Dark Mode**.
   * State tema disimpan di `localStorage` dan diinject sebelum hidrasi DOM untuk mencegah kedipan putih (*Flash of Unstyled Content / FOUC*).
3. **Keamanan Data & Input:**
   * Seluruh input form divalidasi dua arah (klien dan server) menggunakan *Zod*.
   * Sanitasi output Markdown pada halaman artikel untuk mencegah serangan Cross-Site Scripting (XSS).
   * Rate limiting pada server function pengiriman pesan kontak publik.

---

## 7. Definition of Done (DoD)

Proyek ini dianggap selesai dan siap rilis jika:
* [ ] Seluruh halaman publik (`/`, `/articles`, `/articles/:slug`) ter-render penuh via SSR dengan skor Lighthouse > 95.
* [ ] Rich snippet schema JSON-LD tervalidasi tanpa error di Google Rich Results Test Tool.
* [ ] Alur Slide-over Drawer berjalan mulus tanpa lag animasi di layar desktop dan mobile.
* [ ] Rute admin terlindungi secara ketat; operasi CRUD proyek dan artikel (termasuk upload gambar & PDF) berjalan sukses.
* [ ] Form kontak berhasil mencatat data ke database Supabase dan memunculkan status sukses pada antarmuka pengguna.