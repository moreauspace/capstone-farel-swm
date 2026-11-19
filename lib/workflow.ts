import type { Actor, BomLine, LaneView, Readiness, WContext, WorkspaceModel } from "@/lib/types";
import { ROLE_META } from "@/lib/labels";
import { num } from "@/lib/utils";

export const LANES: { id: string; label: string; short: string }[] = [
  { id: "ADMIN", label: "Admin Proyek", short: "Admin" },
  { id: "DIREKTUR", label: "Direktur Operasional", short: "Direktur" },
  { id: "WAREHOUSE", label: "Gudang & Pengadaan", short: "Gudang" },
  { id: "PRODUKSI", label: "Produksi", short: "Produksi" },
  { id: "QC", label: "QC Produksi", short: "QC" },
  { id: "INSTALASI", label: "Instalasi", short: "Instalasi" },
  { id: "PELANGGAN", label: "Pelanggan", short: "Pelanggan" },
];

const OPEN_PR = new Set(["DRAFT", "DIPROSES", "DIPESAN"]);
const BATCH_LABEL: Record<string, string> = {
  ALLOCATED: "menunggu mulai",
  IN_PRODUCTION: "sedang dikerjakan",
  QC_PENDING: "menunggu QC",
  REWORK: "perbaikan",
  PASSED: "lolos",
};

type ProjectLike = {
  status: string;
  approvedAt: Date | string | null;
  productionPrepared: boolean;
  totalOrderedUnits: number;
  producedUnits: number;
  passedUnits: number;
  customerId: string;
  documents: { type: string }[];
  batches: { batchNo: number; plannedQty: number; status: string }[];
  purchaseRequests: { code: string; status: string }[];
  bomItems: {
    qtyPerUnit: number;
    material: {
      id: string;
      sku: string;
      name: string;
      unit: string;
      stockQty: number;
      unitPrice: number;
    };
  }[];
};

export function makeContext(project: ProjectLike): WContext {
  const active =
    [...project.batches]
      .filter((batch) => batch.status !== "PASSED")
      .sort((a, b) => b.batchNo - a.batchNo)[0] ?? null;
  const open =
    project.purchaseRequests.find((pr) => OPEN_PR.has(pr.status)) ?? null;
  const bom: BomLine[] = project.bomItems.map((item) => ({
    materialId: item.material.id,
    sku: item.material.sku,
    name: item.material.name,
    unit: item.material.unit,
    stock: item.material.stockQty,
    perUnit: item.qtyPerUnit,
    unitPrice: item.material.unitPrice,
  }));
  const passed = project.passedUnits;
  const total = project.totalOrderedUnits;
  return {
    status: project.status,
    approved: Boolean(project.approvedAt) || !["DRAFT", "MENUNGGU_DIREKTUR"].includes(project.status),
    productionPrepared: project.productionPrepared,
    total,
    produced: project.producedUnits,
    passed,
    remaining: Math.max(0, total - passed),
    customerId: project.customerId,
    hasDeliveryNote: project.documents.some((doc) => doc.type === "SURAT_JALAN"),
    hasBast: project.documents.some((doc) => doc.type === "BAST"),
    activeBatch: active
      ? { batchNo: active.batchNo, plannedQty: active.plannedQty, status: active.status }
      : null,
    openPr: open ? { code: open.code, status: open.status } : null,
    bom,
  };
}

export function readinessOf(ctx: WContext): Readiness {
  const lines = ctx.bom.map((line) => {
    const possible = line.perUnit <= 0 ? 0 : Math.floor(line.stock / line.perUnit + 1e-9);
    const shortage = Math.max(0, roundQty(line.perUnit * ctx.remaining - line.stock));
    return {
      sku: line.sku,
      name: line.name,
      unit: line.unit,
      stock: line.stock,
      perUnit: line.perUnit,
      possible,
      shortage,
    };
  });
  const canBuild = lines.length ? Math.min(...lines.map((line) => line.possible)) : 0;
  return { remaining: ctx.remaining, canBuild: Number.isFinite(canBuild) ? canBuild : 0, lines };
}

