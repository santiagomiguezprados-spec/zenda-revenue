// ─── Zenda Finance — Mock Data ────────────────────────────────────────────────

// ── CASHFLOW ──────────────────────────────────────────────────────────────────
export const cashflowWaterfall = [
  { name: 'Saldo Inicial', value: 45200,  fill: '#59D7A2' },
  { name: 'Ingresos',      value: 82400,  fill: '#59D7A2' },
  { name: 'Egresos',       value: -58300, fill: '#E57373' },
  { name: 'Gs. Bancarios', value: -1200,  fill: '#E57373' },
  { name: 'Financiero',    value: -3100,  fill: '#E57373' },
  { name: 'Saldo Final',   value: 65000,  fill: '#59D7A2' },
]
export const cashflowKPI = {
  pesificado: '$ 164,96 M',
  dolarizado: '$ 114 mil',
  neto2024:   '70,4 mil',
}

// ── BUDGET VS P&L ─────────────────────────────────────────────────────────────
export const budgetKPI = { neto2025: '71,9 mil', neto2024: '70,4 mil' }

const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
export const budgetEbitda = [
  { mes: 'ene 23', real: 14.9, budget: 5.6 },
  { mes: 'feb 23', real: 5.3,  budget: 5.3 },
  { mes: 'mar 23', real: 11.9, budget: 8.3 },
  { mes: 'abr 23', real: 11.6, budget: 7.4 },
  { mes: 'may 23', real: -7.4, budget: 2.9 },
  { mes: 'jun 23', real: 8.3,  budget: 10.3 },
  { mes: 'jul 23', real: 2.9,  budget: 18.8 },
  { mes: 'ago 23', real: 10.3, budget: 8.7 },
  { mes: 'sep 23', real: 18.8, budget: 11 },
  { mes: 'oct 23', real: 11,   budget: 9.5 },
  { mes: 'nov 23', real: 9.5,  budget: 9.5 },
  { mes: 'dic 23', real: 9.5,  budget: 8.9 },
  { mes: 'ene 24', real: 8.9,  budget: 7.8 },
  { mes: 'feb 24', real: 7.8,  budget: 11.5 },
  { mes: 'mar 24', real: 11.5, budget: 25.5 },
  { mes: 'abr 24', real: -25.5,budget: 4.1 },
  { mes: 'may 24', real: 4.1,  budget: 2.2 },
  { mes: 'jun 24', real: 2.2,  budget: 3.4 },
  { mes: 'jul 24', real: 3.4,  budget: 5.9 },
  { mes: 'ago 24', real: 5.9,  budget: 12.6 },
  { mes: 'sep 24', real: 12.6, budget: -3.4 },
  { mes: 'oct 24', real: -3.4, budget: -0.7 },
  { mes: 'nov 24', real: -0.7, budget: -0.8 },
  { mes: 'dic 24', real: -0.8, budget: 3.5 },
  { mes: 'ene 25', real: 3.5,  budget: 3.7 },
  { mes: 'feb 25', real: 3.7,  budget: 10.8 },
  { mes: 'mar 25', real: 10.8, budget: 7.9 },
  { mes: 'abr 25', real: 7.9,  budget: 7.1 },
  { mes: 'may 25', real: 7.1,  budget: 16 },
  { mes: 'jun 25', real: 16,   budget: 9.3 },
  { mes: 'jul 25', real: 9.3,  budget: 13.5 },
  { mes: 'ago 25', real: 6.2,  budget: 6.4 },
  { mes: 'sep 25', real: 6.4,  budget: 8 },
  { mes: 'oct 25', real: 8,    budget: 9 },
  { mes: 'nov 25', real: 13.5, budget: 10 },
  { mes: 'dic 25', real: 11.9, budget: 10 },
]
export const budgetSuma = budgetEbitda.map((d, i) => ({
  mes: d.mes,
  acum: budgetEbitda.slice(0, i + 1).reduce((s, x) => s + x.real, 0),
}))

