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
    name: "Crux · Daily nutrition",
    short_name: "Crux",
    description: "A calm, local-first climbing nutrition and habit tracker.",
    start_url: `${basePath}/`,
    scope: `${basePath}/`,
    display: "standalone",
    background_color: "#f4f3ee",
    theme_color: "#f4f3ee",
    icons: [
      {
        src: `${basePath}/icon-192.png`,
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: `${basePath}/icon-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: `${basePath}/icon-maskable-512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };
}
