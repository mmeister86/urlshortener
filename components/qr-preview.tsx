"use client";

import React, { useRef } from "react";
import { useQRCode } from "next-qrcode";
import { Button } from "@/components/ui/button";

interface QrPreviewProps {
  text: string;
  size?: number;
  filenameBase?: string;
  className?: string;
  showButtons?: boolean;
}

export default function QrPreview({
  text,
  size = 200,
  filenameBase = "qr",
  className = "",
  showButtons = true,
}: QrPreviewProps) {
  const { Canvas } = useQRCode();
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Ensure we encode a full absolute URL if possible
  const normalizeText = (() => {
    try {
      if (!text) return text;
      if (/^https?:\/\//i.test(text)) return text;
      // If text looks like a path, prepend NEXT_PUBLIC_BASE_URL or window origin
      const base =
        (process.env.NEXT_PUBLIC_BASE_URL as string) ||
        (typeof window !== "undefined" ? window.location.origin : "");
      if (!base) return text;
      if (text.startsWith("/")) return `${base}${text}`;
      return `${base}/${text}`;
    } catch {
      return text;
    }
  })();

  const downloadPng = () => {
    const canvas = containerRef.current?.querySelector(
      "canvas"
    ) as HTMLCanvasElement | null;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `${filenameBase}.png`;
    a.click();
  };

  const downloadSvg = () => {
    const svg = containerRef.current?.querySelector("svg") as SVGElement | null;
    if (!svg) return;
    const serializer = new XMLSerializer();
    let svgStr = serializer.serializeToString(svg);
    // Ensure xmlns is present for standalone SVG files
    if (!/xmlns=/.test(svgStr)) {
      svgStr = svgStr.replace(
        /<svg(\s|>)/,
        '<svg xmlns="http://www.w3.org/2000/svg"$1'
      );
    }
    const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filenameBase}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className={`flex flex-col items-center ${className}`}
      ref={containerRef}
    >
      <div>
        <Canvas
          text={normalizeText}
          options={{
            width: size,
            margin: 3,
            scale: 4,
            color: { dark: "#000000ff", light: "#ffffffff" },
          }}
        />
      </div>

      {showButtons && (
        <div className="flex gap-2 mt-2">
          <Button size="sm" variant="outline" onClick={downloadPng}>
            PNG
          </Button>
          <Button size="sm" variant="outline" onClick={downloadSvg}>
            SVG
          </Button>
        </div>
      )}
    </div>
  );
}
