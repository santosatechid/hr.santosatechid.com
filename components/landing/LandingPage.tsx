import Link from "next/link";

import ScrollCounter from "@/components/landing/scrollCounter";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarCheck,
  CalendarDays,
  ChartNoAxesColumn,
  Check,
  FileText,
  Fingerprint,
  Instagram,
  LifeBuoy,
  Linkedin,
  Mail,
  Menu,
  Minus,
  MousePointerClick,
  Plus,
  RefreshCw,
  ScanFace,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  Target,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";

import {
  AttendanceProof,
  AttendanceWindow,
  DashboardPreview,
  PayrollCard,
  PayrollWindow,
  SlipProof,
} from "./DashboardPreview";

/* ---------------------------------------------------------------------------
 * Santosa HR — marketing surface.
 * Tokens and rules: DESIGN.md §8. App chrome (dashboard/auth) is a separate
 * track; nothing here leaks into it because every value is `hr-` prefixed.
 * ------------------------------------------------------------------------- */

const SHELL = "mx-auto w-full max-w-[1440px] px-5 sm:px-9 xl:px-[72px]";
const COLUMN = "mx-auto w-full max-w-[1000px]";
const SECTION = "flex flex-col items-center gap-11 py-16 sm:py-20 lg:py-24";
const SECTION_TITLE =
  "w-full text-center text-[30px] leading-[1.15] font-extrabold tracking-[-1.2px] text-hr-ink sm:text-[36px] lg:text-[40px] lg:leading-[48px] lg:tracking-[-1.6px]";
const SECTION_SUB =
  "mx-auto w-full max-w-[640px] text-center text-[15px] leading-[1.65] font-medium text-hr-body lg:text-[15.5px] lg:leading-[25px]";

const NAV_LINKS = [
  { label: "Fitur", href: "#fitur" },
  { label: "Cara kerja", href: "#cara-kerja" },
  { label: "Harga", href: "#harga" },
  { label: "FAQ", href: "#faq" },
];

const MODULES = [
  { icon: Fingerprint, label: "Absensi" },
  { icon: CalendarDays, label: "Cuti & lembur" },
  { icon: Wallet, label: "Payroll" },
  { icon: FileText, label: "Slip gaji" },
  { icon: Users, label: "Data karyawan" },
  { icon: UserPlus, label: "Rekrutmen" },
  { icon: Target, label: "Kinerja" },
];

const PROBLEMS = [
  {
    icon: ScanFace,
    question: "Absen masih pakai buku atau fingerprint rusak?",
    answer:
      "Absen dari HP: selfie plus GPS. Tercatat real-time, gak bisa dititipkan.",
  },
  {
    icon: ChartNoAxesColumn,
    question: "Gaji dihitung ulang tiap bulan di Excel?",
    answer:
      "Payroll jalan otomatis dari absensi dan komponen gaji. PPh21 dan BPJS ikut dihitung.",
  },
  {
    icon: Mail,
    question: "Slip gaji digeser satu-satu?",
    answer:
      "Slip digital terkirim ke semua karyawan sekaligus, bisa diunduh sendiri.",
  },
  {
    icon: RefreshCw,
    question: "Cuti dan lembur lewat chat, lalu lupa?",
    answer: "Pengajuan, approval, dan saldo cuti rapi di satu dashboard.",
  },
];

const CAPABILITIES = [
  {
    icon: ScanFace,
    title: "Absensi digital, tanpa buku",
    body: "Karyawan clock-in dari HP — selfie plus GPS. Semua data tercatat otomatis dan real-time.",
  },
  {
    icon: CalendarCheck,
    title: "Cuti, izin, dan lembur di satu tempat",
    body: "Pengajuan, approval, dan saldo cuti rapi di dashboard. Riwayatnya gak hilang.",
  },
  {
    icon: Wallet,
    title: "Payroll & pajak otomatis",
    body: "Gaji dihitung dari absensi, lembur, potongan, dan komponen gaji. PPh21 dan BPJS ikut dihitung.",
  },
  {
    icon: FileText,
    title: "Slip gaji terkirim sendiri",
    body: "Kirim ke semua karyawan sekaligus, atau biarkan mereka unduh sendiri dari aplikasi.",
  },
  {
    icon: ChartNoAxesColumn,
    title: "Laporan HR siap dibaca",
    body: "Headcount, turnover, lembur, dan biaya gaji — jadi angka yang bisa dipakai ambil keputusan.",
  },
];

