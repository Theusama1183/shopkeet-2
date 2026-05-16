import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getDatabase, getServiceRoleDatabase } from "@/lib/supabase/database";
import { createTemplateSchema } from "@/lib/validations/template";

// GET /api/stores/[id]/templates — list all templates for a store
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
    .from('templates')
    .select('*')
    .eq('store_id', id)
    .is('deleted_at', null) // Filter out soft-deleted templates
    .order('type', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[templates] Failed to fetch templates:', error);
    return NextResponse.json({ error: "Failed to fetch templates" }, { status: 500 });
  }

  return NextResponse.json(rows || []);
}

// POST /api/stores/[id]/templates — create a new template
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

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  const { name, type } = parsed.data;

  const serviceDb = getServiceRoleDatabase();
  const { data: created, error: insertError } = await serviceDb
    .from('templates')
    .insert({
      name,
      type,
      content: { content: [], root: { props: {} } },
      is_active: false,
      store_id: id,
    } as any)
    .select()
    .single();

  if (insertError || !created) {
    console.error('[templates] Failed to create template:', insertError);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }

  return NextResponse.json(created, { status: 201 });
}
