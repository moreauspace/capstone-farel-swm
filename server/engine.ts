import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { Actor } from "@/lib/types";
import { buildWorkspace, makeContext, readinessOf } from "@/lib/workflow";
import { clip, round3 } from "@/lib/utils";

type Tx = Prisma.TransactionClient;

const projectInclude = {
  customer: true,
  documents: true,
  batches: true,
  purchaseRequests: { include: { items: true } },
  bomItems: { include: { material: true } },
  units: true,
} satisfies Prisma.ProjectInclude;

type Loaded = Prisma.ProjectGetPayload<{ include: typeof projectInclude }>;

export async function runTransition(
  actor: Actor,
  projectId: string,
  action: string,
  payload: Record<string, string>,
) {
  return prisma.$transaction((tx) => applyTransition(tx, projectId, action, payload, actor), {
    timeout: 20000,
  });
}

export async function applyTransition(
  tx: Tx,
  projectId: string,
  action: string,
  payload: Record<string, string>,
  actor: Actor,
) {
  const project = await load(tx, projectId);
  const ctx = makeContext(project);
  const allowed = buildWorkspace(ctx, actor).actions.some((item) => item.id === action);
  if (!allowed) {
    throw new Error("Tindakan ini tidak tersedia untuk peran atau status sekarang.");
  }
  switch (action) {
    case "SUBMIT_PLAN":
      return submitPlan(tx, project, actor);
    case "APPROVE_PLAN":
      return approvePlan(tx, project, actor, payload);
    case "RETURN_PLAN":
      return returnPlan(tx, project, actor, payload);
    case "CHECK_MATERIAL":
      return checkMaterial(tx, project, actor);
    case "CREATE_PR":
      return createPr(tx, project, actor, payload);
    case "MARK_PR_ORDERED":
      return markOrdered(tx, project, actor);
    case "CONFIRM_ARRIVAL":
      return confirmArrival(tx, project, actor);
    case "PREPARE_PRODUCTION":
      return prepareProduction(tx, project, actor, payload);
    case "START_PRODUCTION":
      return startProduction(tx, project, actor);
    case "FINISH_PRODUCTION":
      return finishProduction(tx, project, actor, payload);
    case "QC_PASS":
      return qcPass(tx, project, actor, payload);
    case "QC_FAIL":
      return qcFail(tx, project, actor, payload);
    case "FINISH_REWORK":
      return finishRework(tx, project, actor, payload);
    case "ISSUE_DELIVERY_NOTE":
      return issueDelivery(tx, project, actor);
    case "CONFIRM_SHIPMENT":
      return confirmShipment(tx, project, actor, payload);
    case "RECORD_INSTALLATION":
      return recordInstallation(tx, project, actor, payload);
    case "INSTALL_QC_PASS":
      return installQcPass(tx, project, actor, payload);
    case "INSTALL_QC_FAIL":
      return installQcFail(tx, project, actor, payload);
    case "FINISH_INSTALL_REWORK":
      return finishInstallRework(tx, project, actor, payload);
    case "CLIENT_REQUEST_FIX":
      return clientFix(tx, project, actor, payload);
    case "CLIENT_SIGN_BAST":
      return clientSign(tx, project, actor, payload);
    case "CLOSE_PROJECT":
      return closeProject(tx, project, actor, payload);
    default:
      throw new Error("Tindakan tidak dikenal.");
  }
}

async function load(tx: Tx, id: string) {
  const project = await tx.project.findUnique({ where: { id }, include: projectInclude });
  if (!project) throw new Error("Proyek tidak ditemukan.");
  return project;
}

async function audit(tx: Tx, projectId: string, actor: Actor, action: string, detail: string) {
  await tx.auditLog.create({
    data: { projectId, actorId: actor.id, actorName: actor.name, action, detail },
  });
}

async function gate(
  tx: Tx,
  project: Loaded,
  actor: Actor,
  gateway: string,
  decision: "YA" | "TIDAK",
  notes: string,
  toStatus: string,
) {
  await tx.gatewayDecision.create({
    data: {
      projectId: project.id,
      gateway,
      decision,
      notes,
      actorName: actor.name,
      fromStatus: project.status,
      toStatus,
    },
  });
}

