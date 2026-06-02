"use client";
import { useState, useMemo } from "react";
import type { SheetData } from "@/lib/sheets";

interface Props { data: SheetData }

const STATUS_COLORS: [RegExp, string][] = [
  [/조치필요/,       "#ef4444"],
  [/신규.*대기/,     "#f59e0b"],
  [/회신완료/,       "#10b981"],
  [/자동분류/,       "#64748b"],
  [/지연/,           "#ef4444"],
  [/미회신/,         "#f59e0b"],
  [/생성됨/,         "#3b82f6"],
  [/긍정/,           "#10b981"],
  [/부정/,           "#ef4444"],
  [/중립/,           "#64748b"],
  [/외부고객/,       "#3b82f6"],
  [/자동.*마케팅/,   "#64748b"],
  [/내부/,           "#8b5cf6"],
  [/검토필요/,       "#f59e0b"],
];

function Pill({ value }: { value: string }) {
  const color = STATUS_COLORS.find(([r]) => r.test(value))?.[1];
  if (!color) return <span style={{ color: "var(--text-3)", fontSize: "12px" }}>{value || "—"}</span>;
  return (
    <span style={{
      borderRadius: "999px", padding: "2px 9px",
      fontSize: "11px", fontWeight: 500,
      color, background: `${color}15`,
      border: `1px solid ${color}25`,
      whiteSpace: "nowrap",
    }}>{value}</span>
  );
}

const PILL_COLS   = /상태|여부|감정|지연|검토|유형|분류|담당|언어|draft/i;
const URL_COLS    = /링크|url/i;
const SKIP_COLS   = /gmail링크/i;

export default function DataTable({ data }: Props) {
  const { columns, rows } = data;
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const PAGE_SIZE = 15;

  const visibleCols = columns.filter((c) => !SKIP_COLS.test(c.header) && c.role !== "longtext" && c.role !== "url");
  const urlCol      = columns.find((c) => c.role === "url");
  const statusCol   = columns.find((c) => /처리상태/i.test(c.header));

  const statusOptions = useMemo(() => {
    if (!statusCol) return [];
    const opts = new Set(rows.map((r) => r[statusCol.key]).filter(Boolean));
    return Array.from(opts);
  }, [rows, statusCol]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return rows.filter((r) => {
      const matchSearch = !q || Object.values(r).some((v) => v.toLowerCase().includes(q));
      const matchStatus = filterStatus === "all" || (statusCol && r[statusCol.key] === filterStatus);
      return matchSearch && matchStatus;
    });
  }, [rows, search, filterStatus, statusCol]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] || "", bv = b[sortKey] || "";
      const numA = Number(av), numB = Number(bv);
      const cmp = (!isNaN(numA) && !isNaN(numB)) ? numA - numB : av.localeCompare(bv, "ko");
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);

  function handleSort(key: string) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
    setPage(0);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 200px" }}>
          <span style={{ position: "absolute", left: "11px", top: "50%", transform: "translateY(-50%)", color: "var(--text-4)", fontSize: "13px" }}>🔍</span>
          <input
            type="text"
            placeholder="검색..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            style={{
              width: "100%",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              padding: "8px 14px 8px 34px",
              color: "var(--text)",
              fontSize: "13px",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "rgba(59,130,246,0.4)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
          />
        </div>
        {statusCol && (
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(0); }}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              padding: "8px 12px",
              color: "var(--text-2)",
              fontSize: "12px",
              cursor: "pointer",
            }}
          >
            <option value="all">전체 상태</option>
            {statusOptions.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        <span style={{ fontSize: "12px", color: "var(--text-4)", whiteSpace: "nowrap", marginLeft: "auto" }}>
          {sorted.length}건 / {rows.length}건
        </span>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto", borderRadius: "var(--radius)", border: "1px solid var(--border)", background: "rgba(15,23,42,0.4)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {urlCol && <th style={{ padding: "11px 14px", color: "var(--text-4)", textAlign: "left", whiteSpace: "nowrap", fontWeight: 500, width: "40px" }}>↗</th>}
              {visibleCols.map((col) => (
                <th key={col.key} onClick={() => handleSort(col.key)}
                  style={{ padding: "11px 14px", color: "var(--text-4)", textAlign: "left", whiteSpace: "nowrap", fontWeight: 500, cursor: "pointer", userSelect: "none", fontSize: "11px", letterSpacing: "0.02em" }}>
                  {col.header}{sortKey === col.key && (sortDir === "asc" ? " ↑" : " ↓")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => (
              <tr key={i}
                style={{ borderBottom: "1px solid rgba(148,163,184,0.05)", transition: "background 0.1s", cursor: "default" }}
                onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
                onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {urlCol && (
                  <td style={{ padding: "10px 14px" }}>
                    {row[urlCol.key] && row[urlCol.key] !== "—" ? (
                      <a href={row[urlCol.key]} target="_blank" rel="noopener noreferrer"
                        style={{ color: "var(--blue)", fontSize: "13px", opacity: 0.8, transition: "opacity 0.15s" }}
                        onMouseOver={(e) => ((e.target as HTMLElement).style.opacity = "1")}
                        onMouseOut={(e) => ((e.target as HTMLElement).style.opacity = "0.8")}>↗</a>
                    ) : <span style={{ color: "var(--text-4)" }}>—</span>}
                  </td>
                )}
                {visibleCols.map((col) => {
                  const val = row[col.key] || "";
                  return (
                    <td key={col.key} style={{ padding: "10px 14px", color: "var(--text-3)", whiteSpace: "nowrap", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {PILL_COLS.test(col.header) && val
                        ? <Pill value={val} />
                        : URL_COLS.test(col.header) && val && val !== "—"
                          ? <a href={val} target="_blank" rel="noopener noreferrer" style={{ color: "var(--blue)" }}>↗</a>
                          : val || <span style={{ color: "var(--text-4)" }}>—</span>}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: "center" }}>
          <button onClick={() => setPage(0)} disabled={page === 0}
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: "6px", padding: "5px 10px", color: "var(--text-4)", cursor: page === 0 ? "default" : "pointer", fontSize: "11px", opacity: page === 0 ? 0.4 : 1 }}>«</button>
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: "6px", padding: "5px 12px", color: "var(--text-3)", cursor: page === 0 ? "default" : "pointer", fontSize: "12px", opacity: page === 0 ? 0.4 : 1 }}>‹</button>
          <span style={{ fontSize: "12px", color: "var(--text-4)", padding: "0 8px" }}>{page + 1} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: "6px", padding: "5px 12px", color: "var(--text-3)", cursor: page === totalPages - 1 ? "default" : "pointer", fontSize: "12px", opacity: page === totalPages - 1 ? 0.4 : 1 }}>›</button>
          <button onClick={() => setPage(totalPages - 1)} disabled={page === totalPages - 1}
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: "6px", padding: "5px 10px", color: "var(--text-4)", cursor: page === totalPages - 1 ? "default" : "pointer", fontSize: "11px", opacity: page === totalPages - 1 ? 0.4 : 1 }}>»</button>
        </div>
      )}
    </div>
  );
}
