/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Paleta oficial Zenda (BRAND.md) ──────────────────────────────
        primary:   '#59D7A2',   // Zenda Green — CTAs, active states
        secondary: '#E71CA2',   // Zenda Pink  — secondary actions
        tertiary:  '#95D6EA',   // Zenda Cyan  — data viz, tertiary
        // Logo gradient
        'logo-teal':   '#77BFBE',  // Z-mark gradient start
        'logo-forest': '#53924D',  // Z-mark gradient end
        // Neutrals
        background:    '#FFFFFF',  // White + subtle green tint via CSS
        card:          '#FFFFFF',
        textPrimary:   '#0A0A0B',  // Near Black
        textSecondary: 'rgba(10,10,11,0.64)',  // Muted Black
        dark:          '#0A0A0B',  // Sidebar / dark surfaces
        // Semantic
        success: '#59D7A2',
        danger:  '#E53935',
        warning: '#F59E0B',
        // Legacy alias (para no romper componentes existentes)
        accent:       '#59D7A2',
        'accent-dark': '#53924D',
      },
      fontFamily: {
        sans:    ['Poppins', 'system-ui', 'sans-serif'],
        heading: ['Recoleta Alt', 'Recoleta', 'Georgia', 'serif'],
        body:    ['Poppins', 'system-ui', 'sans-serif'],
        display: ['Recoleta Alt', 'Recoleta', 'Georgia', 'serif'],
      },
      boxShadow: {
        card:      '0 4px 20px rgba(0,0,0,0.10)',
        subtle:    '0 4px 20px rgba(0,0,0,0.02)',
        prominent: '0 8px 30px rgba(0,0,0,0.15)',
      },
      borderRadius: {
        btn:  '0.5rem',
        card: '1rem',
        hero: '2rem',
      },
    },
  },
  plugins: [],
}

