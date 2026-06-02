import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/** Convert a hex color (#rrggbb) to an "h s% l%" string usable in CSS HSL vars. */
const hexToHslTriplet = (hex: string): string | null => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return null;
  let r = parseInt(m[1], 16) / 255;
  let g = parseInt(m[2], 16) / 255;
  let b = parseInt(m[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
};

const applyFavicon = (url: string | null) => {
  if (!url) return;
  let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.href = url;
};

export const applyPlatformSettings = (s: any) => {
  if (!s) return;
  if (s.app_name) document.title = s.app_name;
  applyFavicon(s.favicon_url ?? null);
  const root = document.documentElement;
  const primary = s.primary_accent ? hexToHslTriplet(s.primary_accent) : null;
  const secondary = s.secondary_accent ? hexToHslTriplet(s.secondary_accent) : null;
  if (primary) root.style.setProperty("--primary", primary);
  if (secondary) root.style.setProperty("--secondary", secondary);
};

/** Loads global platform settings once and keeps branding in sync in realtime. */
const PlatformSettingsApplier = () => {
  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await supabase.from("platform_settings").select("*").limit(1).maybeSingle();
      if (active && data) applyPlatformSettings(data);
    };
    load();
    const ch = supabase
      .channel("platform_settings_global")
      .on("postgres_changes", { event: "*", schema: "public", table: "platform_settings" }, (p) => {
        applyPlatformSettings(p.new);
      })
      .subscribe();
    return () => { active = false; supabase.removeChannel(ch); };
  }, []);
  return null;
};

export default PlatformSettingsApplier;
