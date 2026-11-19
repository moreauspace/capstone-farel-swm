"use client";

import { useEffect, useRef } from "react";

export function SignaturePad({ onChange }: { onChange: (value: string) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }, []);

  function ctxOf() {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return null;
    ctx.strokeStyle = "#1c2430";
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    return { canvas, ctx };
  }

  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  return (
    <div>
      <canvas
        ref={ref}
        className="h-36 w-full touch-none rounded-[6px] border border-[#e6dccb] bg-[#fffdf8]"
        onPointerDown={(event) => {
          const pack = ctxOf();
          if (!pack) return;
          drawing.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          const p = point(event);
          pack.ctx.beginPath();
          pack.ctx.moveTo(p.x, p.y);
        }}
        onPointerMove={(event) => {
          if (!drawing.current) return;
          const pack = ctxOf();
          if (!pack) return;
          const p = point(event);
          pack.ctx.lineTo(p.x, p.y);
          pack.ctx.stroke();
        }}
        onPointerUp={(event) => {
          drawing.current = false;
          const canvas = ref.current;
          if (canvas) onChange(canvas.toDataURL("image/png"));
          event.currentTarget.releasePointerCapture(event.pointerId);
        }}
      />
      <button
        type="button"
        className="mt-1 text-[12px] text-muted"
        onClick={() => {
          const pack = ctxOf();
          if (!pack) return;
          pack.ctx.clearRect(0, 0, pack.canvas.width, pack.canvas.height);
          onChange("");
        }}
      >
        Hapus tanda tangan
      </button>
    </div>
  );
}
