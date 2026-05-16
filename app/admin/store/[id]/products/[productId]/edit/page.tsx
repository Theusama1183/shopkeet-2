"use client";

import { use } from "react";
import { ProductEditorPage } from "@/components/products/product-editor-page";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string; productId: string }>;
}) {
  const { id: storeId, productId } = use(params);
  return <ProductEditorPage mode="edit" storeId={storeId} productId={productId} />;
}
