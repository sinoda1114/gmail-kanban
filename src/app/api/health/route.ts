import { NextResponse } from "next/server";

/** E2E / 稼働確認用。認証不要。 */
export async function GET() {
  return NextResponse.json({ ok: true });
}