async function addDoc(
  tx: Tx,
  actor: Actor,
  projectId: string,
  type: string,
  title: string,
  number: string,
  payload: unknown,
) {
  await tx.document.create({
    data: {
      projectId,
      type,
      title,
      number,
      payload: JSON.stringify(payload),
      status: "FINAL",
      createdById: actor.id,
    },
  });
}

async function notify(
  tx: Tx,
  opts: {
    project: Loaded;
    roles?: string[];
    customer?: boolean;
    exceptUserId: string;
    title: string;
    body: string;
  },
) {
  const roles = new Set(opts.roles ?? []);
  roles.add("SUPER_ADMIN");
  const or: Prisma.UserWhereInput[] = [{ role: { in: [...roles] }, active: true }];
  if (opts.customer) {
    or.push({ role: "PELANGGAN", customerId: opts.project.customerId, active: true });
  }
  const users = await tx.user.findMany({ where: { OR: or }, select: { id: true } });
  const ids = [...new Set(users.map((user) => user.id))].filter((id) => id !== opts.exceptUserId);
  if (!ids.length) return;
  await tx.notification.createMany({
    data: ids.map((userId) => ({
      userId,
      projectId: opts.project.id,
      title: opts.title,
      body: opts.body,
      href: `/projects/${opts.project.id}`,
    })),
  });
}

function need(payload: Record<string, string>, key: string, label: string) {
  const value = clip(payload[key], 2000);
  if (!value) throw new Error(`${label} wajib diisi.`);
  return value;
}

function activeBatch(project: Loaded) {
  return [...project.batches].reverse().find((batch) => batch.status !== "PASSED") ?? null;
}

async function submitPlan(tx: Tx, project: Loaded, actor: Actor) {
  await tx.project.update({ where: { id: project.id }, data: { status: "MENUNGGU_DIREKTUR" } });
  await addDoc(tx, actor, project.id, "RENCANA_PROYEK", "Rencana pelaksanaan proyek", `RP-${project.code}`, {
    summary: project.description,
    units: project.totalOrderedUnits,
    product: project.productName,
    specification: project.specification,
    deadline: project.deadline?.toISOString() ?? null,
    location: project.location,
    submittedBy: actor.name,
  });
  await audit(tx, project.id, actor, "Ajukan rencana", "Rencana pelaksanaan diserahkan ke Direktur Operasional.");
  await notify(tx, {
    project,
    roles: ["DIREKTUR"],
    exceptUserId: actor.id,
    title: `Rencana ${project.code} menunggu arahan`,
    body: `${project.title} siap ditinjau direktur.`,
  });
  return "Rencana diajukan. Direktur Operasional menerima tinjauan.";
}

async function approvePlan(tx: Tx, project: Loaded, actor: Actor, payload: Record<string, string>) {
  const notes = need(payload, "notes", "Arahan direktur");
  await tx.project.update({
    where: { id: project.id },
    data: { status: "OPERASIONAL", approvedAt: new Date(), directorNotes: notes },
  });
  await addDoc(tx, actor, project.id, "ARAHAN_DIREKTUR", "Arahan direktur", `AD-${project.code}`, {
    decision: "Disetujui",
    notes,
    director: actor.name,
  });
  await gate(tx, project, actor, "ARAHAN_DIREKTUR", "YA", notes, "OPERASIONAL");
  await audit(tx, project.id, actor, "Setujui rencana", notes);
  await notify(tx, {
    project,
    roles: ["WAREHOUSE", "PRODUKSI", "ADMIN_PROYEK"],
    exceptUserId: actor.id,
    title: `${project.code} disetujui direktur`,
    body: "Gudang memeriksa material dan produksi menyiapkan proses, berjalan bersamaan.",
  });
  return "Rencana disetujui. Gudang dan produksi menerima pekerjaan.";
}

async function returnPlan(tx: Tx, project: Loaded, actor: Actor, payload: Record<string, string>) {
  const notes = need(payload, "notes", "Alasan pengembalian");
  await tx.project.update({
    where: { id: project.id },
    data: { status: "DRAFT", directorNotes: notes },
  });
  await addDoc(tx, actor, project.id, "ARAHAN_DIREKTUR", "Pengembalian rencana", `AD-${project.code}-R`, {
    decision: "Dikembalikan",
    notes,
    director: actor.name,
  });
  await gate(tx, project, actor, "ARAHAN_DIREKTUR", "TIDAK", notes, "DRAFT");
  await audit(tx, project.id, actor, "Kembalikan rencana", notes);
  await notify(tx, {
    project,
    roles: ["ADMIN_PROYEK"],
    exceptUserId: actor.id,
    title: `Rencana ${project.code} dikembalikan`,
    body: notes,
  });
  return "Rencana dikembalikan ke Admin Proyek.";
}

