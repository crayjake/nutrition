import type { Metadata, Viewport } from "next";
import { AppShell } from "@/components/app-shell";
import { TrackingProvider } from "@/features/tracking/tracking-provider";
import "./globals.css";

function getBasePath(): string {
  if (process.env.NEXT_PUBLIC_BASE_PATH !== undefined) {
    return process.env.NEXT_PUBLIC_BASE_PATH;
  }
  const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1];
  const isUserSite = repositoryName?.endsWith(".github.io");
  return process.env.GITHUB_ACTIONS === "true" &&
    repositoryName &&
    !isUserSite
    ? `/${repositoryName}`
    : "";
}

const basePath = getBasePath();

export const metadata: Metadata = {
  title: {
    default: "Crux · Daily nutrition",
    template: "%s · Crux"
  },
  description: "A calm, local-first climbing nutrition and habit tracker.",
  applicationName: "Crux",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Crux"
  },
  icons: {
    apple: [
      {
        url: `${basePath}/apple-touch-icon-v2.png`,
        sizes: "180x180",
        type: "image/png"
      }
    ]
  }
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
