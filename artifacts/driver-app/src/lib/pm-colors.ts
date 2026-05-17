// Premium Moroccan design tokens — applied globally
export const PM = {
  // Backgrounds
  BG: "linear-gradient(135deg, #1A0A06 0%, #2C1810 100%)",
  BG_SOLID: "#1A0A06",
  BG_CARD: "rgba(255,255,255,0.08)",
  BG_CARD_HOVER: "rgba(255,255,255,0.12)",
  BG_HEADER: "linear-gradient(160deg, #2C1810 0%, #1A0A06 100%)",

  // Accents
  TC: "#E85C30",          // terracotta (brighter)
  TC_DIM: "rgba(232,92,48,0.2)",
  GOLD: "#D4880C",
  GOLD_LIGHT: "#FADB5F",
  GREEN: "#2A7A48",
  GREEN_GLOW: "#2AE86C",

  // Text
  TEXT: "rgba(255,255,255,0.95)",
  TEXT_MID: "rgba(255,255,255,0.65)",
  TEXT_LIGHT: "rgba(255,255,255,0.40)",

  // Borders
  BORDER: "rgba(255,255,255,0.15)",
  BORDER_GOLD: "rgba(212,136,12,0.35)",

  // Card styles (use as style object)
  CARD: {
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.15)",
  } as React.CSSProperties,

  CARD_GOLD: {
    background: "rgba(255,255,255,0.08)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,0.15)",
    borderLeft: "4px solid #D4880C",
  } as React.CSSProperties,

  // CTA button (gold gradient)
  CTA: {
    background: "linear-gradient(135deg, #FADB5F 0%, #D4880C 100%)",
    color: "#1A0A06",
    fontWeight: 700,
  } as React.CSSProperties,

  // Online status pill
  ONLINE: {
    background: "rgba(42,122,72,0.2)",
    border: "1px solid rgba(42,122,72,0.5)",
    boxShadow: "0 0 12px rgba(42,234,108,0.25)",
  } as React.CSSProperties,

  // Moroccan star pattern
  STAR_PATTERN: {
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0l2 18 18 2-18 2-2 18-2-18-18-2 18-2z' fill='%23D4880C' fill-rule='evenodd'/%3E%3C/svg%3E")`,
    backgroundSize: "40px 40px",
  } as React.CSSProperties,

  // Bottom nav
  NAV: {
    background: "rgba(26,10,6,0.90)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    borderTop: "1px solid rgba(255,255,255,0.10)",
  } as React.CSSProperties,
} as const;

// For pages still using simple color constants
export const TC   = PM.TC;
export const GOLD = PM.GOLD;
export const GREEN = PM.GREEN;
export const SAND = PM.BG_SOLID;
export const BORDER = PM.BORDER;
export const BROWN = PM.TEXT;
export const BROWN_MID = PM.TEXT_MID;
export const BROWN_LIGHT = PM.TEXT_LIGHT;

import type React from "react";
