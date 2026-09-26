import { FaAws, FaMicrosoft } from "react-icons/fa";
import { SiGooglecloud } from "react-icons/si";
import { FiCloud } from "react-icons/fi";

export function cloudBrand(provider?: string | null) {
  switch (provider?.trim().toUpperCase()) {
    case "AWS": return { name: "AWS", icon: FaAws, tone: "aws" };
    case "GCP": return { name: "Google Cloud", icon: SiGooglecloud, tone: "gcp" };
    case "AZURE": return { name: "Microsoft Azure", icon: FaMicrosoft, tone: "azure" };
    default: return { name: provider?.trim() || "Cloud not specified", icon: FiCloud, tone: "unknown" };
  }
}

export function deploymentAddress(value?: string | null) {
  if (!value?.trim()) return null;
  try {
    const url = new URL(value.trim());
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return { href: url.href, label: `${url.host}${url.pathname === "/" ? "" : url.pathname}${url.search}${url.hash}` };
  } catch { return null; }
}
