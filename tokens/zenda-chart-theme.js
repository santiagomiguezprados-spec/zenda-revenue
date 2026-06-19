/**
 * zenda-chart-theme.js
 * Tema de marca unificado para Chart.js en todos los reportes de Zenda.
 *
 * Uso: incluir DESPUES del script de Chart.js via CDN, luego llamar
 *   ZendaChart.applyTheme(Chart)  una vez antes de crear cualquier chart.
 *
 * Sin imports ni exports. Se adjunta a window para uso en HTML standalone.
 */

(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /* Paleta de colores de marca                                          */
  /* ------------------------------------------------------------------ */

  /** Colores de series en orden de uso recomendado */
  var PALETTE_SERIES = [
    '#59D7A2', /* verde: metrica principal, positivo   */
    '#E71CA2', /* magenta: enfasis, segunda serie      */
    '#95D6EA', /* sky: tercera serie, datos/analytics  */
    '#0A0A0B', /* negro: comparativo, periodo anterior */
    '#0E7A4E', /* verde ink: cuarta serie si es necesario */
  ];

  /** Colores por plataforma */
  var PALETTE_PLATFORMS = {
    google:   '#4285F4',
    meta:     '#1877F2',
    apple:    '#1C1C1E',
    x:        '#14171A',
    linkedin: '#0A66C2',
    ga4:      '#E37400',
    tiktok:   '#00B7C4',
    singular: '#FF6B35',
  };

  /* Colores compartidos de UI */
  var COLOR_TEXT_MUTED = 'rgba(10,10,11,.62)';
  var COLOR_GRIDLINE   = '#E4E5E1';
  var COLOR_BLACK      = '#0A0A0B';
  var COLOR_WHITE      = '#FFFFFF';
  var FONT_FAMILY      = "'Circular Std', sans-serif";

  /* ------------------------------------------------------------------ */
  /* Utilidades internas                                                  */
  /* ------------------------------------------------------------------ */

  /**
   * Convierte un hex a rgba con la opacidad indicada.
   * Solo admite hex de 6 caracteres (#RRGGBB).
   */
  function hexToRgba(hex, alpha) {
    var r = parseInt(hex.slice(1, 3), 16);
    var g = parseInt(hex.slice(3, 5), 16);
    var b = parseInt(hex.slice(5, 7), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  /**
   * Resuelve un colorKey (indice numerico, nombre de plataforma o hex directo)
   * y devuelve el valor hex correspondiente.
   * Por defecto retorna verde (#59D7A2).
   */
  function resolveColor(colorKey) {
    if (colorKey === undefined || colorKey === null) {
      return PALETTE_SERIES[0]; /* verde por defecto */
    }
    /* Nombre de plataforma */
    if (typeof colorKey === 'string' && PALETTE_PLATFORMS[colorKey.toLowerCase()]) {
      return PALETTE_PLATFORMS[colorKey.toLowerCase()];
    }
    /* Hex directo */
    if (typeof colorKey === 'string' && colorKey.charAt(0) === '#') {
      return colorKey;
    }
    /* Indice numerico */
    if (typeof colorKey === 'number') {
      return PALETTE_SERIES[colorKey] || PALETTE_SERIES[0];
    }
    /* Fallback: verde */
    return PALETTE_SERIES[0];
  }

  /* ------------------------------------------------------------------ */
  /* applyTheme(Chart)                                                   */
  /* Muta Chart.defaults una sola vez para que todos los charts hereden  */
  /* la tipografia, colores y estilo de Zenda sin configuracion extra.   */
  /* ------------------------------------------------------------------ */

  function applyTheme(Chart) {
    if (!Chart || !Chart.defaults) {
      console.warn('ZendaChart.applyTheme: se esperaba una instancia de Chart.js');
      return;
    }

    var d = Chart.defaults;

    /* Tipografia global */
    d.font.family = FONT_FAMILY;
    d.font.size   = 11;

    /* Color de texto por defecto (labels de ejes, etc.) */
    d.color = COLOR_TEXT_MUTED;

    /* Leyenda */
    d.plugins.legend.labels.font        = { family: FONT_FAMILY, size: 11 };
    d.plugins.legend.labels.usePointStyle = true;
    d.plugins.legend.labels.pointStyleWidth = 10;
    d.plugins.legend.labels.padding     = 16;

    /* Tooltip de marca: fondo negro, texto blanco, sin cuadros de color */
    d.plugins.tooltip.backgroundColor = COLOR_BLACK;
    d.plugins.tooltip.titleColor      = COLOR_WHITE;
    d.plugins.tooltip.bodyColor       = 'rgba(255,255,255,.75)';
    d.plugins.tooltip.padding         = 12;
    d.plugins.tooltip.cornerRadius    = 8;
    d.plugins.tooltip.displayColors   = false;
    d.plugins.tooltip.titleFont       = { family: FONT_FAMILY, size: 11, weight: '700' };
    d.plugins.tooltip.bodyFont        = { family: FONT_FAMILY, size: 11 };

    /* Lineas */
    d.elements.line.tension      = 0.35;
    d.elements.line.borderWidth  = 2;

    /* Puntos: invisibles en reposo, aparecen al hacer hover */
    d.elements.point.radius      = 0;
    d.elements.point.hoverRadius = 4;

    /* Barras: esquinas redondeadas */
    d.elements.bar.borderRadius  = 4;

    /* Gridlines: solo en eje Y, muy sutiles, sin borde del eje.
     *
     * Chart.js 3+ usa d.scale para el tipo 'linear' generico.
     * Si el chart define sus propios scales.x/y, estas opciones
     * se fusionan; la configuracion por chart siempre prevalece.
     * Para escalar el efecto correctamente, aplica tambien en el
     * bloque options.scales de cada chart (ver snippet en proceso-reporte.md).
     */
    var scaleDefaults = {
      grid: {
        color:       COLOR_GRIDLINE,
        drawBorder:  false,
      },
      ticks: {
        color: COLOR_TEXT_MUTED,
        font:  { family: FONT_FAMILY, size: 10 },
      },
    };

    /* Eje lineal: gridlines sutiles */
    if (d.scales && d.scales.linear) {
      Object.assign(d.scales.linear.grid,  scaleDefaults.grid);
      Object.assign(d.scales.linear.ticks, scaleDefaults.ticks);
    }

    /* Eje categorico: sin gridlines (se ocultan via color transparente) */
    if (d.scales && d.scales.category) {
      d.scales.category.grid.color      = 'transparent';
      d.scales.category.grid.drawBorder = false;
      Object.assign(d.scales.category.ticks, scaleDefaults.ticks);
    }

    /* Para charts con ejes de tiempo (time) */
    if (d.scales && d.scales.time) {
      Object.assign(d.scales.time.grid,  scaleDefaults.grid);
      Object.assign(d.scales.time.ticks, scaleDefaults.ticks);
    }
  }

  /* ------------------------------------------------------------------ */
  /* ds(label, data, colorKey)                                           */
  /* Factory de datasets estilizados. Devuelve un objeto dataset listo   */
  /* para usar en data.datasets[]. Funciona para type 'line' y 'bar'.   */
  /* ------------------------------------------------------------------ */

  /**
   * Construye un dataset con estilos de marca.
   *
   * @param {string}           label     Nombre de la serie (leyenda y tooltip).
   * @param {Array}            data      Array de valores numericos.
   * @param {string|number}    colorKey  Indice de palette, nombre de plataforma o hex.
   *                                     Por defecto usa verde (palette[0]).
   * @returns {Object}  Objeto dataset compatible con Chart.js data.datasets[].
   */
  function ds(label, data, colorKey) {
    var color = resolveColor(colorKey);

    return {
      label:           label,
      data:            data || [],

      /* Linea */
      borderColor:     color,
      borderWidth:     2,
      tension:         0.35,

      /* Relleno muy sutil bajo la curva */
      backgroundColor: hexToRgba(color, 0.12),
      fill:            false,

      /* Puntos */
      pointRadius:      0,
      pointHoverRadius: 4,
      pointBackgroundColor: color,

      /* Barras (ignorado si el chart es de tipo line) */
      borderRadius:    4,
    };
  }

  /* ------------------------------------------------------------------ */
  /* API publica                                                          */
  /* ------------------------------------------------------------------ */

  window.ZendaChart = {
    /** Paleta de colores de marca */
    palette: Object.assign(PALETTE_SERIES.slice(), { platforms: PALETTE_PLATFORMS }),

    /**
     * Aplica el tema Zenda a Chart.defaults.
     * Llamar una vez, antes de instanciar cualquier chart.
     * @param {object} Chart  La clase Chart importada via CDN (window.Chart).
     */
    applyTheme: applyTheme,

    /**
     * Crea un dataset con estilos de marca.
     * @param {string}        label     Nombre de la serie.
     * @param {Array}         data      Valores.
     * @param {string|number} colorKey  Indice, plataforma o hex. Defecto: verde.
     */
    ds: ds,
  };

}());
