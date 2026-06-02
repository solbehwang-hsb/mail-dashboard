import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mail Dashboard",
  description: "메일 처리 현황 대시보드",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
