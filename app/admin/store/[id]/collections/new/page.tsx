"use client";

import { use } from "react";
import { CollectionForm } from "../collection-form";

export default function NewCollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: storeId } = use(params);
  return <CollectionForm storeId={storeId} mode="create" />;
}
