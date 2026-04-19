import { ImageResponse } from "next/og";
import { isLocale } from "@/lib/i18n/config";

export const runtime = "nodejs";
export const alt = "SearchTalent";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const safeLocale = isLocale(locale) ? locale : "en";
  const isUk = safeLocale === "uk";

  const headline = isUk
    ? "Каталог IT-спеціалістів і проєктів"
    : "Catalog of IT specialists and projects";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #334155 100%)",
          color: "#f8fafc",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            fontSize: 40,
            fontWeight: 700,
            letterSpacing: "-0.02em",
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "#f8fafc",
              color: "#0f172a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              fontWeight: 800,
            }}
          >
            S
          </div>
          <span>SearchTalent</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              maxWidth: 960,
            }}
          >
            {headline}
          </div>
          <div
            style={{
              fontSize: 32,
              color: "#cbd5e1",
              maxWidth: 960,
            }}
          >
            {isUk
              ? "Портфоліо, проєкти та фахівці в одному місці."
              : "Portfolios, projects, and specialists in one place."}
          </div>
        </div>

        <div
          style={{
            fontSize: 24,
            color: "#94a3b8",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          searchtalent
        </div>
      </div>
    ),
    { ...size },
  );
}