function roundQty(n: number) {
  return Math.round(n * 1000) / 1000;
}

function can(role: string, allowed: string[], superOk = true) {
  if (role === "SUPER_ADMIN" && superOk) return true;
  return allowed.includes(role);
}

export function progressCaption(ctx: WContext) {
  if (ctx.status === "SELESAI") return "Seluruh unit terpasang dan BAST sudah ditutup.";
  if (ctx.status === "VERIFIKASI_BAST") return "BAST sudah ditandatangani. Admin proyek menutup berkas.";
  if (ctx.status === "INSPEKSI_PELANGGAN") return "Menunggu pemeriksaan pelanggan di lokasi.";
  if (ctx.activeBatch) {
    const label = BATCH_LABEL[ctx.activeBatch.status] ?? ctx.activeBatch.status;
    return `Batch ${ctx.activeBatch.batchNo}: ${ctx.activeBatch.plannedQty} unit ${label}. ${ctx.passed} dari ${ctx.total} unit sudah lolos QC.`;
  }
  if (ctx.passed >= ctx.total && ctx.total > 0) return "Seluruh unit pesanan sudah lolos QC.";
  return `${ctx.passed} dari ${ctx.total} unit lolos QC. Sisa ${ctx.remaining} unit mengikuti stok yang tersedia.`;
}