async function checkMaterial(tx: Tx, project: Loaded, actor: Actor) {
  const ctx = makeContext(project);
  const ready = readinessOf(ctx);
  if (ctx.remaining <= 0) throw new Error("Seluruh unit sudah lolos QC.");
  if (ctx.activeBatch) throw new Error("Masih ada batch yang belum lolos QC.");
  if (ready.canBuild < 1) {
    await tx.project.update({ where: { id: project.id }, data: { status: "PENGADAAN" } });
    const note = "Stok tidak menutup satu unit lengkap.";
    await gate(tx, project, actor, "MATERIAL_CUKUP", "TIDAK", note, "PENGADAAN");
    await audit(tx, project.id, actor, "Pemeriksaan material", note);
    await notify(tx, {
      project,
      roles: ["WAREHOUSE"],
      exceptUserId: actor.id,
      title: `${project.code} kekurangan material`,
      body: "Buat permintaan pembelian untuk sisa unit.",
    });
    return "Material tidak cukup. Gateway Tidak — buat permintaan pembelian.";
  }
  const qty = Math.min(ready.canBuild, ctx.remaining);
  const last = await tx.productionBatch.aggregate({
    where: { projectId: project.id },
    _max: { batchNo: true },
  });
  const batchNo = (last._max.batchNo ?? 0) + 1;
  const batch = await tx.productionBatch.create({
    data: { projectId: project.id, batchNo, plannedQty: qty, status: "ALLOCATED" },
  });
  for (const line of ctx.bom) {
    const use = round3(line.perUnit * qty);
    if (line.stock + 1e-6 < use) throw new Error("Stok berubah. Ulangi pemeriksaan material.");
    await tx.material.update({
      where: { id: line.materialId },
      data: { stockQty: round3(line.stock - use) },
    });
    await tx.stockMovement.create({
      data: {
        materialId: line.materialId,
        qty: -use,
        type: "ALOKASI",
        refType: "BATCH",
        refId: batch.id,
        note: `Alokasi batch ${batchNo} · ${project.code}`,
      },
    });
    await tx.batchMaterial.create({
      data: { batchId: batch.id, materialId: line.materialId, qty: use },
    });
  }
  const note = `Dialokasikan ${qty} dari ${ctx.remaining} unit sisa.`;
  await tx.project.update({ where: { id: project.id }, data: { updatedAt: new Date() } });
  await gate(tx, project, actor, "MATERIAL_CUKUP", "YA", note, "OPERASIONAL");
  await audit(tx, project.id, actor, "Alokasi material", note);
  await notify(tx, {
    project,
    roles: ["PRODUKSI"],
    exceptUserId: actor.id,
    title: `Material batch ${batchNo} siap · ${project.code}`,
    body: note,
  });
  return `Gateway Ya. ${qty} unit dialokasikan ke batch ${batchNo}.`;
}

