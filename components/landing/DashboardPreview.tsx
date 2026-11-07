import {
  Bell,
  CalendarDays,
  ChartNoAxesColumn,
  Check,
  Clock3,
  LayoutDashboard,
  LifeBuoy,
  Lock,
  MapPin,
  Search,
  Send,
  Settings,
  Target,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";

/* Decorative product proof. Real copy, static data — aria-hidden keeps the
   fake table out of the accessibility tree, which would otherwise read as an
   operational dashboard. */

const NAV_PRIMARY = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Clock3, label: "Absensi" },
  { icon: CalendarDays, label: "Cuti & izin", badge: "4" },
  { icon: Wallet, label: "Payroll" },
  { icon: Users, label: "Karyawan" },
  { icon: UserPlus, label: "Rekrutmen" },
];

const NAV_SECONDARY = [
  { icon: ChartNoAxesColumn, label: "Laporan" },
  { icon: Target, label: "Kinerja" },
  { icon: Settings, label: "Pengaturan" },
  { icon: LifeBuoy, label: "Bantuan" },
];

const KPI = [
  { label: "Hadir hari ini", value: "92%", note: "49 dari 53 karyawan" },
  { label: "Menunggu approval", value: "7", note: "cuti, izin, lembur" },
  { label: "Payroll Agustus", value: "Rp 108,6jt", note: "kirim 24 slip" },
  { label: "Lembur bulan ini", value: "38 jam", note: "12 karyawan" },
];

const APPROVALS = [
  {
    initials: "RP",
    tint: "bg-[#dbeafe]",
    name: "Rizky Pratama",
    type: "Cuti tahunan · 3 hari",
    when: "Hari ini",
  },
  {
    initials: "SL",
    tint: "bg-[#fce7f3]",
    name: "Sari Lestari",
    type: "Lembur 4 jam",
    when: "Hari ini",
  },
  {
    initials: "BN",
    tint: "bg-[#fef3c7]",
    name: "Bagus Nugroho",
    type: "Izin sakit",
    when: "2 hari",
  },
];

const QUICK = [
  { icon: UserPlus, label: "Tambah karyawan" },
  { icon: Send, label: "Kirim slip gaji" },
  { icon: CalendarDays, label: "Jadwal shift" },
  { icon: ChartNoAxesColumn, label: "Laporan bulanan" },
];

function WindowChrome({ path }: { path: string }) {
  return (
    <div className="flex items-center gap-[7px] border-b border-hr-panel-line bg-[#f4f6f9] px-3.5 py-2.5">
      <span className="size-[8px] rounded-full bg-[#ff5f57]" />
      <span className="size-[8px] rounded-full bg-[#febc2e]" />
      <span className="size-[8px] rounded-full bg-[#28c840]" />
      <span className="ml-2 inline-flex items-center gap-1.5 rounded-md bg-white px-2.5 py-1 text-[9px] font-semibold text-hr-muted">
        <Lock className="size-2.5 text-hr-faint" aria-hidden />
        {path}
      </span>
    </div>
  );
}

