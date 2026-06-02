"use client";
import { useState, useEffect } from "react";

interface Props {
  title: string;
  icon?: string;
  defaultOpen?: boolean;
  forceOpen?: boolean;
  children: React.ReactNode;
}

export default function SectionShell({ title, icon, defaultOpen = false, forceOpen, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (forceOpen !== undefined) setOpen(forceOpen);
  }, [forceOpen]);

  return (
    <div style={{
      background: "linear-gradient(180deg, var(--surface) 0%, var(--bg-2) 100%)",
      border: "1px solid var(--border)",
      borderRadius: "14px",
      overflow: "hidden",
      boxShadow: "inset 0 1px 0 color-mix(in oklch, var(--text) 4%, transparent)",
    }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "14px 20px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          borderBottom: open ? "1px solid var(--border)" : "none",
        }}
      >
        <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-mute)", display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "4px", height: "4px", borderRadius: "50%", background: "var(--accent)", display: "inline-block", flexShrink: 0 }} />
          {icon && <span>{icon}</span>}
          {title}
        </span>
        <span style={{ marginLeft: "auto", color: "var(--text-mute)", fontSize: "12px", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>
          ▾
        </span>
      </button>
      {open && (
        <div style={{ padding: "20px" }}>
          {children}
        </div>
      )}
    </div>
  );
}
