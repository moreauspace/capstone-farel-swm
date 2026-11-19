"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import { runTransition, applyTransition } from "@/server/engine";
import { productById } from "@/lib/catalog";
import { ROLE_META } from "@/lib/labels";
import { passwordSchema } from "@/lib/password";
import { ROLES } from "@/lib/types";

function refresh(projectId?: string) {
  revalidatePath("/dashboard");
  revalidatePath("/projects");
  revalidatePath("/portal");
  revalidatePath("/warehouse");
  revalidatePath("/procurement");
  revalidatePath("/notifications");
  revalidatePath("/users");
  if (projectId) revalidatePath(`/projects/${projectId}`);
}

function fail(error: unknown) {
  if (error instanceof z.ZodError) return { ok: false as const, message: error.issues[0]?.message ?? "Data tidak valid." };
  if (error instanceof Error) return { ok: false as const, message: error.message };
  return { ok: false as const, message: "Gagal memproses tindakan." };
}

export async function performWorkflowAction(input: {
  projectId: string;
  action: string;
  payload?: Record<string, string>;
}) {
  try {
    const actor = await requireUser();
    const message = await runTransition(actor, input.projectId, input.action, input.payload ?? {});
    refresh(input.projectId);
    return { ok: true as const, message };
  } catch (error) {
    return fail(error);
  }
}

const draftSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(3, "Judul terlalu pendek"),
  location: z.string().min(3, "Lokasi wajib diisi"),
  specification: z.string().min(3, "Spesifikasi wajib diisi"),
  description: z.string().min(3, "Kebutuhan proyek wajib diisi"),
  units: z.coerce.number().int().min(1).max(500),
  deadline: z.string().min(4, "Tenggat wajib diisi"),
  poNumber: z.string().min(2, "Nomor PO wajib diisi"),
});

export async function updateDraftProject(raw: z.input<typeof draftSchema>) {
  try {
    const actor = await requireUser();
    if (!["ADMIN_PROYEK", "SUPER_ADMIN"].includes(actor.role)) {
      return { ok: false as const, message: "Hanya admin proyek yang dapat mengubah draft." };
    }
    const input = draftSchema.parse(raw);
    const project = await prisma.project.findUnique({
      where: { id: input.projectId },
      include: { batches: true, documents: true, customer: true },
    });
    if (!project) return { ok: false as const, message: "Proyek tidak ditemukan." };
    if (project.status !== "DRAFT") return { ok: false as const, message: "Data hanya bisa diubah saat draft." };
    if (project.batches.length && input.units !== project.totalOrderedUnits) {
      return { ok: false as const, message: "Jumlah unit tidak bisa diubah setelah ada batch." };
    }
    await prisma.project.update({
      where: { id: project.id },
      data: {
        title: input.title.trim(),
        location: input.location.trim(),
        specification: input.specification.trim(),
        description: input.description.trim(),
        totalOrderedUnits: input.units,
        deadline: new Date(input.deadline),
        poNumber: input.poNumber.trim(),
      },
    });
    const po = project.documents.find((doc) => doc.type === "PO");
    if (po) {
      await prisma.document.update({
        where: { id: po.id },
        data: {
          number: input.poNumber.trim(),
          payload: JSON.stringify({
            poNumber: input.poNumber.trim(),
            customer: project.customer.companyName,
            contact: project.customer.contactName,
            product: project.productName,
            units: input.units,
            location: input.location.trim(),
            notes: input.description.trim(),
          }),
        },
      });
    }
    await prisma.auditLog.create({
      data: {
        projectId: project.id,
        actorId: actor.id,
        actorName: actor.name,
        action: "Perbarui draft",
        detail: "Data PO dan kebutuhan proyek diperbarui.",
      },
    });
    refresh(project.id);
    return { ok: true as const, message: "Draft proyek diperbarui." };
  } catch (error) {
    return fail(error);
  }
}

