/**
 * constants/typography.ts
 *
 * Escala tipográfica — Apple HIG text styles adaptados a SnapSite.
 * Complementa a constants/spacing.ts: mismo criterio, un solo lugar de verdad.
 *
 * Uso:
 *   import { type } from '@/constants/typography';
 *   <Text style={[type.title1, { color: colors.foreground }]} />
 *
 * Los pesos y tamaños siguen la jerarquía HIG (Large Title → Caption) con
 * el tracking negativo en títulos que ya usa la pantalla Home.
 */

import type { TextStyle } from "react-native";

export const type = {
  /** Título de pantalla principal (Large Title) — ej. nombre del workspace */
  largeTitle: {
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.6,
    lineHeight: 40,
  },
  /** Título de pantalla estándar */
  title1: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 34,
  },
  /** Título de sección grande / cabecera de modal */
  title2: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.35,
    lineHeight: 28,
  },
  /** Título de sección */
  title3: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.3,
    lineHeight: 25,
  },
  /** Título de fila / card, botones prominentes */
  headline: {
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  /** Texto de cuerpo */
  body: {
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 22,
  },
  /** Texto secundario (subtítulos, descripciones) */
  subhead: {
    fontSize: 15,
    fontWeight: "400",
    lineHeight: 20,
  },
  /** Notas al pie, metadata */
  footnote: {
    fontSize: 13,
    fontWeight: "400",
    lineHeight: 18,
  },
  /** Metadata mínima, contadores */
  caption: {
    fontSize: 12,
    fontWeight: "400",
    lineHeight: 16,
  },
  /** Eyebrow / label de sección en uppercase con tracking amplio */
  eyebrow: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    lineHeight: 16,
  },
} as const satisfies Record<string, TextStyle>;

export type TypeKey = keyof typeof type;
