"use client";

import { use } from "react";
import { ProductEditorPage } from "@/components/products/product-editor-page";

export default function NewProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: storeId } = use(params);
  return <ProductEditorPage mode="new" storeId={storeId} />;
}

