function isPublicIpv4(host: string): boolean {
  const octets = host.split(".").map(Number);
  if (octets.length !== 4 || octets.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) return false;
  const [a, b, c] = octets;
  return !(a === 0 || a === 10 || a === 127 || a >= 224
    || (a === 100 && b >= 64 && b <= 127)
    || (a === 169 && b === 254)
    || (a === 172 && b >= 16 && b <= 31)
    || (a === 192 && (b === 168 || (b === 0 && (c === 0 || c === 2))))
    || (a === 198 && (b === 18 || b === 19 || (b === 51 && c === 100)))
    || (a === 203 && b === 0 && c === 113));
}

/** Syntactic target validation, not a substitute for DNS/egress SSRF controls. */
export function normalizeUrl(rawUrl: string): string {
  const input = rawUrl.trim();
  if (!input || /[\s\\\u0000-\u001f\u007f]/.test(input)) throw new Error("Invalid URL");
  const hasHttpScheme = /^https?:\/\//i.test(input);
  if (!hasHttpScheme && /^[a-z][a-z\d+.-]*:/i.test(input) && !/^[^/:]+:\d+(?:[/?#]|$)/.test(input)) {
    throw new Error("Only HTTP and HTTPS URLs are allowed");
  }
  let url: URL;
  try {
    url = new URL(hasHttpScheme ? input : `https://${input}`);
  } catch {
    throw new Error("Invalid URL");
  }
  if (!/^https?:$/.test(url.protocol) || url.username || url.password || input.replace(/^https?:\/\//i, "").split(/[/?#]/, 1)[0].includes("@")) throw new Error("Invalid or credentialed URL");
  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  if (host.startsWith("[")) {
    const parts = host.slice(1, -1).split(":");
    const first = parseInt(parts[0], 16);
    const second = parseInt(parts[1] || "0", 16);
    // Only native global unicast; reject mapped IPv4, local, transition and documentation ranges.
    if (!(first >= 0x2000 && first <= 0x3fff) || first === 0x2002
      || (first === 0x2001 && (second < 0x200 || second === 0xdb8))
      || (first === 0x3fff && second <= 0xfff)) throw new Error("Non-public IP address");
  } else if (/^[\d.]+$/.test(host)) {
    if (!isPublicIpv4(host)) throw new Error("Non-public IP address");
  } else if (!host.includes(".") || /(?:^|\.)(?:localhost|local|localdomain|internal|lan|home|arpa|onion|invalid)$/.test(host)
    || host.split(".").some((label) => !/^[a-z\d](?:[a-z\d-]*[a-z\d])?$/.test(label))) {
    throw new Error("Invalid or local hostname");
  }
  url.hostname = host;
  return url.href;
}