export const budgetRevenue = [
  { mes: 'ene 23', real: 36.2, budget: 34.0 },
  { mes: 'feb 23', real: 33.8, budget: 35.5 },
  { mes: 'mar 23', real: 38.5, budget: 37.2 },
  { mes: 'abr 23', real: 35.1, budget: 36.8 },
  { mes: 'may 23', real: 31.4, budget: 38.0 },
  { mes: 'jun 23', real: 37.2, budget: 39.5 },
  { mes: 'jul 23', real: 34.8, budget: 42.1 },
  { mes: 'ago 23', real: 39.5, budget: 38.7 },
  { mes: 'sep 23', real: 44.1, budget: 41.0 },
  { mes: 'oct 23', real: 41.3, budget: 40.5 },
  { mes: 'nov 23', real: 38.9, budget: 39.5 },
  { mes: 'dic 23', real: 36.5, budget: 37.0 },
  { mes: 'ene 24', real: 42.1, budget: 40.5 },
  { mes: 'feb 24', real: 39.8, budget: 44.0 },
  { mes: 'mar 24', real: 48.2, budget: 52.0 },
  { mes: 'abr 24', real: 44.6, budget: 46.8 },
  { mes: 'may 24', real: 46.3, budget: 45.2 },
  { mes: 'jun 24', real: 43.8, budget: 44.0 },
  { mes: 'jul 24', real: 47.5, budget: 48.5 },
  { mes: 'ago 24', real: 50.2, budget: 52.1 },
  { mes: 'sep 24', real: 53.8, budget: 50.0 },
  { mes: 'oct 24', real: 48.1, budget: 49.5 },
  { mes: 'nov 24', real: 45.7, budget: 47.0 },
  { mes: 'dic 24', real: 43.2, budget: 44.5 },
  { mes: 'ene 25', real: 49.8, budget: 51.0 },
  { mes: 'feb 25', real: 52.3, budget: 53.5 },
  { mes: 'mar 25', real: 56.1, budget: 55.0 },
  { mes: 'abr 25', real: 54.7, budget: 56.2 },
  { mes: 'may 25', real: 53.4, budget: 58.0 },
  { mes: 'jun 25', real: 58.9, budget: 57.5 },
  { mes: 'jul 25', real: 55.2, budget: 59.0 },
  { mes: 'ago 25', real: 51.8, budget: 54.0 },
  { mes: 'sep 25', real: 54.3, budget: 56.5 },
  { mes: 'oct 25', real: 57.6, budget: 58.0 },
  { mes: 'nov 25', real: 60.2, budget: 59.5 },
  { mes: 'dic 25', real: 58.4, budget: 60.0 },
]

// ── ACTIVOS + VENTAS ──────────────────────────────────────────────────────────
export const activosKPI = {
  bancarioUSD:  '$ 164,96 M',
  dolarizado:   '$ 114 mil',
  totalConDeudas: '$ 118 mil',
}
export const ventasTrimestrales = [
  { q: 'T1 2022', v: 74.9 },  { q: 'T2 2022', v: 102.6 }, { q: 'T3 2022', v: 130.1 }, { q: 'T4 2022', v: 154.7 },
  { q: 'T1 2023', v: 106.6 }, { q: 'T2 2023', v: 105.3 }, { q: 'T3 2023', v: 116.9 }, { q: 'T4 2023', v: 133.3 },
  { q: 'T1 2024', v: 143.1 }, { q: 'T2 2024', v: 159.8 }, { q: 'T3 2024', v: 172.3 }, { q: 'T4 2024', v: 158.5 },
  { q: 'T1 2025', v: 153.8 }, { q: 'T2 2025', v: 161.4 }, { q: 'T3 2025', v: 166.1 }, { q: 'T4 2025', v: 144.4 },
  { q: 'T1 2026', v: 56.2 },
]
export const saldosBancarios = [
  { mes: 'dic 23', v: 116 }, { mes: 'ene 24', v: 132 }, { mes: 'feb 24', v: 143 },
  { mes: 'mar 24', v: 154 }, { mes: 'abr 24', v: 172 }, { mes: 'may 24', v: 174 },
  { mes: 'jun 24', v: 171 }, { mes: 'jul 24', v: 181 }, { mes: 'ago 24', v: 150 },
  { mes: 'sep 24', v: 140 }, { mes: 'oct 24', v: 110 }, { mes: 'nov 24', v: 116 },
  { mes: 'dic 24', v: 101 }, { mes: 'ene 25', v: 99  }, { mes: 'feb 25', v: 99  },
  { mes: 'mar 25', v: 99  }, { mes: 'abr 25', v: 91  }, { mes: 'may 25', v: 80  },
  { mes: 'jun 25', v: 91  }, { mes: 'jul 25', v: 114 }, { mes: 'ago 25', v: 118 },
  { mes: 'sep 25', v: 91  }, { mes: 'oct 25', v: 98  }, { mes: 'nov 25', v: 104 },
  { mes: 'dic 25', v: 100 },
]
export const cobranzasUSD = [
  { cliente: 'TAI LOY',               porCobrar: '5.791,16',     _highlight: false },
  { cliente: 'Wyndham Internacional', porCobrar: '3.500,00',     _highlight: false },
  { cliente: 'Baby Secur',            porCobrar: '1.219,34',     _highlight: false },
  { cliente: 'Total',                 porCobrar: '10.510,50',    _bold: true, _highlight: true },
]
export const cobranzasARS = [
  { cliente: 'Wyndham Local',     porCobrar: '10.333.929,79',  _highlight: false },
  { cliente: 'SANCOR COOP.',      porCobrar: '5.858.470,33',   _highlight: false },
  { cliente: 'BRUSTARK S.A.',     porCobrar: '3.523.348,76',   _highlight: false },
  { cliente: 'DEPI LIFE',         porCobrar: '3.224.137,76',   _highlight: false },
  { cliente: 'Otros',             porCobrar: '5.184.644,64',   _highlight: false },
  { cliente: 'Total',             porCobrar: '28.124.531,28',  _bold: true, _highlight: true },
]

