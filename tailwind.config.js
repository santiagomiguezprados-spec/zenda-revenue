/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Marca ───────────────────────────────────────────────────────
        g:        '#59D7A2',   // verde CTA dark / positivo
        'g-ink':  '#0E7A4E',   // verde texto WCAG AA en claro
        'g-logo': '#009444',   // verde wordmark "zenda."
        m:        '#E71CA2',   // magenta énfasis máximo
        'm-ink':  '#B0157C',   // magenta texto WCAG AA en claro
        'm-cta':  '#D91A98',   // magenta CTA con texto blanco
        s:        '#95D6EA',   // sky: data / analytics / tercer acento
        k:        '#0A0A0B',   // negro
        w:        '#FAFBF9',   // blanco tintado (nunca blanco puro)
        gray:     '#F2F3F0',   // divisores / hover
        bdr:      '#E4E5E1',   // bordes sutiles

        // ── Semántica reporting ─────────────────────────────────────────
        up:          '#0E7A4E',
        'up-bg':     'rgba(89,215,162,0.16)',
        down:        '#C2334D',
        'down-bg':   'rgba(194,51,77,0.10)',
        'up-dark':   '#59D7A2',
        'down-dark': '#FF8298',

        // ── Plataformas ─────────────────────────────────────────────────
        'p-google':   '#4285F4',
        'p-meta':     '#1877F2',
        'p-apple':    '#1C1C1E',
        'p-x':        '#14171A',
        'p-linkedin': '#0A66C2',
        'p-ga4':      '#E37400',
        'p-tiktok':   '#00B7C4',
        'p-singular': '#FF6B35',

        // ── Aliases — sin romper componentes existentes ─────────────────
        primary:       '#59D7A2',
        secondary:     '#E71CA2',
        tertiary:      '#95D6EA',
        dark:          '#0A0A0B',
        textPrimary:   '#0A0A0B',
        textSecondary: 'rgba(10,10,11,0.62)',
        background:    '#FAFBF9',
        card:          '#FAFBF9',
        success:       '#0E7A4E',
        danger:        '#C2334D',
        warning:       '#E37400',
        accent:        '#59D7A2',
        'accent-dark': '#0E7A4E',
      },

      fontFamily: {
        // Circular Std como sans base (body)
        sans:    ["'Circular Std'", '-apple-system', "'Segoe UI'", "'Helvetica Neue'", 'sans-serif'],
        body:    ["'Circular Std'", '-apple-system', "'Segoe UI'", "'Helvetica Neue'", 'sans-serif'],
        // Recoleta Alt para títulos y valores grandes
        display: ["'Recoleta Alt'", 'Georgia', "'Times New Roman'", 'serif'],
        heading: ["'Recoleta Alt'", 'Georgia', "'Times New Roman'", 'serif'],
        // Montserrat solo para el wordmark
        logo:    ["'Montserrat'", 'sans-serif'],
        // Mono para labels / tags / métricas-labels (UPPERCASE)
        mono:    ["'SF Mono'", "'Fira Code'", "'Cascadia Code'", 'ui-monospace', 'monospace'],
      },

      // Radios exactos del token — SIN box-shadow (regla innegociable)
      borderRadius: {
        card:  '16px',
        panel: '20px',
        pill:  '100px',
        tag:   '4px',
      },

      borderWidth: {
        brand: '1.5px',
      },
    },
  },
  plugins: [],
}
