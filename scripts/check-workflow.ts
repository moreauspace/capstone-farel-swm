import { PrismaClient } from "@prisma/client";
import { buildWorkspace, makeContext, readinessOf } from "../lib/workflow";

const prisma = new PrismaClient();
const year = new Date().getFullYear();
const code = (n: number) => `SWM-${year}-${String(n).padStart(3, "0")}`;

async function actions(projectCode: string, email: string) {
  const project = await prisma.project.findUnique({
    where: { code: projectCode },
    include: {
      documents: { select: { type: true } },
      batches: true,
      purchaseRequests: true,
      bomItems: { include: { material: true } },
    },
  });
  const user = await prisma.user.findUnique({ where: { email } });
  if (!project || !user) throw new Error(`Data tidak ada untuk ${projectCode} / ${email}`);
  const model = buildWorkspace(makeContext(project), { role: user.role, customerId: user.customerId });
  return { ids: model.actions.map((item) => item.id).sort(), readiness: readinessOf(makeContext(project)) };
}

function same(actual: string[], expected: string[]) {
  const left = [...actual].sort().join(",");
  const right = [...expected].sort().join(",");
  if (left !== right) throw new Error(`Harapan ${right} tetapi dapat ${left}`);
}

async function main() {
  const a1 = await actions(code(1), "admin.proyek@satyawira.co.id");
  same(a1.ids, ["SUBMIT_PLAN"]);
  const d1 = await actions(code(1), "direktur@satyawira.co.id");
  same(d1.ids, []);

  const a2 = await actions(code(2), "direktur@satyawira.co.id");
  same(a2.ids, ["APPROVE_PLAN", "RETURN_PLAN"]);

  const w3 = await actions(code(3), "gudang@satyawira.co.id");
  same(w3.ids, ["CONFIRM_ARRIVAL"]);
  const p3 = await actions(code(3), "produksi@satyawira.co.id");
  same(p3.ids, ["PREPARE_PRODUCTION"]);

  const w4 = await actions(code(4), "gudang@satyawira.co.id");
  same(w4.ids, ["CHECK_MATERIAL"]);
  if (w4.readiness.canBuild !== 2) throw new Error(`Batch parsial harus 2 unit, dapat ${w4.readiness.canBuild}`);
  const p4 = await actions(code(4), "produksi@satyawira.co.id");
  same(p4.ids, []);

  const q5 = await actions(code(5), "qc@satyawira.co.id");
  same(q5.ids, ["QC_FAIL", "QC_PASS"]);

  const i6 = await actions(code(6), "instalasi@satyawira.co.id");
  same(i6.ids, ["INSTALL_QC_FAIL", "INSTALL_QC_PASS"]);
  const c6 = await actions(code(6), "pelanggan@rssentosa.id");
  same(c6.ids, []);

  const c7 = await actions(code(7), "pelanggan@rssentosa.id");
  same(c7.ids, ["CLIENT_REQUEST_FIX", "CLIENT_SIGN_BAST"]);

  const a8 = await actions(code(8), "admin.proyek@satyawira.co.id");
  same(a8.ids, ["CLOSE_PROJECT"]);

  const a9 = await actions(code(9), "admin.proyek@satyawira.co.id");
  same(a9.ids, []);

  console.log("Alur BPMN sesuai untuk sembilan proyek sampel.");
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