// ── PASIVOS + COSTOS ──────────────────────────────────────────────────────────
export const pasivosKPI = {
  tcEstatico: 'TC 1.200',
  saldoPlanesUSD: '-54,2 mil',
  prestamosUSD:   '-4,1 mil',
  saldoIVA:       '-20,6 mil',
}
export const costosTrimestrales = [
  { q: 'T1 2021', v: 48 }, { q: 'T2 2021', v: 52 }, { q: 'T3 2021', v: 55 }, { q: 'T4 2021', v: 60 },
  { q: 'T1 2022', v: 63 }, { q: 'T2 2022', v: 70 }, { q: 'T3 2022', v: 75 }, { q: 'T4 2022', v: 82 },
  { q: 'T1 2023', v: 88 }, { q: 'T2 2023', v: 92 }, { q: 'T3 2023', v: 95 }, { q: 'T4 2023', v: 105 },
  { q: 'T1 2024', v: 112 },{ q: 'T2 2024', v: 118 },{ q: 'T3 2024', v: 122 },{ q: 'T4 2024', v: 130 },
]
export const distribucionCostos = [
  { name: 'OC2011a - Sueldos Base',             value: 55.1, fill: '#59D7A2' },
  { name: 'OC2011c - Sueldos Cargas Sociales',  value: 12.4, fill: '#53924D' },
  { name: 'OC2013 - Sueldos Exterior',          value:  8.7, fill: '#95D6EA' },
  { name: 'OC2021 - Oficinas',                  value:  5.6, fill: '#77BFBE' },
  { name: 'Otros',                              value: 18.2, fill: '#444' },
]
export const pivotCostos = {
  cols: ['sept 2024','oct 2024','mar 2024','abr 2024','ago 2024','may 2024','nov 2024','jul 2024','feb 2024','Total'],
  rows: [
    { cat: 'OC2011a - Sueldos Base',              vals: [28646.32, 29060.24, 22676.61, 25456.11, 26011.34, 24578.3,  35414.77, 26891.01, 20722,   691965.56] },
    { cat: 'OC2011c - Sueldos Cargas Sociales',   vals: [6577.2,   6872.37,  5326.9,   5983.69,  5962.52,  5787.54,  8138.01,  6288.83,  4859,    155949.98] },
    { cat: 'OC2013 - Sueldos Exterior',           vals: [3844.92,  3786.87,  4079.82,  2227.78,  3352.7,   658.05,   0,        1889.16,  2722,    109789.68] },
    { cat: 'OC2021 - Oficinas',                   vals: [12219.39, 2394.03,  1676.4,   2269.57,  2162.7,   1871.75,  0,        580.31,   2706,    69157.98]  },
    { cat: 'OC2012 - Terciarizados',              vals: [601.64,   627.35,   1150.15,  1184.85,  784.64,   1056.54,  0,        1503.34,  1341,    44384.1]   },
    { cat: 'OC2032 - Administrativos y Legales',  vals: [578.38,   676.66,   1128.14,  839.93,   497.78,   1709.94,  682.79,   489.87,   1080,    32783.18]  },
    { cat: 'OC2033a - Servicios en la Nube',      vals: [1020.05,  1550.23,  746.88,   738.37,   1044.04,  1469.96,  280,      1049.54,  1091,    29148.2]   },
    { cat: 'OC3000 - Intereses',                  vals: [1693.81,  1161.1,   3861.11,  2777.26,  1613.16,  974.07,   0,        564.35,   2203,    24632.53]  },
  ],
  totals: [51873.74, 51334.34, 49871.89, 47554.68, 47162.12, 46776.52, 45694.55, 44594.8, 44240, 1255755.58],
}

