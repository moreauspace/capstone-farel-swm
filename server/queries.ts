import "server-only";
import { prisma } from "@/lib/prisma";
import { buildWorkspace, makeContext } from "@/lib/workflow";
import { CLIENT_DOC_TYPES } from "@/lib/labels";
import type { Actor, DashboardData, ProjectDTO } from "@/lib/types";
import { daysBetween } from "@/lib/utils";

const detailInclude = {
  customer: true,
  createdBy: true,
  bomItems: { include: { material: true } },
  batches: {
    include: { materials: { include: { material: true } } },
    orderBy: { batchNo: "asc" as const },
  },
  units: { orderBy: { serialNo: "asc" as const } },
  documents: { include: { createdBy: true }, orderBy: { createdAt: "desc" as const } },
  decisions: { orderBy: { createdAt: "desc" as const } },
  audits: { orderBy: { createdAt: "desc" as const } },
  purchaseRequests: {
    include: { items: { include: { material: true } } },
    orderBy: { createdAt: "desc" as const },
  },
};

function iso(value: Date | null | undefined) {
  return value ? value.toISOString() : null;
}

export async function getProjectDTO(id: string, actor: Actor): Promise<ProjectDTO | null> {
  const project = await prisma.project.findUnique({ where: { id }, include: detailInclude });
  if (!project) return null;
  if (actor.role === "PELANGGAN" && project.customerId !== actor.customerId) return null;
  const audience = actor.role === "PELANGGAN" ? "client" : "internal";
  const model = buildWorkspace(makeContext(project), actor);
  const active = [...project.batches].reverse().find((batch) => batch.status !== "PASSED");
  const inFlight = active && (active.status === "ALLOCATED" || active.status === "IN_PRODUCTION") ? active.plannedQty : 0;
  const documents = project.documents.filter((doc) => audience === "internal" || CLIENT_DOC_TYPES.has(doc.type));
  return {
    id: project.id,
    code: project.code,
    title: project.title,
    description: project.description,
    productName: project.productName,
    specification: project.specification,
    location: project.location,
    total: project.totalOrderedUnits,
    produced: project.producedUnits,
    passed: project.passedUnits,
    inFlight,
    status: project.status,
    productionPrepared: project.productionPrepared,
    deadline: iso(project.deadline),
    poNumber: project.poNumber,
    directorNotes: audience === "internal" || project.approvedAt ? project.directorNotes : null,
    approvedAt: iso(project.approvedAt),
    shippedAt: iso(project.shippedAt),
    arrivedSiteAt: iso(project.arrivedSiteAt),
    bastAt: iso(project.bastAt),
    completedAt: iso(project.completedAt),
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    customer: {
      id: project.customer.id,
      companyName: project.customer.companyName,
      contactName: project.customer.contactName,
      email: project.customer.email,
      phone: project.customer.phone,
      address: project.customer.address,
    },
    lanes: model.lanes,
    actions: model.actions,
    stage: model.stage,
    readiness: audience === "internal" ? model.readiness : null,
    caption: model.caption,
    batches: project.batches.map((batch) => ({
      id: batch.id,
      batchNo: batch.batchNo,
      plannedQty: batch.plannedQty,
      status: batch.status,
      notes: batch.notes,
      startedAt: iso(batch.startedAt),
      finishedAt: iso(batch.finishedAt),
      qcAt: iso(batch.qcAt),
      materials:
        audience === "internal"
          ? batch.materials.map((item) => ({
              name: item.material.name,
              qty: item.qty,
              unit: item.material.unit,
            }))
          : [],
    })),
    documents: documents.map((doc) => ({
      id: doc.id,
      type: doc.type,
      title: doc.title,
      number: doc.number,
      payload: doc.payload,
      status: doc.status,
      createdAt: doc.createdAt.toISOString(),
      author: doc.createdBy?.name ?? null,
    })),
    audits:
      audience === "internal"
        ? project.audits.map((item) => ({
            id: item.id,
            actorName: item.actorName,
            action: item.action,
            detail: item.detail,
            createdAt: item.createdAt.toISOString(),
          }))
        : [],
    decisions:
      audience === "internal"
        ? project.decisions.map((item) => ({
            id: item.id,
            gateway: item.gateway,
            decision: item.decision,
            notes: item.notes,
            actorName: item.actorName,
            fromStatus: item.fromStatus,
            toStatus: item.toStatus,
            createdAt: item.createdAt.toISOString(),
          }))
        : [],
    units: project.units.map((unit) => ({ serialNo: unit.serialNo, status: unit.status })),
    purchaseRequests:
      audience === "internal"
        ? project.purchaseRequests.map((pr) => ({
            id: pr.id,
            code: pr.code,
            status: pr.status,
            notes: pr.notes,
            createdAt: pr.createdAt.toISOString(),
            orderedAt: iso(pr.orderedAt),
            arrivedAt: iso(pr.arrivedAt),
            items: pr.items.map((item) => ({
              name: item.material.name,
              sku: item.material.sku,
              unit: item.material.unit,
              qty: item.qty,
              receivedQty: item.receivedQty,
            })),
          }))
        : [],
    audience,
  };
}