export function laneBoard(ctx: WContext): LaneView[] {
  const S = ctx.status;
  const late = ["INSTALASI", "QC_INSTALASI", "REWORK_INSTALASI", "INSPEKSI_PELANGGAN", "VERIFIKASI_BAST", "SELESAI"].includes(S);
  const unitsDone = ctx.passed >= ctx.total && ctx.total > 0;
  const approved = ctx.approved;

  const admin: LaneView = {
    id: "ADMIN",
    label: "Admin Proyek",
    short: "Admin",
    state: "wait",
    detail: "Menunggu",
  };
  if (S === "SELESAI") {
    admin.state = "done";
    admin.detail = "Proyek ditutup";
  } else if (S === "VERIFIKASI_BAST") {
    admin.state = "current";
    admin.detail = "Verifikasi BAST dan tutup proyek";
  } else if (S === "DRAFT") {
    admin.state = "current";
    admin.detail = "Verifikasi kebutuhan, ajukan rencana";
  } else {
    admin.state = "done";
    admin.detail = "PO dan rencana tercatat";
  }

  const direktur: LaneView = {
    id: "DIREKTUR",
    label: "Direktur Operasional",
    short: "Direktur",
    state: S === "MENUNGGU_DIREKTUR" ? "current" : approved ? "done" : "wait",
    detail:
      S === "MENUNGGU_DIREKTUR"
        ? "Meninjau rencana pelaksanaan"
        : approved
          ? "Arahan sudah diberikan"
          : "Menunggu pengajuan admin",
  };

  const warehouse: LaneView = {
    id: "WAREHOUSE",
    label: "Gudang & Pengadaan",
    short: "Gudang",
    state: "wait",
    detail: "Menunggu arahan direktur",
  };
  if (!approved) {
    warehouse.state = "wait";
  } else if (S === "PENGADAAN") {
    warehouse.state = "current";
    warehouse.detail = ctx.openPr ? `PR ${ctx.openPr.code} · ${prPhrase(ctx.openPr.status)}` : "Buat permintaan pembelian";
  } else if (S === "OPERASIONAL" && !ctx.activeBatch && !unitsDone) {
    warehouse.state = "current";
    warehouse.detail = "Cek material untuk sisa unit";
  } else if (unitsDone || late || S === "SIAP_KIRIM") {
    warehouse.state = "done";
    warehouse.detail = "Kebutuhan material terpenuhi";
  } else if (ctx.activeBatch) {
    warehouse.state = "idle";
    warehouse.detail = "Material batch sudah dialokasi";
  }

  const produksi: LaneView = {
    id: "PRODUKSI",
    label: "Produksi",
    short: "Produksi",
    state: "wait",
    detail: "Menunggu arahan",
  };
  if (!approved) {
    produksi.state = "wait";
  } else if (S === "PRODUKSI") {
    produksi.state = "current";
    produksi.detail = "Produksi batch berjalan";
  } else if (S === "REWORK_PRODUKSI") {
    produksi.state = "rework";
    produksi.detail = "Perbaikan produk, lalu kembali ke QC";
  } else if (S === "OPERASIONAL" && ctx.activeBatch?.status === "ALLOCATED") {
    produksi.state = "current";
    produksi.detail = ctx.productionPrepared ? "Mulai produksi batch" : "Siapkan proses, material sudah ada";
  } else if ((S === "PENGADAAN" || S === "OPERASIONAL") && !ctx.productionPrepared && !unitsDone) {
    produksi.state = "current";
    produksi.detail = "Siapkan proses produksi";
  } else if (unitsDone || late || S === "SIAP_KIRIM" || S === "QC_PRODUKSI") {
    produksi.state = "done";
    produksi.detail = S === "QC_PRODUKSI" ? "Menyerahkan batch ke QC" : "Batch produksi selesai";
  } else if (ctx.productionPrepared) {
    produksi.state = "idle";
    produksi.detail = "Persiapan selesai";
  }

  const qc: LaneView = {
    id: "QC",
    label: "QC Produksi",
    short: "QC",
    state: "wait",
    detail: "Belum ada batch",
  };
  if (S === "QC_PRODUKSI") {
    qc.state = "current";
    qc.detail = "Pemeriksaan hasil produksi";
  } else if (S === "REWORK_PRODUKSI") {
    qc.state = "idle";
    qc.detail = "Menunggu hasil perbaikan";
  } else if (S === "SIAP_KIRIM") {
    qc.state = "current";
    qc.detail = ctx.hasDeliveryNote ? "Konfirmasi unit tiba di lokasi" : "Terbitkan surat jalan";
  } else if (late || S === "SELESAI") {
    qc.state = "done";
    qc.detail = "Unit sudah dikirim";
  } else if (ctx.passed > 0) {
    qc.state = "idle";
    qc.detail = `${ctx.passed} unit lolos, sisa masih berjalan`;
  }

  const instalasi: LaneView = {
    id: "INSTALASI",
    label: "Instalasi",
    short: "Instalasi",
    state: "wait",
    detail: "Menunggu kedatangan unit",
  };
  if (S === "INSTALASI") {
    instalasi.state = "current";
    instalasi.detail = "Pasang unit di lokasi";
  } else if (S === "QC_INSTALASI") {
    instalasi.state = "current";
    instalasi.detail = "QC internal oleh pengawas";
  } else if (S === "REWORK_INSTALASI") {
    instalasi.state = "rework";
    instalasi.detail = "Perbaikan instalasi";
  } else if (["INSPEKSI_PELANGGAN", "VERIFIKASI_BAST", "SELESAI"].includes(S)) {
    instalasi.state = "done";
    instalasi.detail = "Instalasi selesai";
  }

  const pelanggan: LaneView = {
    id: "PELANGGAN",
    label: "Pelanggan",
    short: "Pelanggan",
    state: "wait",
    detail: "Menunggu pemeriksaan",
  };
  if (S === "INSPEKSI_PELANGGAN") {
    pelanggan.state = "current";
    pelanggan.detail = "Periksa hasil dan tanda tangan BAST";
  } else if (S === "VERIFIKASI_BAST" || S === "SELESAI") {
    pelanggan.state = "done";
    pelanggan.detail = "BAST ditandatangani";
  } else if (S === "DRAFT" || S === "MENUNGGU_DIREKTUR") {
    pelanggan.state = "idle";
    pelanggan.detail = "PO sudah diterima admin";
  }

  return [admin, direktur, warehouse, produksi, qc, instalasi, pelanggan];
}

function prPhrase(status: string) {
  if (status === "DIPESAN") return "menunggu kedatangan";
  if (status === "DIPROSES" || status === "DRAFT") return "siap dipesan";
  return status.toLowerCase();
}

