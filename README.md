# Legalize — Perú

Legislación peruana como repositorio Git. Cada ley es un fichero Markdown, cada reforma un commit con la fecha real de publicación.

Normas del [SPIJ](https://spij.minjus.gob.pe) (Sistema Peruano de Información Jurídica): legislación nacional + las 25 regiones + municipalidades, con historial completo de reformas.

## Inicio rápido

```bash
git clone https://github.com/crafter-station/legalize-pe.git
cd legalize-pe

# ¿Qué dice el Artículo 2 de la Constitución hoy?
grep -A 20 "Artículo 2" leyes/pe/constitucion-1993.md

# ¿Cuándo cambió?
git log --oneline -- leyes/pe/constitucion-1993.md

# Legislación de Lima
ls leyes/pe-lima/
```

## Estructura

```
leyes/
├── pe/                         ← Legislación nacional
│   ├── constitucion-1993.md        # Constitución Política del Perú
│   ├── dleg-295.md                 # Código Civil
│   ├── dleg-635.md                 # Código Penal
│   ├── ley-26702.md                # Ley de Bancos
│   └── ...
│
├── pe-lima/                    ← Región Lima
├── pe-cusco/                   ← Región Cusco
├── pe-arequipa/                ← Región Arequipa
└── ...
```

Las carpetas usan el formato: `pe` para legislación nacional, `pe-{region}` para legislación regional, `pe-{region}-{provincia}` para ordenanzas municipales.

Una carpeta = una jurisdicción. Un archivo = una norma. El rango y los metadatos van en el frontmatter YAML:

```yaml
---
titulo: "Decreto Legislativo N° 295 - Código Civil"
identificador: "dleg-295"
pais: "pe"
jurisdiccion: "pe"
rango: "decreto-legislativo"
fechaPublicacion: "1984-07-25"
ultimaActualizacion: "2024-01-15"
estado: "vigente"
fuente: "https://spij.minjus.gob.pe/..."
diarioOficial: "El Peruano"
---
```

## Cobertura

| Jurisdicción | Código | Normas |
|--------------|--------|--------|
| Nacional | `pe/` | — |
| Amazonas | `pe-amazonas/` | — |
| Áncash | `pe-ancash/` | — |
| Apurímac | `pe-apurimac/` | — |
| Arequipa | `pe-arequipa/` | — |
| Ayacucho | `pe-ayacucho/` | — |
| Cajamarca | `pe-cajamarca/` | — |
| Callao | `pe-callao/` | — |
| Cusco | `pe-cusco/` | — |
| Huancavelica | `pe-huancavelica/` | — |
| Huánuco | `pe-huanuco/` | — |
| Ica | `pe-ica/` | — |
| Junín | `pe-junin/` | — |
| La Libertad | `pe-la-libertad/` | — |
| Lambayeque | `pe-lambayeque/` | — |
| Lima | `pe-lima/` | — |
| Loreto | `pe-loreto/` | — |
| Madre de Dios | `pe-madre-de-dios/` | — |
| Moquegua | `pe-moquegua/` | — |
| Pasco | `pe-pasco/` | — |
| Piura | `pe-piura/` | — |
| Puno | `pe-puno/` | — |
| San Martín | `pe-san-martin/` | — |
| Tacna | `pe-tacna/` | — |
| Tumbes | `pe-tumbes/` | — |
| Ucayali | `pe-ucayali/` | — |

## Tipos de normas

| Prefijo | Tipo |
|---------|------|
| `constitucion-` | Constitución Política |
| `ley-` | Ley |
| `dleg-` | Decreto Legislativo |
| `du-` | Decreto de Urgencia |
| `ds-` | Decreto Supremo |
| `rm-` | Resolución Ministerial |
| `rs-` | Resolución Suprema |
| `ordenanza-` | Ordenanza Regional/Municipal |

## Fuente de datos

Todo el contenido proviene del [SPIJ](https://spij.minjus.gob.pe) (Sistema Peruano de Información Jurídica) del Ministerio de Justicia. El texto legislativo es de dominio público según el Decreto Legislativo 822, Artículo 9. Este repositorio añade estructura, control de versiones y metadatos.

Cada reforma es un commit independiente con la fecha oficial de publicación como fecha de autoría. El mensaje del commit incluye los artículos afectados y un enlace a la fuente oficial.

## API

¿Buscas acceso programático? La API estará disponible en [legalize.crafter.ing](https://legalize.crafter.ing) — busca, filtra, compara versiones y más.

## Contribuir

¿Has encontrado un error en un texto consolidado? ¿Falta alguna reforma? Abre un [issue](https://github.com/crafter-station/legalize-pe/issues) indicando el nombre de la ley, el artículo y la fuente oficial con la versión correcta.

## Licencia

**Contenido legislativo:** Dominio público (fuentes oficiales del gobierno peruano).

**Código y herramientas:** [MIT](LICENSE)

---

Inspirado por [legalize-es](https://github.com/legalize-dev/legalize-es).
