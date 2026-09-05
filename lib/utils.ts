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
