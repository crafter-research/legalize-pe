#!/bin/bash
# Download missing laws from SPIJ using agent-browser

AB="/Users/shiara/Documents/personal-projects/agent-browser/bin/agent-browser-darwin-arm64"
OUTPUT_DIR="/Users/shiara/Documents/personal-projects/legalize-pe/leyes/pe"

# Laws to download with their SPIJ search terms
declare -A LAWS=(
  ["ley-27815"]="27815"
  ["ley-28024"]="28024"
  ["ley-26771"]="26771"
  ["ley-27693"]="27693"
  ["dleg-650"]="650 compensacion"
  ["dleg-713"]="713 descansos"
  ["dleg-688"]="688 beneficios"
  ["dleg-892"]="892 utilidades"
  ["ley-25129"]="25129"
  ["ley-27735"]="27735"
  ["ley-29414"]="29414"
  ["ley-29944"]="29944"
  ["ley-30512"]="30512"
  ["ley-29325"]="29325"
)

# Law names
declare -A LAW_NAMES=(
  ["ley-27815"]="Ley del Código de Ética de la Función Pública"
  ["ley-28024"]="Ley que regula la gestión de intereses en la administración pública"
  ["ley-26771"]="Ley de Nepotismo"
  ["ley-27693"]="Ley que crea la Unidad de Inteligencia Financiera"
  ["dleg-650"]="TUO de la Ley de Compensación por Tiempo de Servicios"
  ["dleg-713"]="Descansos Remunerados de los Trabajadores"
  ["dleg-688"]="Ley de Consolidación de Beneficios Sociales"
  ["dleg-892"]="Participación de los Trabajadores en las Utilidades"
  ["ley-25129"]="Ley de Asignación Familiar"
  ["ley-27735"]="Ley de Gratificaciones para Trabajadores"
  ["ley-29414"]="Ley que establece los derechos de las personas usuarias de los servicios de salud"
  ["ley-29944"]="Ley de Reforma Magisterial"
  ["ley-30512"]="Ley de Institutos y Escuelas de Educación Superior"
  ["ley-29325"]="Ley del Sistema Nacional de Evaluación y Fiscalización Ambiental"
)

# Publication dates
declare -A LAW_DATES=(
  ["ley-27815"]="2002-08-13"
  ["ley-28024"]="2003-07-12"
  ["ley-26771"]="1997-04-15"
  ["ley-27693"]="2002-04-12"
  ["dleg-650"]="1991-07-24"
  ["dleg-713"]="1991-11-08"
  ["dleg-688"]="1991-11-05"
  ["dleg-892"]="1996-11-11"
  ["ley-25129"]="1989-12-06"
  ["ley-27735"]="2002-05-28"
  ["ley-29414"]="2009-10-02"
  ["ley-29944"]="2012-11-25"
  ["ley-30512"]="2016-11-02"
  ["ley-29325"]="2009-03-05"
)

echo "🇵🇪 Descargando leyes faltantes de SPIJ"
echo "════════════════════════════════════════"

# Close any existing browser
$AB close --all 2>/dev/null
sleep 2

# Open SPIJ and login
echo "🔐 Iniciando sesión en SPIJ..."
$AB open "https://spij.minjus.gob.pe/"
sleep 5

$AB fill @e3 "usuarioNoPago"
$AB fill @e4 "123456"
$AB click @e2
sleep 4

echo "✅ Sesión iniciada"

# Process each law
SUCCESS=0
FAILED=0

for LAW_ID in "${!LAWS[@]}"; do
  SEARCH_TERM="${LAWS[$LAW_ID]}"
  LAW_NAME="${LAW_NAMES[$LAW_ID]}"
  LAW_DATE="${LAW_DATES[$LAW_ID]}"

  echo ""
  echo "📜 $LAW_NAME"
  echo "   ID: $LAW_ID"
  echo "   Búsqueda: $SEARCH_TERM"

  # Go to search
  $AB click @e6 2>/dev/null
  sleep 3

  # Get snapshot to find search field
  SNAPSHOT=$($AB snapshot -i 2>/dev/null)

  # Find textbox and search button
  TEXTBOX=$(echo "$SNAPSHOT" | grep -oP 'textbox[^[]*\[ref=\K\w+' | head -1)

  if [ -n "$TEXTBOX" ]; then
    $AB fill @$TEXTBOX "$SEARCH_TERM"
    sleep 1

    # Find search button
    SEARCH_BTN=$(echo "$SNAPSHOT" | grep -oP 'button "Buscar"[^[]*\[ref=\K\w+' | head -1)
    if [ -n "$SEARCH_BTN" ]; then
      $AB click @$SEARCH_BTN
      sleep 4
    else
      $AB press Enter
      sleep 4
    fi

    # Get results snapshot
    RESULTS=$($AB snapshot -i 2>/dev/null)

    # Find first law result
    LAW_LINK=$(echo "$RESULTS" | grep -oP 'link[^[]*detallenorma[^[]*\[ref=\K\w+' | head -1)

    if [ -n "$LAW_LINK" ]; then
      $AB click @$LAW_LINK
      sleep 4

      # Extract law text
      LAW_TEXT=$($AB eval "document.body.innerText" 2>/dev/null)

      if [ -n "$LAW_TEXT" ] && [ ${#LAW_TEXT} -gt 500 ]; then
        # Get law type
        if [[ $LAW_ID == dleg-* ]]; then
          RANGO="decreto-legislativo"
        else
          RANGO="ley"
        fi

        # Create markdown file
        cat > "$OUTPUT_DIR/$LAW_ID.md" << EOF
---
titulo: "$LAW_NAME"
identificador: "$LAW_ID"
pais: "pe"
jurisdiccion: "pe"
rango: "$RANGO"
fechaPublicacion: "$LAW_DATE"
ultimaActualizacion: "$(date +%Y-%m-%d)"
estado: "vigente"
fuente: "https://spij.minjus.gob.pe/"
diarioOficial: "El Peruano"
---

# $LAW_NAME

$LAW_TEXT
EOF

        echo "   ✅ Guardado: $OUTPUT_DIR/$LAW_ID.md"
        ((SUCCESS++))
      else
        echo "   ❌ No se pudo extraer el texto"
        ((FAILED++))
      fi
    else
      echo "   ❌ No se encontró resultado"
      ((FAILED++))
    fi
  else
    echo "   ❌ No se encontró campo de búsqueda"
    ((FAILED++))
  fi

  # Go back to home for next search
  $AB open "https://spij.minjus.gob.pe/spij-ext-web/#/inicio"
  sleep 3
done

# Close browser
$AB close

echo ""
echo "════════════════════════════════════════"
echo "✅ Éxito: $SUCCESS"
echo "❌ Fallidas: $FAILED"