// ── GOP BY POD ────────────────────────────────────────────────────────────────
export const gopKPI = {
  contribucionUSD: '102,4 mil',
  contribucionARS: '135,4 M',
  clientes:        '22,0',
}
const podMeses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
function podData(baseVenta, baseCosto) {
  return podMeses.map((m) => ({
    mes: m,
    venta: baseVenta + (Math.random() - 0.3) * baseVenta * 0.3,
    costo: baseCosto + (Math.random() - 0.3) * baseCosto * 0.25,
  }))
}
export const gopPods = [
  { id: 'POD1', nombre: 'Consenso',                  margen: '7,7 mil',   data: podData(6200, 4500) },
  { id: 'POD2', nombre: 'Hipotecario',               margen: '5,5 mil',   data: podData(4800, 3600) },
  { id: 'POD3', nombre: 'Mercado Libre Sustentable', margen: '42,9 mil',  data: podData(8000, 5000) },
  { id: 'POD4', nombre: 'Wyndham',                   margen: '-26,8 mil', data: podData(4100, 6000) },
  { id: 'POD5', nombre: 'Tay Loi',                   margen: '-3,0 mil',  data: podData(3800, 4100) },
  { id: 'POD6', nombre: 'Sancor Seguros',            margen: '-19,9 mil', data: podData(3200, 5000) },
  { id: 'POD7', nombre: 'PPI',                       margen: '2,6 mil',   data: podData(4100, 3500) },
  { id: 'POD8', nombre: 'UEPM',                      margen: '927,1',     data: podData(3600, 3200) },
]

// ── CARTERA ───────────────────────────────────────────────────────────────────
export const carteraKPI = { carteraMensual: '21' }
export const carteraBarData = [
  { mes: 'ene', cost: 18200 }, { mes: 'feb', cost: 19400 }, { mes: 'mar', cost: 21000 },
  { mes: 'abr', cost: 19800 }, { mes: 'may', cost: 22100 }, { mes: 'jun', cost: 20500 },
  { mes: 'jul', cost: 21800 }, { mes: 'ago', cost: 23200 }, { mes: 'sep', cost: 22400 },
  { mes: 'oct', cost: 24100 }, { mes: 'nov', cost: 23800 }, { mes: 'dic', cost: 25000 },
]

// ── PEOPLE ────────────────────────────────────────────────────────────────────
export const peopleKPI = { headcount: '27', prev: '29' }
const payrollMeses = ['jul 24','ago 24','sep 24','oct 24','nov 24','dic 24','ene 25','feb 25']
export const payrollData = payrollMeses.map((m, i) => ({
  mes: m,
  strategist:   8.2 + i * 0.3,
  managers:     6.1 + i * 0.2,
  tls:          5.8 + i * 0.15,
  businessLead: 4.2 + i * 0.1,
  gerentes:     5.5 + i * 0.12,
  pasantes:     1.4 + i * 0.05,
}))
export const headcountData = [
  { mes: 'ene 24', n: 33 }, { mes: 'feb 24', n: 34 }, { mes: 'mar 24', n: 34 },
  { mes: 'abr 24', n: 34 }, { mes: 'may 24', n: 35 }, { mes: 'jun 24', n: 35 },
  { mes: 'jul 24', n: 35 }, { mes: 'ago 24', n: 33 }, { mes: 'sep 24', n: 31 },
  { mes: 'oct 24', n: 29 }, { mes: 'nov 24', n: 29 }, { mes: 'dic 24', n: 27 },
  { mes: 'ene 25', n: 27 }, { mes: 'feb 25', n: 26 },
]
export const notebooksData = [
  { estado: 'OK',           zender: 18 },
  { estado: 'PARA ARREGLAR',zender: 1  },
  { estado: 'LIBRE',        zender: 0  },
  { estado: 'BACK UP',      zender: 0  },
  { estado: 'ROBADA',       zender: 1  },
]
