"use client";

import React from "react";
import Link from "next/link";

export default function WidgetPage() {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: 24, fontFamily: "ui-sans-serif, system-ui" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>MotorMind Smart Chat Widget</h1>
      <p style={{ color: "#555", marginBottom: 20 }}>
        This route exists so LandingSite AI (or any site) can iframe the chat widget. Right now it’s a placeholder.
      </p>

      <div style={{ display: "grid", gap: 12 }}>
        <div style={{ border: "1px solid #eee", borderRadius: 12, padding: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 6 }}>Next step</h2>
          <p style={{ color: "#555", marginBottom: 10 }}>
            We’ll drop your actual MotorMind chat UI here and have it call your smart payment + SmartProtect logic.
          </p>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/drivelogic" style={{ background: "#000", color: "#fff", padding: "10px 14px", borderRadius: 10, textDecoration: "none" }}>
              Open DriveLogic Demo
            </Link>
            <a href="/api/health" style={{ border: "1px solid #ddd", padding: "10px 14px", borderRadius: 10, textDecoration: "none", color: "#111" }}>
              API Health (optional)
            </a>
          </div>
        </div>

        <div style={{ border: "1px dashed #ddd", borderRadius: 12, padding: 16, color: "#777" }}>
          <b>Embed example:</b>
          <pre style={{ marginTop: 10, padding: 12, background: "#111", color: "#eee", borderRadius: 12, overflowX: "auto" }}>
{`<iframe
  src="https://YOUR-DEPLOYED-URL.vercel.app/widget"
  style="width: 100%; height: 850px; border: 0; border-radius: 16px;"
  loading="lazy"
></iframe>`}
          </pre>
        </div>
      </div>
    </div>
  );
}
