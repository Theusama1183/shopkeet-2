"use client";

import { use } from "react";
import { CategoryForm } from "../category-form";

export default function NewCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: storeId } = use(params);
  return <CategoryForm storeId={storeId} mode="create" />;
}