export function buildWorkspace(ctx: WContext, viewer: Pick<Actor, "role" | "customerId">): WorkspaceModel {
  const lanes = laneBoard(ctx);
  const currents = lanes.filter((lane) => lane.state === "current" || lane.state === "rework");
  const stage = {
    headline: currents.map((lane) => lane.detail).join(" · ") || "Tidak ada hambatan terbuka",
    owner: currents.map((lane) => lane.short).join(" & ") || "—",
  };
  const readiness = readinessOf(ctx);
  const actions = actionsFor(ctx, readiness, viewer);
  return { lanes, actions, stage, readiness, caption: progressCaption(ctx) };
}

function actionsFor(ctx: WContext, readiness: Readiness, viewer: Pick<Actor, "role" | "customerId">) {
  const role = viewer.role;
  if (role === "PELANGGAN" && viewer.customerId !== ctx.customerId) return [];
  const S = ctx.status;
  const list: WorkspaceModel["actions"] = [];
  const n = Math.min(readiness.canBuild, ctx.remaining);

  if (S === "DRAFT" && can(role, ["ADMIN_PROYEK"])) {
    list.push({
      id: "SUBMIT_PLAN",
      title: "Ajukan rencana ke direktur",
      description: "Mengunci data proyek dan menyerahkan rencana pelaksanaan ke Direktur Operasional.",
      tone: "primary",
      fields: [],
    });
  }

  if (S === "MENUNGGU_DIREKTUR" && can(role, ["DIREKTUR"])) {
    list.push({
      id: "APPROVE_PLAN",
      title: "Setujui rencana",
      description: "Arahan ini membuka gudang dan produksi secara bersamaan.",
      tone: "primary",
      fields: [{ type: "textarea", name: "notes", label: "Arahan direktur", required: true, placeholder: "Catatan pelaksanaan, prioritas lokasi, atau batas waktu." }],
    });
    list.push({
      id: "RETURN_PLAN",
      title: "Kembalikan ke admin",
      description: "Rencana kembali ke draft beserta catatan yang harus dilengkapi.",
      tone: "danger",
      fields: [{ type: "textarea", name: "notes", label: "Alasan pengembalian", required: true }],
    });
  }

  if (S === "PENGADAAN" && can(role, ["WAREHOUSE"])) {
    if (!ctx.openPr) {
      const shortLines = readiness.lines.filter((line) => line.shortage > 0);
      list.push({
        id: "CREATE_PR",
        title: "Buat PR pembelian",
        description: "Gateway material: Tidak. PR diisi dari kekurangan untuk sisa unit pesanan.",
        tone: "primary",
        fields: [{ type: "textarea", name: "notes", label: "Catatan pengadaan", placeholder: "Vendor, tenggat, atau syarat terima." }],
        facts: shortLines.map((line) => ({
          label: line.name,
          value: `${num(line.shortage, 2)} ${line.unit}`,
        })),
      });
    } else if (ctx.openPr.status === "DRAFT" || ctx.openPr.status === "DIPROSES") {
      list.push({
        id: "MARK_PR_ORDERED",
        title: "Catat PR dipesan",
        description: `${ctx.openPr.code} berpindah ke pemesanan. Stok bertambah saat barang tiba.`,
        tone: "primary",
        fields: [],
        facts: [{ label: "Nomor PR", value: ctx.openPr.code }],
      });
    } else if (ctx.openPr.status === "DIPESAN") {
      list.push({
        id: "CONFIRM_ARRIVAL",
        title: "Material tiba di gudang",
        description: "Stok bertambah sesuai PR, lalu proyek kembali ke pemeriksaan ketersediaan.",
        tone: "primary",
        fields: [],
        facts: [{ label: "Nomor PR", value: ctx.openPr.code }],
      });
    }
  }

  if (
    ["PENGADAAN", "OPERASIONAL"].includes(S) &&
    !ctx.productionPrepared &&
    ctx.passed < ctx.total &&
    can(role, ["PRODUKSI"])
  ) {
    list.push({
      id: "PREPARE_PRODUCTION",
      title: "Selesaikan persiapan produksi",
      description: "Berjalan paralel dengan gudang. Produksi unit baru bisa mulai setelah material dialokasi dan persiapan ini selesai.",
      tone: "primary",
      fields: [{ type: "textarea", name: "notes", label: "Catatan persiapan", placeholder: "Jig, gambar kerja, atau shift." }],
    });
  }

  if (S === "OPERASIONAL" && !ctx.activeBatch && ctx.remaining > 0 && can(role, ["WAREHOUSE"])) {
    const enough = readiness.canBuild >= 1;
    list.push({
      id: "CHECK_MATERIAL",
      title: "Jalankan pemeriksaan material",
      description: enough
        ? `Material cukup untuk ${n} dari ${ctx.remaining} unit sisa. Gateway: Ya. Sistem mengalokasikan ${n} unit, bukan menunggu seluruh pesanan.`
        : "Stok tidak menutup satu unit lengkap. Gateway: Tidak. Proyek pindah ke pengadaan.",
      tone: "primary",
      fields: [],
      facts: readiness.lines.map((line) => ({
        label: line.name,
        value: `${num(line.stock, 1)} ${line.unit} · ${line.possible} unit`,
      })),
    });
  }

  if (
    S === "OPERASIONAL" &&
    ctx.productionPrepared &&
    ctx.activeBatch?.status === "ALLOCATED" &&
    can(role, ["PRODUKSI"])
  ) {
    list.push({
      id: "START_PRODUCTION",
      title: "Mulai produksi batch",
      description: "Kerjakan sebanyak material yang sudah dialokasi. Sisa pesanan menyusul pada batch berikutnya.",
      tone: "primary",
      fields: [],
      facts: [
        { label: "Batch", value: String(ctx.activeBatch.batchNo) },
        { label: "Unit", value: String(ctx.activeBatch.plannedQty) },
      ],
    });
  }

  if (S === "PRODUKSI" && ctx.activeBatch?.status === "IN_PRODUCTION" && can(role, ["PRODUKSI"])) {
    list.push({
      id: "FINISH_PRODUCTION",
      title: "Serahkan batch ke QC",
      description: "Unit selesai dikerjakan dan berpindah ke pemeriksaan QC produksi.",
      tone: "primary",
      fields: [{ type: "textarea", name: "notes", label: "Catatan produksi" }],
      facts: [{ label: "Batch", value: `${ctx.activeBatch.batchNo} · ${ctx.activeBatch.plannedQty} unit` }],
    });
  }

  if (S === "QC_PRODUKSI" && ctx.activeBatch?.status === "QC_PENDING" && can(role, ["QC_PRODUKSI"])) {
    list.push({
      id: "QC_PASS",
      title: "QC lolos",
      description: "Unit masuk gudang sebagai selesai. Jika pesanan belum penuh, alur kembali ke gudang dan produksi.",
      tone: "primary",
      fields: [{ type: "textarea", name: "notes", label: "Catatan pemeriksaan" }],
      facts: [{ label: "Batch", value: `${ctx.activeBatch.batchNo} · ${ctx.activeBatch.plannedQty} unit` }],
    });
    list.push({
      id: "QC_FAIL",
      title: "QC tidak sesuai",
      description: "Batch masuk perbaikan produk, lalu diperiksa ulang. Unit belum dihitung lolos.",
      tone: "danger",
      fields: [{ type: "textarea", name: "notes", label: "Temuan QC", required: true }],
    });
  }

  if (S === "REWORK_PRODUKSI" && ctx.activeBatch?.status === "REWORK" && can(role, ["PRODUKSI"])) {
    list.push({
      id: "FINISH_REWORK",
      title: "Perbaikan selesai, kembali ke QC",
      description: "Batch yang sama diperiksa ulang. Tidak membuat batch baru.",
      tone: "primary",
      fields: [{ type: "textarea", name: "notes", label: "Catatan perbaikan" }],
    });
  }

  if (S === "SIAP_KIRIM" && can(role, ["QC_PRODUKSI"])) {
    if (!ctx.hasDeliveryNote) {
      list.push({
        id: "ISSUE_DELIVERY_NOTE",
        title: "Terbitkan surat jalan",
        description: "Surat jalan memuat seluruh nomor seri unit yang lolos QC.",
        tone: "primary",
        fields: [],
      });
    } else {
      list.push({
        id: "CONFIRM_SHIPMENT",
        title: "Unit tiba di lokasi",
        description: "Menyerahkan pekerjaan ke tim instalasi setelah barang sampai di site pelanggan.",
        tone: "primary",
        fields: [{ type: "textarea", name: "notes", label: "Catatan pengiriman" }],
      });
    }
  }

  if (S === "INSTALASI" && can(role, ["INSTALASI"])) {
    list.push({
      id: "RECORD_INSTALLATION",
      title: "Catat instalasi selesai",
      description: "Setelah pemasangan, pengawas melanjutkan QC internal di lokasi.",
      tone: "primary",
      fields: [{ type: "textarea", name: "notes", label: "Catatan pemasangan", required: true }],
    });
  }

  if (S === "QC_INSTALASI" && can(role, ["INSTALASI"])) {
    list.push({
      id: "INSTALL_QC_PASS",
      title: "QC internal sesuai",
      description: "Menerbitkan permintaan pemeriksaan dan memberi tahu pelanggan.",
      tone: "primary",
      fields: [{ type: "textarea", name: "notes", label: "Hasil QC instalasi" }],
    });
    list.push({
      id: "INSTALL_QC_FAIL",
      title: "QC internal tidak sesuai",
      description: "Kembali ke perbaikan instalasi sebelum diajukan ke pelanggan.",
      tone: "danger",
      fields: [{ type: "textarea", name: "notes", label: "Temuan pengawas", required: true }],
    });
  }

  if (S === "REWORK_INSTALASI" && can(role, ["INSTALASI"])) {
    list.push({
      id: "FINISH_INSTALL_REWORK",
      title: "Perbaikan selesai, ulangi QC",
      description: "Pengawas memeriksa ulang hasil perbaikan di lokasi.",
      tone: "primary",
      fields: [{ type: "textarea", name: "notes", label: "Catatan perbaikan" }],
    });
  }

  if (S === "INSPEKSI_PELANGGAN" && can(role, ["PELANGGAN"], false)) {
    list.push({
      id: "CLIENT_SIGN_BAST",
      title: "Hasil sesuai, tanda tangan BAST",
      description: "Bubuhkan tanda tangan atau unggah pindaian. Admin proyek akan memverifikasi sebelum menutup.",
      tone: "primary",
      fields: [
        { type: "text", name: "signerName", label: "Nama penandatangan", required: true },
        { type: "signature", name: "signature", label: "Tanda tangan" },
        { type: "file", name: "attachment", label: "Atau unggah pindaian (gambar/PDF, maks. 1,2 MB)" },
      ],
    });
    list.push({
      id: "CLIENT_REQUEST_FIX",
      title: "Ada temuan, minta perbaikan",
      description: "Catatan ini mengembalikan pekerjaan ke tim instalasi.",
      tone: "danger",
      fields: [{ type: "textarea", name: "notes", label: "Catatan perbaikan", required: true }],
    });
  }

  if (S === "VERIFIKASI_BAST" && can(role, ["ADMIN_PROYEK"])) {
    list.push({
      id: "CLOSE_PROJECT",
      title: "Verifikasi BAST dan tutup proyek",
      description: "Pastikan dokumen BAST lengkap. Status proyek menjadi selesai.",
      tone: "primary",
      fields: [{ type: "confirm", name: "confirm", label: "Saya sudah memeriksa dokumen BAST.", required: true }],
    });
  }

  return list;
}

export function roleLabel(role: string) {
  return ROLE_META[role]?.label ?? role;
}
