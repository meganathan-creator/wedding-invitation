import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { loadWeddingConfig } from "./config";
function Root() {
    const [config, setConfig] = useState(null);
    const [error, setError] = useState("");
    useEffect(() => {
        loadWeddingConfig().then(setConfig).catch((e) => setError(e.message));
    }, []);
    if (error) {
        return _jsxs("div", { style: { padding: 40, fontFamily: "sans-serif" }, children: ["Configuration error: ", error] });
    }
    if (!config) {
        return _jsx("div", { className: "loading", children: "Loading invitation\u2026" });
    }
    return _jsx(App, { config: config });
}
createRoot(document.getElementById("root")).render(_jsx(StrictMode, { children: _jsx(Root, {}) }));
