"use client";
import { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid,
} from "recharts";
import type { SheetData } from "@/lib/sheets";

interface Props { data: SheetData }

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#1e293b", border: "1px solid rgba(148,163,184,0.15)", borderRadius: "8px", padding: "10px 14px" }}>
      <p style={{ color: "#94a3b8", fontSize: "11px", marginBottom: "4px" }}>{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color, fontSize: "13px", fontWeight: 600 }}>
          {p.value}건
        </p>
      ))}
    </div>
  );
};

export default function TimelineSection({ data }: Props) {
  const { columns, rows } = data;
  const dtCol     = columns.find((c) => c.role === "datetime" && /수신/i.test(c.header));
  const statusCol = columns.find((c) => /처리상태/i.test(c.header));

  const dailyData = useMemo(() => {
    if (!dtCol) return [];
    const map: Record<string, { total: number; action: number; done: number }> = {};
    rows.forEach((r) => {
      const d = (r[dtCol.key] || "").slice(0, 10);
      if (!d) return;
      if (!map[d]) map[d] = { total: 0, action: 0, done: 0 };
      map[d].total++;
      const st = statusCol ? r[statusCol.key] : "";
      if (/조치필요|신규.*대기/.test(st)) map[d].action++;
      if (/회신완료/.test(st)) map[d].done++;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date: date.slice(5), ...v }));
  }, [rows, dtCol, statusCol]);

  const heatmap = useMemo(() => {
    const map: Record<string, number> = {};
    if (!dtCol) return map;
    rows.forEach((r) => {
      const raw = r[dtCol.key];
      if (!raw) return;
      const d = new Date(raw);
      const key = `${d.getDay()}-${d.getHours()}`;
      map[key] = (map[key] || 0) + 1;
    });
    return map;
  }, [rows, dtCol]);

  const maxHeat = Math.max(...Object.values(heatmap), 1);
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  if (!dtCol) return <p style={{ color: "var(--text-4)", fontSize: "13px" }}>날짜 컬럼 없음</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
      {/* Stacked Area Chart */}
      <div>
        <p style={{ fontSize: "12px", color: "var(--text-4)", fontWeight: 500, marginBottom: "14px" }}>
          일별 메일 수신량 (처리 현황 포함)
        </p>
        <div style={{ height: "180px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gDone" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gAction" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
              <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="total"  stroke="#3b82f6" strokeWidth={2} fill="url(#gTotal)"  name="전체" />
              <Area type="monotone" dataKey="done"   stroke="#10b981" strokeWidth={1.5} fill="url(#gDone)"   name="회신완료" />
              <Area type="monotone" dataKey="action" stroke="#ef4444" strokeWidth={1.5} fill="url(#gAction)" name="조치필요" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {/* Legend */}
        <div style={{ display: "flex", gap: "16px", marginTop: "10px" }}>
          {[["전체", "#3b82f6"], ["회신완료", "#10b981"], ["조치필요", "#ef4444"]].map(([label, color]) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span style={{ width: "10px", height: "2px", background: color, display: "inline-block", borderRadius: "1px" }} />
              <span style={{ fontSize: "11px", color: "var(--text-4)" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Heatmap */}
      <div>
        <p style={{ fontSize: "12px", color: "var(--text-4)", fontWeight: 500, marginBottom: "14px" }}>
          요일 × 시간대 히트맵
        </p>
        <div style={{ overflowX: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "24px repeat(24, 1fr)", gap: "3px", minWidth: "560px" }}>
            <div />
            {hours.map((h) => (
              <div key={h} style={{ fontSize: "9px", color: "var(--text-4)", textAlign: "center", paddingBottom: "2px" }}>
                {h % 6 === 0 ? `${h}` : ""}
              </div>
            ))}
            {days.map((day, di) => (
              <>
                <div key={`d${di}`} style={{ fontSize: "10px", color: "var(--text-4)", display: "flex", alignItems: "center", justifyContent: "center" }}>{day}</div>
                {hours.map((h) => {
                  const v = heatmap[`${di}-${h}`] || 0;
                  const t = v / maxHeat;
                  return (
                    <div key={`${di}-${h}`}
                      title={`${day} ${h}시 ${v}건`}
                      style={{
                        aspectRatio: "1",
                        borderRadius: "3px",
                        background: v === 0
                          ? "rgba(30,41,59,0.8)"
                          : `rgba(59,130,246,${0.1 + t * 0.8})`,
                        border: "1px solid rgba(148,163,184,0.04)",
                        transition: "transform 0.1s, box-shadow 0.1s",
                        cursor: "default",
                      }}
                      onMouseOver={(e) => {
                        (e.target as HTMLDivElement).style.transform = "scale(1.5)";
                        (e.target as HTMLDivElement).style.boxShadow = "0 0 8px rgba(59,130,246,0.5)";
                        (e.target as HTMLDivElement).style.zIndex = "10";
                      }}
                      onMouseOut={(e) => {
                        (e.target as HTMLDivElement).style.transform = "scale(1)";
                        (e.target as HTMLDivElement).style.boxShadow = "none";
                        (e.target as HTMLDivElement).style.zIndex = "auto";
                      }}
                    />
                  );
                })}
              </>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
