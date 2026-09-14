import type { WeddingConfig } from "./types/wedding";

export async function loadWeddingConfig(): Promise<WeddingConfig> {
  const response = await fetch("/config/wedding.json", {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Unable to load wedding configuration (${response.status})`);
  }

  return response.json() as Promise<WeddingConfig>;
}
