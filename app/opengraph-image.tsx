import { ImageResponse } from "next/og"

export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OGImage() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        backgroundColor: "#1a1714",
        color: "#f5f0eb",
        padding: "60px 80px",
        fontFamily: "sans-serif",
      }}
    >
      {/* Blue accent bar */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 8,
          backgroundColor: "#0063a6",
        }}
      />

      <div
        style={{
          fontSize: 20,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "#8a8078",
          marginBottom: 16,
        }}
      >
        Volitve v Državni zbor 2026
      </div>

      <div
        style={{
          fontSize: 64,
          fontWeight: 700,
          marginBottom: 24,
        }}
      >
        GIBANJE SVOBODA
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 32,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 80, fontWeight: 700 }}>29</span>
          <span style={{ fontSize: 24, color: "#8a8078" }}>/ 90 sedežev</span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          gap: 40,
          marginTop: 32,
          fontSize: 24,
          color: "#8a8078",
        }}
      >
        <span>28,62 % glasov</span>
        <span>Udeležba: 69,26 %</span>
      </div>

      {/* Bottom bar with party colors */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 6,
          display: "flex",
        }}
      >
        <div style={{ flex: 29, backgroundColor: "#0063a6" }} />
        <div style={{ flex: 28, backgroundColor: "#FFE53F" }} />
        <div style={{ flex: 9, backgroundColor: "#009ac7" }} />
        <div style={{ flex: 6, backgroundColor: "#fc0010" }} />
        <div style={{ flex: 6, backgroundColor: "#01beac" }} />
        <div style={{ flex: 5, backgroundColor: "#b30020" }} />
        <div style={{ flex: 5, backgroundColor: "#7e5096" }} />
      </div>
    </div>,
    { ...size }
  )
}
