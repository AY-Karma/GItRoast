import { ImageResponse } from "next/og";

export const alt = "GitRoast. Your GitHub. Roasted. A roast of your public code habits, with receipts.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        color: "#f0f6fc",
        background: "#0d1117",
        fontFamily: "Arial, sans-serif"
      }}
    >
      <div style={{ height: 88, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 54px", borderBottom: "1px solid #30363d" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 15, fontSize: 25, fontWeight: 700 }}>
          <div style={{ width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 10, background: "#238636", color: "#ffffff", fontSize: 24 }}>G</div>
          GitRoast
        </div>
        <div style={{ color: "#8b949e", fontSize: 17 }}>Code review. With a mean streak.</div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "54px 68px" }}>
        <div style={{ color: "#8b949e", fontFamily: "monospace", fontSize: 20 }}>github.com/you</div>
        <div style={{ marginTop: 18, maxWidth: 950, display: "flex", flexDirection: "column", fontSize: 94, lineHeight: 1.05, fontWeight: 700, letterSpacing: -4 }}><span>Your GitHub.</span><span style={{ color: "#ff7b72" }}>Roasted.</span></div>
        <div style={{ marginTop: 28, color: "#8b949e", fontSize: 24 }}>A brutally honest roast of your public repos and commits.</div>
      </div>

      <div style={{ height: 72, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 54px", borderTop: "1px solid #30363d", fontSize: 18 }}>
        <div style={{ color: "#8b949e" }}>Public profiles. No sign-in. Plenty of receipts.</div>
        <div style={{ color: "#3fb950", fontWeight: 700 }}>Roast my GitHub →</div>
      </div>
    </div>,
    size
  );
}