async function createPr(tx: Tx, project: Loaded, actor: Actor, payload: Record<string, string>) {
  const ctx = makeContext(project);
  if (ctx.openPr) throw new Error("Masih ada PR yang belum tiba.");
  const ready = readinessOf(ctx);
  const lines = ready.lines.filter((line) => line.shortage > 0);
  if (!lines.length) {
    await tx.project.update({ where: { id: project.id }, data: { status: "OPERASIONAL" } });
    await audit(tx, project.id, actor, "PR tidak diperlukan", "Stok sudah menutup minimal satu unit. Kembali ke pemeriksaan.");
    return "Tidak ada kekurangan material. Proyek kembali ke pemeriksaan stok.";
  }
  const count = await tx.purchaseRequest.count();
  const code = `PR-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;
  const notes = clip(payload.notes, 2000);
  const pr = await tx.purchaseRequest.create({
    data: {
      code,
      projectId: project.id,
      status: "DIPROSES",
      notes: notes || null,
      items: {
        create: lines.map((line) => {
          const material = project.bomItems.find((item) => item.material.sku === line.sku)?.material;
          if (!material) throw new Error("Material BOM tidak ditemukan.");
          return { materialId: material.id, qty: line.shortage };
        }),
      },
    },
  });
  await addDoc(tx, actor, project.id, "PR", "Permintaan pembelian", code, {
    prCode: code,
    notes,
    items: lines.map((line) => ({ name: line.name, sku: line.sku, qty: line.shortage, unit: line.unit })),
  });
  await tx.project.update({ where: { id: project.id }, data: { updatedAt: new Date() } });
  await audit(tx, project.id, actor, "Buat PR", `${code} untuk ${lines.length} material.`);
  await notify(tx, {
    project,
    roles: ["WAREHOUSE"],
    exceptUserId: actor.id,
    title: `${code} menunggu pemesanan`,
    body: `Pengadaan ${project.code} siap diproses.`,
  });
  void pr;
  return `${code} terbit. Lanjutkan dengan mencatat pemesanan.`;
}

async function markOrdered(tx: Tx, project: Loaded, actor: Actor) {
  const pr = project.purchaseRequests.find((item) => item.status === "DRAFT" || item.status === "DIPROSES");
  if (!pr) throw new Error("Tidak ada PR yang siap dipesan.");
  await tx.purchaseRequest.update({
    where: { id: pr.id },
    data: { status: "DIPESAN", orderedAt: new Date() },
  });
  await tx.project.update({ where: { id: project.id }, data: { updatedAt: new Date() } });
  await audit(tx, project.id, actor, "PR dipesan", `${pr.code} sedang dalam pengadaan.`);
  return `${pr.code} dicatat sebagai dipesan. Konfirmasi saat material tiba.`;
}

async function confirmArrival(tx: Tx, project: Loaded, actor: Actor) {
  const pr = project.purchaseRequests.find((item) => item.status === "DIPESAN");
  if (!pr) throw new Error("Tidak ada PR yang menunggu kedatangan.");
  const full = await tx.purchaseRequest.findUnique({
    where: { id: pr.id },
    include: { items: true },
  });
  if (!full) throw new Error("PR tidak ditemukan.");
  for (const item of full.items) {
    const material = await tx.material.findUnique({ where: { id: item.materialId } });
    if (!material) continue;
    await tx.material.update({
      where: { id: item.materialId },
      data: { stockQty: round3(material.stockQty + item.qty) },
    });
    await tx.purchaseRequestItem.update({
      where: { id: item.id },
      data: { receivedQty: item.qty },
    });
    await tx.stockMovement.create({
      data: {
        materialId: item.materialId,
        qty: item.qty,
        type: "PENERIMAAN",
        refType: "PR",
        refId: pr.id,
        note: `Penerimaan ${pr.code} · ${project.code}`,
      },
    });
  }
  await tx.purchaseRequest.update({
    where: { id: pr.id },
    data: { status: "TIBA", arrivedAt: new Date() },
  });
  await tx.project.update({ where: { id: project.id }, data: { status: "OPERASIONAL" } });
  await audit(tx, project.id, actor, "Material tiba", `${pr.code} masuk gudang. Stok bertambah.`);
  await notify(tx, {
    project,
    roles: ["WAREHOUSE", "PRODUKSI"],
    exceptUserId: actor.id,
    title: `Material ${project.code} tiba`,
    body: "Jalankan kembali pemeriksaan ketersediaan untuk sisa unit.",
  });
  return `${pr.code} diterima. Stok bertambah dan proyek kembali ke pemeriksaan material.`;
}

async function prepareProduction(tx: Tx, project: Loaded, actor: Actor, payload: Record<string, string>) {
  const notes = clip(payload.notes, 2000);
  await tx.project.update({ where: { id: project.id }, data: { productionPrepared: true } });
  await audit(tx, project.id, actor, "Persiapan produksi", notes || "Proses produksi siap dijalankan sesuai material yang tersedia.");
  return "Persiapan produksi selesai. Batch dapat dimulai setelah material dialokasi.";
}

async function startProduction(tx: Tx, project: Loaded, actor: Actor) {
  const batch = activeBatch(project);
  if (!batch || batch.status !== "ALLOCATED") throw new Error("Tidak ada batch yang siap diproduksi.");
  await tx.productionBatch.update({
    where: { id: batch.id },
    data: { status: "IN_PRODUCTION", startedAt: new Date() },
  });
  await tx.project.update({ where: { id: project.id }, data: { status: "PRODUKSI" } });
  await audit(tx, project.id, actor, "Mulai produksi", `Batch ${batch.batchNo} · ${batch.plannedQty} unit.`);
  return `Batch ${batch.batchNo} sedang diproduksi (${batch.plannedQty} unit).`;
}

async function finishProduction(tx: Tx, project: Loaded, actor: Actor, payload: Record<string, string>) {
  const batch = activeBatch(project);
  if (!batch || batch.status !== "IN_PRODUCTION") throw new Error("Tidak ada batch yang sedang diproduksi.");
  const notes = clip(payload.notes, 2000);
  await tx.productionBatch.update({
    where: { id: batch.id },
    data: { status: "QC_PENDING", finishedAt: new Date(), notes: notes || batch.notes },
  });
  await tx.project.update({
    where: { id: project.id },
    data: { status: "QC_PRODUKSI", producedUnits: project.producedUnits + batch.plannedQty },
  });
  await audit(tx, project.id, actor, "Serah ke QC", `Batch ${batch.batchNo} selesai diproduksi.`);
  await notify(tx, {
    project,
    roles: ["QC_PRODUKSI"],
    exceptUserId: actor.id,
    title: `Batch ${batch.batchNo} ${project.code} menunggu QC`,
    body: `${batch.plannedQty} unit siap diperiksa.`,
  });
  return `Batch ${batch.batchNo} diserahkan ke QC Produksi.`;
}

async function qcFail(tx: Tx, project: Loaded, actor: Actor, payload: Record<string, string>) {
  const batch = activeBatch(project);
  if (!batch) throw new Error("Batch tidak ditemukan.");
  const notes = need(payload, "notes", "Temuan QC");
  await tx.productionBatch.update({ where: { id: batch.id }, data: { status: "REWORK", notes } });
  await tx.project.update({ where: { id: project.id }, data: { status: "REWORK_PRODUKSI" } });
  await tx.qcRecord.create({
    data: {
      projectId: project.id,
      batchId: batch.id,
      stage: "PRODUKSI",
      result: "FAIL",
      notes,
      inspector: actor.name,
    },
  });
  await addDoc(tx, actor, project.id, "LAPORAN_QC_PRODUKSI", "Laporan QC produksi", `QC-${project.code}-B${batch.batchNo}`, {
    batchNo: batch.batchNo,
    qty: batch.plannedQty,
    result: "TIDAK SESUAI",
    notes,
    inspector: actor.name,
  });
  await gate(tx, project, actor, "HASIL_QC_PRODUKSI", "TIDAK", notes, "REWORK_PRODUKSI");
  await audit(tx, project.id, actor, "QC tidak sesuai", notes);
  await notify(tx, {
    project,
    roles: ["PRODUKSI"],
    exceptUserId: actor.id,
    title: `Perbaikan produk ${project.code}`,
    body: `Batch ${batch.batchNo} kembali ke produksi. ${notes}`,
  });
  return "Gateway Tidak. Batch masuk perbaikan produk.";
}

async function finishRework(tx: Tx, project: Loaded, actor: Actor, payload: Record<string, string>) {
  const batch = activeBatch(project);
  if (!batch || batch.status !== "REWORK") throw new Error("Tidak ada batch dalam perbaikan.");
  const notes = clip(payload.notes, 2000);
  await tx.productionBatch.update({
    where: { id: batch.id },
    data: { status: "QC_PENDING", notes: notes || batch.notes },
  });
  await tx.project.update({ where: { id: project.id }, data: { status: "QC_PRODUKSI" } });
  await audit(tx, project.id, actor, "Perbaikan produk selesai", notes || `Batch ${batch.batchNo} kembali ke QC.`);
  await notify(tx, {
    project,
    roles: ["QC_PRODUKSI"],
    exceptUserId: actor.id,
    title: `QC ulang ${project.code}`,
    body: `Batch ${batch.batchNo} selesai diperbaiki.`,
  });
  return "Perbaikan selesai. QC Produksi memeriksa ulang batch yang sama.";
}

async function qcPass(tx: Tx, project: Loaded, actor: Actor, payload: Record<string, string>) {
  const batch = activeBatch(project);
  if (!batch || batch.status !== "QC_PENDING") throw new Error("Tidak ada batch yang menunggu QC.");
  const notes = clip(payload.notes, 2000);
  const nextPassed = project.passedUnits + batch.plannedQty;
  await tx.productionBatch.update({
    where: { id: batch.id },
    data: { status: "PASSED", qcAt: new Date(), notes: notes || batch.notes },
  });
  await tx.productUnit.createMany({
    data: Array.from({ length: batch.plannedQty }, (_, index) => ({
      projectId: project.id,
      batchId: batch.id,
      serialNo: `${project.code}-U${String(project.passedUnits + index + 1).padStart(3, "0")}`,
      status: "STORED",
    })),
  });
  await tx.qcRecord.create({
    data: {
      projectId: project.id,
      batchId: batch.id,
      stage: "PRODUKSI",
      result: "PASS",
      notes: notes || "Sesuai spesifikasi.",
      inspector: actor.name,
    },
  });
  await addDoc(tx, actor, project.id, "LAPORAN_QC_PRODUKSI", "Laporan QC produksi", `QC-${project.code}-B${batch.batchNo}`, {
    batchNo: batch.batchNo,
    qty: batch.plannedQty,
    result: "LULUS",
    notes: notes || "Sesuai spesifikasi.",
    inspector: actor.name,
  });
  const allDone = nextPassed >= project.totalOrderedUnits;
  const toStatus = allDone ? "SIAP_KIRIM" : "OPERASIONAL";
  await tx.project.update({
    where: { id: project.id },
    data: { passedUnits: nextPassed, status: toStatus },
  });
  await gate(tx, project, actor, "HASIL_QC_PRODUKSI", "YA", notes || "Lulus", toStatus);
  await gate(
    tx,
    project,
    actor,
    "SEMUA_UNIT",
    allDone ? "YA" : "TIDAK",
    allDone
      ? "Seluruh unit pesanan lolos QC."
      : `${nextPassed} dari ${project.totalOrderedUnits} unit lolos. Sisa kembali ke gudang dan produksi.`,
    toStatus,
  );
  await audit(
    tx,
    project.id,
    actor,
    "QC lolos",
    allDone
      ? "Seluruh unit lolos QC. Siap diterbitkan surat jalan."
      : `Batch ${batch.batchNo} lolos. Sisa ${project.totalOrderedUnits - nextPassed} unit kembali ke siklus material.`,
  );
  await notify(tx, {
    project,
    roles: allDone ? ["QC_PRODUKSI"] : ["WAREHOUSE", "PRODUKSI"],
    exceptUserId: actor.id,
    title: allDone ? `${project.code} siap kirim` : `${project.code} masih ada sisa unit`,
    body: allDone
      ? "Terbitkan surat jalan untuk seluruh nomor seri."
      : `${nextPassed} dari ${project.totalOrderedUnits} unit lolos. Produksi sisa unit dilanjutkan.`,
  });
  return allDone
    ? "Seluruh unit lolos QC. Tahap surat jalan terbuka."
    : `Batch lolos. ${nextPassed} dari ${project.totalOrderedUnits} unit selesai. Sisa kembali ke gudang.`;
}

async function issueDelivery(tx: Tx, project: Loaded, actor: Actor) {
  const units = await tx.productUnit.findMany({
    where: { projectId: project.id },
    orderBy: { serialNo: "asc" },
  });
  if (!units.length) throw new Error("Belum ada unit berseri.");
  await tx.project.update({ where: { id: project.id }, data: { updatedAt: new Date() } });
  await addDoc(tx, actor, project.id, "SURAT_JALAN", "Surat jalan", `SJ-${project.code}`, {
    destination: project.location,
    customer: project.customer.companyName,
    serials: units.map((unit) => unit.serialNo),
    units: units.length,
    issuedBy: actor.name,
  });
  await audit(tx, project.id, actor, "Terbitkan surat jalan", `${units.length} nomor seri tercantum.`);
  return "Surat jalan terbit. Konfirmasi setelah unit tiba di lokasi.";
}

async function confirmShipment(tx: Tx, project: Loaded, actor: Actor, payload: Record<string, string>) {
  const notes = clip(payload.notes, 2000);
  const now = new Date();
  await tx.productUnit.updateMany({ where: { projectId: project.id }, data: { status: "SHIPPED" } });
  await tx.project.update({
    where: { id: project.id },
    data: { status: "INSTALASI", shippedAt: now, arrivedSiteAt: now },
  });
  await audit(tx, project.id, actor, "Tiba di lokasi", notes || `Seluruh unit ${project.code} tiba di ${project.location}.`);
  await notify(tx, {
    project,
    roles: ["INSTALASI"],
    exceptUserId: actor.id,
    title: `${project.code} tiba di lokasi`,
    body: `Instalasi dapat dimulai di ${project.location}.`,
  });
  return "Unit tiba di lokasi. Tim instalasi menerima pekerjaan.";
}

async function recordInstallation(tx: Tx, project: Loaded, actor: Actor, payload: Record<string, string>) {
  const notes = need(payload, "notes", "Catatan pemasangan");
  await tx.productUnit.updateMany({ where: { projectId: project.id }, data: { status: "INSTALLED" } });
  await tx.project.update({ where: { id: project.id }, data: { status: "QC_INSTALASI" } });
  await audit(tx, project.id, actor, "Instalasi selesai", notes);
  return "Pemasangan dicatat. Lanjutkan QC internal pengawas.";
}

async function installQcFail(tx: Tx, project: Loaded, actor: Actor, payload: Record<string, string>) {
  const notes = need(payload, "notes", "Temuan pengawas");
  await tx.project.update({ where: { id: project.id }, data: { status: "REWORK_INSTALASI" } });
  await tx.qcRecord.create({
    data: { projectId: project.id, stage: "INSTALASI", result: "FAIL", notes, inspector: actor.name },
  });
  await addDoc(tx, actor, project.id, "HASIL_QC_INSTALASI", "Hasil QC instalasi", `QCI-${project.code}`, {
    result: "TIDAK SESUAI",
    notes,
    inspector: actor.name,
    location: project.location,
  });
  await gate(tx, project, actor, "HASIL_QC_INSTALASI", "TIDAK", notes, "REWORK_INSTALASI");
  await audit(tx, project.id, actor, "QC instalasi tidak sesuai", notes);
  await notify(tx, {
    project,
    roles: ["INSTALASI"],
    exceptUserId: actor.id,
    title: `Perbaikan instalasi ${project.code}`,
    body: notes,
  });
  return "Gateway Tidak. Instalasi masuk perbaikan.";
}

async function finishInstallRework(tx: Tx, project: Loaded, actor: Actor, payload: Record<string, string>) {
  const notes = clip(payload.notes, 2000);
  await tx.project.update({ where: { id: project.id }, data: { status: "QC_INSTALASI" } });
  await audit(tx, project.id, actor, "Perbaikan instalasi selesai", notes || "Siap QC internal ulang.");
  await notify(tx, {
    project,
    roles: ["INSTALASI"],
    exceptUserId: actor.id,
    title: `QC ulang instalasi ${project.code}`,
    body: "Perbaikan selesai. Pengawas memeriksa kembali.",
  });
  return "Perbaikan selesai. Ulangi QC internal.";
}

async function installQcPass(tx: Tx, project: Loaded, actor: Actor, payload: Record<string, string>) {
  const notes = clip(payload.notes, 2000) || "Hasil pemasangan sesuai gambar dan spesifikasi.";
  await tx.project.update({ where: { id: project.id }, data: { status: "INSPEKSI_PELANGGAN" } });
  await tx.qcRecord.create({
    data: { projectId: project.id, stage: "INSTALASI", result: "PASS", notes, inspector: actor.name },
  });
  await addDoc(tx, actor, project.id, "HASIL_QC_INSTALASI", "Hasil QC instalasi", `QCI-${project.code}`, {
    result: "SESUAI",
    notes,
    inspector: actor.name,
    location: project.location,
  });
  await addDoc(tx, actor, project.id, "PERMINTAAN_PEMERIKSAAN", "Permintaan pemeriksaan", `PP-${project.code}`, {
    message: "Instalasi selesai dan lolos QC internal. Mohon pemeriksaan bersama di lokasi.",
    location: project.location,
    units: project.totalOrderedUnits,
    requestedBy: actor.name,
  });
  await gate(tx, project, actor, "HASIL_QC_INSTALASI", "YA", notes, "INSPEKSI_PELANGGAN");
  await audit(tx, project.id, actor, "Ajukan pemeriksaan pelanggan", notes);
  await notify(tx, {
    project,
    customer: true,
    roles: ["INSTALASI", "ADMIN_PROYEK"],
    exceptUserId: actor.id,
    title: `Pemeriksaan ${project.code} menunggu Anda`,
    body: `${project.customer.companyName} diminta memeriksa hasil instalasi di ${project.location}.`,
  });
  return "Permintaan pemeriksaan terkirim ke pelanggan.";
}

async function clientFix(tx: Tx, project: Loaded, actor: Actor, payload: Record<string, string>) {
  const notes = need(payload, "notes", "Catatan perbaikan");
  await tx.project.update({ where: { id: project.id }, data: { status: "REWORK_INSTALASI" } });
  await addDoc(tx, actor, project.id, "CATATAN_PERBAIKAN", "Catatan perbaikan pelanggan", `CP-${project.code}-${Date.now().toString().slice(-4)}`, {
    notes,
    by: actor.name,
    company: project.customer.companyName,
  });
  await gate(tx, project, actor, "HASIL_SESUAI_PELANGGAN", "TIDAK", notes, "REWORK_INSTALASI");
  await audit(tx, project.id, actor, "Pelanggan minta perbaikan", notes);
  await notify(tx, {
    project,
    roles: ["INSTALASI", "ADMIN_PROYEK"],
    exceptUserId: actor.id,
    title: `Temuan pelanggan pada ${project.code}`,
    body: notes,
  });
  return "Catatan perbaikan dikirim. Instalasi menerima pekerjaan ulang.";
}

async function clientSign(tx: Tx, project: Loaded, actor: Actor, payload: Record<string, string>) {
  const signerName = need(payload, "signerName", "Nama penandatangan");
  const signature = payload.signature ?? "";
  const attachment = payload.attachment ?? "";
  const okSig = signature.startsWith("data:image/") && signature.length < 1_500_000;
  const okFile = /^(data:image\/|data:application\/pdf)/.test(attachment) && attachment.length < 1_400_000;
  if (!okSig && !okFile) throw new Error("Bubuhkan tanda tangan atau unggah pindaian BAST.");
  if (signature && !okSig) throw new Error("Tanda tangan tidak valid.");
  if (attachment && !okFile) throw new Error("Berkas harus gambar atau PDF di bawah 1,2 MB.");
  const signedAt = new Date();
  await tx.project.update({
    where: { id: project.id },
    data: { status: "VERIFIKASI_BAST", bastAt: signedAt },
  });
  await addDoc(tx, actor, project.id, "BAST", "Berita acara serah terima", `BAST-${project.code}`, {
    signerName,
    signedAt: signedAt.toISOString(),
    company: project.customer.companyName,
    project: project.title,
    units: project.totalOrderedUnits,
    location: project.location,
    statement: "Pekerjaan pintu timbal telah diperiksa dan diserahterimakan dalam kondisi sesuai.",
    signature: okSig ? signature : "",
    attachment: okFile ? attachment : "",
  });
  await gate(tx, project, actor, "HASIL_SESUAI_PELANGGAN", "YA", `Ditandatangani ${signerName}`, "VERIFIKASI_BAST");
  await audit(tx, project.id, actor, "Tanda tangan BAST", `${signerName} menandatangani BAST.`);
  await notify(tx, {
    project,
    roles: ["ADMIN_PROYEK"],
    exceptUserId: actor.id,
    title: `BAST ${project.code} masuk`,
    body: `${signerName} menandatangani serah terima. Admin memverifikasi dan menutup proyek.`,
  });
  return "BAST ditandatangani. Admin Proyek menerima verifikasi penutupan.";
}

async function closeProject(tx: Tx, project: Loaded, actor: Actor, payload: Record<string, string>) {
  if (payload.confirm !== "yes") throw new Error("Centang konfirmasi pemeriksaan BAST.");
  if (!project.documents.some((doc) => doc.type === "BAST")) throw new Error("Dokumen BAST belum ada.");
  await tx.project.update({
    where: { id: project.id },
    data: { status: "SELESAI", completedAt: new Date() },
  });
  await audit(tx, project.id, actor, "Tutup proyek", "BAST diverifikasi. Proyek selesai.");
  await notify(tx, {
    project,
    customer: true,
    roles: ["ADMIN_PROYEK", "DIREKTUR"],
    exceptUserId: actor.id,
    title: `${project.code} selesai`,
    body: "Berita acara diverifikasi dan proyek ditutup.",
  });
  return "Proyek ditutup.";
}
