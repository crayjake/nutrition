import type { MetadataRoute } from "next";

export const dynamic = "force-static";

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

export default function manifest(): MetadataRoute.Manifest {
  const basePath = getBasePath();
  return {
    id: `${basePath}/`,
    name: "Crux · Nutrition & climbing",
    short_name: "Crux",
    description:
      "A calm, local-first nutrition, habit and climbing session tracker.",
    start_url: `${basePath}/`,
    scope: `${basePath}/`,
    display: "standalone",
    orientation: "portrait",
    background_color: "#f4f3ee",
    theme_color: "#f4f3ee",
    categories: ["health", "fitness", "lifestyle"],
    icons: [
      {
        src: `${basePath}/app-icon-v3-192.png`,
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: `${basePath}/app-icon-v3-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: `${basePath}/app-icon-maskable-v3-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ],
    shortcuts: [
      {
        name: "Log climbing",
        short_name: "Climb",
        url: `${basePath}/climbing/`,
        icons: [
          {
            src: `${basePath}/app-icon-v3-192.png`,
            sizes: "192x192",
            type: "image/png"
          }
        ]
      }
    ]
  };
}
