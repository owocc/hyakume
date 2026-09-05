import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Parse hex (#rgb, #rrggbb) or rgb/rgba string into [r, g, b]
 */
export function parseColor(color: string): [number, number, number] | null {
  const c = (color || "").trim().toLowerCase();
  if (c.startsWith("#")) {
    let hex = c.slice(1);
    if (hex.length === 3) {
      hex = hex.split("").map((x) => x + x).join("");
    }
    if (hex.length === 6) {
      const num = parseInt(hex, 16);
      if (!isNaN(num)) {
        return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
      }
    }
  }
  const rgbMatch = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    return [Number(rgbMatch[1]), Number(rgbMatch[2]), Number(rgbMatch[3])];
  }
  return null;
}

/**
 * Calculate perceived luminance of an RGB color (0 to 255)
 * Using standard ITU-R BT.709 perceived luminance formula
 */
export function getColorLuminance(color: string): number {
  const rgb = parseColor(color);
  if (!rgb) return 0;
  const [r, g, b] = rgb;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export interface CardTheme {
  isLight: boolean;
  textColor: string;
  tagColor: string;
  subtitleColor: string;
  barBg: string;
  buttonClass: string;
}

/**
 * Determine contrast theme for card based on dominant background color.
 * If the dominant color is light (luminance > 145), calculates contrasting dark text colors.
 * If dark, uses crisp white text colors.
 */
export function getCardTheme(primaryColor?: string): CardTheme {
  const isLight = primaryColor ? getColorLuminance(primaryColor) > 145 : false;

  if (isLight) {
    return {
      isLight: true,
      textColor: "#09090b",
      tagColor: "rgba(9, 9, 11, 0.75)",
      subtitleColor: "rgba(9, 9, 11, 0.80)",
      barBg: "bg-white/70 text-black backdrop-blur-xl",
      buttonClass: "bg-black text-white hover:bg-neutral-800 shadow-sm",
    };
  }

  return {
    isLight: false,
    textColor: "#ffffff",
    tagColor: "rgba(255, 255, 255, 0.80)",
    subtitleColor: "rgba(255, 255, 255, 0.85)",
    barBg: "bg-black/35 text-white backdrop-blur-xl",
    buttonClass: "bg-white text-black hover:bg-white/90 shadow-sm",
  };
}

/**
 * Generate computed gradient styles from the dominant/primary color.
 * If no color is provided or invalid, defaults to black-to-transparent overlay.
 */
export function getCardGradientStyle(primaryColor?: string): {
  background: string;
  overlay: string;
} {
  // User specified: 左上角黑色10%，到右下角透明
  const defaultOverlay =
    "linear-gradient(135deg, rgba(0, 0, 0, 0.10) 0%, rgba(0, 0, 0, 0) 100%)";
  const defaultBackground = "linear-gradient(135deg, #18181b 0%, #09090b 100%)";

  if (!primaryColor) {
    return {
      background: defaultBackground,
      overlay: defaultOverlay,
    };
  }

  const rgb = parseColor(primaryColor);
  if (!rgb) {
    return {
      background: `linear-gradient(135deg, ${primaryColor} 0%, #09090b 100%)`,
      overlay: defaultOverlay,
    };
  }

  const [r, g, b] = rgb;
  // Calculate rich complementary / shifted tone for gradient depth
  const r2 = Math.min(255, Math.round(r * 0.65 + g * 0.2));
  const g2 = Math.min(255, Math.round(g * 0.65 + b * 0.2));
  const b2 = Math.min(255, Math.round(b * 0.65 + r * 0.2));

  return {
    background: `linear-gradient(135deg, rgba(${r}, ${g}, ${b}, 0.92) 0%, rgba(${r2}, ${g2}, ${b2}, 0.8) 60%, rgba(8, 8, 10, 0.98) 100%)`,
    overlay: defaultOverlay,
  };
}
