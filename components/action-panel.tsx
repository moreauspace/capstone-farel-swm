"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/field";
import { SignaturePad } from "@/components/signature-pad";
import { performWorkflowAction } from "@/server/actions";
import type { ActionDef } from "@/lib/types";

export function ActionPanel({
  projectId,
  actions,
  stage,
}: {
  projectId: string;
  actions: ActionDef[];
  stage: { headline: string; owner: string };
}) {
  return (
    <aside className="panel p-4">
      <p className="text-[12px] uppercase tracking-[0.14em] text-muted">Tindakan peran Anda</p>
      <h2 className="mt-1 text-lg leading-snug">{stage.headline}</h2>
      <p className="mt-1 text-[13px] text-muted">Meja saat ini: {stage.owner}</p>
      <div className="mt-4 space-y-3">
        {actions.length === 0 ? (
          <p className="text-sm leading-6 text-muted">Tidak ada tindakan untuk peran Anda pada tahap ini.</p>
        ) : (
          actions.map((action) => <ActionCard key={action.id} projectId={projectId} action={action} />)
        )}
      </div>
    </aside>
  );
}

function ActionCard({ projectId, action }: { projectId: string; action: ActionDef }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [values, setValues] = useState<Record<string, string>>({});
  const [fileName, setFileName] = useState("");

  function set(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  return (
    <form
      className="rounded-card border border-line p-3"
      onSubmit={(event) => {
        event.preventDefault();
        for (const field of action.fields) {
          if (field.required && !values[field.name]) {
            toast.error(`${field.label} wajib diisi.`);
            return;
          }
        }
        if (action.id === "CLIENT_SIGN_BAST" && !values.signature && !values.attachment) {
          toast.error("Bubuhkan tanda tangan atau unggah pindaian.");
          return;
        }
        start(async () => {
          const result = await performWorkflowAction({ projectId, action: action.id, payload: values });
          if (!result.ok) toast.error(result.message);
          else {
            toast.success(result.message);
            setValues({});
            router.refresh();
          }
        });
      }}
    >
      <h3 className="text-sm font-medium">{action.title}</h3>
      <p className="mt-1 text-[13px] leading-5 text-muted">{action.description}</p>
      {action.facts?.length ? (
        <dl className="mt-3 space-y-1 text-[12px]">
          {action.facts.map((fact) => (
            <div key={fact.label} className="flex justify-between gap-3">
              <dt className="text-muted">{fact.label}</dt>
              <dd className="num text-right">{fact.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <div className="mt-3 space-y-3">
        {action.fields.map((field) => (
          <div key={field.name}>
            {field.type !== "confirm" ? <Label htmlFor={`${action.id}-${field.name}`}>{field.label}</Label> : null}
            {field.type === "textarea" ? (
              <Textarea
                id={`${action.id}-${field.name}`}
                required={field.required}
                placeholder={field.placeholder}
                value={values[field.name] ?? ""}
                onChange={(event) => set(field.name, event.target.value)}
              />
            ) : null}
            {field.type === "text" ? (
              <Input
                id={`${action.id}-${field.name}`}
                required={field.required}
                value={values[field.name] ?? ""}
                onChange={(event) => set(field.name, event.target.value)}
              />
            ) : null}
            {field.type === "signature" ? <SignaturePad onChange={(value) => set(field.name, value)} /> : null}
            {field.type === "file" ? (
              <Input
                id={`${action.id}-${field.name}`}
                type="file"
                accept="image/*,application/pdf"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  if (file.size > 1_200_000) {
                    toast.error("Berkas maksimal 1,2 MB.");
                    return;
                  }
                  setFileName(file.name);
                  const reader = new FileReader();
                  reader.onload = () => set(field.name, String(reader.result ?? ""));
                  reader.readAsDataURL(file);
                }}
              />
            ) : null}
            {field.type === "confirm" ? (
              <label className="flex items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={values[field.name] === "yes"}
                  onChange={(event) => set(field.name, event.target.checked ? "yes" : "")}
                />
                {field.label}
              </label>
            ) : null}
            {field.type === "file" && fileName ? <p className="mt-1 text-[12px] text-muted">{fileName}</p> : null}
          </div>
        ))}
      </div>
      <Button
        type="submit"
        className="mt-3 w-full"
        variant={action.tone === "danger" ? "danger" : "primary"}
        disabled={pending}
      >
        {pending ? "Memproses…" : action.title}
      </Button>
    </form>
  );
}
