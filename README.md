# legalize-pe

Corpus peruano para la federación [legalize.dev](https://legalize.dev).

Este repositorio contiene solo el corpus: normas legales en Markdown con frontmatter YAML y su historial en Git. El código que genera, audita, publica y sirve este corpus vive en [`crafter-research/legalize-pe-engine`](https://github.com/crafter-research/legalize-pe-engine).

**Web:** [legalize-pe.crafter.ing](https://legalize-pe.crafter.ing)

## Estado

| Área | Estado |
|---|---|
| Corpus nacional `pe/` | 1,622 archivos Markdown |
| Reformas constitucionales | 31 archivos bajo `pe/reformas-constitucionales/` |
| Corpus regional Cusco `pe-cus/` | 5 ordenanzas regionales |
| Constitución 1993 | 32 commits de línea histórica, 1993 a 2024 |
| Federación legalize.dev | PR abierto: [legalize-dev/legalize#17](https://github.com/legalize-dev/legalize/pull/17) |

## Estructura

```text
legalize-pe/
├── pe/                         # Normas nacionales de Perú
│   ├── CON-1993.md             # Constitución Política del Perú
│   └── reformas-constitucionales/
├── pe-cus/                     # Ordenanzas regionales de Cusco
├── docs/                       # Notas de extracción y métricas históricas
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
jurisdiction: pe-cus
scope: Regional
issuing_entity: Gobierno Regional de CUSCO
date_precision: year
```

## Uso

```bash
git clone https://github.com/crafter-research/legalize-pe.git
cd legalize-pe

rg "Artículo 2" pe/CON-1993.md
git log --oneline --date=short --format="%ad %s" -- pe/CON-1993.md
```

Para correr la web, los scrapers, auditorías o migraciones, usa el engine:

```bash
git clone https://github.com/crafter-research/legalize-pe-engine.git
cd legalize-pe-engine
bun install
bun cli --help
```

## Fuentes

- [SPIJ](https://spij.minjus.gob.pe), Sistema Peruano de Información Jurídica
- [El Peruano](https://elperuano.pe), diario oficial
- `gob.pe` para normas regionales e institucionales

El texto legislativo es de dominio público según el Decreto Legislativo 822, Artículo 9.

## Licencia

- Contenido legislativo: dominio público
- Documentación y archivos auxiliares: [MIT](LICENSE)
