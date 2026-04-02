#!/bin/bash
# Fetch laws from Congreso archive and convert to markdown
# Usage: ./scripts/fetch-from-congreso.sh

set -e

OUTPUT_DIR="leyes/pe"
TEMP_DIR="/tmp/legalize-pe-pdfs"
BASE_URL="https://www.leyes.congreso.gob.pe/Documentos"

mkdir -p "$TEMP_DIR"
mkdir -p "$OUTPUT_DIR"

fetch_ley() {
  local id="$1"
  local number="$2"
  local name="$3"
  local rango="$4"
  local fecha="$5"
  local url_path="$6"

  local pdf_file="$TEMP_DIR/${id}.pdf"
  local txt_file="$TEMP_DIR/${id}.txt"
  local md_file="$OUTPUT_DIR/${id}.md"

  # Skip if already exists
  if [[ -f "$md_file" ]]; then
    echo "⏭️  $id already exists, skipping"
    return 0
  fi

  echo "📥 Fetching $id ($name)..."

  # Download PDF
  local url="${BASE_URL}/${url_path}/${number}.pdf"
  if ! curl -sL -o "$pdf_file" "$url"; then
    echo "❌ Failed to download $url"
    return 1
  fi

  # Check if PDF is valid
  if ! file "$pdf_file" | grep -q PDF; then
    echo "❌ Invalid PDF for $id"
    rm -f "$pdf_file"
    return 1
  fi

  # Convert to text
  echo "📄 Converting to text..."
  if ! pdftotext -layout "$pdf_file" "$txt_file" 2>/dev/null; then
    echo "❌ Failed to convert PDF"
    return 1
  fi

  # Create markdown file
  echo "📝 Creating markdown..."

  cat > "$md_file" << FRONTMATTER
---
titulo: "${name}"
identificador: "${id}"
pais: "pe"
jurisdiccion: "pe"
rango: "${rango}"
fechaPublicacion: "${fecha}"
ultimaActualizacion: "$(date +%Y-%m-%d)"
estado: "vigente"
fuente: "${url}"
diarioOficial: "El Peruano"
---

# ${name}

FRONTMATTER

  cat "$txt_file" >> "$md_file"

  echo "✅ Saved $md_file"

  # Cleanup
  rm -f "$pdf_file" "$txt_file"

  return 0
}

echo "🇵🇪 Legalize PE - Congressional Archive Fetcher"
echo "================================================"
echo ""

success=0
failed=0

# Fetch Leyes
echo "📚 Fetching Leyes..."

fetch_ley "ley-28245" "28245" "Ley Marco del Sistema Nacional de Gestión Ambiental" "ley" "2004-06-08" "Leyes" && ((success++)) || ((failed++))
sleep 1

fetch_ley "ley-26979" "26979" "Ley de Procedimiento de Ejecución Coactiva" "ley" "1998-09-23" "Leyes" && ((success++)) || ((failed++))
sleep 1

fetch_ley "ley-28015" "28015" "Ley de Promoción y Formalización de la Micro y Pequeña Empresa" "ley" "2003-07-03" "Leyes" && ((success++)) || ((failed++))
sleep 1

fetch_ley "ley-26221" "26221" "Ley Orgánica de Hidrocarburos" "ley-organica" "1993-08-20" "Leyes" && ((success++)) || ((failed++))
sleep 1

fetch_ley "ley-27291" "27291" "Ley que permite la utilización de medios electrónicos para comunicaciones" "ley" "2000-06-24" "Leyes" && ((success++)) || ((failed++))
sleep 1

fetch_ley "ley-29381" "29381" "Ley de Organización y Funciones del MTPE" "ley" "2009-06-16" "Leyes" && ((success++)) || ((failed++))
sleep 1

# Fetch Decretos Legislativos (use zero-padded numbers)
echo ""
echo "📚 Fetching Decretos Legislativos..."

fetch_ley "dleg-1075" "01075" "Disposiciones Complementarias a la Decisión 486 - Propiedad Industrial" "decreto-legislativo" "2008-06-28" "DecretosLegislativos" && ((success++)) || ((failed++))
sleep 1

fetch_ley "dleg-767" "00767" "Ley Orgánica del Poder Judicial" "decreto-legislativo" "1991-12-04" "DecretosLegislativos" && ((success++)) || ((failed++))
sleep 1

fetch_ley "dleg-702" "00702" "Ley de Telecomunicaciones" "decreto-legislativo" "1991-11-05" "DecretosLegislativos" && ((success++)) || ((failed++))
sleep 1

fetch_ley "dleg-1033" "01033" "Ley de Organización y Funciones del INDECOPI" "decreto-legislativo" "2008-06-25" "DecretosLegislativos" && ((success++)) || ((failed++))
sleep 1

fetch_ley "dleg-1353" "01353" "Autoridad Nacional de Transparencia y Acceso a la Información" "decreto-legislativo" "2017-01-07" "DecretosLegislativos" && ((success++)) || ((failed++))
sleep 1

fetch_ley "dleg-1438" "01438" "Sistema Nacional de Abastecimiento" "decreto-legislativo" "2018-09-16" "DecretosLegislativos" && ((success++)) || ((failed++))
sleep 1

echo ""
echo "================================================"
echo "✅ Success: $success"
echo "❌ Failed: $failed"
echo ""

# Cleanup temp directory
rm -rf "$TEMP_DIR"
