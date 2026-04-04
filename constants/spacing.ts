/**
 * constants/spacing.ts
 *
 * Design token system — Apple HIG spacing guidelines for React Native / Expo.
 *
 * ─── Scale ────────────────────────────────────────────────────────────────────
 *   4-point base grid, matching iOS native spacing conventions.
 *
 * ─── Apple HIG references ────────────────────────────────────────────────────
 *   • Screen horizontal margin:  16–20 px  (standard content inset)
 *   • Section gap (between cards/groups): 24 px
 *   • Item gap (within a group): 8–12 px
 *   • Card internal padding: 16 px
 *   • List row height: 44 px minimum (touch target)
 *   • Form field height: 44–56 px
 *   • Primary button height: 50–56 px
 *   • Header title top spacing: 16 px below safe area
 *   • Bottom safe-area padding: 16–24 px
 */

export const spacing = {
  // ── Base scale ──────────────────────────────────────────────────────────────
  xs:   4,
  sm:   8,
  md:   12,
  base: 16,
  lg:   20,
  xl:   24,
  xxl:  32,
  xxxl: 48,

  // ── Screen layout ───────────────────────────────────────────────────────────
  /** Horizontal padding from screen edge to content — matches iOS standard 16 px */
  screenH: 16,
  /** Vertical padding at top of scrollable content (below header) */
  screenTop: 16,
  /** Vertical padding at bottom of scrollable content (above tab bar / safe area) */
  screenBottom: 32,

  // ── Sections ────────────────────────────────────────────────────────────────
  /** Gap between major sections (e.g. between two card groups) */
  sectionGap: 24,
  /** Gap between a section label and the card below it */
  sectionLabelGap: 8,
  /** Vertical margin above a section label */
  sectionLabelTop: 24,

  // ── Cards ───────────────────────────────────────────────────────────────────
  /** Internal padding of a card */
  cardPad: 16,
  /** Border radius of cards */
  cardRadius: 16,
  /** Gap between sibling cards */
  cardGap: 12,

  // ── List rows ───────────────────────────────────────────────────────────────
  /** Minimum touch target height per Apple HIG */
  rowMinHeight: 44,
  /** Horizontal padding inside a list row */
  rowPadH: 16,
  /** Vertical padding inside a list row */
  rowPadV: 12,
  /** Gap between icon and label in a row */
  rowIconGap: 12,
  /** Icon container size */
  rowIconSize: 36,
  /** Icon container border radius */
  rowIconRadius: 10,

  // ── Form fields ─────────────────────────────────────────────────────────────
  /** Height of a standard text input */
  inputHeight: 56,
  /** Border radius of inputs */
  inputRadius: 16,
  /** Gap between consecutive form fields */
  fieldGap: 16,
  /** Gap between label and input */
  labelGap: 8,

  // ── Buttons ─────────────────────────────────────────────────────────────────
  /** Height of a primary CTA button */
  btnHeight: 54,
  /** Border radius of primary buttons */
  btnRadius: 14,
  /** Horizontal padding inside buttons */
  btnPadH: 20,

  // ── Modals ──────────────────────────────────────────────────────────────────
  /** Horizontal padding inside a modal sheet */
  modalH: 20,
  /** Top padding of modal body content */
  modalTop: 8,
  /** Bottom padding of modal body content */
  modalBottom: 24,
  /** Gap between modal sections */
  modalSectionGap: 20,

  // ── Typography helpers ──────────────────────────────────────────────────────
  /** Section label: font size */
  sectionLabelSize: 11,
  /** Section label: letter spacing */
  sectionLabelTracking: 0.6,
} as const;

export type SpacingKey = keyof typeof spacing;
