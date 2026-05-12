"use client";

import { use } from "react";
import { TagForm } from "../../tag-form";

export default function EditTagPage({
  params,
}: {
  params: Promise<{ id: string; tagId: string }>;
}) {
  const { id: storeId, tagId } = use(params);
  return <TagForm storeId={storeId} tagId={tagId} mode="edit" />;
}
