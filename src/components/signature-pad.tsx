"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

type SignaturePadProps = {
  width?: number;
  height?: number;
  className?: string;
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
};

export function SignaturePad({
  width = 320,
  height = 160,
  className,
  onSave,
  onCancel,
}: SignaturePadProps) {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const drawing = React.useRef(false);
  const last = React.useRef<{ x: number; y: number } | null>(null);
  const [dims, setDims] = React.useState({ w: width, h: height });

  React.useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const cw = Math.round(el.clientWidth);
      const w = Math.min(560, Math.max(260, cw > 0 ? cw : width));
      const h = Math.round((w * height) / width);
      setDims((d) => (d.w === w && d.h === h ? d : { w, h }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, height]);

  const getCtx = () => canvasRef.current?.getContext("2d");

  const pos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drawing.current = true;
    last.current = pos(e);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || !last.current) return;
    const ctx = getCtx();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;
    const p = pos(e);
    ctx.strokeStyle = "#312e81";
    ctx.lineWidth = 2.25;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last.current = p;
  };

  const end = () => {
    drawing.current = false;
    last.current = null;
  };

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.fillStyle = "#fafaff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#c7d2fe";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);
  }, [dims.w, dims.h]);

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    ctx.fillStyle = "#fafaff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#c7d2fe";
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1);
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    onSave(dataUrl);
  };

  return (
    <div className={className}>
      <div
        ref={wrapRef}
        className="w-full min-w-0 max-w-full touch-none rounded-xl bg-gradient-to-br from-indigo-400 via-violet-500 to-fuchsia-500 p-px shadow-lg shadow-indigo-500/20 dark:from-indigo-500 dark:via-violet-600 dark:to-fuchsia-600 dark:shadow-violet-950/50"
      >
        <canvas
          ref={canvasRef}
          width={dims.w}
          height={dims.h}
          className="h-auto w-full max-w-full cursor-crosshair rounded-[11px] bg-[#fafaff] dark:bg-zinc-950"
          onPointerDown={start}
          onPointerMove={draw}
          onPointerUp={end}
          onPointerLeave={end}
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={clear}>
          Effacer
        </Button>
        <Button type="button" size="sm" className="btn-gradient" onClick={save}>
          Enregistrer la signature
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          Annuler
        </Button>
      </div>
    </div>
  );
}
