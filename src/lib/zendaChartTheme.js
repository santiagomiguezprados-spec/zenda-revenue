/**
 * zendaChartTheme.js
 * Puerto del tema Zenda de Chart.js → Recharts.
 *
 * Uso básico:
 *   import { chartDefaults, tooltipStyle, ds, PALETTE } from '@/lib/zendaChartTheme'
 *
 *   <CartesianGrid {...chartDefaults.cartesianGrid} />
 *   <XAxis        {...chartDefaults.xAxis} />
 *   <YAxis        {...chartDefaults.yAxis} />
 *   <Tooltip      {...tooltipStyle} />
 *   <Legend       {...chartDefaults.legend} />
 *
 *   // Serie con color de paleta por índice:
 *   <Line {...ds(0)} dataKey="cpl" name="CPL" />
 *
 *   // Serie por nombre de plataforma:
 *   <Bar  {...ds('google')} dataKey="spend" name="Google Spend" />
 *
 *   // Serie con hex directo:
 *   <Area {...ds('#E71CA2')} dataKey="budget" name="Presupuesto" />
 */

// ── Paleta de series (orden de uso recomendado) ──────────────────────────
const PALETTE_SERIES = [
  '#59D7A2', // verde: métrica principal, positivo
  '#E71CA2', // magenta: énfasis, segunda serie
  '#95D6EA', // sky: tercera serie, datos/analytics
  '#0A0A0B', // negro: comparativo, período anterior
  '#0E7A4E', // verde ink: cuarta serie si es necesario
];

// ── Colores por plataforma ────────────────────────────────────────────────
const PALETTE_PLATFORMS = {
  google:   '#4285F4',
  meta:     '#1877F2',
  apple:    '#1C1C1E',
  x:        '#14171A',
  linkedin: '#0A66C2',
  ga4:      '#E37400',
  tiktok:   '#00B7C4',
  singular: '#FF6B35',
};

const COLOR_TEXT_MUTED = 'rgba(10,10,11,0.62)';
const COLOR_GRIDLINE   = '#E4E5E1';
const COLOR_BLACK      = '#0A0A0B';
const FONT_FAMILY      = "'Circular Std', -apple-system, 'Segoe UI', sans-serif";

// ── Utilidades ────────────────────────────────────────────────────────────

/** Convierte un hex #RRGGBB a rgba(r,g,b,alpha). */
export function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Resuelve un colorKey (índice, nombre de plataforma o hex) al valor hex.
 * Devuelve verde (#59D7A2) como fallback.
 */
export function resolveColor(colorKey) {
  if (colorKey == null) return PALETTE_SERIES[0];
  if (typeof colorKey === 'string' && PALETTE_PLATFORMS[colorKey.toLowerCase()])
    return PALETTE_PLATFORMS[colorKey.toLowerCase()];
  if (typeof colorKey === 'string' && colorKey.startsWith('#')) return colorKey;
  if (typeof colorKey === 'number') return PALETTE_SERIES[colorKey] ?? PALETTE_SERIES[0];
  return PALETTE_SERIES[0];
}

// ── Defaults para componentes Recharts ───────────────────────────────────

/**
 * Props spreadeables para CartesianGrid, XAxis, YAxis y Legend.
 *
 * @example
 * <CartesianGrid {...chartDefaults.cartesianGrid} />
 * <XAxis        {...chartDefaults.xAxis} dataKey="mes" />
 * <YAxis        {...chartDefaults.yAxis} />
 */
export const chartDefaults = {
  cartesianGrid: {
    stroke: COLOR_GRIDLINE,
    strokeDasharray: '0',
    vertical: false,
  },
  xAxis: {
    tick: { fontFamily: FONT_FAMILY, fontSize: 10, fill: COLOR_TEXT_MUTED },
    axisLine: false,
    tickLine: false,
  },
  yAxis: {
    tick: { fontFamily: FONT_FAMILY, fontSize: 10, fill: COLOR_TEXT_MUTED },
    axisLine: false,
    tickLine: false,
    width: 48,
  },
  legend: {
    wrapperStyle: {
      fontFamily: FONT_FAMILY,
      fontSize: '11px',
      color: COLOR_TEXT_MUTED,
    },
  },
};

// ── Tooltip de marca ──────────────────────────────────────────────────────

/**
 * Props spreadeables para el componente <Tooltip> de Recharts.
 * Fondo negro, tipografía Circular Std, sin borde — igual que el tooltip
 * del tema Chart.js original.
 *
 * @example
 * <Tooltip {...tooltipStyle} />
 */
export const tooltipStyle = {
  contentStyle: {
    background: COLOR_BLACK,
    border: 'none',
    borderRadius: '8px',
    padding: '10px 14px',
    fontFamily: FONT_FAMILY,
    fontSize: '11px',
    color: '#fff',
  },
  labelStyle: {
    color: '#fff',
    fontWeight: 700,
    fontFamily: FONT_FAMILY,
    marginBottom: '4px',
  },
  itemStyle: {
    color: 'rgba(255,255,255,0.75)',
    fontFamily: FONT_FAMILY,
  },
  cursor: { stroke: COLOR_GRIDLINE, strokeWidth: 1 },
};

// ── Factory de datasets ───────────────────────────────────────────────────

/**
 * Devuelve props de estilo de marca para Line, Bar o Area.
 *
 * @param {string|number} colorKey  Índice de paleta, nombre de plataforma o hex.
 * @param {object}        overrides Props adicionales o que sobreescriben el default.
 * @returns {object} Props listas para spreadear en <Line>, <Bar> o <Area>.
 *
 * @example — Line
 * <Line {...ds(0)} dataKey="cpl" name="CPL" />
 *
 * @example — Bar con plataforma
 * <Bar  {...ds('meta')} dataKey="spend" name="Meta Spend" />
 *
 * @example — Area con fill
 * <Area {...ds(1, { fill: 'rgba(231,28,162,0.08)' })} dataKey="budget" />
 */
export function ds(colorKey, overrides = {}) {
  const color = resolveColor(colorKey);
  return {
    // Line / Area
    stroke: color,
    strokeWidth: 2,
    dot: false,
    activeDot: { r: 4, fill: color, strokeWidth: 0 },

    // Area fill sutil
    fill: hexToRgba(color, 0.12),

    // Bar
    radius: [4, 4, 0, 0],

    ...overrides,
  };
}

// ── Exportaciones principales ─────────────────────────────────────────────

/** Paleta completa: array de series + objeto de plataformas. */
export const PALETTE = Object.assign([...PALETTE_SERIES], {
  platforms: PALETTE_PLATFORMS,
});
