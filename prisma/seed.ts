import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PRODUCTS } from "../lib/catalog";

const prisma = new PrismaClient();
const year = new Date().getFullYear();
const code = (n: number) => `SWM-${year}-${String(n).padStart(3, "0")}`;
const ago = (days: number) => new Date(Date.now() - days * 86400000);
const ahead = (days: number) => new Date(Date.now() + days * 86400000);

async function main() {
  await prisma.notification.deleteMany();
  await prisma.otpToken.deleteMany();
  await prisma.gatewayDecision.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.qcRecord.deleteMany();
  await prisma.productUnit.deleteMany();
  await prisma.batchMaterial.deleteMany();
  await prisma.productionBatch.deleteMany();
  await prisma.purchaseRequestItem.deleteMany();
  await prisma.purchaseRequest.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.document.deleteMany();
  await prisma.bomItem.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.material.deleteMany();

  const passwordHash = await bcrypt.hash("SatyaWira#2026", 10);

  const materials = [
    ["PB-02", "Timbal lembar 2 mm", "kg", 40, 80, 185000, "Penahan radiasi"],
    ["PB-03", "Timbal lembar 3 mm", "kg", 0, 50, 210000, "Penahan radiasi"],
    ["HB-40", "Hollow baja 40×40", "m", 400, 80, 42000, "Rangka"],
    ["EG-HD", "Engsel heavy duty", "pcs", 80, 20, 275000, "Hardware"],
    ["LG-46", "Lead glass 400×600", "pcs", 30, 8, 2450000, "Penahan radiasi"],
    ["LK-01", "Lockset pintu radiasi", "set", 40, 8, 640000, "Hardware"],
    ["SL-R", "Seal radiasi", "m", 200, 40, 35000, "Finishing"],
    ["EP-02", "Cat epoxy", "L", 60, 12, 125000, "Finishing"],
  ] as const;

  const mat: Record<string, string> = {};
  for (const [sku, name, unit, stockQty, minStock, unitPrice, category] of materials) {
    const row = await prisma.material.create({
      data: { sku, name, unit, stockQty, minStock, unitPrice, category },
    });
    mat[sku] = row.id;
  }

  const sentosa = await prisma.customer.create({
    data: {
      companyName: "RS Sentosa Medika",
      contactName: "dr. Nadia Putri",
      email: "pelanggan@rssentosa.id",
      phone: "021-5550188",
      address: "Jl. Garnisun Dalam No. 8, Jakarta Selatan",
    },
  });
  const sadikin = await prisma.customer.create({
    data: {
      companyName: "RSUP Dr. Hasan Sadikin",
      contactName: "Ir. Dimas Ardi",
      email: "sarpras@rshs.example",
      phone: "022-2034953",
      address: "Jl. Pasteur No. 38, Bandung",
    },
  });
  const siloam = await prisma.customer.create({
    data: {
      companyName: "RS Siloam Surabaya",
      contactName: "Linda Kusuma",
      email: "logistik@siloam-sby.example",
      phone: "031-9900120",
      address: "Jl. Raya Gubeng No. 70, Surabaya",
    },
  });
  const premier = await prisma.customer.create({
    data: {
      companyName: "RS Premier Harmoni",
      contactName: "dr. Andika Rahman",
      email: "teknik@premierharmoni.example",
      phone: "021-25559900",
      address: "Jl. Surya Sumantri, Jakarta Barat",
    },
  });
  const bumi = await prisma.customer.create({
    data: {
      companyName: "Klinik Radiologi Bumi Sehat",
      contactName: "Sinta Maharani",
      email: "ops@bumisehat.example",
      phone: "021-7788123",
      address: "Jl. KH Noer Ali, Bekasi",
    },
  });
  const bekasi = await prisma.customer.create({
    data: {
      companyName: "RSUD Kota Bekasi",
      contactName: "Agung Wibowo",
      email: "pengadaan@rsudbekasi.example",
      phone: "021-8899001",
      address: "Jl. Pramuka No. 55, Bekasi",
    },
  });

  const people = [
    ["Sari Wulandari", "superadmin@satyawira.co.id", "SUPER_ADMIN", "0812-1000-1001", null],
    ["Bima Pratama", "admin.proyek@satyawira.co.id", "ADMIN_PROYEK", "0812-1000-1002", null],
    ["Ir. Hendra Kusuma", "direktur@satyawira.co.id", "DIREKTUR", "0812-1000-1003", null],
    ["Lestari Ayu", "gudang@satyawira.co.id", "WAREHOUSE", "0812-1000-1004", null],
    ["Agus Setiawan", "produksi@satyawira.co.id", "PRODUKSI", "0812-1000-1005", null],
    ["Maya Fitriani", "qc@satyawira.co.id", "QC_PRODUKSI", "0812-1000-1006", null],
    ["Rudi Hartono", "instalasi@satyawira.co.id", "INSTALASI", "0812-1000-1007", null],
    ["dr. Nadia Putri", "pelanggan@rssentosa.id", "PELANGGAN", "0812-1000-1008", sentosa.id],
  ] as const;

  const dept: Record<string, string> = {
    SUPER_ADMIN: "Manajemen Sistem",
    ADMIN_PROYEK: "Administrasi Proyek",
    DIREKTUR: "Direktur Operasional",
    WAREHOUSE: "Gudang & Pengadaan",
    PRODUKSI: "Produksi",
    QC_PRODUKSI: "QC Produksi",
    INSTALASI: "Instalasi & Pengawas",
    PELANGGAN: "Portal Klien",
  };

  const user: Record<string, string> = {};
  for (const [name, email, role, phone, customerId] of people) {
    const row = await prisma.user.create({
      data: { name, email, passwordHash, role, department: dept[role], phone, customerId },
    });
    user[role] = row.id;
  }

  const product = (id: string) => PRODUCTS.find((item) => item.id === id)!;

  async function project(input: {
    n: number;
    customerId: string;
    productId: string;
    title: string;
    location: string;
    units: number;
    status: string;
    description: string;
    poNumber: string;
    deadline: Date;
    createdAt: Date;
    produced?: number;
    passed?: number;
    prepared?: boolean;
    approvedAt?: Date | null;
    directorNotes?: string;
    shippedAt?: Date | null;
    arrivedSiteAt?: Date | null;
    bastAt?: Date | null;
    completedAt?: Date | null;
  }) {
    const item = product(input.productId);
    return prisma.project.create({
      data: {
        code: code(input.n),
        title: input.title,
        description: input.description,
        productName: item.name,
        specification: item.spec,
        location: input.location,
        totalOrderedUnits: input.units,
        producedUnits: input.produced ?? 0,
        passedUnits: input.passed ?? 0,
        status: input.status,
        productionPrepared: input.prepared ?? false,
        deadline: input.deadline,
        poNumber: input.poNumber,
        directorNotes: input.directorNotes,
        approvedAt: input.approvedAt,
        shippedAt: input.shippedAt,
        arrivedSiteAt: input.arrivedSiteAt,
        bastAt: input.bastAt,
        completedAt: input.completedAt,
        customerId: input.customerId,
        createdById: user.ADMIN_PROYEK,
        createdAt: input.createdAt,
        bomItems: {
          create: item.bom.map((line) => ({ materialId: mat[line.sku], qtyPerUnit: line.qty })),
        },
      },
    });
  }

  async function paper(
    projectId: string,
    author: string,
    type: string,
    title: string,
    number: string,
    payload: unknown,
    createdAt: Date,
  ) {
    await prisma.document.create({
      data: {
        projectId,
        type,
        title,
        number,
        payload: JSON.stringify(payload),
        status: "FINAL",
        createdById: author,
        createdAt,
      },
    });
  }

  async function trace(projectId: string, actorId: string, actorName: string, action: string, detail: string, createdAt: Date) {
    await prisma.auditLog.create({
      data: { projectId, actorId, actorName, action, detail, createdAt },
    });
  }

  async function decision(
    projectId: string,
    gateway: string,
    decisionValue: string,
    notes: string,
    actorName: string,
    fromStatus: string,
    toStatus: string,
    createdAt: Date,
  ) {
    await prisma.gatewayDecision.create({
      data: { projectId, gateway, decision: decisionValue, notes, actorName, fromStatus, toStatus, createdAt },
    });
  }

  async function batch(
    projectId: string,
    productId: string,
    batchNo: number,
    qty: number,
    status: string,
    times: { createdAt: Date; startedAt?: Date; finishedAt?: Date; qcAt?: Date },
    notes?: string,
  ) {
    const row = await prisma.productionBatch.create({
      data: {
        projectId,
        batchNo,
        plannedQty: qty,
        status,
        notes,
        createdAt: times.createdAt,
        startedAt: times.startedAt,
        finishedAt: times.finishedAt,
        qcAt: times.qcAt,
      },
    });
    const item = product(productId);
    for (const line of item.bom) {
      await prisma.batchMaterial.create({
        data: { batchId: row.id, materialId: mat[line.sku], qty: line.qty * qty },
      });
    }
    return row;
  }

  async function serials(projectId: string, batchId: string, projectCode: string, from: number, qty: number, status: string) {
    await prisma.productUnit.createMany({
      data: Array.from({ length: qty }, (_, index) => ({
        projectId,
        batchId,
        serialNo: `${projectCode}-U${String(from + index).padStart(3, "0")}`,
        status,
      })),
    });
  }

  const p1 = await project({
    n: 1,
    customerId: bekasi.id,
    productId: "pintu-standar",
    title: "Pintu radiologi IGD RSUD Bekasi",
    location: "Ruang radiologi IGD, RSUD Kota Bekasi",
    units: 8,
    status: "DRAFT",
    description: "Delapan daun pintu untuk ruang baru IGD. Arah bukaan kiri, akses lift barang malam hari.",
    poNumber: "PO-BEKASI-118",
    deadline: ahead(40),
    createdAt: ago(0),
  });
  await paper(p1.id, user.ADMIN_PROYEK, "PO", "Purchase Order", "PO-BEKASI-118", {
    poNumber: "PO-BEKASI-118", customer: "RSUD Kota Bekasi", contact: "Agung Wibowo", product: product("pintu-standar").name, units: 8, location: p1.location, notes: p1.description,
  }, ago(0));
  await paper(p1.id, user.ADMIN_PROYEK, "DATA_PROYEK", "Data proyek", `DP-${p1.code}`, {
    location: p1.location, specification: p1.specification, deadline: ahead(40).toISOString(), description: p1.description,
  }, ago(0));
  await trace(p1.id, user.ADMIN_PROYEK, "Bima Pratama", "Terima PO", "PO-BEKASI-118 dicatat. Menunggu pengajuan ke direktur.", ago(0));

  const p2 = await project({
    n: 2,
    customerId: sadikin.id,
    productId: "pintu-standar",
    title: "Sayap radiologi RSHS Pasteur",
    location: "Instalasi radiologi, RSUP Dr. Hasan Sadikin",
    units: 10,
    status: "MENUNGGU_DIREKTUR",
    description: "Sepuluh pintu RS-90 untuk renovasi sayap barat. Pemasangan bertahap per koridor.",
    poNumber: "PO-RSHS-204",
    deadline: ahead(50),
    createdAt: ago(3),
  });
  await paper(p2.id, user.ADMIN_PROYEK, "PO", "Purchase Order", "PO-RSHS-204", {
    poNumber: "PO-RSHS-204", customer: "RSUP Dr. Hasan Sadikin", product: product("pintu-standar").name, units: 10, location: p2.location,
  }, ago(3));
  await paper(p2.id, user.ADMIN_PROYEK, "DATA_PROYEK", "Data proyek", `DP-${p2.code}`, { location: p2.location, specification: p2.specification, description: p2.description }, ago(3));
  await paper(p2.id, user.ADMIN_PROYEK, "RENCANA_PROYEK", "Rencana pelaksanaan proyek", `RP-${p2.code}`, {
    summary: p2.description, units: 10, product: product("pintu-standar").name, submittedBy: "Bima Pratama",
  }, ago(2));
  await trace(p2.id, user.ADMIN_PROYEK, "Bima Pratama", "Ajukan rencana", "Rencana diserahkan ke Direktur Operasional.", ago(2));

  const p3 = await project({
    n: 3,
    customerId: siloam.id,
    productId: "pintu-ct",
    title: "Ruang CT Siloam Surabaya",
    location: "Ruang CT lantai 3, RS Siloam Surabaya",
    units: 12,
    status: "PENGADAAN",
    description: "Dua belas pintu CT-120. Timbal 3 mm belum tersedia di gudang.",
    poNumber: "PO-SILOAM-077",
    deadline: ahead(60),
    createdAt: ago(12),
    prepared: false,
    approvedAt: ago(10),
    directorNotes: "Dahulukan daun yang menghadap koridor pasien. Pengadaan timbal 3 mm jangan menunggu stok 2 mm.",
  });
  await paper(p3.id, user.ADMIN_PROYEK, "PO", "Purchase Order", "PO-SILOAM-077", { poNumber: "PO-SILOAM-077", customer: "RS Siloam Surabaya", units: 12, product: product("pintu-ct").name }, ago(12));
  await paper(p3.id, user.ADMIN_PROYEK, "RENCANA_PROYEK", "Rencana pelaksanaan proyek", `RP-${p3.code}`, { summary: p3.description, units: 12, submittedBy: "Bima Pratama" }, ago(11));
  await paper(p3.id, user.DIREKTUR, "ARAHAN_DIREKTUR", "Arahan direktur", `AD-${p3.code}`, { decision: "Disetujui", notes: p3.directorNotes, director: "Ir. Hendra Kusuma" }, ago(10));
  await paper(p3.id, user.WAREHOUSE, "PR", "Permintaan pembelian", `PR-${year}-001`, {
    prCode: `PR-${year}-001`,
    notes: "Timbal 3 mm kosong. Material lain masih menutup kebutuhan.",
    items: [{ name: "Timbal lembar 3 mm", sku: "PB-03", qty: 336, unit: "kg" }],
  }, ago(9));
  const pr = await prisma.purchaseRequest.create({
    data: {
      code: `PR-${year}-001`,
      projectId: p3.id,
      status: "DIPESAN",
      notes: "Diproses ke pemasok timbal dalam negeri.",
      createdAt: ago(9),
      orderedAt: ago(8),
      items: { create: [{ materialId: mat["PB-03"], qty: 336 }] },
    },
  });
  await decision(p3.id, "ARAHAN_DIREKTUR", "YA", p3.directorNotes ?? "", "Ir. Hendra Kusuma", "MENUNGGU_DIREKTUR", "OPERASIONAL", ago(10));
  await decision(p3.id, "MATERIAL_CUKUP", "TIDAK", "Timbal 3 mm tidak menutup satu unit.", "Lestari Ayu", "OPERASIONAL", "PENGADAAN", ago(9));
  await trace(p3.id, user.WAREHOUSE, "Lestari Ayu", "Buat PR", `${pr.code} untuk 336 kg timbal 3 mm.`, ago(9));
  await trace(p3.id, user.WAREHOUSE, "Lestari Ayu", "PR dipesan", "Menunggu kedatangan dari pemasok.", ago(8));

  const p4 = await project({
    n: 4,
    customerId: premier.id,
    productId: "pintu-standar",
    title: "Poliklinik radiologi Premier Harmoni",
    location: "Poliklinik radiologi, RS Premier Harmoni",
    units: 10,
    status: "OPERASIONAL",
    description: "Sepuluh pintu RS-90. Enam unit sudah lolos QC. Sisa empat menunggu alokasi stok.",
    poNumber: "PO-PREMIER-055",
    deadline: ahead(25),
    createdAt: ago(18),
    produced: 6,
    passed: 6,
    prepared: true,
    approvedAt: ago(16),
    directorNotes: "Kerjakan batch sesuai stok. Jangan menahan enam unit yang sudah jadi.",
  });
  const b4 = await batch(p4.id, "pintu-standar", 1, 6, "PASSED", { createdAt: ago(14), startedAt: ago(13), finishedAt: ago(11), qcAt: ago(10) }, "Batch pertama sesuai gambar.");
  await serials(p4.id, b4.id, p4.code, 1, 6, "STORED");
  await prisma.qcRecord.create({
    data: { projectId: p4.id, batchId: b4.id, stage: "PRODUKSI", result: "PASS", notes: "Enam unit sesuai.", inspector: "Maya Fitriani", createdAt: ago(10) },
  });
  await paper(p4.id, user.QC_PRODUKSI, "LAPORAN_QC_PRODUKSI", "Laporan QC produksi", `QC-${p4.code}-B1`, { batchNo: 1, qty: 6, result: "LULUS", inspector: "Maya Fitriani", notes: "Enam unit sesuai." }, ago(10));
  await decision(p4.id, "MATERIAL_CUKUP", "YA", "Dialokasikan 6 dari 10 unit.", "Lestari Ayu", "OPERASIONAL", "OPERASIONAL", ago(14));
  await decision(p4.id, "HASIL_QC_PRODUKSI", "YA", "Lulus", "Maya Fitriani", "QC_PRODUKSI", "OPERASIONAL", ago(10));
  await decision(p4.id, "SEMUA_UNIT", "TIDAK", "6 dari 10 unit lolos. Sisa kembali ke gudang.", "Maya Fitriani", "QC_PRODUKSI", "OPERASIONAL", ago(10));
  await trace(p4.id, user.QC_PRODUKSI, "Maya Fitriani", "QC lolos", "Batch 1 lolos. Sisa 4 unit menunggu pemeriksaan material.", ago(10));
  await prisma.stockMovement.create({
    data: { materialId: mat["PB-02"], qty: -108, type: "ALOKASI", refType: "BATCH", refId: b4.id, note: `Alokasi batch 1 · ${p4.code}`, createdAt: ago(14) },
  });

  const p5 = await project({
    n: 5,
    customerId: bumi.id,
    productId: "pintu-standar",
    title: "Klinik Bumi Sehat — ruang foto",
    location: "Ruang foto polos, Klinik Radiologi Bumi Sehat",
    units: 5,
    status: "QC_PRODUKSI",
    description: "Lima pintu. Batch pertama selesai diperbaiki dan menunggu QC ulang.",
    poNumber: "PO-BUMI-019",
    deadline: ahead(20),
    createdAt: ago(15),
    produced: 5,
    passed: 0,
    prepared: true,
    approvedAt: ago(14),
    directorNotes: "Jaga kerataan daun. Klinik ini sempit, ukur ulang di workshop.",
  });
  const b5 = await batch(p5.id, "pintu-standar", 1, 5, "QC_PENDING", { createdAt: ago(9), startedAt: ago(8), finishedAt: ago(6) }, "Perbaikan celah bawah selesai.");
  await prisma.qcRecord.create({
    data: { projectId: p5.id, batchId: b5.id, stage: "PRODUKSI", result: "FAIL", notes: "Celah bawah melebihi toleransi seal.", inspector: "Maya Fitriani", createdAt: ago(5) },
  });
  await paper(p5.id, user.QC_PRODUKSI, "LAPORAN_QC_PRODUKSI", "Laporan QC produksi", `QC-${p5.code}-B1`, { batchNo: 1, qty: 5, result: "TIDAK SESUAI", notes: "Celah bawah melebihi toleransi seal.", inspector: "Maya Fitriani" }, ago(5));
  await decision(p5.id, "HASIL_QC_PRODUKSI", "TIDAK", "Celah bawah melebihi toleransi.", "Maya Fitriani", "QC_PRODUKSI", "REWORK_PRODUKSI", ago(5));
  await trace(p5.id, user.PRODUKSI, "Agus Setiawan", "Perbaikan produk selesai", "Batch kembali ke QC.", ago(2));

  const p6 = await project({
    n: 6,
    customerId: sentosa.id,
    productId: "pintu-standar",
    title: "Rawat inap Sentosa lantai 4",
    location: "Lantai 4 sayap timur, RS Sentosa Medika",
    units: 6,
    status: "QC_INSTALASI",
    description: "Enam pintu terpasang. Menunggu QC internal pengawas.",
    poNumber: "PO-SENTOSA-301",
    deadline: ahead(10),
    createdAt: ago(30),
    produced: 6,
    passed: 6,
    prepared: true,
    approvedAt: ago(28),
    directorNotes: "Pasang di luar jam besuk.",
    shippedAt: ago(4),
    arrivedSiteAt: ago(4),
  });
  const b6 = await batch(p6.id, "pintu-standar", 1, 6, "PASSED", { createdAt: ago(20), startedAt: ago(18), finishedAt: ago(12), qcAt: ago(11) });
  await serials(p6.id, b6.id, p6.code, 1, 6, "INSTALLED");
  await prisma.qcRecord.create({ data: { projectId: p6.id, batchId: b6.id, stage: "PRODUKSI", result: "PASS", notes: "Lulus workshop.", inspector: "Maya Fitriani", createdAt: ago(11) } });
  await paper(p6.id, user.QC_PRODUKSI, "SURAT_JALAN", "Surat jalan", `SJ-${p6.code}`, {
    destination: p6.location, customer: "RS Sentosa Medika", serials: Array.from({ length: 6 }, (_, i) => `${p6.code}-U${String(i + 1).padStart(3, "0")}`), units: 6, issuedBy: "Maya Fitriani",
  }, ago(5));
  await trace(p6.id, user.INSTALASI, "Rudi Hartono", "Instalasi selesai", "Enam daun terpasang. Siap QC internal.", ago(1));

  const p7 = await project({
    n: 7,
    customerId: sentosa.id,
    productId: "pintu-standar",
    title: "Radiologi Sentosa lantai 2",
    location: "Radiologi lantai 2, RS Sentosa Medika",
    units: 4,
    status: "INSPEKSI_PELANGGAN",
    description: "Empat pintu lolos QC internal. Menunggu pemeriksaan dr. Nadia Putri.",
    poNumber: "PO-SENTOSA-288",
    deadline: ahead(6),
    createdAt: ago(34),
    produced: 4,
    passed: 4,
    prepared: true,
    approvedAt: ago(32),
    directorNotes: "Serahterima setelah pelanggan melihat seal dan ayunan daun.",
    shippedAt: ago(6),
    arrivedSiteAt: ago(6),
  });
  const b7 = await batch(p7.id, "pintu-standar", 1, 4, "PASSED", { createdAt: ago(24), startedAt: ago(22), finishedAt: ago(16), qcAt: ago(15) });
  await serials(p7.id, b7.id, p7.code, 1, 4, "INSTALLED");
  await prisma.qcRecord.create({ data: { projectId: p7.id, batchId: b7.id, stage: "PRODUKSI", result: "PASS", notes: "Lulus.", inspector: "Maya Fitriani", createdAt: ago(15) } });
  await prisma.qcRecord.create({ data: { projectId: p7.id, stage: "INSTALASI", result: "PASS", notes: "Ayunan dan seal sesuai.", inspector: "Rudi Hartono", createdAt: ago(2) } });
  await paper(p7.id, user.INSTALASI, "HASIL_QC_INSTALASI", "Hasil QC instalasi", `QCI-${p7.code}`, { result: "SESUAI", notes: "Ayunan dan seal sesuai.", inspector: "Rudi Hartono", location: p7.location }, ago(2));
  await paper(p7.id, user.INSTALASI, "PERMINTAAN_PEMERIKSAAN", "Permintaan pemeriksaan", `PP-${p7.code}`, {
    message: "Instalasi selesai dan lolos QC internal. Mohon pemeriksaan bersama di lokasi.", location: p7.location, units: 4, requestedBy: "Rudi Hartono",
  }, ago(2));
  await decision(p7.id, "HASIL_QC_INSTALASI", "YA", "Sesuai.", "Rudi Hartono", "QC_INSTALASI", "INSPEKSI_PELANGGAN", ago(2));
  await trace(p7.id, user.INSTALASI, "Rudi Hartono", "Ajukan pemeriksaan pelanggan", "Permintaan pemeriksaan dikirim ke RS Sentosa Medika.", ago(2));

  const p8 = await project({
    n: 8,
    customerId: premier.id,
    productId: "pintu-standar",
    title: "MCU Premier — ruang thorax",
    location: "Ruang thorax MCU, RS Premier Harmoni",
    units: 3,
    status: "VERIFIKASI_BAST",
    description: "Tiga pintu. BAST sudah ditandatangani pelanggan dan menunggu verifikasi admin.",
    poNumber: "PO-PREMIER-041",
    deadline: ago(1),
    createdAt: ago(40),
    produced: 3,
    passed: 3,
    prepared: true,
    approvedAt: ago(38),
    directorNotes: "Tutup setelah BAST lengkap.",
    shippedAt: ago(12),
    arrivedSiteAt: ago(12),
    bastAt: ago(1),
  });
  const b8 = await batch(p8.id, "pintu-standar", 1, 3, "PASSED", { createdAt: ago(30), startedAt: ago(28), finishedAt: ago(22), qcAt: ago(21) });
  await serials(p8.id, b8.id, p8.code, 1, 3, "INSTALLED");
  await prisma.qcRecord.create({ data: { projectId: p8.id, batchId: b8.id, stage: "PRODUKSI", result: "PASS", notes: "Lulus.", inspector: "Maya Fitriani", createdAt: ago(21) } });
  await prisma.qcRecord.create({ data: { projectId: p8.id, stage: "INSTALASI", result: "PASS", notes: "Sesuai.", inspector: "Rudi Hartono", createdAt: ago(8) } });
  await paper(p8.id, user.PELANGGAN, "BAST", "Berita acara serah terima", `BAST-${p8.code}`, {
    signerName: "dr. Andika Rahman",
    signedAt: ago(1).toISOString(),
    company: "RS Premier Harmoni",
    project: p8.title,
    units: 3,
    location: p8.location,
    statement: "Pekerjaan pintu timbal telah diperiksa dan diserahterimakan dalam kondisi sesuai.",
    signature: "",
  }, ago(1));
  await decision(p8.id, "HASIL_SESUAI_PELANGGAN", "YA", "Ditandatangani dr. Andika Rahman.", "dr. Andika Rahman", "INSPEKSI_PELANGGAN", "VERIFIKASI_BAST", ago(1));
  await trace(p8.id, user.ADMIN_PROYEK, "Bima Pratama", "Terima BAST", "BAST masuk dan menunggu verifikasi penutupan.", ago(1));

  const p9 = await project({
    n: 9,
    customerId: sentosa.id,
    productId: "pintu-standar",
    title: "IGD Sentosa — cluster trauma",
    location: "Cluster trauma IGD, RS Sentosa Medika",
    units: 8,
    status: "SELESAI",
    description: "Delapan pintu selesai, BAST diverifikasi.",
    poNumber: "PO-SENTOSA-240",
    deadline: ago(14),
    createdAt: ago(48),
    produced: 8,
    passed: 8,
    prepared: true,
    approvedAt: ago(46),
    directorNotes: "Selesai sesuai arahan.",
    shippedAt: ago(20),
    arrivedSiteAt: ago(20),
    bastAt: ago(13),
    completedAt: ago(12),
  });
  const b9a = await batch(p9.id, "pintu-standar", 1, 5, "PASSED", { createdAt: ago(40), startedAt: ago(38), finishedAt: ago(34), qcAt: ago(32) });
  const b9b = await batch(p9.id, "pintu-standar", 2, 3, "PASSED", { createdAt: ago(30), startedAt: ago(29), finishedAt: ago(26), qcAt: ago(25) });
  await serials(p9.id, b9a.id, p9.code, 1, 5, "INSTALLED");
  await serials(p9.id, b9b.id, p9.code, 6, 3, "INSTALLED");
  await prisma.qcRecord.create({ data: { projectId: p9.id, batchId: b9a.id, stage: "PRODUKSI", result: "FAIL", notes: "Engsel atas longgar pada unit pertama.", inspector: "Maya Fitriani", createdAt: ago(35) } });
  await prisma.qcRecord.create({ data: { projectId: p9.id, batchId: b9a.id, stage: "PRODUKSI", result: "PASS", notes: "Lulus setelah penyetelan engsel.", inspector: "Maya Fitriani", createdAt: ago(32) } });
  await prisma.qcRecord.create({ data: { projectId: p9.id, batchId: b9b.id, stage: "PRODUKSI", result: "PASS", notes: "Tiga unit lulus.", inspector: "Maya Fitriani", createdAt: ago(25) } });
  await prisma.qcRecord.create({ data: { projectId: p9.id, stage: "INSTALASI", result: "FAIL", notes: "Seal sisi kanan kurang rapat.", inspector: "Rudi Hartono", createdAt: ago(18) } });
  await prisma.qcRecord.create({ data: { projectId: p9.id, stage: "INSTALASI", result: "PASS", notes: "Seal diperbaiki dan sesuai.", inspector: "Rudi Hartono", createdAt: ago(16) } });
  await paper(p9.id, user.PELANGGAN, "BAST", "Berita acara serah terima", `BAST-${p9.code}`, {
    signerName: "dr. Nadia Putri", signedAt: ago(13).toISOString(), company: "RS Sentosa Medika", units: 8, location: p9.location, statement: "Diserahterimakan dalam kondisi sesuai.", signature: "",
  }, ago(13));
  await trace(p9.id, user.ADMIN_PROYEK, "Bima Pratama", "Tutup proyek", "BAST diverifikasi. Proyek selesai.", ago(12));

  await prisma.notification.createMany({
    data: [
      { userId: user.DIREKTUR, projectId: p2.id, title: `Rencana ${p2.code} menunggu arahan`, body: "Sayap radiologi RSHS siap ditinjau.", href: `/projects/${p2.id}`, read: false },
      { userId: user.WAREHOUSE, projectId: p3.id, title: `PR-${year}-001 menunggu kedatangan`, body: "Timbal 3 mm untuk Siloam sedang dipesan.", href: `/projects/${p3.id}`, read: false },
      { userId: user.WAREHOUSE, projectId: p4.id, title: `${p4.code} perlu cek sisa unit`, body: "Empat unit belum dialokasi. Stok timbal 2 mm menutup sebagian.", href: `/projects/${p4.id}`, read: false },
      { userId: user.PRODUKSI, projectId: p3.id, title: `Siapkan proses ${p3.code}`, body: "Persiapan produksi boleh jalan paralel dengan pengadaan.", href: `/projects/${p3.id}`, read: false },
      { userId: user.QC_PRODUKSI, projectId: p5.id, title: `QC ulang ${p5.code}`, body: "Batch Bumi Sehat selesai diperbaiki.", href: `/projects/${p5.id}`, read: false },
      { userId: user.INSTALASI, projectId: p6.id, title: `QC internal ${p6.code}`, body: "Pemasangan lantai 4 Sentosa menunggu pengawas.", href: `/projects/${p6.id}`, read: false },
      { userId: user.PELANGGAN, projectId: p7.id, title: `Pemeriksaan ${p7.code} menunggu Anda`, body: "Radiologi lantai 2 siap diperiksa dan ditandatangani.", href: `/projects/${p7.id}`, read: false },
      { userId: user.ADMIN_PROYEK, projectId: p8.id, title: `BAST ${p8.code} masuk`, body: "Verifikasi BAST Premier lalu tutup proyek.", href: `/projects/${p8.id}`, read: false },
      { userId: user.SUPER_ADMIN, projectId: p4.id, title: "Sebagian unit Premier sudah di gudang", body: "Sisa pesanan mengikuti stok timbal 2 mm.", href: `/projects/${p4.id}`, read: false },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
