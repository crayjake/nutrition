import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/app-shell";
import { TrackingProvider } from "@/features/tracking/tracking-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Crux · Daily nutrition",
    template: "%s · Crux"
  },
  description: "A calm, local-first climbing nutrition and habit tracker.",
  applicationName: "Crux"
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f3ee" },
    { media: "(prefers-color-scheme: dark)", color: "#151815" }
  ]
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <TrackingProvider>
          <AppShell>{children}</AppShell>
        </TrackingProvider>
      </body>
    </html>
  );
}
