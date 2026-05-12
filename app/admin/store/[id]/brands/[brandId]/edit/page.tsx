"use client";

import { use } from "react";
import { BrandForm } from "../../brand-form";

export default function EditBrandPage({
  params,
}: {
  params: Promise<{ id: string; brandId: string }>;
}) {
  const { id: storeId, brandId } = use(params);
  return <BrandForm storeId={storeId} brandId={brandId} mode="edit" />;
}
