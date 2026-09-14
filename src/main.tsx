import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { loadWeddingConfig } from "./config";

function Root() {
  const [config, setConfig] = useState<Awaited<ReturnType<typeof loadWeddingConfig>> | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadWeddingConfig().then(setConfig).catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return <div style={{ padding: 40, fontFamily: "sans-serif" }}>Configuration error: {error}</div>;
  }

  if (!config) {
    return <div className="loading">Loading invitation…</div>;
  }

  return <App config={config} />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode><Root /></StrictMode>
);
