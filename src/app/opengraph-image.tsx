import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "My Kitchen Buddy - Turn Cooking Videos Into Recipes";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #e85d2d 0%, #f59e0b 100%)",
        padding: "40px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "40px",
        }}
      >
        <svg
          width="80"
          height="80"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M17 21a1 1 0 0 0 1-1v-5.35c0-.457.316-.844.727-1.041a4 4 0 0 0-2.134-7.589 5 5 0 0 0-9.186 0 4 4 0 0 0-2.134 7.588c.411.198.727.585.727 1.041V20a1 1 0 0 0 1 1Z" />
          <path d="M6 17h12" />
        </svg>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <h1
          style={{
            fontSize: "64px",
            fontWeight: "bold",
            color: "white",
            textAlign: "center",
            margin: "0 0 20px 0",
            textShadow: "0 2px 10px rgba(0,0,0,0.2)",
          }}
        >
          My Kitchen Buddy
        </h1>
        <p
          style={{
            fontSize: "32px",
            color: "rgba(255,255,255,0.9)",
            textAlign: "center",
            margin: "0",
            maxWidth: "800px",
          }}
        >
          Turn Cooking Videos Into Recipes Instantly
        </p>
      </div>
      <div
        style={{
          display: "flex",
          gap: "20px",
          marginTop: "50px",
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.2)",
            padding: "12px 24px",
            borderRadius: "30px",
            color: "white",
            fontSize: "20px",
          }}
        >
          TikTok
        </div>
        <div
          style={{
            background: "rgba(255,255,255,0.2)",
            padding: "12px 24px",
            borderRadius: "30px",
            color: "white",
            fontSize: "20px",
          }}
        >
          Instagram
        </div>
        <div
          style={{
            background: "rgba(255,255,255,0.2)",
            padding: "12px 24px",
            borderRadius: "30px",
            color: "white",
            fontSize: "20px",
          }}
        >
          YouTube
        </div>
      </div>
    </div>,
    {
      ...size,
    },
  );
}
