/**
 * Logo — AVA droplet mark in a rounded olive tile with optional wordmark.
 * Use tone="light" on dark surfaces (header), tone="dark" on cream surfaces.
 */

import Colors from "@/constants/Colors";

type Props = {
  tone?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  showWordmark?: boolean;
};

const SIZES = {
  sm: { mark: 32, word: 18, sub: 9 },
  md: { mark: 40, word: 22, sub: 10 },
  lg: { mark: 52, word: 28, sub: 12 },
};

export function Logo({ tone = "light", size = "md", showWordmark = true }: Props) {
  const s = SIZES[size];
  const wordColor = tone === "light" ? Colors.white : Colors.olive700;
  const subColor = tone === "light" ? Colors.sage300 : Colors.sage400;

  const svg = `<svg width="${s.mark}" height="${s.mark}" viewBox="0 0 44 44" fill="none" style="display:block;flex-shrink:0">
    <rect width="44" height="44" rx="13" fill="${Colors.olive700}"/>
    <path d="M22 11c0 5-6 7-6 12a6 6 0 0 0 12 0c0-5-6-7-6-12Z" fill="${Colors.cream200}"/>
    <path d="M15 28c1.6 1.2 3 1.2 4.6 0 1.6-1.2 3-1.2 4.6 0 1.6 1.2 3 1.2 4.6 0" stroke="${Colors.sage300}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </svg>`;

  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 12 }}>
      <span
        style={{ display: "inline-flex", lineHeight: 0 }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {showWordmark && (
        <span style={{ display: "flex", flexDirection: "column", gap: 2, lineHeight: 1 }}>
          <span
            style={{
              fontFamily: '"Poppins", sans-serif',
              fontWeight: 700,
              fontSize: s.word,
              letterSpacing: "0.06em",
              color: wordColor,
            }}
          >
            AVA
          </span>
          <span
            style={{
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontWeight: 500,
              fontSize: s.sub,
              letterSpacing: "0.14em",
              textTransform: "uppercase" as const,
              color: subColor,
            }}
          >
            Assistência · Enchentes
          </span>
        </span>
      )}
    </div>
  );
}
