// Placeholder entry point — scaffold only.
// Real UI (App.tsx, router.tsx, routes/, components/) is frontend-builder's
// job per architecture.md §3. This file exists so `vite` / `tsc` have
// something to build against before that work lands.
import React from "react";
import { createRoot } from "react-dom/client";

function Placeholder() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
      <h1>Sentinel</h1>
      <p>Scaffold placeholder — UI pending frontend-builder.</p>
    </main>
  );
}

const container = document.getElementById("root");
if (container) {
  createRoot(container).render(<Placeholder />);
}
