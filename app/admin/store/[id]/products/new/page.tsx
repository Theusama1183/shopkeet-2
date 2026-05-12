"use client";

import { use } from "react";
import { ProductForm } from "@/components/products/ProductForm";

export default function NewProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: storeId } = use(params);
  return <ProductForm storeId={storeId} mode="create" />;
}
