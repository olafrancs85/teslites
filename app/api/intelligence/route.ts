import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    status: "ok",
    source: "tesla-live-intelligence",
    message: "Intelligence endpoint active",
  })
}
