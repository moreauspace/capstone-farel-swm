"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/field";
import { PRODUCTS } from "@/lib/catalog";
import { createProject } from "@/server/actions";

export function NewProjectForm({
  customers,
}: {
  customers: { id: string; companyName: string; contactName: string }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [mode, setMode] = useState<"existing" | "new">(customers.length ? "existing" : "new");
  const [productId, setProductId] = useState(PRODUCTS[0].id);
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const product = useMemo(() => PRODUCTS.find((item) => item.id === productId) ?? PRODUCTS[0], [productId]);
  const customer = customers.find((item) => item.id === customerId);
  const [title, setTitle] = useState(`${product.name}`);
  const [spec, setSpec] = useState(product.spec);
  const [touched, setTouched] = useState(false);

  function applyProduct(id: string) {
    const next = PRODUCTS.find((item) => item.id === id) ?? PRODUCTS[0];
    setProductId(id);
    setSpec(next.spec);
    if (!touched) setTitle(customer ? `${next.name} · ${customer.companyName}` : next.name);
  }

  function submit(submitToDirector: boolean, form: HTMLFormElement) {
    const data = new FormData(form);
    start(async () => {
      const result = await createProject({
        customerId: mode === "existing" ? customerId : undefined,
        newCustomer:
          mode === "new"
            ? {
                companyName: String(data.get("companyName") ?? ""),
                contactName: String(data.get("contactName") ?? ""),
                email: String(data.get("email") ?? ""),
                phone: String(data.get("phone") ?? ""),
                address: String(data.get("address") ?? ""),
              }
            : undefined,
        productId,
        title: String(data.get("title") ?? ""),
        location: String(data.get("location") ?? ""),
        units: Number(data.get("units") ?? 1),
        deadline: String(data.get("deadline") ?? ""),
        poNumber: String(data.get("poNumber") ?? ""),
        specification: String(data.get("specification") ?? ""),
        description: String(data.get("description") ?? ""),
        submit: submitToDirector,
      });
      if (!result.ok) toast.error(result.message);
      else {
        toast.success(result.message);
        router.push(`/projects/${result.id}`);
        router.refresh();
      }
    });
  }

  return (
    <form
      className="panel grid gap-4 p-4 md:grid-cols-2"
      onSubmit={(event) => {
        event.preventDefault();
        submit(false, event.currentTarget);
      }}
    >
      <div className="md:col-span-2 flex gap-2">
        <button type="button" className={`rounded-full px-3 py-1 text-sm ${mode === "existing" ? "bg-navy text-white dark:bg-[#d7e6f4] dark:text-[#102433]" : "text-muted"}`} onClick={() => setMode("existing")}>
          Pelanggan tersimpan
        </button>
        <button type="button" className={`rounded-full px-3 py-1 text-sm ${mode === "new" ? "bg-navy text-white dark:bg-[#d7e6f4] dark:text-[#102433]" : "text-muted"}`} onClick={() => setMode("new")}>
          Pelanggan baru
        </button>
      </div>
      {mode === "existing" ? (
        <div className="md:col-span-2">
          <Label htmlFor="customer">Instansi</Label>
          <Select
            id="customer"
            value={customerId}
            onChange={(event) => {
              setCustomerId(event.target.value);
              const next = customers.find((item) => item.id === event.target.value);
              if (!touched && next) setTitle(`${product.name} · ${next.companyName}`);
            }}
          >
            {customers.map((item) => (
              <option key={item.id} value={item.id}>{item.companyName} · {item.contactName}</option>
            ))}
          </Select>
        </div>
      ) : (
        <>
          <div>
            <Label htmlFor="company">Nama instansi</Label>
            <Input id="company" name="companyName" required={mode === "new"} />
          </div>
          <div>
            <Label htmlFor="contact">Nama kontak</Label>
            <Input id="contact" name="contactName" required={mode === "new"} />
          </div>
          <div>
            <Label htmlFor="mail">Email</Label>
            <Input id="mail" name="email" type="email" required={mode === "new"} />
          </div>
          <div>
            <Label htmlFor="phone">Telepon</Label>
            <Input id="phone" name="phone" />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="address">Alamat</Label>
            <Input id="address" name="address" />
          </div>
        </>
      )}
      <div>
        <Label htmlFor="product">Produk</Label>
        <Select id="product" value={productId} onChange={(event) => applyProduct(event.target.value)}>
          {PRODUCTS.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </Select>
      </div>
      <div>
        <Label htmlFor="units">Jumlah unit</Label>
        <Input id="units" name="units" type="number" min={1} max={500} defaultValue={8} required />
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="title">Judul proyek</Label>
        <Input id="title" name="title" value={title} onChange={(event) => { setTouched(true); setTitle(event.target.value); }} required />
      </div>
      <div>
        <Label htmlFor="po">Nomor PO</Label>
        <Input id="po" name="poNumber" required placeholder="PO-RS-0142" />
      </div>
      <div>
        <Label htmlFor="deadline">Tenggat</Label>
        <Input id="deadline" name="deadline" type="date" required />
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="location">Lokasi pemasangan</Label>
        <Input id="location" name="location" required placeholder="Ruang radiologi, lantai 2" />
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="spec">Spesifikasi</Label>
        <Textarea id="spec" name="specification" value={spec} onChange={(event) => setSpec(event.target.value)} required />
      </div>
      <div className="md:col-span-2">
        <Label htmlFor="desc">Kebutuhan proyek</Label>
        <Textarea id="desc" name="description" required placeholder="Jumlah daun, arah bukaan, akses lokasi, dan catatan survey." />
      </div>
      <div className="md:col-span-2 flex flex-wrap gap-2">
        <Button type="submit" variant="secondary" disabled={pending}>Simpan draft</Button>
        <Button
          type="button"
          disabled={pending}
          onClick={(event) => {
            const form = event.currentTarget.form;
            if (!form?.reportValidity()) return;
            submit(true, form);
          }}
        >
          {pending ? "Menyimpan…" : "Ajukan rencana ke direktur"}
        </Button>
      </div>
    </form>
  );
}
