"use client";
import { useMemo } from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import type { SheetData } from "@/lib/sheets";

interface Props { data: SheetData }

const PALETTE = ["#3b82f6","#10b981","#f59e0b","#8b5cf6","#ef4444","#06b6d4","#ec4899","#84cc16"];

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1e293b", border: "1px solid rgba(148,163,184,0.15)", borderRadius: "8px", padding: "10px 14px" }}>
      <p style={{ color: "#f8fafc", fontSize: "13px", fontWeight: 600 }}>{payload[0].name}</p>
      <p style={{ color: "#94a3b8", fontSize: "12px" }}>{payload[0].value}건</p>
    </div>
  );
};

function HorizontalBar({ col, rows, color }: { col: { key: string; header: string }; rows: Record<string, string>[]; color?: string }) {
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    rows.forEach((r) => { const v = r[col.key] || "(없음)"; map[v] = (map[v] || 0) + 1; });
    return Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, 8);
  }, [rows, col]);
  const max = counts[0]?.[1] || 1;
  const total = counts.reduce((s, [, v]) => s + v, 0);

  return (
    <div>
      <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-3)", marginBottom: "14px" }}>{col.header}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {counts.map(([name, value], i) => (
          <div key={name}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: "12px", color: "var(--text-2)", maxWidth: "160px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "11px", color: "var(--text-4)" }}>{Math.round(value / total * 100)}%</span>
                <span className="mono" style={{ fontSize: "12px", color: "var(--text-3)", minWidth: "24px", textAlign: "right" }}>{value}</span>
              </div>
            </div>
            <div style={{ height: "5px", borderRadius: "3px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: "3px",
                width: `${(value / max) * 100}%`,
                background: color || PALETTE[i % PALETTE.length],
                transition: "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DonutChart({ col, rows }: { col: { key: string; header: string }; rows: Record<string, string>[] }) {
  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    rows.forEach((r) => { const v = r[col.key] || "(없음)"; map[v] = (map[v] || 0) + 1; });
    return Object.entries(map).sort(([, a], [, b]) => b - a).slice(0, 6).map(([name, value]) => ({ name, value }));
  }, [rows, col]);

  return (
    <div>
      <p style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-3)", marginBottom: "14px" }}>{col.header}</p>
      <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
        <div style={{ width: "100px", height: "100px", flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={counts} cx="50%" cy="50%" innerRadius={28} outerRadius={46} paddingAngle={3} dataKey="value" stroke="none">
                {counts.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px" }}>
          {counts.map(({ name, value }, i) => (
            <div key={name} style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "2px", background: PALETTE[i % PALETTE.length], flexShrink: 0 }} />
              <span style={{ fontSize: "11px", color: "var(--text-3)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
              <span className="mono" style={{ fontSize: "11px", color: "var(--text-4)" }}>{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function CategorySection({ data }: Props) {
  const { columns, rows } = data;
  const catCols = columns.filter((c) => c.role === "category" || c.role === "status");

  // 분류, 처리상태 → donut (max 2), 나머지 → horizontal bar
  const donutCols = catCols.filter((c) => /^분류$|처리상태/i.test(c.header)).slice(0, 2);
  const barCols   = catCols.filter((c) => !donutCols.includes(c));

  if (catCols.length === 0) return <p style={{ color: "var(--text-4)", fontSize: "13px" }}>카테고리 컬럼 없음</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Donuts — max 2 */}
      {donutCols.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "24px" }}>
          {donutCols.map((col) => <DonutChart key={col.key} col={col} rows={rows} />)}
        </div>
      )}

      {/* Horizontal bars */}
      {barCols.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "28px" }}>
          {barCols.map((col, i) => (
            <HorizontalBar key={col.key} col={col} rows={rows} color={PALETTE[(i + 2) % PALETTE.length]} />
          ))}
        </div>
      )}
    </div>
  );
}
