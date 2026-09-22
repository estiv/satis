import { NextResponse } from "next/server";
import { APP_VERSION, SCHEMA_VERSION } from "@/core/app-version";

export async function GET() {
  return NextResponse.json({
    ok: true,
    app: "satis-rental",
    version: APP_VERSION,
    schema: SCHEMA_VERSION,
  });
}
