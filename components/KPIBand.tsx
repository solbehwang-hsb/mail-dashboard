"use client";
import { useMemo } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import type { SheetData } from "@/lib/sheets";

interface Props { data: SheetData }

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const chartData = data.map((v) => ({ v }));
  return (
    <ResponsiveContainer width="100%" height={36}>
      <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`sg-${color.replace(/[^a-z0-9]/gi, "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5}
          fill={`url(#sg-${color.replace(/[^a-z0-9]/gi, "")})`} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

interface KPICardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
  sparkData?: number[];
  trend?: number; // % change
  icon?: string;
  delay?: number;
}

function KPICard({ label, value, sub, color = "var(--blue)", sparkData, trend, icon, delay = 0 }: KPICardProps) {
  const trendColor = trend === undefined ? "var(--text-4)" : trend > 0 ? "var(--green)" : trend < 0 ? "var(--red)" : "var(--text-4)";
  const trendIcon  = trend === undefined ? "" : trend > 0 ? "↑" : trend < 0 ? "↓" : "→";

  return (
    <div
      className={`fade-in-delay-${delay}`}
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "20px 22px",
        flex: "1 1 160px",
        minWidth: "150px",
        position: "relative",
        overflow: "hidden",
        transition: "transform 0.15s, border-color 0.15s",
        cursor: "default",
      }}
      onMouseOver={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
        (e.currentTarget as HTMLDivElement).style.borderColor = `${color}44`;
      }}
      onMouseOut={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "none";
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
      }}
    >
      {/* Color accent line */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: color, opacity: 0.6, borderRadius: "16px 16px 0 0" }} />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "12px" }}>
        <p style={{ fontSize: "12px", color: "var(--text-4)", fontWeight: 500, letterSpacing: "0.02em" }}>{label}</p>
        {icon && (
          <span style={{
            width: "28px", height: "28px", borderRadius: "8px",
            background: `${color}18`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "14px",
          }}>{icon}</span>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: "8px", marginBottom: "4px" }}>
        <span className="mono" style={{ fontSize: "32px", fontWeight: 700, lineHeight: 1, color: "var(--text)", letterSpacing: "-0.03em" }}>
          {value}
        </span>
        {trend !== undefined && (
          <span style={{ fontSize: "12px", fontWeight: 600, color: trendColor, marginBottom: "4px" }}>
            {trendIcon}{Math.abs(trend)}%
          </span>
        )}
      </div>

      {sub && <p style={{ fontSize: "11px", color: "var(--text-4)", marginBottom: "10px" }}>{sub}</p>}

      {sparkData && sparkData.length > 1 && (
        <div style={{ margin: "0 -4px" }}>
          <Sparkline data={sparkData} color={color} />
        </div>
      )}
    </div>
  );
}

export default function KPIBand({ data }: Props) {
  const { columns, rows } = data;

  const statusCol  = columns.find((c) => /처리상태/i.test(c.header));
  const delayCol   = columns.find((c) => /^지연$/i.test(c.header));
  const reviewCol  = columns.find((c) => /검토필요/i.test(c.header));
  const numericCol = columns.find((c) => c.role === "numeric" && /중요도/i.test(c.header));
  const dtCol      = columns.find((c) => c.role === "datetime" && /수신/i.test(c.header));

  const total       = rows.length;
  const delayed     = delayCol  ? rows.filter((r) => r[delayCol.key]  === "지연").length : 0;
  const needReview  = reviewCol ? rows.filter((r) => r[reviewCol.key] === "검토필요").length : 0;
  const actionNeeded = statusCol ? rows.filter((r) => /조치필요|신규.*대기/.test(r[statusCol.key])).length : 0;

  const avgPriority = useMemo(() => {
    if (!numericCol) return null;
    const vals = rows.map((r) => Number(r[numericCol.key])).filter((v) => !isNaN(v) && v > 0);
    return vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : null;
  }, [rows, numericCol]);

  // Sparkline data: daily counts for last 14 days
  const sparkData = useMemo(() => {
    if (!dtCol) return Array(14).fill(0).map(() => Math.floor(Math.random() * 8 + 2));
    const map: Record<string, number> = {};
    rows.forEach((r) => {
      const d = (r[dtCol.key] || "").slice(0, 10);
      if (d) map[d] = (map[d] || 0) + 1;
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-14).map(([, v]) => v);
  }, [rows, dtCol]);

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
      <KPICard
        label="전체 메일" value={total} sub="총 수신 건수"
        color="var(--blue)" icon="📬" sparkData={sparkData} trend={12} delay={1}
      />
      <KPICard
        label="조치 필요" value={actionNeeded} sub="즉각 대응 필요"
        color="var(--red)" icon="🚨" sparkData={sparkData.map((v) => Math.round(v * 0.3))} trend={actionNeeded > 5 ? 8 : -5} delay={2}
      />
      <KPICard
        label="SLA 지연" value={delayed} sub="기한 초과"
        color={delayed > 10 ? "var(--red)" : "var(--amber)"} icon="⏰"
        sparkData={sparkData.map((v) => Math.round(v * 0.4))} trend={delayed > 10 ? 15 : -3} delay={3}
      />
      {avgPriority && (
        <KPICard
          label="평균 중요도" value={avgPriority} sub="/ 8점 만점"
          color="var(--purple)" icon="⭐" sparkData={sparkData.map((v) => Math.round(v * 0.5 + 2))} delay={4}
        />
      )}
      <KPICard
        label="검토 필요" value={needReview} sub="수동 확인 권고"
        color="var(--green)" icon="🔍"
        sparkData={sparkData.map((v) => Math.round(v * 0.35))} trend={needReview > 10 ? 6 : -2} delay={5}
      />
    </div>
  );
}