const WHY = [
  {
    icon: Store,
    title: "Dibuat untuk usaha kecil & menengah",
    body: "Kebutuhanmu beda dari perusahaan besar. Santosa HR bisa langsung dipakai tanpa tim HR khusus.",
  },
  {
    icon: MousePointerClick,
    title: "Simpel, cepat, gampang dipakai",
    body: "Gak perlu training berhari-hari. Pemilik usaha bisa beresin semuanya dari HP.",
  },
  {
    icon: TrendingUp,
    title: "Bantu ambil keputusan lebih pintar",
    body: "Laporan real-time dan analitik sederhana supaya kamu tahu kondisi tim kapan saja.",
  },
  {
    icon: Wallet,
    title: "Harga ikut tumbuh bersama bisnis",
    body: "Mulai dari paket kecil, naik ke fitur lanjutan saat bisnisnya makin besar — tanpa bikin boncos.",
  },
  {
    icon: ShieldCheck,
    title: "Data aman, tersimpan di Indonesia",
    body: "Data karyawan, gaji, dan absensi tersimpan terenkripsi di server yang tersertifikasi.",
  },
];

const CAPTIONS = [
  {
    icon: RefreshCw,
    title: "Real-time, tanpa refresh",
    body: "Absensi, approval, dan payroll langsung kelihatan begitu berubah.",
  },
  {
    icon: Smartphone,
    title: "Bisa dibuka dari HP",
    body: "Admin pakai laptop, karyawan pakai HP sendiri — data yang sama.",
  },
  {
    icon: ShieldCheck,
    title: "Data tersimpan di Indonesia",
    body: "Backup harian, terenkripsi, dan bisa diekspor kapan pun.",
  },
];

const FEATURES = [
  {
    icon: ScanFace,
    title: "Absensi selfie + GPS",
    body: "Clock-in dari HP, lokasi dan foto tercatat. Cocok buat tim yang tersebar di banyak outlet.",
  },
  {
    icon: CalendarDays,
    title: "Cuti, izin & lembur",
    body: "Saldo cuti otomatis, approval sekali klik, riwayat gak hilang.",
  },
  {
    icon: Wallet,
    title: "Payroll + pajak",
    body: "Gaji, tunjangan, potongan, PPh21, dan BPJS dihitung sendiri.",
  },
  {
    icon: FileText,
    title: "Slip gaji digital",
    body: "Kirim ke semua karyawan sekaligus. Arsip rapi, bisa diunduh kapan saja.",
  },
  {
    icon: Users,
    title: "Data karyawan",
    body: "Kontrak, KTP, NPWP, riwayat jabatan — satu profil, bukan folder.",
  },
  {
    icon: ChartNoAxesColumn,
    title: "Laporan HR",
    body: "Headcount, turnover, lembur, biaya gaji — siap dibaca tiap bulan.",
  },
];

type TierPrice = { value: number; prefix?: string; suffix?: string };

type Tier = {
  name: string;
  price: TierPrice | string;
  unit: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  featured: boolean;
};

const TIERS: Tier[] = [
  {
    name: "STARTER",
    price: { value: 0, prefix: "Rp " },
    unit: "s.d. 10 karyawan",
    description: "Buat tim kecil yang baru mau rapi.",
    features: [
      "Absensi selfie + GPS",
      "Cuti & izin",
      "Data karyawan",
      "Slip gaji digital",
    ],
    cta: "Mulai gratis",
    href: "/auth/signIn",
    featured: false,
  },
  {
    name: "BISNIS",
    price: { value: 15, prefix: "Rp ", suffix: "rb" },
    unit: "per karyawan / bulan",
    description: "Kalau payroll dan pajak sudah mulai ribet.",
    features: [
      "Semua fitur Starter",
      "Payroll + PPh21 & BPJS",
      "Approval berjenjang",
      "Laporan HR bulanan",
      "Rekrutmen & onboarding",
    ],
    cta: "Pilih Bisnis",
    href: "/auth/signIn",
    featured: true,
  },
  {
    name: "ENTERPRISE",
    price: "Custom",
    unit: "ngobrol dulu",
    description: "Buat grup usaha dengan banyak entitas.",
    features: [
      "Multi-entitas & multi-cabang",
      "SSO dan integrasi API",
      "Struktur approval custom",
      "Pendampingan implementasi",
    ],
    cta: "Ngobrol dulu",
    href: "https://wa.me/6281927453030",
    featured: false,
  },
];

const NOTES = [
  {
    title: "5 Cara Merapikan Struktur Organisasi Usaha Kecil",
    date: "Mar 8, 2026",
    plate: "bg-hr-blue-tint",
    icon: Users,
    ink: "text-hr-blue",
  },
  {
    title: "Karyawan Bukan Beban: Melihat HR sebagai Aset Bisnis",
    date: "Apr 6, 2026",
    plate: "bg-hr-yellow-tint",
    icon: TrendingUp,
    ink: "text-hr-yellow-deep",
  },
  {
    title: "Digitalisasi HR untuk UMKM: Mulai Tanpa Bingung",
    date: "Mei 10, 2026",
    plate: "bg-hr-panel",
    icon: Smartphone,
    ink: "text-hr-blue-ink",
  },
];

