"use client";

import { use } from "react";
import { CategoryForm } from "../../category-form";

export default function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string; categoryId: string }>;
}) {
  const { id: storeId, categoryId } = use(params);
  return <CategoryForm storeId={storeId} categoryId={categoryId} mode="edit" />;
}
