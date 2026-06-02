import { NextResponse } from "next/server";
import { fetchSheetData } from "@/lib/sheets";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessToken = (session as { access_token?: string }).access_token;
  if (!accessToken) {
    return NextResponse.json({ error: "No access token — 다시 로그인해주세요." }, { status: 401 });
  }

  try {
    const data = await fetchSheetData(accessToken);
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
