"use client";
import type { SheetData } from "@/lib/sheets";

interface Props { data: SheetData }

export default function AIInsights({ data }: Props) {
  const { columns, rows } = data;

  const statusCol  = columns.find((c) => /처리상태/i.test(c.header));
  const delayCol   = columns.find((c) => /^지연$/i.test(c.header));
  const reviewCol  = columns.find((c) => /검토필요/i.test(c.header));
  const catCol     = columns.find((c) => /^분류$/i.test(c.header));
  const sentCol    = columns.find((c) => /감정/i.test(c.header));
  const deptCol    = columns.find((c) => /담당부서/i.test(c.header));

  const delayed    = delayCol  ? rows.filter((r) => r[delayCol.key]  === "지연").length : 0;
  const needReview = reviewCol ? rows.filter((r) => r[reviewCol.key] === "검토필요").length : 0;
  const actionRows = statusCol ? rows.filter((r) => /조치필요|신규.*대기/.test(r[statusCol.key])) : [];
  const negative   = sentCol   ? rows.filter((r) => r[sentCol.key]   === "부정").length : 0;

  // 파트너십 비율
  const partnerRows = catCol ? rows.filter((r) => /협업|제휴/i.test(r[catCol.key])) : [];

  // 가장 바쁜 부서
  const deptMap: Record<string, number> = {};
  if (deptCol) {
    rows.forEach((r) => {
      const d = r[deptCol.key];
      if (d && !/자동분류/i.test(d)) deptMap[d] = (deptMap[d] || 0) + 1;
    });
  }
  const busiest = Object.entries(deptMap).sort(([,a],[,b]) => b - a)[0]?.[0] ?? "—";

  const insights = [
    delayed > 0 && {
      icon: "🚨",
      color: "var(--red)",
      bg: "var(--red-dim)",
      text: `SLA 위반 ${delayed}건 감지됨`,
      sub: "기한 초과 메일이 즉각 대응이 필요합니다",
    },
    partnerRows.length > 3 && {
      icon: "📈",
      color: "var(--blue)",
      bg: "var(--blue-dim)",
      text: `협업/제휴 요청 ${partnerRows.length}건 대기 중`,
      sub: "파트너십 검토가 누적되고 있습니다",
    },
    negative > 0 && {
      icon: "⚠️",
      color: "var(--amber)",
      bg: "var(--amber-dim)",
      text: `부정 감정 메일 ${negative}건`,
      sub: "즉각적인 고객 대응이 권장됩니다",
    },
    needReview > 0 && {
      icon: "🔍",
      color: "var(--purple)",
      bg: "var(--purple-dim)",
      text: `${busiest} 검토 백로그 ${needReview}건`,
      sub: "담당 팀의 응답 지연이 누적되고 있습니다",
    },
  ].filter(Boolean) as { icon: string; color: string; bg: string; text: string; sub: string }[];

  const actions = [
    actionRows.length > 0 && `미처리 ${actionRows.length}건의 고객 메일에 우선 응답`,
    partnerRows.length > 0 && `협업 제안서 ${partnerRows.length}건 검토 및 답변`,
    delayed > 0 && `SLA 초과 ${delayed}건 긴급 처리`,
    negative > 0 && `부정 감정 고객 ${negative}명 케어 조치`,
  ].filter(Boolean) as string[];

  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(30,41,59,0.9) 0%, rgba(15,23,42,0.95) 100%)",
      border: "1px solid rgba(59,130,246,0.2)",
      borderRadius: "var(--radius-xl)",
      padding: "28px 32px",
      position: "relative",
      overflow: "hidden",
    }} className="fade-in">
      {/* Glow */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: "1px",
        background: "linear-gradient(90deg, transparent, rgba(59,130,246,0.6), transparent)",
      }} />
      <div style={{
        position: "absolute", top: "-60px", right: "-60px", width: "200px", height: "200px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: "16px", marginBottom: "24px" }}>
        <div style={{
          width: "40px", height: "40px", borderRadius: "10px", flexShrink: 0,
          background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "18px",
        }}>🤖</div>
        <div>
          <h2 style={{ fontSize: "17px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
            AI 운영 인사이트
          </h2>
          <p style={{ fontSize: "12px", color: "var(--text-4)", marginTop: "2px" }}>
            {rows.length}건 메일 분석 결과 · 방금 업데이트
          </p>
        </div>
        <div style={{
          marginLeft: "auto",
          background: "rgba(16,185,129,0.12)",
          border: "1px solid rgba(16,185,129,0.25)",
          borderRadius: "999px",
          padding: "4px 12px",
          fontSize: "11px",
          color: "var(--green)",
          display: "flex", alignItems: "center", gap: "5px",
        }}>
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--green)",
            boxShadow: "0 0 6px var(--green)", animation: "pulse 2s infinite" }} />
          Live
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Insights */}
        <div>
          <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-4)", marginBottom: "12px" }}>
            감지된 이슈
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {insights.map((item, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "flex-start", gap: "10px",
                background: item.bg,
                border: `1px solid ${item.color}22`,
                borderRadius: "var(--radius)",
                padding: "12px 14px",
                transition: "transform 0.15s",
              }}
                onMouseOver={(e) => (e.currentTarget.style.transform = "translateX(3px)")}
                onMouseOut={(e) => (e.currentTarget.style.transform = "none")}
              >
                <span style={{ fontSize: "16px", flexShrink: 0, marginTop: "1px" }}>{item.icon}</span>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: 600, color: "var(--text)" }}>{item.text}</p>
                  <p style={{ fontSize: "11px", color: "var(--text-3)", marginTop: "2px" }}>{item.sub}</p>
                </div>
              </div>
            ))}
            {insights.length === 0 && (
              <div style={{ padding: "16px", textAlign: "center", color: "var(--text-4)", fontSize: "13px" }}>
                ✅ 현재 감지된 이슈 없음
              </div>
            )}
          </div>
        </div>

        {/* Recommended Actions */}
        <div>
          <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-4)", marginBottom: "12px" }}>
            권장 조치
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {actions.map((action, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: "12px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                padding: "12px 14px",
                cursor: "default",
                transition: "background 0.15s",
              }}
                onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                onMouseOut={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
              >
                <span style={{
                  width: "22px", height: "22px", borderRadius: "6px", flexShrink: 0,
                  background: "rgba(59,130,246,0.15)",
                  border: "1px solid rgba(59,130,246,0.2)",
                  color: "var(--blue)",
                  fontSize: "11px", fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>{i + 1}</span>
                <p style={{ fontSize: "13px", color: "var(--text-2)", lineHeight: 1.4 }}>{action}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
