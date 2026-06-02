import { google } from "googleapis";

export type ColumnRole =
  | "datetime"
  | "category"
  | "status"
  | "boolean"
  | "numeric"
  | "email"
  | "url"
  | "longtext"
  | "freetext";

export interface ColumnMeta {
  key: string;
  header: string;
  role: ColumnRole;
  index: number;
}

export interface SheetData {
  columns: ColumnMeta[];
  rows: Record<string, string>[];
}

function inferRole(header: string, samples: string[]): ColumnRole {
  const h = header.toLowerCase();

  if (/수신|기한|날짜|일시|date|time/.test(h)) return "datetime";
  if (/링크|link|url|http/.test(h)) return "url";
  if (/발신자|email|sender|mail/.test(h) && samples.some((s) => s.includes("@"))) return "email";
  if (/초안|조치|내용|body|text|note|draft/.test(h) && samples.some((s) => s.length > 40)) return "longtext";
  if (/경과|중요도|score|count|days|숫자|numeric/.test(h) && samples.every((s) => s === "" || !isNaN(Number(s)))) return "numeric";
  if (samples.every((s) => s === "" || !isNaN(Number(s))) && samples.some((s) => s !== "")) return "numeric";
  if (samples.every((s) => ["", "지연", "검토필요", "미회신", "회신완료", "true", "false", "y", "n"].includes(s.toLowerCase()))) return "boolean";
  const uniq = new Set(samples.filter(Boolean));
  if (uniq.size <= 8 && samples.length > 5) return "category";
  if (/상태|status|분류|type|유형|감정|여부/.test(h)) return "status";

  return "freetext";
}

function toKey(header: string, index: number): string {
  return header
    .replace(/[^\w가-힣]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "") || `col_${index}`;
}

export async function fetchSheetData(accessToken: string): Promise<SheetData> {
  const sheetId = process.env.GOOGLE_SHEETS_ID;
  const tabName = process.env.GOOGLE_SHEET_TAB || "Sheet1";

  if (!sheetId) throw new Error("Missing GOOGLE_SHEETS_ID");

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const sheets = google.sheets({ version: "v4", auth: oauth2Client });
  const range = `'${tabName}'!A1:Z200`;

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range,
  });

  const values = response.data.values || [];
  if (values.length === 0) return { columns: [], rows: [] };

  const headers: string[] = values[0].map(String);
  const dataRows = values.slice(1);

  const columns: ColumnMeta[] = headers.map((header, i) => {
    const samples = dataRows
      .slice(0, 50)
      .map((row) => (row[i] ?? "").toString().trim())
      .filter(Boolean)
      .slice(0, 20);
    return {
      key: toKey(header, i),
      header,
      role: inferRole(header, samples),
      index: i,
    };
  });

  const rows: Record<string, string>[] = dataRows.map((row) => {
    const obj: Record<string, string> = {};
    columns.forEach((col) => {
      obj[col.key] = (row[col.index] ?? "").toString().trim();
    });
    return obj;
  });

  return { columns, rows };
}
