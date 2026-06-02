"use client";
import { useMemo } from "react";
import type { SheetData } from "@/lib/sheets";

interface Props { data: SheetData }

function urgencyScore(row: Record<string, string>, cols: Record<string, string>): number {
  let score = 0;
  if (row[cols.delay] === "지연") score += 40;
  if (/조치필요/.test(row[cols.status])) score += 30;
  if (/신규.*대기/.test(row[cols.status])) score += 20;
  if (row[cols.sentiment] === "부정") score += 20;
  if (row[cols.review] === "검토필요") score += 10;
  const pri = Number(row[cols.priority]);
  if (!isNaN(pri)) score += pri * 2;
  return score;
}

function UrgencyBadge({ score }: { score: number }) {
  const level = score >= 80 ? { label: "긴급", color: "#ef4444", bg: "rgba(239,68,68,0.12)" }
    : score >= 50 ? { label: "높음", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" }
    : { label: "보통", color: "#64748b", bg: "rgba(100,116,139,0.1)" };
  return (
    <span style={{
      borderRadius: "999px", padding: "2px 8px",
      fontSize: "10px", fontWeight: 700, letterSpacing: "0.04em",
      color: level.color, background: level.bg,
      border: `1px solid ${level.color}30`,
    }}>{level.label}</span>
  );
}

function StatusPill({ value }: { value: string }) {
  const map: [RegExp, string][] = [
    [/조치필요/, "#ef4444"],
    [/신규.*대기/, "#f59e0b"],
    [/회신완료/, "#10b981"],
    [/자동분류/, "#64748b"],
  ];
  const color = map.find(([r]) => r.test(value))?.[1] ?? "#64748b";
  return (
    <span style={{
      borderRadius: "999px", padding: "2px 8px", fontSize: "11px",
      color, background: `${color}18`, border: `1px solid ${color}30`,
    }}>{value || "—"}</span>
  );
}

export default function PriorityQueue({ data }: Props) {
  const { columns, rows } = data;

  const colKeys = {
    delay:     columns.find((c) => /^지연$/i.test(c.header))?.key    ?? "",
    status:    columns.find((c) => /처리상태/i.test(c.header))?.key   ?? "",
    sentiment: columns.find((c) => /감정/i.test(c.header))?.key      ?? "",
    review:    columns.find((c) => /검토필요/i.test(c.header))?.key   ?? "",
    priority:  columns.find((c) => /중요도/i.test(c.header))?.key    ?? "",
    sender:    columns.find((c) => c.role === "email")?.key           ?? "",
    id:        columns.find((c) => /티켓/i.test(c.header))?.key       ?? "",
    draft:     columns.find((c) => /draft|초안/i.test(c.header))?.key ?? "",
    url:       columns.find((c) => c.role === "url")?.key             ?? "",
    cat:       columns.find((c) => /^분류$/i.test(c.header))?.key     ?? "",
    dept:      columns.find((c) => /담당부서/i.test(c.header))?.key   ?? "",
  };

  const prioritized = useMemo(() => {
    return [...rows]
      .map((r) => ({ row: r, score: urgencyScore(r, colKeys) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }, [rows, colKeys]);

  if (prioritized.length === 0) return (
    <div style={{ textAlign: "center", padding: "32px", color: "var(--text-4)" }}>
      🎉 긴급 처리가 필요한 메일이 없습니다
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      {prioritized.map(({ row, score }, i) => {
        const sender = row[colKeys.sender] || "";
        const senderName = sender.replace(/<[^>]+>/, "").trim() || sender;
        const senderEmail = (sender.match(/<([^>]+)>/) ?? [])[1] || sender;
        const url = row[colKeys.url];

        return (
          <div
            key={i}
            style={{
              display: "grid",
              gridTemplateColumns: "28px 1fr auto",
              alignItems: "center",
              gap: "14px",
              background: i === 0 ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.025)",
              border: `1px solid ${i === 0 ? "rgba(239,68,68,0.2)" : "var(--border)"}`,
              borderRadius: "var(--radius)",
              padding: "14px 16px",
              transition: "background 0.15s, transform 0.15s",
              cursor: "default",
            }}
            onMouseOver={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.05)";
              (e.currentTarget as HTMLDivElement).style.transform = "translateX(3px)";
            }}
            onMouseOut={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = i === 0 ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.025)";
              (e.currentTarget as HTMLDivElement).style.transform = "none";
            }}
          >
            {/* Rank */}
            <div style={{
              width: "28px", height: "28px", borderRadius: "8px", flexShrink: 0,
              background: i < 3 ? "rgba(239,68,68,0.15)" : "rgba(255,255,255,0.05)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "12px", fontWeight: 700,
              color: i < 3 ? "var(--red)" : "var(--text-4)",
            }}>{i + 1}</div>

            {/* Content */}
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                <UrgencyBadge score={score} />
                {row[colKeys.status] && <StatusPill value={row[colKeys.status]} />}
                {row[colKeys.cat] && (
                  <span style={{ fontSize: "11px", color: "var(--text-4)", background: "rgba(255,255,255,0.04)", padding: "1px 7px", borderRadius: "999px", border: "1px solid var(--border)" }}>
                    {row[colKeys.cat]}
                  </span>
                )}
              </div>
              <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {senderName}
                {senderEmail && senderName !== senderEmail && (
                  <span style={{ color: "var(--text-4)", fontSize: "11px", marginLeft: "6px" }}>{senderEmail}</span>
                )}
              </p>
              {row[colKeys.dept] && (
                <p style={{ fontSize: "11px", color: "var(--text-4)", marginTop: "2px" }}>{row[colKeys.dept]}</p>
              )}
            </div>

            {/* Right */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px", flexShrink: 0 }}>
              <span className="mono" style={{ fontSize: "11px", color: "var(--text-4)", background: "rgba(255,255,255,0.04)", padding: "2px 8px", borderRadius: "6px" }}>
                #{(row[colKeys.id] || String(i)).slice(0, 8)}
              </span>
              {url && url !== "—" && (
                <a href={url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: "11px", color: "var(--blue)", display: "flex", alignItems: "center", gap: "3px" }}
                  onClick={(e) => e.stopPropagation()}>
                  열기 ↗
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
