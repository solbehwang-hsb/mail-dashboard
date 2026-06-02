"use client";
import type { SheetData } from "@/lib/sheets";

interface Props { data: SheetData }

function StatusPill({ value }: { value: string }) {
  const map: Record<string, string> = {
    "조치필요": "var(--accent-2)",
    "신규(대기)": "var(--accent-4)",
    "회신완료": "var(--accent)",
    "자동분류": "var(--text-mute)",
    "검토필요": "var(--accent-4)",
    "지연": "var(--accent-2)",
    "미회신": "var(--accent-2)",
    "생성됨": "var(--accent)",
  };
  const color = Object.entries(map).find(([k]) => value.includes(k))?.[1] || "var(--text-mute)";
  if (!value || value === "—") return null;
  return (
    <span style={{
      borderRadius: "999px",
      padding: "2px 8px",
      fontSize: "11px",
      background: `color-mix(in oklch, ${color} 15%, transparent)`,
      border: `1px solid color-mix(in oklch, ${color} 25%, transparent)`,
      color,
    }}>
      {value}
    </span>
  );
}

export default function ReviewCards({ data }: Props) {
  const { columns, rows } = data;

  const reviewCol = columns.find((c) => /검토필요/i.test(c.header));
  const longCol = columns.find((c) => c.role === "longtext");
  const statusCol = columns.find((c) => /처리상태/i.test(c.header));
  const senderCol = columns.find((c) => c.role === "email");
  const urlCol = columns.find((c) => c.role === "url");
  const idCol = columns.find((c) => /티켓|id/i.test(c.header) && c.role === "freetext");

  const reviewRows = reviewCol
    ? rows.filter((r) => r[reviewCol.key] === "검토필요")
    : rows.filter((r) => {
        if (statusCol) return /조치필요|신규.*대기/.test(r[statusCol.key]);
        return false;
      });

  if (reviewRows.length === 0) return (
    <p style={{ color: "var(--text-mute)", fontSize: "13px" }}>검토 필요 항목이 없습니다.</p>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {reviewRows.map((row, i) => {
        const id = idCol ? row[idCol.key] : String(i);
        const sender = senderCol ? row[senderCol.key] : "";
        const status = statusCol ? row[statusCol.key] : "";
        const text = longCol ? row[longCol.key] : "";
        const url = urlCol ? row[urlCol.key] : "";

        return (
          <div key={id} style={{
            background: "linear-gradient(180deg, var(--surface) 0%, var(--bg-2) 100%)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            boxShadow: "inset 0 1px 0 color-mix(in oklch, var(--text) 4%, transparent)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
              <span className="mono" style={{ fontSize: "11px", color: "var(--text-mute)" }}>{id}</span>
              {status && <StatusPill value={status} />}
            </div>
            {sender && (
              <div style={{ fontSize: "12px", color: "var(--text-dim)" }}>{sender}</div>
            )}
            {text && (
              <p style={{
                fontSize: "13px",
                color: "var(--text)",
                lineHeight: 1.6,
                display: "-webkit-box",
                WebkitLineClamp: 3,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}>
                {text}
              </p>
            )}
            {url && url !== "—" && (
              <a href={url} target="_blank" rel="noopener noreferrer" style={{
                fontSize: "11px",
                color: "var(--accent-3)",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}>
                ↗ Gmail에서 열기
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}
