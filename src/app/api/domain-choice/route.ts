import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function POST(request: NextRequest) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ error: "Supabase לא מוגדר" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  const domainId = body?.domainId;
  const accessToken = body?.accessToken;

  if (typeof domainId !== "string" || !domainId) {
    return NextResponse.json({ error: "domainId חסר" }, { status: 400 });
  }
  if (typeof accessToken !== "string" || !accessToken) {
    return NextResponse.json({ error: "accessToken חסר" }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });

  const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken);
  if (userError || !user) {
    return NextResponse.json({ error: "משתמש לא מזוהה" }, { status: 401 });
  }

  const domainSelectedAt = new Date().toISOString();
  const { error } = await supabase
    .from("candidates")
    .update({ chosen_domain: domainId, domain_selected_at: domainSelectedAt })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, domainId, domainSelectedAt });
}
