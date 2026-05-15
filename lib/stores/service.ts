import { getServiceRoleDatabase } from "@/lib/supabase/database";
import { logAuditEvent } from "@/lib/audit/logger";
import { validateStoreInput } from "@/lib/validations/store";
import { inngest } from "@/lib/inngest/client";
import { ConflictError, ValidationError } from "@/lib/errors";

export async function createStoreCore(params: {
  userId: string;
  userEmail: string;
  userName?: string | null;
  userImage?: string | null;
  name: string;
  subdomain: string;
  description?: string | null;
  correlationId?: string;
}) {
  const { userId, userEmail, userName, userImage, name, subdomain, description, correlationId } = params;

  // Validate input
  const validation = validateStoreInput({ name, subdomain, description: description ?? undefined });
  if (!validation.success) {
    throw new ValidationError(validation.error || "Validation failed");
  }

  const db = getServiceRoleDatabase();
  
  // Ensure user exists in database
  const { error: userError } = await db.from('users').upsert({
    id: userId,
    email: userEmail,
    name: userName || userEmail.split("@")[0],
    image: userImage || null,
  }, {
    onConflict: 'id',
    ignoreDuplicates: true
  });

  if (userError) {
    console.error('[store-create] Failed to upsert user:', userError);
  }

  // Create store
  const { data: newStoreData, error } = await db
    .from('stores')
    .insert({
      name: validation.data!.name,
      subdomain: validation.data!.subdomain,
      description: validation.data!.description || null,
      user_id: userId,
    })
    .select()
    .single();

  if (error || !newStoreData) {
    if (error?.code === '23505') {
      throw new ConflictError("Subdomain already taken");
    }
    throw new Error('Failed to create store');
  }

  const newStore = newStoreData;

  // Trigger background jobs (fire-and-forget)
  inngest.send({
    name: "store/created",
    data: {
      storeId: newStore.id,
      userId: userId,
      subdomain: newStore.subdomain,
    },
  }).catch((err) => {
    console.error("[inngest] Failed to send store/created event:", err);
  });

  // Audit log (fire-and-forget)
  logAuditEvent({
    userId: userId,
    action: "store.created",
    resource: "store",
    resourceId: newStore.id,
    storeId: newStore.id,
    metadata: { 
      subdomain: newStore.subdomain, 
      name: newStore.name,
      correlationId 
    },
  });

  return newStore;
}
