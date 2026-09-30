// `color` é a cor usada no CV (títulos e seções). Os tons da interface saem de hue/sat.
export const PALETTES = [
  { id: 'musgo', name: 'Musgo', hue: 95, sat: 25, neutralSat: 16, color: '#3f5f34' },
  { id: 'oceano', name: 'Oceano', hue: 208, sat: 42, neutralSat: 18, color: '#1d4e89' },
  { id: 'ameixa', name: 'Ameixa', hue: 318, sat: 24, neutralSat: 12, color: '#6b2f5c' },
  { id: 'terracota', name: 'Terracota', hue: 18, sat: 42, neutralSat: 20, color: '#9a4027' },
  { id: 'mostarda', name: 'Mostarda', hue: 42, sat: 52, neutralSat: 22, color: '#86610f' },
  { id: 'grafite', name: 'Grafite', hue: 220, sat: 10, neutralSat: 5, color: '#2f3640' },
];

export const DEFAULT_PALETTE = PALETTES[0];

/**
 * Transforma a escolha salva ({ id } ou { id: 'custom', hex }) numa paleta completa.
 * Para cores personalizadas, a cor do CV é escurecida para continuar legível impressa.
 */
export function resolvePalette(choice) {
  if (choice?.id === 'custom' && /^#[0-9a-f]{6}$/i.test(choice.hex || '')) {
    const { h, s, l } = hexToHsl(choice.hex);
    return {
      id: 'custom',
      hue: h,
      sat: clamp(s, 12, 60),
      neutralSat: Math.min(22, Math.round(s * 0.35)),
      color: hslToHex(h, Math.min(s, 70), Math.min(l, 34)),
    };
  }
  return PALETTES.find((palette) => palette.id === choice?.id) ?? DEFAULT_PALETTE;
}

export function hexToRgb(hex) {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function hexToHsl(hex) {
  const [r, g, b] = hexToRgb(hex).map((channel) => channel / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
  }

  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const channel = (n) => {
    const k = (n + h / 30) % 12;
    const value = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(value * 255).toString(16).padStart(2, '0');
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}
