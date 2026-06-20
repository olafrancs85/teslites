import { NextResponse } from "next/server";
import { store } from "../store/route";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const record = store.get(params.id);

  if (!record) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(record);
}
