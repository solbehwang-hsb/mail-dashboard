"use client";
import { useState, useEffect, useCallback } from "react";
import { signOut } from "next-auth/react";
import type { SheetData } from "@/lib/sheets";
import KPIBand          from "@/components/KPIBand";
import AIInsights        from "@/components/AIInsights";
import TimelineSection   from "@/components/TimelineSection";
import CategorySection   from "@/components/CategorySection";
import EmailSection      from "@/components/EmailSection";
import PriorityQueue     from "@/components/PriorityQueue";
import ReviewCards       from "@/components/ReviewCards";
import DataTable         from "@/components/DataTable";

/* ── Section wrapper ─────────────────────────────────────── */
function Section({
  title, icon, children, defaultOpen = false, accent,
}: {
  title: string; icon: string; children: React.ReactNode; defaultOpen?: boolean; accent?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const color = accent || "var(--blue)";
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)", overflow: "hidden" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: "12px",
          padding: "18px 24px", background: "transparent", border: "none",
          borderBottom: open ? "1px solid var(--border)" : "none",
          cursor: "pointer", transition: "background 0.15s",
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
        onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
      >
        <span style={{
          width: "30px", height: "30px", borderRadius: "8px", flexShrink: 0,
          background: `${color}18`, border: `1px solid ${color}28`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px",
        }}>{icon}</span>
        <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-2)", letterSpacing: "-0.01em" }}>{title}</span>
        <span style={{ marginLeft: "auto", color: "var(--text-4)", fontSize: "11px", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</span>
      </button>
      {open && <div style={{ padding: "24px" }}>{children}</div>}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────── */
export default function DashboardPage() {
  const [data,        setData]        = useState<SheetData | null>(null);
  const [error,       setError]       = useState<string | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [needRelogin, setNeedRelogin] = useState(false);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [allOpen,     setAllOpen]     = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNeedRelogin(false);
    try {
      const res = await fetch("/api/sheets", { cache: "no-store" });
      if (res.status === 401) { setNeedRelogin(true); return; }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `HTTP ${res.status}`);
      }
      setData(await res.json());
      setLastFetched(new Date());
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "32px 24px", display: "flex", flexDirection: "column", gap: "0" }}>

      {/* ── Header ── */}
      <header className="fade-in" style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "10px",
              background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px",
            }}>✉️</div>
            <h1 style={{ fontSize: "20px", fontWeight: 700, color: "var(--text)", letterSpacing: "-0.02em" }}>
              Mail Ops
            </h1>
            <span style={{
              fontSize: "10px", fontWeight: 600, letterSpacing: "0.06em",
              background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.25)",
              color: "var(--blue)", borderRadius: "999px", padding: "2px 8px",
            }}>AI POWERED</span>
          </div>
          {lastFetched && (
            <p style={{ fontSize: "11px", color: "var(--text-4)" }}>
              마지막 업데이트: {lastFetched.toLocaleTimeString("ko-KR")}
            </p>
          )}
        </div>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <button onClick={() => setAllOpen((v) => !v)}
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)", borderRadius: "8px", padding: "8px 16px", color: "var(--text-3)", fontSize: "12px", cursor: "pointer", transition: "background 0.15s" }}
            onMouseOver={(e) => ((e.target as HTMLButtonElement).style.background = "rgba(255,255,255,0.08)")}
            onMouseOut={(e) => ((e.target as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)")}
          >{allOpen ? "모두 닫기" : "모두 펼치기"}</button>

          <button onClick={fetchData} disabled={loading}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)",
              borderRadius: "8px", padding: "8px 16px", color: "var(--blue)",
              fontSize: "12px", fontWeight: 600, cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.6 : 1, transition: "background 0.15s",
            }}
            onMouseOver={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "rgba(59,130,246,0.25)"; }}
            onMouseOut={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "rgba(59,130,246,0.15)")}
          >
            <span style={{ display: "inline-block", animation: loading ? "spin 1s linear infinite" : "none" }}>↻</span>
            새로고침
          </button>

          <button onClick={() => signOut({ callbackUrl: "/login" })}
            style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: "8px", padding: "8px 14px", color: "var(--text-4)", fontSize: "12px", cursor: "pointer" }}>
            로그아웃
          </button>
        </div>
      </header>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* ── Loading ── */}
      {loading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px", gap: "16px" }}>
          <div style={{
            width: "48px", height: "48px", borderRadius: "14px",
            background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "22px", animation: "spin 2s linear infinite",
          }}>✉️</div>
          <p style={{ color: "var(--text-4)", fontSize: "14px" }}>데이터를 불러오는 중...</p>
        </div>
      )}

      {/* ── Relogin ── */}
      {needRelogin && !loading && (
        <div style={{
          background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)",
          borderRadius: "var(--radius-lg)", padding: "32px", textAlign: "center",
          display: "flex", flexDirection: "column", alignItems: "center", gap: "16px",
        }}>
          <div style={{ fontSize: "32px" }}>🔑</div>
          <div>
            <p style={{ color: "var(--text)", fontWeight: 600, fontSize: "15px", marginBottom: "6px" }}>인증 토큰 만료</p>
            <p style={{ color: "var(--text-4)", fontSize: "13px" }}>Sheets 읽기 권한이 없는 세션입니다. 재로그인이 필요합니다.</p>
          </div>
          <button onClick={() => signOut({ callbackUrl: "/login" })}
            style={{ background: "rgba(59,130,246,0.2)", border: "1px solid rgba(59,130,246,0.35)", borderRadius: "999px", padding: "10px 28px", color: "var(--blue)", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}>
            로그아웃 후 재로그인
          </button>
        </div>
      )}

      {/* ── Error ── */}
      {error && !loading && (
        <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "var(--radius-lg)", padding: "16px 20px", color: "var(--red)", fontSize: "13px" }}>
          ⚠ {error}
        </div>
      )}

      {/* ── Dashboard content ── */}
      {data && !loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

          {/* Row 0: AI Summary */}
          <AIInsights data={data} />

          {/* Row 1: KPI */}
          <div className="fade-in-delay-1">
            <KPIBand data={data} />
          </div>

          {/* Row 2: Volume Trend */}
          <Section title="메일 수신 트렌드" icon="📈" defaultOpen={true} accent="var(--blue)">
            <TimelineSection data={data} />
          </Section>

          {/* Row 3: Priority Queue */}
          <Section title="🔥 즉시 대응 필요 (우선순위 큐)" icon="🚨" defaultOpen={true} accent="#ef4444">
            <PriorityQueue data={data} />
          </Section>

          {/* Row 4: Category Analytics */}
          <Section title="카테고리 분석" icon="🍩" defaultOpen={false} accent="var(--purple)">
            <CategorySection data={data} />
          </Section>

          {/* Row 5: Sender Analytics */}
          <Section title="발신자 분석" icon="📬" defaultOpen={false} accent="var(--amber)">
            <EmailSection data={data} />
          </Section>

          {/* Row 6: Full Table */}
          <Section title="전체 메일 테이블" icon="📋" defaultOpen={false} accent="var(--green)">
            <DataTable data={data} />
          </Section>

        </div>
      )}
    </div>
  );
}
