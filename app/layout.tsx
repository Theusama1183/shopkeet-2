import type { Metadata } from "next";
import { Inter, IBM_Plex_Sans_Condensed } from "next/font/google";
import { QueryProvider } from "@/lib/providers/query-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { WebVitals } from "./web-vitals";
import "./globals.css";
import "@puckeditor/core/puck.css"; // Import Puck CSS globally to avoid chunk loading issues

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap", // ✅ Prevent FOIT (Flash of Invisible Text)
});

const ibmPlexCondensed = IBM_Plex_Sans_Condensed({
  variable: "--font-ibm-plex",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap", // ✅ Prevent FOIT (Flash of Invisible Text)
});

export const metadata: Metadata = {
  title: "Shopkeet",
  description: "Manage your store with ease",
  robots: "index, follow",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${ibmPlexCondensed.variable} antialiased bg-zinc-100 text-zinc-900`}
      >
        <ErrorBoundary>
          <QueryProvider>
            {children}
          </QueryProvider>
        </ErrorBoundary>
        <WebVitals />
      </body>
    </html>
  );
}
