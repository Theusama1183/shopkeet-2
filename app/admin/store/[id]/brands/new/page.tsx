"use client";

import { use } from "react";
import { BrandForm } from "../brand-form";

export default function NewBrandPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: storeId } = use(params);
  return <BrandForm storeId={storeId} mode="create" />;
}