export function DashboardPreview() {
  return (
    <div
      aria-hidden
      className="shadow-hr-window relative overflow-hidden rounded-hr-card bg-white ring-1 ring-hr-line"
    >
      <WindowChrome path="app.santosahr.id/dashboard" />

      <div className="flex">
        {/* Sidebar */}
        <div className="hidden w-[176px] shrink-0 flex-col gap-1 border-r border-hr-line bg-white px-3 py-3.5 sm:flex">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex size-5 items-center justify-center rounded-md bg-hr-blue-deep">
              <span className="size-2 rounded-[2px] bg-white" />
            </span>
            <span className="text-[11px] font-extrabold">
              Santosa <span className="text-hr-blue">HR</span>
            </span>
          </div>

          <p className="px-1 pb-1 text-[7.5px] font-extrabold tracking-[0.8px] text-hr-faint">
            UTAMA
          </p>
          {NAV_PRIMARY.map(({ icon: Icon, label, active, badge }) => (
            <div
              key={label}
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${
                active ? "bg-hr-blue-tint" : ""
              }`}
            >
              <Icon
                className={`size-3 ${active ? "text-hr-blue" : "text-hr-faint"}`}
              />
              <span
                className={`text-[9.5px] ${
                  active
                    ? "font-bold text-hr-blue-ink"
                    : "font-medium text-hr-body"
                }`}
              >
                {label}
              </span>
              {badge ? (
                <span className="ml-auto rounded-full bg-hr-yellow px-1.5 py-px text-[7px] font-extrabold text-[#5c4400]">
                  {badge}
                </span>
              ) : null}
            </div>
          ))}

          <p className="px-1 pb-1 pt-2 text-[7.5px] font-extrabold tracking-[0.8px] text-hr-faint">
            LAINNYA
          </p>
          {NAV_SECONDARY.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 rounded-md px-2 py-1.5">
              <Icon className="size-3 text-hr-faint" />
              <span className="text-[9.5px] font-medium text-hr-body">{label}</span>
            </div>
          ))}

          <div className="mt-auto flex items-center gap-2 border-t border-hr-line pt-2.5">
            <span className="flex size-6 items-center justify-center rounded-full bg-hr-blue-tint text-[8px] font-extrabold text-hr-blue-ink">
              RP
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[9px] font-bold">Rizky Pratama</span>
              <span className="block text-[7.5px] text-hr-muted">HR Admin</span>
            </span>
          </div>
        </div>

        {/* Main */}
        <div className="min-w-0 flex-1 p-3.5 sm:p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[13px] font-extrabold tracking-[-0.2px] sm:text-[15px]">
                Selamat pagi, Rizky 👋
              </p>
              <p className="mt-0.5 text-[8.5px] font-medium text-hr-muted sm:text-[9.5px]">
                Senin, 24 Agustus 2026 · 4 pengajuan menunggu persetujuanmu
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden items-center gap-1.5 rounded-md bg-hr-panel px-2 py-1.5 md:inline-flex">
                <Search className="size-2.5 text-hr-faint" />
                <span className="text-[8px] font-medium text-hr-faint">
                  Cari karyawan…
                </span>
              </span>
              <span className="flex size-6 items-center justify-center rounded-md bg-hr-panel">
                <Bell className="size-3 text-hr-body" />
              </span>
              <span className="flex size-6 items-center justify-center rounded-full bg-hr-blue-ink text-[8px] font-extrabold text-white">
                RP
              </span>
            </div>
          </div>

          {/* KPI */}
          <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
            {KPI.map(({ label, value, note }) => (
              <div
                key={label}
                className="rounded-lg bg-white p-2.5 ring-1 ring-hr-line"
              >
                <p className="text-[8px] font-semibold text-hr-muted sm:text-[9px]">
                  {label}
                </p>
                <p className="mt-1 text-[15px] font-extrabold tracking-[-0.4px] sm:text-[17px]">
                  {value}
                </p>
                <p className="mt-0.5 text-[7.5px] font-medium text-hr-faint">
                  {note}
                </p>
              </div>
            ))}
          </div>

          {/* Approvals + quick */}
          <div className="mt-2.5 grid gap-2.5 lg:grid-cols-[1fr_200px]">
            <div className="overflow-hidden rounded-lg bg-white ring-1 ring-hr-line">
              <div className="flex items-center justify-between border-b border-hr-line px-2.5 py-2">
                <p className="text-[9.5px] font-extrabold">Menunggu persetujuan</p>
                <p className="text-[8px] font-bold text-hr-blue">Lihat semua</p>
              </div>
              {APPROVALS.map((row) => (
                <div
                  key={row.name}
                  className="flex items-center gap-2 border-b border-hr-line-soft px-2.5 py-2 last:border-0"
                >
                  <span
                    className={`flex size-5 shrink-0 items-center justify-center rounded-full ${row.tint} text-[7px] font-extrabold text-[#374151]`}
                  >
                    {row.initials}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[8.5px] font-bold">
                      {row.name}
                    </span>
                    <span className="block truncate text-[7.5px] font-medium text-hr-muted">
                      {row.type}
                    </span>
                  </span>
                  <span className="hidden text-[7px] font-bold text-hr-faint sm:block">
                    {row.when}
                  </span>
                  <span className="rounded-md bg-hr-blue-ink px-1.5 py-1 text-[7px] font-bold text-white">
                    Setujui
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <div className="rounded-lg bg-white p-2.5 ring-1 ring-hr-line">
                <p className="text-[9.5px] font-extrabold">Aksi cepat</p>
                <div className="mt-1.5 flex flex-col gap-1.5">
                  {QUICK.map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <span className="flex size-4 items-center justify-center rounded bg-hr-blue-tint">
                        <Icon className="size-2.5 text-hr-blue" />
                      </span>
                      <span className="text-[8px] font-semibold">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg bg-hr-yellow-tint p-2.5">
                <p className="text-[8.5px] font-extrabold text-[#7a5900]">
                  Cuti hari ini · 4 orang
                </p>
                <p className="mt-1 text-[7.5px] leading-3 font-medium text-hr-yellow-ink">
                  Dewi S., Budi G., Rina W., Yudi A.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PayrollCard() {
  return (
    <div
      aria-hidden
      className="shadow-hr-float rounded-[13px] bg-white p-4 ring-1 ring-hr-line"
    >
      <p className="text-[9px] font-extrabold tracking-[0.8px] text-hr-muted">
        PAYROLL · AGUSTUS 2026
      </p>
      <p className="mt-1.5 text-[24px] font-extrabold tracking-[-0.9px]">
        Rp 108.600.000
      </p>
      <p className="mt-1 text-[11px] font-semibold text-hr-body">
        24 karyawan · siap kirim
      </p>
      <span className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-hr-blue-ink py-2 text-[11.5px] font-bold text-white">
        <Send className="size-3" />
        Kirim slip gaji
      </span>
    </div>
  );
}

export function PayrollWindow() {
  return (
    <div
      aria-hidden
      className="shadow-hr-window overflow-hidden rounded-hr-card bg-white ring-1 ring-hr-panel-line"
    >
      <WindowChrome path="app.santosahr.id/payroll" />
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[13px] font-extrabold">Payroll · Agustus 2026</p>
          <span className="rounded-md bg-hr-yellow-tint px-1.5 py-1 text-[7.5px] font-extrabold tracking-[0.5px] text-hr-yellow-ink">
            DRAFT
          </span>
        </div>

        <div className="mt-3 rounded-lg bg-hr-panel p-3">
          <p className="text-[8px] font-extrabold tracking-[0.8px] text-hr-faint">
            TOTAL PAYROLL
          </p>
          <p className="mt-1 text-[22px] font-extrabold tracking-[-0.8px]">
            Rp 108.600.000
          </p>
          <p className="text-[9px] font-medium text-hr-muted">
            24 karyawan · 4 outlet · jatuh tempo 28 Agu
          </p>
        </div>

        <div className="mt-3 space-y-1.5">
          {[
            ["Gaji pokok", "Rp 96.400.000"],
            ["Tunjangan", "Rp 9.800.000"],
            ["Lembur", "Rp 3.100.000"],
            ["PPh21 & BPJS", "– Rp 700.000"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between text-[9.5px]">
              <span className="font-medium text-hr-muted">{k}</span>
              <span className="font-bold">{v}</span>
            </div>
          ))}
        </div>

        <div className="mt-3 border-t border-hr-line pt-2">
          {[
            ["RP", "Rizky Pratama", "Kasir · Kemang", "Rp 4.850.000", "Siap"],
            ["SL", "Sari Lestari", "Admin · Head office", "Rp 5.200.000", "Siap"],
            ["BN", "Bagus Nugroho", "Barista · Senopati", "Rp 4.400.000", "Cek"],
          ].map(([initials, name, role, amount, status]) => (
            <div key={name} className="flex items-center gap-2 py-1.5">
              <span className="flex size-5 items-center justify-center rounded-full bg-hr-blue-tint text-[7px] font-extrabold text-hr-blue-ink">
                {initials}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[8.5px] font-bold">{name}</span>
                <span className="block truncate text-[7.5px] text-hr-faint">{role}</span>
              </span>
              <span className="text-[8.5px] font-bold">{amount}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[7px] font-extrabold ${
                  status === "Siap"
                    ? "bg-hr-success-tint text-hr-success"
                    : "bg-hr-yellow-tint text-hr-yellow-ink"
                }`}
              >
                {status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AttendanceWindow() {
  return (
    <div
      aria-hidden
      className="shadow-hr-window overflow-hidden rounded-hr-card bg-white ring-1 ring-hr-panel-line"
    >
      <WindowChrome path="app.santosahr.id/absensi" />
      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[13px] font-extrabold">Absensi hari ini</p>
          <span className="inline-flex items-center gap-1 rounded-md bg-hr-blue-tint px-2 py-1 text-[8.5px] font-bold text-hr-blue-ink">
            <CalendarDays className="size-2.5" />
            Sen, 24 Agu
          </span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            ["Hadir", "49", "bg-hr-success-tint text-hr-success"],
            ["Terlambat", "3", "bg-hr-yellow-tint text-hr-yellow-ink"],
            ["Cuti", "4", "bg-hr-blue-tint text-hr-blue-ink"],
          ].map(([label, value, tint]) => (
            <div key={label} className={`rounded-lg p-2.5 ${tint}`}>
              <p className="text-[8px] font-bold">{label}</p>
              <p className="text-[17px] font-extrabold tracking-[-0.4px]">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-3">
          <div className="flex gap-2 border-b border-hr-line pb-1.5 text-[7.5px] font-extrabold tracking-[0.6px] text-hr-faint">
            <span className="flex-1">KARYAWAN</span>
            <span>MASUK</span>
          </div>
          {[
            ["RP", "Rizky Pratama", "Kemang", "08:02", "Tepat waktu"],
            ["SL", "Sari Lestari", "Head office", "07:54", "Tepat waktu"],
            ["BN", "Bagus Nugroho", "Senopati", "08:21", "Terlambat"],
          ].map(([initials, name, outlet, time, status]) => (
            <div key={name} className="flex items-center gap-2 border-b border-hr-line-soft py-2 last:border-0">
              <span className="flex size-5 items-center justify-center rounded-full bg-hr-panel text-[7px] font-extrabold text-hr-body">
                {initials}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[8.5px] font-bold">{name}</span>
                <span className="block text-[7.5px] text-hr-faint">{outlet}</span>
              </span>
              <span className="text-[8.5px] font-bold">{time}</span>
              <span
                className={`rounded-full px-1.5 py-0.5 text-[7px] font-extrabold ${
                  status === "Tepat waktu"
                    ? "bg-hr-success-tint text-hr-success"
                    : "bg-hr-yellow-tint text-hr-yellow-ink"
                }`}
              >
                {status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AttendanceProof() {
  return (
    <div aria-hidden className="flex flex-col gap-2.5 rounded-hr-card bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-extrabold tracking-[0.6px] text-hr-muted">
          ABSENSI HARI INI
        </p>
        <span className="inline-flex items-center gap-1 rounded-full bg-hr-success-tint px-2 py-1 text-[8px] font-extrabold text-hr-success">
          <Check className="size-2.5" />
          Terverifikasi
        </span>
      </div>
      <p className="text-[34px] font-extrabold tracking-[-1.4px]">08:02</p>
      <p className="text-[11.5px] font-semibold text-hr-body">
        Masuk · Outlet Kemang
      </p>
      <div className="flex items-center gap-1.5 border-t border-hr-line-soft pt-2.5">
        <MapPin className="size-3 text-hr-blue" />
        <p className="text-[10px] font-medium text-hr-muted">
          Selfie + GPS tercatat otomatis
        </p>
      </div>
    </div>
  );
}

export function SlipProof() {
  return (
    <div aria-hidden className="flex flex-col gap-2 rounded-hr-card bg-white p-5">
      <p className="text-[9.5px] font-extrabold tracking-[0.6px] text-hr-muted">
        SLIP GAJI · AGUSTUS 2026
      </p>
      <p className="text-[14px] font-extrabold">Rizky Pratama</p>
      <p className="text-[28px] font-extrabold tracking-[-1px]">Rp 4.850.000</p>
      <div className="space-y-1">
        {[
          ["Gaji pokok", "Rp 4.200.000"],
          ["Tunjangan", "Rp 650.000"],
          ["PPh21", "– Rp 48.000"],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between text-[10px]">
            <span className="font-medium text-hr-muted">{k}</span>
            <span className="font-bold">{v}</span>
          </div>
        ))}
      </div>
      <div className="mt-1 flex items-center gap-1.5 rounded-md bg-hr-blue-tint px-2 py-1.5">
        <Send className="size-2.5 text-hr-blue" />
        <p className="text-[8.5px] font-bold text-hr-blue-ink">
          Terkirim ke WhatsApp karyawan
        </p>
      </div>
    </div>
  );
}