const FAQ = [
  {
    q: "Cocok buat usaha kecil?",
    a: "Cocok. Kalau tim kamu di bawah 10 orang, paket Starter gratis selamanya. Tinggal naik paket saat jumlah karyawan bertambah.",
  },
  {
    q: "Data karyawan aman?",
    a: "Data dienkripsi saat transit dan saat disimpan, dengan backup harian di server Indonesia. Akses dibatasi per peran, dan bisa diekspor kapan pun.",
  },
  {
    q: "Bisa hitung PPh21 dan BPJS?",
    a: "Bisa. Komponen pajak dan BPJS dihitung dari gaji bruto, status PTKP, dan potongan yang kamu atur — lalu muncul di slip gaji.",
  },
  {
    q: "Karyawan wajib install aplikasi?",
    a: "Tidak wajib. Karyawan bisa absen lewat browser HP. Aplikasi hanya menambah kenyamanan untuk absen harian dan lihat slip.",
  },
  {
    q: "Komponen gaji tiap orang beda?",
    a: "Bisa beda per karyawan: tunjangan, potongan, lembur, dan tarif pajak disimpan di profil masing-masing.",
  },
  {
    q: "Bisa berhenti kapan aja?",
    a: "Bisa. Tidak ada kontrak jangka panjang. Data bisa diekspor sebelum akun ditutup.",
  },
];

const FOOTER_COLUMNS = [
  {
    label: "PRODUK",
    links: ["Fitur", "Cara kerja", "Harga", "FAQ"],
  },
  {
    label: "PERUSAHAAN",
    links: ["Tentang Santosa Tech", "Santosa POS", "Santosa Pay", "Kontak"],
  },
  {
    label: "BANTUAN",
    links: ["Panduan pemakaian", "Status layanan", "Kebijakan privasi"],
  },
];

function Mark({
  className = "size-[30px] rounded-lg",
}: {
  className?: string;
}) {
  return (
    <span
      className={`bg-hr-blue-deep flex shrink-0 items-center justify-center ${className}`}
    >
      <svg
        viewBox="0 0 399 399"
        aria-hidden
        className="size-[62%] overflow-visible"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M67 0l152 0a10 10 0 0 1 10 10l0 38a10 10 0 0 1-10 10l-162 0 0-48a10 10 0 0 1 10-10z m-57 57l48 0 0 172-48 0a10 10 0 0 1-10-10l0-152a10 10 0 0 1 10-10z m114 57l95 0a10 10 0 0 1 10 10l0 48-105 0a10 10 0 0 1-10-10l0-38a10 10 0 0 1 10-10z m-67 113l105 0a10 10 0 0 1 10 10l0 38a10 10 0 0 1-10 10l-95 0a10 10 0 0 1-10-10l0-48z m168-56l63 0 0 161a10 10 0 0 1-10 10l-53 0 0-171z m69-57l95 0a10 10 0 0 1 10 10l0 38a10 10 0 0 1-10 10l-105 0 0-48a10 10 0 0 1 10-10z m-227 227l162 0 0 48a10 10 0 0 1-10 10l-152 0a10 10 0 0 1-10-10l0-38a10 10 0 0 1 10-10z"
          fill="#FFFFFF"
        />
      </svg>
    </span>
  );
}

function Wordmark({ dark = false }: { dark?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <Mark />
      <span className="text-[19px] font-extrabold tracking-[-0.5px]">
        <span className={dark ? "text-white" : "text-hr-ink"}>Santosa</span>
        <span className="text-hr-blue ml-1">HR</span>
      </span>
    </span>
  );
}

const PRIMARY_BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-hr-btn bg-hr-blue-ink px-6 py-3.5 text-[15px] font-bold text-white transition-colors hover:bg-hr-blue-deep focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hr-blue-ink";
const SECONDARY_BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-hr-btn bg-white px-6 py-3.5 text-[15px] font-bold text-hr-ink ring-1 ring-hr-line transition-colors hover:bg-hr-panel focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-hr-blue";