const FILTERS: Record<string, string[]> = {
  awal: ["DRAFT", "MENUNGGU_DIREKTUR"],
  material: ["OPERASIONAL", "PENGADAAN"],
  produksi: ["PRODUKSI", "QC_PRODUKSI", "REWORK_PRODUKSI"],
  lapangan: ["SIAP_KIRIM", "INSTALASI", "QC_INSTALASI", "REWORK_INSTALASI", "INSPEKSI_PELANGGAN", "VERIFIKASI_BAST"],
  selesai: ["SELESAI"],
};

export async function listProjects(actor: Actor, q?: string, filter?: string) {
  const statuses = filter ? FILTERS[filter] ?? [filter] : undefined;
  const query = q?.trim();
  const projects = await prisma.project.findMany({
    where: {
      ...(actor.role === "PELANGGAN" ? { customerId: actor.customerId ?? "__none__" } : {}),
      ...(statuses ? { status: { in: statuses } } : {}),
      ...(query
        ? {
            OR: [
              { code: { contains: query } },
              { title: { contains: query } },
              { poNumber: { contains: query } },
              { location: { contains: query } },
              { customer: { companyName: { contains: query } } },
            ],
          }
        : {}),
    },
    include: { customer: true },
    orderBy: { updatedAt: "desc" },
  });
  return projects.map((project) => ({
    id: project.id,
    code: project.code,
    title: project.title,
    status: project.status,
    customer: project.customer.companyName,
    location: project.location,
    total: project.totalOrderedUnits,
    passed: project.passedUnits,
    produced: project.producedUnits,
    deadline: iso(project.deadline),
    updatedAt: project.updatedAt.toISOString(),
  }));
}

