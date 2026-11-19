"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/field";
import { Modal } from "@/components/ui/modal";
import { ROLE_META } from "@/lib/labels";
import { ROLES } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { createUser, resetUserPassword, setUserActive } from "@/server/actions";

type Row = {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  phone: string | null;
  active: boolean;
  customer: string | null;
  createdAt: string;
};

export function UserManager({
  users,
  customers,
  selfId,
}: {
  users: Row[];
  customers: { id: string; companyName: string }[];
  selfId: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [resetId, setResetId] = useState<string | null>(null);
  const [role, setRole] = useState("ADMIN_PROYEK");
  const [pending, start] = useTransition();

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button type="button" onClick={() => setOpen(true)}>Akun baru</Button>
      </div>
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="text-[12px] text-muted">
            <tr>
              <th className="px-3 py-3 font-medium">Nama</th>
              <th className="px-3 py-3 font-medium">Peran</th>
              <th className="px-3 py-3 font-medium">Status</th>
              <th className="px-3 py-3 font-medium">Sejak</th>
              <th className="px-3 py-3 font-medium"> </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-line">
                <td className="px-3 py-3">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-[12px] text-muted">{user.email}</div>
                </td>
                <td className="px-3 py-3">
                  <div>{ROLE_META[user.role]?.label ?? user.role}</div>
                  <div className="text-[12px] text-muted">{user.customer ?? user.department}</div>
                </td>
                <td className="px-3 py-3">{user.active ? "Aktif" : "Nonaktif"}</td>
                <td className="px-3 py-3">{formatDate(user.createdAt)}</td>
                <td className="px-3 py-3 text-right">
                  <button type="button" className="mr-3 text-[13px] text-copper" onClick={() => setResetId(user.id)}>Sandi</button>
                  {user.id !== selfId ? (
                    <button
                      type="button"
                      className="text-[13px] text-muted"
                      onClick={() => {
                        start(async () => {
                          const result = await setUserActive(user.id, !user.active);
                          if (!result.ok) toast.error(result.message);
                          else {
                            toast.success(result.message);
                            router.refresh();
                          }
                        });
                      }}
                    >
                      {user.active ? "Nonaktifkan" : "Aktifkan"}
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={open} onOpenChange={setOpen} title="Akun baru">
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            start(async () => {
              const result = await createUser({
                name: String(data.get("name") ?? ""),
                email: String(data.get("email") ?? ""),
                role: String(data.get("role") ?? role) as (typeof ROLES)[number],
                phone: String(data.get("phone") ?? ""),
                password: String(data.get("password") ?? ""),
                customerId: String(data.get("customerId") ?? "") || undefined,
              });
              if (!result.ok) toast.error(result.message);
              else {
                toast.success(result.message);
                setOpen(false);
                router.refresh();
              }
            });
          }}
        >
          <div>
            <Label htmlFor="name">Nama</Label>
            <Input id="name" name="name" required />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div>
            <Label htmlFor="role">Peran</Label>
            <Select id="role" name="role" value={role} onChange={(event) => setRole(event.target.value)}>
              {ROLES.map((item) => (
                <option key={item} value={item}>{ROLE_META[item].label}</option>
              ))}
            </Select>
          </div>
          {role === "PELANGGAN" ? (
            <div>
              <Label htmlFor="customerId">Instansi</Label>
              <Select id="customerId" name="customerId" required>
                <option value="">Pilih</option>
                {customers.map((item) => (
                  <option key={item.id} value={item.id}>{item.companyName}</option>
                ))}
              </Select>
            </div>
          ) : null}
          <div>
            <Label htmlFor="phone">Telepon</Label>
            <Input id="phone" name="phone" />
          </div>
          <div>
            <Label htmlFor="password">Kata sandi awal</Label>
            <Input id="password" name="password" type="text" required minLength={8} />
          </div>
          <Button type="submit" disabled={pending}>{pending ? "Menyimpan…" : "Buat akun"}</Button>
        </form>
      </Modal>
      <Modal open={Boolean(resetId)} onOpenChange={(next) => !next && setResetId(null)} title="Kata sandi baru">
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const password = String(new FormData(event.currentTarget).get("password") ?? "");
            if (!resetId) return;
            start(async () => {
              const result = await resetUserPassword(resetId, password);
              if (!result.ok) toast.error(result.message);
              else {
                toast.success(result.message);
                setResetId(null);
              }
            });
          }}
        >
          <div>
            <Label htmlFor="next">Kata sandi</Label>
            <Input id="next" name="password" type="text" required />
          </div>
          <Button type="submit" disabled={pending}>Simpan</Button>
        </form>
      </Modal>
    </div>
  );
}