export default function LandingPage() {
  return (
    <div className="font-jakarta text-hr-ink min-h-screen bg-white">
      <a
        href="#main"
        className="focus:rounded-hr-btn focus:bg-hr-ink sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-white"
      >
        Lompat ke konten
      </a>

      {/* ---------------------------------------------------------------- Nav */}
      <header className="border-hr-line/70 sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
        <div
          className={`${SHELL} flex h-[70px] items-center justify-between lg:h-[78px]`}
        >
          <Link href="/" aria-label="Santosa HR — beranda">
            <Wordmark />
          </Link>

          <nav
            aria-label="Navigasi utama"
            className="hidden items-center gap-[34px] md:flex"
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-hr-body hover:text-hr-ink text-[14px] font-semibold transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-[18px] md:flex">
            <Link
              href="/auth/signIn"
              className="hover:text-hr-blue text-[14px] font-semibold transition-colors"
            >
              Masuk
            </Link>
            <Link
              href="/auth/signIn"
              className="rounded-hr-btn bg-hr-blue-ink hover:bg-hr-blue-deep px-5 py-[11px] text-[14px] font-bold text-white transition-colors"
            >
              Coba gratis
            </Link>
          </div>

          {/* No-JS mobile nav: details + summary is the entire mechanism. */}
          <details className="group relative md:hidden">
            <summary className="rounded-hr-btn ring-hr-line flex size-10 cursor-pointer list-none items-center justify-center ring-1 [&::-webkit-details-marker]:hidden">
              <Menu className="size-5 group-open:hidden" aria-hidden />
              <X className="hidden size-5 group-open:block" aria-hidden />
              <span className="sr-only">Buka menu</span>
            </summary>
            <div className="rounded-hr-card border-hr-line shadow-hr-card absolute right-0 mt-2 w-56 border bg-white p-2">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-hr-btn hover:bg-hr-panel block px-3 py-2.5 text-sm font-semibold"
                >
                  {link.label}
                </a>
              ))}
              <div className="border-hr-line mt-2 flex flex-col gap-2 border-t pt-2">
                <Link
                  href="/auth/signIn"
                  className="rounded-hr-btn hover:bg-hr-panel px-3 py-2.5 text-sm font-semibold"
                >
                  Masuk
                </Link>
                <Link
                  href="/auth/signIn"
                  className="rounded-hr-btn bg-hr-blue-ink px-3 py-2.5 text-center text-sm font-bold text-white"
                >
                  Coba gratis
                </Link>
              </div>
            </div>
          </details>
        </div>
      </header>

      <main id="main">
        {/* ------------------------------------------------------------ Hero */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute top-[220px] left-1/2 h-[620px] w-[840px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,#dfebfd_0%,#ffffff_70%)] opacity-80"
          />

          <div
            className={`${SHELL} relative flex flex-col items-center pt-10 pb-14 lg:pt-14`}
          >
            <div className="animate-element rounded-hr-pill ring-hr-line flex items-center gap-2 bg-white py-[7px] pr-4 pl-2 ring-1">
              <span className="bg-hr-yellow flex size-6 items-center justify-center rounded-full">
                <Sparkles className="size-3" aria-hidden />
              </span>
              <span className="text-[14px] font-semibold">
                Solusi HR End-to-End
              </span>
            </div>

            <h1 className="animate-element animate-delay-100 mt-6 max-w-[960px] text-center text-[36px] leading-[1.08] font-extrabold tracking-[-0.035em] sm:text-[48px] lg:text-[60px] lg:leading-[67px]">
              <span className="block">Urusan karyawan jadi ringan.</span>
              <span className="mt-1 flex flex-col items-center gap-0 lg:mt-2 lg:flex-row lg:justify-center lg:gap-3">
                <span className="text-[#b9bec8]">Serahkan ke</span>
                <span className="text-hr-blue whitespace-nowrap">
                  Santosa HR
                </span>
              </span>
            </h1>

            <p className="animate-element animate-delay-200 text-hr-body mt-5 max-w-[640px] text-center text-[15px] leading-[1.65] font-medium lg:text-[16.5px] lg:leading-[26px]">
              Absensi, cuti, payroll, sampai slip gaji — semuanya jalan sendiri.
              Gak ada lagi rekap absen di Excel jam 11 malam sebelum tanggal 25.
            </p>

            <div className="animate-element animate-delay-300 mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/auth/signIn" className={PRIMARY_BUTTON}>
                Coba gratis 14 hari
              </Link>
              <a href="#cara-kerja" className={SECONDARY_BUTTON}>
                <ArrowRight className="size-4" aria-hidden />
                Lihat cara kerja
              </a>
            </div>

            <div className="animate-element animate-delay-300 relative mt-10 w-full max-w-[1000px] pt-2 pb-16 lg:mt-12 lg:pb-24">
              <DashboardPreview />
              <div className="mt-3 w-full lg:absolute lg:right-0 lg:bottom-0 lg:mt-0 lg:w-[294px] lg:translate-y-8">
                <PayrollCard />
              </div>
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- Modules */}
        <section className={`${SHELL} flex flex-col items-center gap-5 pb-16`}>
          <p className="text-hr-faint text-[10.5px] font-extrabold tracking-[1.4px]">
            SATU PLATFORM, SEMUA URUSAN KARYAWAN
          </p>
          <ul className="flex flex-wrap justify-center gap-2.5">
            {MODULES.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="rounded-hr-pill ring-hr-line flex items-center gap-2 bg-white px-4 py-2.5 ring-1"
              >
                <Icon className="text-hr-blue size-3.5" aria-hidden />
                <span className="text-[13px] font-semibold">{label}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* -------------------------------------------------------- Problems */}
        <section className="bg-hr-yellow relative overflow-hidden py-16 sm:py-20 lg:py-24">
          <span
            aria-hidden
            className="pointer-events-none absolute -top-40 right-[-120px] size-[520px] rounded-full bg-white/15"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute top-[420px] -left-[180px] size-[460px] rounded-full bg-white/10"
          />

          <div
            className={`${SHELL} relative flex flex-col items-center gap-12`}
          >
            <div className={`${COLUMN} flex flex-col gap-2`}>
              <h2 className="text-[30px] leading-[1.2] font-extrabold tracking-[-1.2px] sm:text-[38px] lg:text-[44px] lg:leading-[53px] lg:tracking-[-1.6px]">
                Sekilas terlihat gampang.
              </h2>
              <p className="text-hr-yellow-deep text-[30px] leading-[1.25] font-extrabold tracking-[-1.2px] sm:text-[38px] lg:text-[44px] lg:leading-[53px] lg:tracking-[-1.6px]">
                Tapi tumpukan kerja HR-nya terasa tiap akhir bulan. Urusan
                karyawan seharusnya bikin bisnis tumbuh, bukan bikin admin
                pulang jam 11 malam.
              </p>
            </div>

            <div className={`${COLUMN} grid gap-4 md:grid-cols-2`}>
              {PROBLEMS.map(({ icon: Icon, question, answer }) => (
                <div
                  key={question}
                  className="rounded-hr-card flex gap-3.5 bg-white p-5 sm:p-6"
                >
                  <span className="bg-hr-yellow-tint flex size-[42px] shrink-0 items-center justify-center rounded-[11px]">
                    <Icon
                      className="text-hr-yellow-ink size-[19px]"
                      aria-hidden
                    />
                  </span>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-[15.5px] leading-[21px] font-extrabold">
                      {question}
                    </h3>
                    <p className="text-hr-body flex gap-2 text-[13px] leading-[20px] font-medium">
                      <Check
                        className="text-hr-blue mt-0.5 size-3.5 shrink-0"
                        aria-hidden
                      />
                      {answer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ---------------------------------------------------- Capabilities */}
        <section
          id="cara-kerja"
          className="bg-hr-blue-ink relative overflow-hidden py-16 sm:py-20 lg:py-24"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute -top-36 -left-36 size-[520px] rounded-full bg-white/7"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute top-[280px] -right-24 size-[560px] rounded-full bg-white/6"
          />

          <div
            className={`${SHELL} relative flex flex-col items-center gap-11`}
          >
            <div className="flex max-w-[1000px] flex-col items-center gap-3.5">
              <h2 className="max-w-[940px] text-center text-[28px] leading-[1.2] font-extrabold tracking-[-1.2px] text-white sm:text-[34px] lg:text-[40px] lg:leading-[48px] lg:tracking-[-1.6px]">
                Santosa HR bantu kamu fokus ke bisnis, bukan ke rekap absen.
              </h2>
              <p className="text-hr-blue-soft max-w-[600px] text-center text-[15px] leading-[1.6] font-medium lg:text-[15.5px] lg:leading-[25px]">
                Absensi, cuti, payroll, dan slip gaji jalan di satu alur yang
                saling nyambung.
              </p>
            </div>

            <div className="flex w-full max-w-[640px] flex-col gap-4 sm:flex-row sm:justify-center">
              <div className="shadow-hr-float rounded-hr-card w-full sm:w-[300px]">
                <AttendanceProof />
              </div>
              <div className="shadow-hr-float rounded-hr-card w-full sm:w-[300px]">
                <SlipProof />
              </div>
            </div>

            <div className={`${COLUMN} flex flex-col gap-6`}>
              {CAPABILITIES.map(({ icon: Icon, title, body }) => (
                <div key={title} className="flex gap-4 sm:gap-[18px]">
                  <span className="rounded-hr-tile flex size-[46px] shrink-0 items-center justify-center bg-white/12">
                    <Icon className="size-[21px] text-white" aria-hidden />
                  </span>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-[18px] font-extrabold tracking-[-0.3px] text-white">
                      {title}
                    </h3>
                    <p className="text-hr-blue-soft text-[13.5px] leading-[21px] font-medium">
                      {body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------------------------------ Why choose */}
        <section className={`${SHELL} ${SECTION}`}>
          <div className="flex flex-col items-center gap-3">
            <h2 className={SECTION_TITLE}>Kenapa Santosa HR?</h2>
            <p className={SECTION_SUB}>
              Karena kamu butuh solusi HR yang praktis, terjangkau, dan bisa
              dipercaya.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3.5">
            {WHY.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="rounded-hr-panel bg-hr-blue-ink flex items-center justify-between gap-6 px-6 py-6 sm:px-8"
              >
                <div className="flex flex-col gap-1.5">
                  <h3 className="text-[19px] font-extrabold tracking-[-0.4px] text-white">
                    {title}
                  </h3>
                  <p className="text-hr-blue-soft text-[13.5px] leading-[21px] font-medium">
                    {body}
                  </p>
                </div>
                <span className="rounded-hr-card hidden size-16 shrink-0 items-center justify-center bg-white/12 sm:flex">
                  <Icon className="size-7 text-white" aria-hidden />
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------------------------------------------- App preview */}
        <section className={`${SHELL} bg-hr-panel py-16 sm:py-20 lg:py-24`}>
          <div className="relative flex flex-col items-center gap-9">
            <div className="flex flex-col items-center gap-3">
              <h2 className={SECTION_TITLE}>
                Tampilan yang kamu lihat setelah login.
              </h2>
              <p className={`${SECTION_SUB} max-w-[660px]`}>
                Satu dashboard untuk absensi, approval, payroll, dan laporan.
                Bukan tampilan konsep — ini layar yang dipakai admin tiap hari.
              </p>
            </div>

            <DashboardPreview />

            <div className="grid w-full gap-4 md:grid-cols-2">
              <PayrollWindow />
              <AttendanceWindow />
            </div>

            <div className="grid w-full gap-5 pt-2 sm:grid-cols-3">
              {CAPTIONS.map(({ icon: Icon, title, body }) => (
                <div key={title} className="flex gap-3">
                  <span className="rounded-hr-btn ring-hr-panel-line flex size-[34px] shrink-0 items-center justify-center bg-white ring-1">
                    <Icon className="text-hr-blue size-[15px]" aria-hidden />
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <h3 className="text-[13.5px] font-extrabold">{title}</h3>
                    <p className="text-hr-body text-[12px] leading-[18px] font-medium">
                      {body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* -------------------------------------------------------- Features */}
        <section id="fitur" className={`${SHELL} ${SECTION}`}>
          <div className="flex flex-col items-center gap-3">
            <h2 className={SECTION_TITLE}>
              Semua fitur yang kamu butuh, tanpa ribet.
            </h2>
            <p className={SECTION_SUB}>
              Mulai dari absen pagi sampai slip gaji — enam modul yang saling
              nyambung, bukan enam aplikasi terpisah.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className="ring-hr-line flex items-center gap-4 rounded-[14px] bg-white px-5 py-4 ring-1 sm:gap-[18px] sm:px-6"
              >
                <span className="rounded-hr-tile bg-hr-panel flex size-[52px] shrink-0 items-center justify-center sm:size-[58px]">
                  <Icon
                    className="text-hr-blue size-[22px] sm:size-[25px]"
                    aria-hidden
                  />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <h3 className="text-[15.5px] font-extrabold tracking-[-0.3px] sm:text-[16.5px]">
                    {title}
                  </h3>
                  <p className="text-hr-body text-[13px] leading-[20px] font-medium">
                    {body}
                  </p>
                </div>
                <ArrowUpRight
                  className="size-4 shrink-0 text-[#c2c7d0]"
                  aria-hidden
                />
              </div>
            ))}

            <div className="bg-hr-blue-ink flex items-center gap-4 rounded-[14px] px-5 py-5 sm:px-6">
              <span className="rounded-hr-tile flex size-[52px] shrink-0 items-center justify-center bg-white/12">
                <LifeBuoy className="size-[22px] text-white" aria-hidden />
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <h3 className="text-[16.5px] font-extrabold tracking-[-0.3px] text-white">
                  Butuh bantuan?
                </h3>
                <p className="text-hr-blue-soft text-[13px] leading-[20px] font-medium">
                  Tim kami siap bantu dari setup sampai payroll pertama — di
                  mana pun bisnismu.
                </p>
              </div>
              <ArrowRight
                className="size-[18px] shrink-0 text-white"
                aria-hidden
              />
            </div>
          </div>
        </section>

        {/* --------------------------------------------------------- Pricing */}
        <section id="harga" className="bg-hr-panel py-16 sm:py-20 lg:py-24">
          <div className={`${SHELL} flex flex-col items-center gap-9`}>
            <div className="flex flex-col items-center gap-3">
              <h2 className={SECTION_TITLE}>
                Makin banyak karyawan, makin hemat.
              </h2>
              <p className={SECTION_SUB}>
                Mulai gratis buat tim kecil. Bayar per karyawan aktif, bukan per
                paket.
              </p>
            </div>

            <div className="grid w-full gap-4 lg:grid-cols-3">
              {TIERS.map((tier) => (
                <div
                  key={tier.name}
                  className={`rounded-hr-card flex flex-col justify-between gap-8 bg-white p-6 ${
                    tier.featured
                      ? "shadow-hr-card ring-hr-blue ring-2"
                      : "ring-hr-line ring-1"
                  }`}
                >
                  <div className="flex flex-col gap-2.5">
                    {tier.featured && (
                      <span className="rounded-hr-pill bg-hr-blue-ink w-fit px-2.5 py-1 text-[8.5px] font-extrabold tracking-[0.6px] text-white">
                        PALING SERING DIPILIH
                      </span>
                    )}
                    <p className="text-hr-blue text-[10.5px] font-extrabold tracking-[1.1px]">
                      {tier.name}
                    </p>
                    <div className="flex items-end gap-2">
                      <p className="text-[32px] font-extrabold tracking-[-1.4px] sm:text-[34px]">
                        {typeof tier.price === "string" ? (
                          tier.price
                        ) : (
                          <ScrollCounter
                            value={tier.price.value}
                            prefix={tier.price.prefix}
                            suffix={tier.price.suffix}
                          />
                        )}
                      </p>
                      <p className="text-hr-body w-[110px] text-[11.5px] leading-[15px] font-semibold">
                        {tier.unit}
                      </p>
                    </div>
                    <p className="text-hr-body text-[12.5px] leading-[19px] font-medium">
                      {tier.description}
                    </p>
                  </div>

                  <ul className="flex flex-col gap-2.5">
                    {tier.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex gap-2 text-[12.5px] leading-[18px] font-medium text-[#3a3f47]"
                      >
                        <Check
                          className="text-hr-blue mt-0.5 size-3.5 shrink-0"
                          aria-hidden
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={tier.href}
                    className={`rounded-hr-btn inline-flex items-center justify-center px-4 py-3 text-[13.5px] font-bold transition-colors ${
                      tier.featured
                        ? "bg-hr-blue-ink hover:bg-hr-blue-deep text-white"
                        : "text-hr-ink hover:bg-hr-panel bg-white ring-1 ring-[#dde1e7]"
                    }`}
                  >
                    {tier.cta}
                  </Link>
                </div>
              ))}
            </div>

            <p className="text-hr-muted text-center text-[11.5px] font-medium">
              Harga belum termasuk pajak · Bisa berubah sesuai jumlah karyawan
            </p>
          </div>
        </section>

        {/* ----------------------------------------------------------- Notes */}
        <section className={`${SHELL} ${SECTION}`}>
          <div className="flex flex-col items-center gap-3">
            <h2 className={SECTION_TITLE}>Catatan dari perjalanan kami</h2>
            <p className={`${SECTION_SUB} max-w-[760px]`}>
              Di balik Santosa HR ada cerita soal pilihan sulit dan mimpi yang
              dikejar terus. Kami bagikan caranya produk ini lahir — bukan cuma
              dari baris kode, tapi dari keyakinan bahwa HR bisa lebih
              manusiawi.
            </p>
          </div>

          <div className="grid w-full gap-5 md:grid-cols-3">
            {NOTES.map(({ title, date, plate, icon: Icon, ink }) => (
              <article
                key={title}
                className="rounded-hr-card bg-hr-panel flex flex-col overflow-hidden"
              >
                <div
                  className={`relative flex h-[196px] items-center justify-center ${plate}`}
                >
                  <Icon className={`size-16 opacity-70 ${ink}`} aria-hidden />
                  <span className="absolute inset-x-6 bottom-5 h-px bg-current opacity-10" />
                </div>
                <div className="flex flex-col gap-3 p-5 pb-6">
                  <h3 className="text-[17px] leading-[23px] font-extrabold tracking-[-0.4px]">
                    {title}
                  </h3>
                  <p className="text-hr-muted flex items-center gap-1.5 text-[12px] font-medium">
                    <CalendarDays
                      className="size-3 text-[#9aa1ac]"
                      aria-hidden
                    />
                    {date}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------------- FAQ */}
        <section id="faq" className={`${SHELL} ${SECTION} gap-7`}>
          <div className="flex flex-col items-center gap-2.5">
            <h2 className={SECTION_TITLE}>Yang sering ditanya</h2>
            <p className={SECTION_SUB}>
              Pertanyaan yang paling sering masuk ke tim kami.
            </p>
          </div>

          <div className="w-full max-w-[1100px]">
            {FAQ.map((item, index) => (
              <details
                key={item.q}
                open={index === 0}
                className="group border-b border-[#e5e7eb] px-1 py-5"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 [&::-webkit-details-marker]:hidden">
                  <span className="flex-1 text-[15.5px] font-bold sm:text-[16.5px]">
                    {item.q}
                  </span>
                  <span
                    className="flex size-5 shrink-0 items-center justify-center"
                    aria-hidden
                  >
                    <Plus className="size-4 text-[#9aa1ac] group-open:hidden" />
                    <Minus className="text-hr-blue hidden size-4 group-open:block" />
                  </span>
                </summary>
                <p className="text-hr-body mt-2.5 max-w-[940px] text-[14px] leading-[22px] font-medium">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* ------------------------------------------------------------- CTA */}
        <section className="bg-hr-yellow relative overflow-hidden py-16 sm:py-20 lg:py-24">
          <span
            aria-hidden
            className="pointer-events-none absolute -top-28 right-[-80px] size-[480px] rounded-full bg-white/20"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute top-[180px] -left-28 size-[380px] rounded-full bg-white/12"
          />

          <div className={`${SHELL} relative flex flex-col items-center gap-4`}>
            <h2 className="max-w-[900px] text-center text-[30px] leading-[1.15] font-extrabold tracking-[-1.4px] sm:text-[38px] lg:text-[44px] lg:leading-[52px] lg:tracking-[-1.8px]">
              Mulai sekarang, dan jadi yang pertama dengan Santosa HR.
            </h2>
            <p className="max-w-[620px] text-center text-[15px] leading-[1.65] font-medium text-[#5c4400] lg:text-[16px] lg:leading-[26px]">
              Coba gratis 14 hari. Setup sehari, tanpa kartu kredit, dan timmu
              langsung bisa absen dari HP.
            </p>
            <Link
              href="/auth/signIn"
              className="bg-hr-blue-ink hover:bg-hr-blue-deep mt-3 inline-flex items-center gap-2 rounded-[10px] px-6 py-[15px] text-[15px] font-extrabold text-white shadow-[0_12px_28px_rgba(138,100,0,0.2)] transition-colors"
            >
              <ArrowRight className="size-4" aria-hidden />
              Coba gratis 14 hari
            </Link>
            <p className="text-[11px] font-bold tracking-[1px] text-[#6e5200]">
              ATAU NGOBROL LANGSUNG:{" "}
              <a
                href="https://wa.me/6281927453030"
                className="underline underline-offset-2"
              >
                +62 819 2745 3030
              </a>
            </p>
          </div>
        </section>
      </main>

      {/* ------------------------------------------------------------ Footer */}
      <footer className="border-hr-line bg-hr-panel border-t">
        <div className={`${SHELL} flex flex-col gap-9 py-14`}>
          <div className="flex flex-col justify-between gap-9 lg:flex-row">
            <div className="flex max-w-[420px] flex-col gap-3.5">
              <Wordmark />
              <p className="text-hr-body text-[13px] font-semibold">
                solusi HR end-to-end
              </p>
              <p className="text-hr-body text-[13px] leading-[22px] font-medium">
                HR end-to-end: absensi, cuti, payroll, slip gaji, sampai
                rekrutmen. Dibuat oleh Santosa Tech Indonesia.
              </p>
              <a
                href="mailto:santosatechid@gmail.com"
                className="text-hr-body hover:text-hr-ink flex items-center gap-2 text-[12.5px] font-semibold"
              >
                <Mail className="size-3.5 text-[#9aa1ac]" aria-hidden />
                santosatechid@gmail.com
              </a>
            </div>

            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:gap-10">
              {FOOTER_COLUMNS.map((column) => (
                <div key={column.label} className="flex flex-col gap-3">
                  <p className="text-hr-faint text-[10.5px] font-extrabold tracking-[1.1px]">
                    {column.label}
                  </p>
                  {column.links.map((link) => (
                    <a
                      key={link}
                      href="#main"
                      className="hover:text-hr-blue text-[13px] font-semibold text-[#3a3f47]"
                    >
                      {link}
                    </a>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col justify-between gap-4 border-t border-[#e5e7eb] pt-5 sm:flex-row sm:items-center">
            <p className="text-hr-muted text-[11.5px] font-medium">
              © 2026 Santosa HR — bagian dari PT Santosa Tech Indonesia
            </p>
            <div className="flex items-center gap-3.5">
              <a
                href="https://instagram.com"
                aria-label="Instagram"
                className="text-hr-faint hover:text-hr-ink"
              >
                <Instagram className="size-[15px]" aria-hidden />
              </a>
              <a
                href="https://linkedin.com"
                aria-label="LinkedIn"
                className="text-hr-faint hover:text-hr-ink"
              >
                <Linkedin className="size-[15px]" aria-hidden />
              </a>
              <a
                href="https://x.com"
                aria-label="X"
                className="text-hr-faint hover:text-hr-ink"
              >
                <X className="size-[15px]" aria-hidden />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