export async function getDashboard(actor: Actor): Promise<DashboardData> {
  const [projects, qcRecords, openPrs] = await Promise.all([
    prisma.project.findMany({
      include: {
        customer: true,
        batches: true,
        purchaseRequests: true,
        documents: { select: { type: true } },
        bomItems: { include: { material: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.qcRecord.findMany({ select: { stage: true, result: true } }),
    prisma.purchaseRequest.count({ where: { status: { in: ["DRAFT", "DIPROSES", "DIPESAN"] } } }),
  ]);

  const active = projects.filter((project) => project.status !== "SELESAI");
  const waitingDirector = projects.filter((project) => project.status === "MENUNGGU_DIREKTUR").length;
  const productionProjects = projects.filter((project) => {
    const batch = project.batches.some((item) => item.status !== "PASSED");
    return (
      ["PRODUKSI", "QC_PRODUKSI", "REWORK_PRODUKSI"].includes(project.status) ||
      (project.status === "OPERASIONAL" && (batch || project.passedUnits > 0) && project.passedUnits < project.totalOrderedUnits)
    );
  });
  const producedSum = productionProjects.reduce((sum, project) => sum + project.passedUnits, 0);
  const orderedSum = productionProjects.reduce((sum, project) => sum + project.totalOrderedUnits, 0);
  const installing = projects.filter((project) =>
    ["INSTALASI", "QC_INSTALASI", "REWORK_INSTALASI"].includes(project.status),
  ).length;
  const done = projects.filter((project) => project.status === "SELESAI").length;

  const laneCounts = new Map<string, number>();
  const queue: DashboardData["queue"] = [];
  for (const project of projects) {
    if (project.status === "SELESAI") continue;
    const model = buildWorkspace(makeContext(project), actor);
    for (const lane of model.lanes) {
      if (lane.state === "current" || lane.state === "rework") {
        laneCounts.set(lane.id, (laneCounts.get(lane.id) ?? 0) + 1);
      }
    }
    if (model.actions.length) {
      queue.push({
        id: project.id,
        code: project.code,
        title: project.title,
        customer: project.customer.companyName,
        status: project.status,
        action: model.actions[0].title,
        extra: Math.max(0, model.actions.length - 1),
      });
    }
  }

  const bottlenecks = [
    { id: "ADMIN", label: "Admin" },
    { id: "DIREKTUR", label: "Direktur" },
    { id: "WAREHOUSE", label: "Gudang" },
    { id: "PRODUKSI", label: "Produksi" },
    { id: "QC", label: "QC" },
    { id: "INSTALASI", label: "Instalasi" },
    { id: "PELANGGAN", label: "Pelanggan" },
  ].map((lane) => ({ ...lane, count: laneCounts.get(lane.id) ?? 0 }));

  const qc = ["PRODUKSI", "INSTALASI"].map((stage) => ({
    stage: stage === "PRODUKSI" ? "Produksi" : "Instalasi",
    pass: qcRecords.filter((row) => row.stage === stage && row.result === "PASS").length,
    fail: qcRecords.filter((row) => row.stage === stage && row.result === "FAIL").length,
  }));

  const lead = projects
    .filter((project) => project.completedAt)
    .map((project) => ({
      code: project.code.replace("SWM-", ""),
      days: daysBetween(project.createdAt.toISOString(), project.completedAt!.toISOString()),
    }));
  const leadAvg = lead.length ? Math.round(lead.reduce((sum, item) => sum + item.days, 0) / lead.length) : null;

  return {
    kpis: [
      { id: "active", label: "Proyek aktif", value: String(active.length), hint: "Belum ditutup dengan BAST" },
      { id: "director", label: "Menunggu arahan", value: String(waitingDirector), hint: "Rencana di meja direktur" },
      { id: "pr", label: "PR aktif", value: String(openPrs), hint: "Pengadaan yang belum tiba" },
      {
        id: "prod",
        label: "Produksi berjalan",
        value: String(productionProjects.length),
        hint: orderedSum ? `${producedSum} dari ${orderedSum} unit lolos QC` : "Tidak ada batch aktif",
      },
      { id: "install", label: "Dalam instalasi", value: String(installing), hint: "Pemasangan dan QC lapangan" },
      { id: "done", label: "Proyek selesai", value: String(done), hint: leadAvg != null ? `Lead time rata-rata ${leadAvg} hari` : "Belum ada yang ditutup" },
    ],
    bottlenecks,
    queue,
    units: projects
      .filter((project) => project.status !== "DRAFT")
      .slice(0, 8)
      .map((project) => ({ code: project.code.replace("SWM-", ""), target: project.totalOrderedUnits, passed: project.passedUnits })),
    qc,
    lead,
    leadAvg,
  };
}

export async function getWarehouse() {
  const [materials, movements] = await Promise.all([
    prisma.material.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
    prisma.stockMovement.findMany({ include: { material: true }, orderBy: { createdAt: "desc" }, take: 12 }),
  ]);
  const value = materials.reduce((sum, item) => sum + item.stockQty * item.unitPrice, 0);
  const below = materials.filter((item) => item.stockQty < item.minStock).length;
  return {
    value,
    below,
    materials: materials.map((item) => ({
      id: item.id,
      sku: item.sku,
      name: item.name,
      unit: item.unit,
      stockQty: item.stockQty,
      minStock: item.minStock,
      unitPrice: item.unitPrice,
      category: item.category,
      below: item.stockQty < item.minStock,
    })),
    movements: movements.map((item) => ({
      id: item.id,
      sku: item.material.sku,
      name: item.material.name,
      qty: item.qty,
      unit: item.material.unit,
      type: item.type,
      note: item.note,
      createdAt: item.createdAt.toISOString(),
    })),
  };
}

export async function getProcurement() {
  const rows = await prisma.purchaseRequest.findMany({
    include: { project: { include: { customer: true } }, items: { include: { material: true } } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((pr) => ({
    id: pr.id,
    code: pr.code,
    status: pr.status,
    notes: pr.notes,
    projectId: pr.projectId,
    projectCode: pr.project.code,
    projectTitle: pr.project.title,
    customer: pr.project.customer.companyName,
    createdAt: pr.createdAt.toISOString(),
    orderedAt: iso(pr.orderedAt),
    arrivedAt: iso(pr.arrivedAt),
    value: pr.items.reduce((sum, item) => sum + item.qty * item.material.unitPrice, 0),
    items: pr.items.map((item) => ({
      name: item.material.name,
      sku: item.material.sku,
      unit: item.material.unit,
      qty: item.qty,
      receivedQty: item.receivedQty,
    })),
  }));
}

export async function getNotifications(userId: string) {
  const items = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    body: item.body,
    href: item.href,
    read: item.read,
    createdAt: item.createdAt.toISOString(),
  }));
}

export async function getUsers() {
  const users = await prisma.user.findMany({
    include: { customer: true },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });
  return users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    department: user.department,
    phone: user.phone,
    active: user.active,
    customer: user.customer?.companyName ?? null,
    createdAt: user.createdAt.toISOString(),
  }));
}

export async function getCustomers() {
  const customers = await prisma.customer.findMany({ orderBy: { companyName: "asc" } });
  return customers.map((customer) => ({
    id: customer.id,
    companyName: customer.companyName,
    contactName: customer.contactName,
    email: customer.email,
  }));
}

export async function getPortal(actor: Actor) {
  if (!actor.customerId) return [];
  const projects = await prisma.project.findMany({
    where: { customerId: actor.customerId },
    include: {
      batches: true,
      purchaseRequests: true,
      documents: { select: { type: true } },
      bomItems: { include: { material: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  return projects.map((project) => {
    const model = buildWorkspace(makeContext(project), actor);
    return {
      id: project.id,
      code: project.code,
      title: project.title,
      status: project.status,
      location: project.location,
      total: project.totalOrderedUnits,
      passed: project.passedUnits,
      produced: project.producedUnits,
      deadline: iso(project.deadline),
      caption: model.caption,
      lanes: model.lanes,
      needsAction: model.actions.length > 0,
    };
  });
}