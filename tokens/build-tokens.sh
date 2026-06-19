#!/bin/bash
# ============================================================================
# build-tokens.sh — genera tokens/zenda-tokens.css
#   = @font-face con woff2 embebidas en base64 (desde tokens/fonts/)
#   + zenda-tokens.base.css (tokens + componentes)
# Correr solo si cambian las fuentes o el CSS base. El resultado se commitea.
# Uso: bash tokens/build-tokens.sh
# ============================================================================
set -euo pipefail
cd "$(dirname "$0")"

OUT="zenda-tokens.css"

b64() { base64 -i "fonts/$1" | tr -d '\n'; }

fontface() {
  local family="$1" weight="$2" file="$3"
  printf "@font-face {\n  font-family: '%s';\n  font-weight: %s;\n  font-style: normal;\n  font-display: swap;\n  src: url('data:font/woff2;base64,%s') format('woff2');\n}\n" \
    "$family" "$weight" "$(b64 "$file")"
}

{
  echo "/* =========================================================================="
  echo "   ZENDA REPORTING — TOKENS + COMPONENTES (GENERADO por build-tokens.sh)"
  echo "   NO EDITAR A MANO: editar zenda-tokens.base.css y regenerar."
  echo "   01 · FUENTES EMBEBIDAS (base64) — los LLMs NO deben leer ni modificar"
  echo "        los bloques base64; copiarlos intactos."
  echo "   ========================================================================== */"
  echo
  fontface 'Recoleta Alt' 500 'RecoletaAlt-Medium.woff2'
  fontface 'Recoleta Alt' 700 'RecoletaAlt-Bold.woff2'
  fontface 'Recoleta Alt' 900 'RecoletaAlt-Black.woff2'
  fontface 'Circular Std' 400 'CircularStd-Book.woff2'
  fontface 'Circular Std' 500 'CircularStd-Medium.woff2'
  fontface 'Circular Std' 700 'CircularStd-Bold.woff2'
  fontface 'Montserrat' 400 'Montserrat-Logo.woff2'
  echo
  cat zenda-tokens.base.css
} > "$OUT"

echo "OK → tokens/$OUT ($(du -h "$OUT" | cut -f1 | tr -d ' '))"
