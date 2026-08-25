import { NextRequest, NextResponse } from "next/server";
import { sendSms } from "@/lib/sms019";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const phone = body?.phone;
  const message = body?.message;

  if (typeof phone !== "string" || !phone.trim()) {
    return NextResponse.json({ error: "phone חסר" }, { status: 400 });
  }
  if (typeof message !== "string" || !message.trim()) {
    return NextResponse.json({ error: "message חסר" }, { status: 400 });
  }

  const result = await sendSms(phone, message);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ success: true, shipmentId: result.shipmentId });
}
