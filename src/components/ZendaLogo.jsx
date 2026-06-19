import logoColor from '../assets/zenda-logo.png'
import logoWhite from '../assets/zenda-logo-white.png'

/**
 * Logo Zenda oficial — BRAND.md rules:
 * - Dark wordmark on light backgrounds (default)
 * - White wordmark on dark backgrounds (sidebar)
 * - Z mark gradient: #77BFBE → #53924D (135deg)
 */
export default function ZendaLogo({ size = 'md', variant = 'color' }) {
  const heights = { sm: 28, md: 36, lg: 48 }
  const h = heights[size] || 36

  // Sidebar oscuro → logo blanco (Brand Rule #6)
  if (variant === 'sidebar') {
    return (
      <img
        src={logoWhite}
        alt="Zenda"
        style={{ height: h, width: 'auto', objectFit: 'contain' }}
      />
    )
  }

  // Fondo claro → logo oscuro (default)
  return (
    <img
      src={logoColor}
      alt="Zenda"
      style={{ height: h, width: 'auto', objectFit: 'contain' }}
    />
  )
}
