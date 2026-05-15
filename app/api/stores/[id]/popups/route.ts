import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDatabase, getServiceRoleDatabase } from "@/lib/supabase/database";

// GET /api/stores/[id]/popups — list all popups for a store
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDatabase();
  const { data: store, error: storeError } = await db
    .from('stores')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  
  if (storeError || !store) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: rows, error } = await db
    .from('popups')
    .select('*')
    .eq('store_id', id)
    .is('deleted_at', null) // Filter out soft-deleted popups
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[popups] Failed to fetch popups:', error);
    return NextResponse.json({ error: "Failed to fetch popups" }, { status: 500 });
  }

  return NextResponse.json(rows || []);
}

// POST /api/stores/[id]/popups — create a new popup
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = await getDatabase();
  const { data: store, error: storeError } = await db
    .from('stores')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  
  if (storeError || !store) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { name } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  // Sanitize name to prevent XSS
  const sanitizedName = name.trim().replace(/[<>]/g, '').substring(0, 200);

  const serviceDb = getServiceRoleDatabase();
  const { data: created, error: insertError } = await serviceDb
    .from('popups')
    .insert({
      name: sanitizedName,
      content: { content: [], root: { props: {} } },
      trigger: { event: "on-load", delay: 3, frequency: "once-per-session" },
      conditions: { rules: [] },
      is_active: false,
      store_id: id,
    } as any)
    .select()
    .single();

  if (insertError || !created) {
    console.error('[popups] Failed to create popup:', insertError);
    return NextResponse.json({ error: "Failed to create popup" }, { status: 500 });
  }

  return NextResponse.json(created, { status: 201 });
}