const customerSchema = z.object({
  companyName: z.string().min(2, "Nama instansi wajib diisi"),
  contactName: z.string().min(2, "Nama kontak wajib diisi"),
  email: z.string().email("Email pelanggan tidak valid"),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const createSchema = z.object({
  customerId: z.string().optional(),
  newCustomer: customerSchema.optional(),
  productId: z.string().min(1),
  title: z.string().min(3, "Judul proyek wajib diisi"),
  location: z.string().min(3, "Lokasi wajib diisi"),
  units: z.coerce.number().int().min(1, "Minimal 1 unit").max(500),
  deadline: z.string().min(4, "Tenggat wajib diisi"),
  poNumber: z.string().min(2, "Nomor PO wajib diisi"),
  specification: z.string().min(3),
  description: z.string().min(3, "Jelaskan kebutuhan proyek"),
  submit: z.boolean(),
});

export async function createProject(raw: z.input<typeof createSchema>) {
  try {
    const actor = await requireUser();
    if (!["ADMIN_PROYEK", "SUPER_ADMIN"].includes(actor.role)) {
      return { ok: false as const, message: "Hanya admin proyek yang dapat membuat PO." };
    }
    const input = createSchema.parse(raw);
    if (!input.customerId && !input.newCustomer) {
      return { ok: false as const, message: "Pilih pelanggan atau buat pelanggan baru." };
    }
    const product = productById(input.productId);
    if (!product) return { ok: false as const, message: "Jenis produk tidak dikenal." };
    const materials = await prisma.material.findMany();
    const bySku = new Map(materials.map((item) => [item.sku, item]));
    for (const line of product.bom) {
      if (!bySku.get(line.sku)) return { ok: false as const, message: `Material ${line.sku} belum ada di gudang.` };
    }

    const id = await prisma.$transaction(async (tx) => {
      const customer = input.newCustomer
        ? await tx.customer.create({
            data: {
              companyName: input.newCustomer.companyName.trim(),
              contactName: input.newCustomer.contactName.trim(),
              email: input.newCustomer.email.toLowerCase().trim(),
              phone: input.newCustomer.phone?.trim() || null,
              address: input.newCustomer.address?.trim() || null,
            },
          })
        : await tx.customer.findUnique({ where: { id: input.customerId } });
      if (!customer) throw new Error("Pelanggan tidak ditemukan.");
      const year = new Date().getFullYear();
      const count = await tx.project.count({ where: { code: { startsWith: `SWM-${year}-` } } });
      let seq = count + 1;
      let code = `SWM-${year}-${String(seq).padStart(3, "0")}`;
      while (await tx.project.findUnique({ where: { code } })) {
        seq += 1;
        code = `SWM-${year}-${String(seq).padStart(3, "0")}`;
      }
      const deadline = new Date(input.deadline);
      const project = await tx.project.create({
        data: {
          code,
          title: input.title.trim(),
          description: input.description.trim(),
          productName: product.name,
          specification: input.specification.trim(),
          location: input.location.trim(),
          totalOrderedUnits: input.units,
          status: "DRAFT",
          deadline,
          poNumber: input.poNumber.trim(),
          customerId: customer.id,
          createdById: actor.id,
          bomItems: {
            create: product.bom.map((line) => ({
              materialId: bySku.get(line.sku)!.id,
              qtyPerUnit: line.qty,
            })),
          },
        },
      });
      await tx.document.create({
        data: {
          projectId: project.id,
          type: "PO",
          title: "Purchase Order",
          number: input.poNumber.trim(),
          status: "FINAL",
          createdById: actor.id,
          payload: JSON.stringify({
            poNumber: input.poNumber.trim(),
            customer: customer.companyName,
            contact: customer.contactName,
            product: product.name,
            units: input.units,
            location: input.location.trim(),
            notes: input.description.trim(),
          }),
        },
      });
      await tx.document.create({
        data: {
          projectId: project.id,
          type: "DATA_PROYEK",
          title: "Data proyek",
          number: `DP-${code}`,
          status: "FINAL",
          createdById: actor.id,
          payload: JSON.stringify({
            location: input.location.trim(),
            specification: input.specification.trim(),
            deadline: deadline.toISOString(),
            description: input.description.trim(),
            bom: product.bom.map((line) => ({
              sku: line.sku,
              name: bySku.get(line.sku)!.name,
              qtyPerUnit: line.qty,
              unit: bySku.get(line.sku)!.unit,
            })),
          }),
        },
      });
      await tx.auditLog.create({
        data: {
          projectId: project.id,
          actorId: actor.id,
          actorName: actor.name,
          action: "Terima PO",
          detail: `${input.poNumber.trim()} dicatat untuk ${customer.companyName}.`,
        },
      });
      if (input.submit) {
        await applyTransition(tx, project.id, "SUBMIT_PLAN", {}, actor);
      }
      return project.id;
    });
    refresh(id);
    return {
      ok: true as const,
      id,
      message: input.submit ? "PO dicatat dan rencana diajukan ke direktur." : "PO tersimpan sebagai draft.",
    };
  } catch (error) {
    return fail(error);
  }
}

const userSchema = z.object({
  name: z.string().min(3, "Nama wajib diisi"),
  email: z.string().email("Email tidak valid"),
  role: z.enum(ROLES),
  phone: z.string().optional(),
  password: passwordSchema,
  customerId: z.string().optional(),
});

export async function createUser(raw: z.input<typeof userSchema>) {
  try {
    const actor = await requireUser();
    if (actor.role !== "SUPER_ADMIN") return { ok: false as const, message: "Hanya super admin yang mengelola akun." };
    const input = userSchema.parse(raw);
    if (input.role === "PELANGGAN" && !input.customerId) {
      return { ok: false as const, message: "Akun pelanggan harus dihubungkan ke instansi." };
    }
    await prisma.user.create({
      data: {
        name: input.name.trim(),
        email: input.email.toLowerCase().trim(),
        passwordHash: await bcrypt.hash(input.password, 10),
        role: input.role,
        department: ROLE_META[input.role]?.department ?? input.role,
        phone: input.phone?.trim() || null,
        customerId: input.role === "PELANGGAN" ? input.customerId : null,
      },
    });
    refresh();
    return { ok: true as const, message: "Akun dibuat." };
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && (error as { code: string }).code === "P2002") {
      return { ok: false as const, message: "Email sudah dipakai." };
    }
    return fail(error);
  }
}

export async function setUserActive(userId: string, active: boolean) {
  try {
    const actor = await requireUser();
    if (actor.role !== "SUPER_ADMIN") return { ok: false as const, message: "Hanya super admin yang mengelola akun." };
    if (actor.id === userId && !active) return { ok: false as const, message: "Anda tidak dapat menonaktifkan akun sendiri." };
    await prisma.user.update({ where: { id: userId }, data: { active } });
    refresh();
    return { ok: true as const, message: active ? "Akun diaktifkan." : "Akun dinonaktifkan." };
  } catch (error) {
    return fail(error);
  }
}

export async function resetUserPassword(userId: string, password: string) {
  try {
    const actor = await requireUser();
    if (actor.role !== "SUPER_ADMIN") return { ok: false as const, message: "Hanya super admin yang mengelola akun." };
    const parsed = passwordSchema.parse(password);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash: await bcrypt.hash(parsed, 10) } });
    refresh();
    return { ok: true as const, message: "Kata sandi diperbarui." };
  } catch (error) {
    return fail(error);
  }
}

export async function markNotificationRead(id: string) {
  try {
    const actor = await requireUser();
    await prisma.notification.updateMany({ where: { id, userId: actor.id }, data: { read: true } });
    revalidatePath("/notifications");
    return { ok: true as const };
  } catch (error) {
    return fail(error);
  }
}

export async function markAllNotificationsRead() {
  try {
    const actor = await requireUser();
    await prisma.notification.updateMany({ where: { userId: actor.id, read: false }, data: { read: true } });
    revalidatePath("/notifications");
    return { ok: true as const, message: "Semua notifikasi ditandai terbaca." };
  } catch (error) {
    return fail(error);
  }
}
