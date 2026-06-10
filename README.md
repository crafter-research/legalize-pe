# legalize-pe

Corpus peruano para la federación [legalize.dev](https://legalize.dev): **21,244 normas legales** en Markdown con frontmatter YAML, versionadas en Git — cada norma es un archivo, cada reforma es un commit con su fecha real de publicación.

Este repositorio contiene solo el corpus. El código que lo genera, audita, publica y sirve vive en [`crafter-research/legalize-pe-engine`](https://github.com/crafter-research/legalize-pe-engine).

**Web:** [legalize-pe.crafter.ing](https://legalize-pe.crafter.ing)

## Estado

| Área | Estado |
|---|---|
| Corpus nacional `pe/` | **11,045** archivos Markdown |
| Corpus regional `pe-{iso}/` | **10,199** normas en **26 jurisdicciones** |
| **Total** | **21,244 normas** |
| Reformas constitucionales | 31 archivos bajo `pe/reformas-constitucionales/` |
| Constitución 1993 | línea histórica versionada en Git, 1993 a 2024 |
| Federación legalize.dev | PR abierto: [legalize-dev/legalize#17](https://github.com/legalize-dev/legalize/pull/17) |

El tier **nacional vigente** se construye desde [SPIJ](https://spij.minjus.gob.pe) (acceso libre) con fechas reales y sin OCR. El tier **regional** —25 gobiernos regionales + Lima Metropolitana— se construye desde `gob.pe`. Es la primera cobertura legal sub-nacional cohesionada de un país del Sur Global; ninguna otra fuente peruana la ofrece.

### Cobertura regional (`pe-{iso}/`)

| Jurisdicción | Normas | | Jurisdicción | Normas |
|---|--:|---|---|--:|
| Huancavelica `pe-huv` | 1,066 | | Junín `pe-jun` | 356 |
| Cusco `pe-cus` | 816 | | Lima Región `pe-lim` | 347 |
| Amazonas `pe-ama` | 723 | | Lima Metropolitana `pe-lim-met` | 308 |
| Piura `pe-piu` | 720 | | Lambayeque `pe-lam` | 195 |
| Loreto `pe-lor` | 703 | | Puno `pe-pun` | 166 |
| Ucayali `pe-uca` | 601 | | San Martín `pe-sam` | 159 |
| Pasco `pe-pas` | 499 | | Moquegua `pe-moq` | 154 |
| Áncash `pe-anc` | 478 | | Apurímac `pe-apu` | 154 |
| Arequipa `pe-are` | 472 | | Ayacucho `pe-aya` | 134 |
| La Libertad `pe-lal` | 437 | | Tacna `pe-tac` | 101 |
| Ica `pe-ica` | 421 | | Cajamarca `pe-caj` | 6 |
| Tumbes `pe-tum` | 412 | | Huánuco `pe-huc` | 1 |
| Callao `pe-cal` | 390 | | Madre de Dios `pe-mdd` | 380 |

> Códigos `pe-{iso}` según ISO 3166-2:PE. Cajamarca y Huánuco quedan bajos porque la mayoría de sus normas se publican en `gob.pe` bajo tipos aún no recolectados — pendiente de una pasada de descubrimiento de tipos más amplia.

## Estructura

```text
legalize-pe/
├── pe/                         # Normas nacionales (11,045)
│   ├── CON-1993.md             # Constitución Política del Perú
│   └── reformas-constitucionales/
├── pe-ama/  pe-anc/  pe-apu/  …  pe-uca/   # 26 jurisdicciones regionales
├── docs/                       # Notas de extracción y métricas
├── AUDIT.md                    # Estado auditable del corpus
└── README.md
```

## Formato

Cada norma sigue [SPEC v0.2](https://github.com/legalize-dev/legalize/blob/main/SPEC.md) con extensiones peruanas cuando hace falta.

```yaml
---
title: Constitución Política del Perú
identifier: CON-1993
country: pe
rank: constitucion
publication_date: '1993-12-30'
last_updated: '2024-12-11'
status: in_force
source: 'https://lpderecho.pe/constitucion-politica-peru-actualizada/'
official_journal: El Peruano
---
```

Campos regionales usados por `pe-{iso}/`:

```yaml
jurisdiction: pe-are
scope: Regional
gob_pe_slug: regionarequipa
```

## Uso

```bash
git clone https://github.com/crafter-research/legalize-pe.git
cd legalize-pe

# Buscar en la Constitución
rg "Artículo 2" pe/CON-1993.md

# Línea histórica de la Constitución (cada reforma = un commit)
git log --oneline --date=short --format="%ad %s" -- pe/CON-1993.md

# Buscar en todo el corpus
rg -l "minería ilegal" pe pe-*

# Normas de una región
ls pe-are/
```

Para correr la web, los scrapers, auditorías o migraciones, usa el engine:

```bash
git clone https://github.com/crafter-research/legalize-pe-engine.git
cd legalize-pe-engine
bun install
bun cli --help
```

## Fuentes

- [SPIJ](https://spij.minjus.gob.pe), Sistema Peruano de Información Jurídica (acceso libre) — tier nacional
- `gob.pe` — tier regional (25 gobiernos regionales + Lima Metropolitana)
- [El Peruano](https://elperuano.pe), diario oficial — catálogo de referencia

El texto legislativo es de dominio público según el Decreto Legislativo 822, Artículo 9.

## Licencia

- Contenido legislativo: dominio público
- Documentación y archivos auxiliares: [MIT](LICENSE)
