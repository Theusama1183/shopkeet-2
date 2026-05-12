"use client";

import { use } from "react";
import { CollectionForm } from "../../collection-form";

export default function EditCollectionPage({
  params,
}: {
  params: Promise<{ id: string; collectionId: string }>;
}) {
  const { id: storeId, collectionId } = use(params);
  return <CollectionForm storeId={storeId} collectionId={collectionId} mode="edit" />;
}
