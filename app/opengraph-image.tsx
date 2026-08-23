import { ImageResponse } from "next/og";

export const alt = "GitRoast - GitHub profile review";
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
      <div style={{ height: 88, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 54px", background: "#010409", borderBottom: "1px solid #30363d" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 15, fontSize: 25, fontWeight: 700 }}>
          <div style={{ width: 42, height: 42, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 21, background: "#f0f6fc", color: "#0d1117", fontSize: 24 }}>G</div>
          gitroast / profile-review
          <div style={{ border: "1px solid #30363d", color: "#8b949e", borderRadius: 99, padding: "3px 10px", fontSize: 14 }}>Public</div>
        </div>
        <div style={{ color: "#8b949e", fontSize: 17 }}>ROAST.md</div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "54px 68px" }}>
        <div style={{ color: "#8b949e", fontFamily: "monospace", fontSize: 20 }}>github.com/you</div>
        <div style={{ marginTop: 18, maxWidth: 950, display: "flex", flexDirection: "column", fontSize: 76, lineHeight: 1.05, fontWeight: 700, letterSpacing: -3 }}><span>Your public work.</span><span style={{ color: "#f85149" }}>Thoroughly reviewed.</span></div>
        <div style={{ marginTop: 28, color: "#c9d1d9", fontSize: 24 }}>A funny, data-backed review of any public GitHub profile.</div>
      </div>

      <div style={{ height: 72, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 54px", background: "#161b22", borderTop: "1px solid #30363d", fontSize: 18 }}>
        <div style={{ color: "#3fb950" }}>Review checks completed</div>
        <div style={{ color: "#58a6ff", fontWeight: 700 }}>gitroast</div>
      </div>
    </div>,
    size
  );
}
