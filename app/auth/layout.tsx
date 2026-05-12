import { ReactNode } from "react";
import { LoadingProvider } from "@/components/providers";

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <LoadingProvider>
      {children}
    </LoadingProvider>
  );
}