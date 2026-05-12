"use client";

import { use } from "react";
import { TagForm } from "../tag-form";

export default function NewTagPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: storeId } = use(params);
  return <TagForm storeId={storeId} mode="create" />;
}
