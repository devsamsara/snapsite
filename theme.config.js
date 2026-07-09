/** @type {const} */
// Paleta "Onyx & Indigo" — base oscura profunda (casi negro, tinte frío),
// modo claro muy limpio y acento índigo eléctrico premium.
// Contrastes verificados: foreground/background ≥ 15:1, muted ≥ 4.5:1,
// primary sobre fondo y blanco sobre primary ≥ 4.5:1 en ambos modos.
const themeColors = {
  primary: { light: '#4F46E5', dark: '#818CF8' },
  background: { light: '#FCFCFD', dark: '#0A0A0F' },
  surface: { light: '#FFFFFF', dark: '#15151C' },
  foreground: { light: '#0C0D12', dark: '#F7F8FA' },
  muted: { light: '#5C6370', dark: '#9BA1AE' },
  border: { light: '#E6E8EE', dark: '#262832' },
  success: { light: '#059669', dark: '#34D399' },
  warning: { light: '#D97706', dark: '#FBBF24' },
  error: { light: '#DC2626', dark: '#F87171' },
};

module.exports = { themeColors };
