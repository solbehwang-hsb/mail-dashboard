"use client";
import { useMemo } from "react";
import type { SheetData } from "@/lib/sheets";

interface Props { data: SheetData }

export default function EmailSection({ data }: Props) {
  const { columns, rows } = data;
  const emailCol = columns.find((c) => c.role === "email");
  if (!emailCol) return null;

  const { senders, domains } = useMemo(() => {
    const sMap: Record<string, number> = {};
    const dMap: Record<string, number> = {};
    rows.forEach((r) => {
      const raw = r[emailCol.key] || "";
      const match = raw.match(/<([^>]+)>/);
      const addr = match ? match[1] : raw;
      const name = raw.replace(/<[^>]+>/, "").trim() || addr;
      if (addr.includes("@")) {
        sMap[name || addr] = (sMap[name || addr] || 0) + 1;
        const domain = addr.split("@")[1];
        if (domain) dMap[domain] = (dMap[domain] || 0) + 1;
      }
    });
    return {
      senders: Object.entries(sMap).sort(([, a], [, b]) => b - a).slice(0, 8),
      domains: Object.entries(dMap).sort(([, a], [, b]) => b - a).slice(0, 6),
    };
  }, [rows, emailCol]);

  const maxSender = senders[0]?.[1] || 1;
  const maxDomain = domains[0]?.[1] || 1;

  const COLORS = ["#3b82f6","#8b5cf6","#10b981","#f59e0b","#ef4444","#06b6d4","#ec4899","#84cc16"];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
      {/* Top Senders */}
      <div>
        <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-3)", marginBottom: "16px" }}>
          Top 발신자
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {senders.map(([name, count], i) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span className="mono" style={{ fontSize: "10px", color: "var(--text-4)", width: "14px", textAlign: "right", flexShrink: 0 }}>{i + 1}</span>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ fontSize: "12px", color: "var(--text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "160px" }}>{name}</span>
                  <span className="mono" style={{ fontSize: "12px", color: "var(--text-3)" }}>{count}</span>
                </div>
                <div style={{ height: "4px", borderRadius: "2px", background: "rgba(255,255,255,0.06)" }}>
                  <div style={{
                    height: "100%", borderRadius: "2px",
                    width: `${(count / maxSender) * 100}%`,
                    background: COLORS[i % COLORS.length],
                    transition: "width 0.5s ease",
                  }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Domains */}
      <div>
        <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-3)", marginBottom: "16px" }}>
          Top 도메인
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {domains.map(([name, count], i) => {
            const pct = Math.round((count / rows.length) * 100);
            return (
              <div key={name} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                padding: "10px 14px",
                transition: "background 0.15s",
              }}
                onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.06)")}
                onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                  <span style={{ fontSize: "13px", color: "var(--text-2)", fontWeight: 500 }}>{name}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-4)", background: "rgba(255,255,255,0.04)", padding: "2px 7px", borderRadius: "999px" }}>{pct}%</span>
                  <span className="mono" style={{ fontSize: "12px", color: "var(--text-3)", minWidth: "20px", textAlign: "right" }}>{count}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
