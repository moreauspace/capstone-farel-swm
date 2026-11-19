export const ROLES = [
  "SUPER_ADMIN",
  "ADMIN_PROYEK",
  "DIREKTUR",
  "WAREHOUSE",
  "PRODUKSI",
  "QC_PRODUKSI",
  "INSTALASI",
  "PELANGGAN",
] as const;

export type Role = (typeof ROLES)[number];

export const PROJECT_STATUSES = [
  "DRAFT",
  "MENUNGGU_DIREKTUR",
  "OPERASIONAL",
  "PENGADAAN",
  "PRODUKSI",
  "QC_PRODUKSI",
  "REWORK_PRODUKSI",
  "SIAP_KIRIM",
  "INSTALASI",
  "QC_INSTALASI",
  "REWORK_INSTALASI",
  "INSPEKSI_PELANGGAN",
  "VERIFIKASI_BAST",
  "SELESAI",
] as const;

export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export type ActionField = {
  type: "text" | "textarea" | "signature" | "file" | "confirm";
  name: string;
  label: string;
  required?: boolean;
  placeholder?: string;
};

export type ActionDef = {
  id: string;
  title: string;
  description: string;
  tone: "primary" | "danger" | "neutral";
  fields: ActionField[];
  facts?: { label: string; value: string }[];
};

export type LaneStateName = "current" | "rework" | "done" | "wait" | "idle";

export type LaneView = {
  id: string;
  label: string;
  short: string;
  state: LaneStateName;
  detail: string;
};

export type BomLine = {
  materialId: string;
  sku: string;
  name: string;
  unit: string;
  stock: number;
  perUnit: number;
  unitPrice: number;
};

export type WContext = {
  status: string;
  approved: boolean;
  productionPrepared: boolean;
  total: number;
  produced: number;
  passed: number;
  remaining: number;
  customerId: string;
  hasDeliveryNote: boolean;
  hasBast: boolean;
  activeBatch: { batchNo: number; plannedQty: number; status: string } | null;
  openPr: { code: string; status: string } | null;
  bom: BomLine[];
};

export type ReadinessLine = {
  sku: string;
  name: string;
  unit: string;
  stock: number;
  perUnit: number;
  possible: number;
  shortage: number;
};

export type Readiness = {
  remaining: number;
  canBuild: number;
  lines: ReadinessLine[];
};

export type WorkspaceModel = {
  lanes: LaneView[];
  actions: ActionDef[];
  stage: { headline: string; owner: string };
  readiness: Readiness;
  caption: string;
};

export type Actor = {
  id: string;
  name: string;
  role: string;
  customerId: string | null;
};

export type BatchDTO = {
  id: string;
  batchNo: number;
  plannedQty: number;
  status: string;
  notes: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  qcAt: string | null;
  materials: { name: string; qty: number; unit: string }[];
};

export type DocumentDTO = {
  id: string;
  type: string;
  title: string;
  number: string;
  payload: string;
  status: string;
  createdAt: string;
  author: string | null;
};

export type AuditDTO = {
  id: string;
  actorName: string;
  action: string;
  detail: string;
  createdAt: string;
};

export type DecisionDTO = {
  id: string;
  gateway: string;
  decision: string;
  notes: string | null;
  actorName: string;
  fromStatus: string;
  toStatus: string;
  createdAt: string;
};

export type QueueItem = {
  id: string;
  code: string;
  title: string;
  customer: string;
  status: string;
  action: string;
  extra: number;
};

export type DashboardData = {
  kpis: { id: string; label: string; value: string; hint: string }[];
  bottlenecks: { id: string; label: string; count: number }[];
  queue: QueueItem[];
  units: { code: string; target: number; passed: number }[];
  qc: { stage: string; pass: number; fail: number }[];
  lead: { code: string; days: number }[];
  leadAvg: number | null;
};

export type ProjectDTO = {
  id: string;
  code: string;
  title: string;
  description: string;
  productName: string;
  specification: string;
  location: string;
  total: number;
  produced: number;
  passed: number;
  inFlight: number;
  status: string;
  productionPrepared: boolean;
  deadline: string | null;
  poNumber: string | null;
  directorNotes: string | null;
  approvedAt: string | null;
  shippedAt: string | null;
  arrivedSiteAt: string | null;
  bastAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  customer: {
    id: string;
    companyName: string;
    contactName: string;
    email: string;
    phone: string | null;
    address: string | null;
  };
  lanes: LaneView[];
  actions: ActionDef[];
  stage: { headline: string; owner: string };
  readiness: Readiness | null;
  caption: string;
  batches: BatchDTO[];
  documents: DocumentDTO[];
  audits: AuditDTO[];
  decisions: DecisionDTO[];
  units: { serialNo: string; status: string }[];
  purchaseRequests: {
    id: string;
    code: string;
    status: string;
    notes: string | null;
    createdAt: string;
    orderedAt: string | null;
    arrivedAt: string | null;
    items: { name: string; sku: string; unit: string; qty: number; receivedQty: number }[];
  }[];
  audience: "internal" | "client";
};
