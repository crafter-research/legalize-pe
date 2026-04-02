# Legalize — Perú

Legislación peruana como repositorio Git. Cada ley es un fichero Markdown, cada reforma un commit con la fecha real de publicación.

## Estadísticas

| Categoría | Cantidad |
|-----------|----------|
| Leyes principales | 92 |
| Reformas constitucionales | 31 |
| **Total de normas** | **123** |

## Inicio rápido

```bash
git clone https://github.com/crafter-research/legalize-pe.git
cd legalize-pe

# ¿Qué dice el Artículo 2 de la Constitución hoy?
grep -A 20 "Artículo 2" leyes/pe/constitucion-1993.md

# ¿Cuándo se reformó la Constitución?
git log --oneline --date=short --format="%ad %s" -- leyes/pe/reformas-constitucionales/

# Ver el historial de reformas constitucionales
cat leyes/pe/HISTORIAL_REFORMAS_CONSTITUCIONALES.md
```

## Historial de reformas constitucionales

Cada reforma constitucional es un commit con la fecha oficial de publicación en El Peruano:

```bash
$ git log --oneline --date=short --format="%ad %s" -- leyes/pe/reformas-constitucionales/ | head -10

2024-12-11 feat(constitucion): Ley 32189 - Reconocimiento del pueblo afroperuano
2024-12-11 feat(constitucion): Ley 32188 - Persona con discapacidad
2024-10-29 feat(constitucion): Ley 32145 - Reforma del artículo 49
2024-03-20 feat(constitucion): Ley 31988 - Bicameralidad del Congreso
2023-09-23 feat(constitucion): Ley 31878 - TIC y educación cívica
...
2000-11-05 feat(constitucion): Ley 27365 - Elimina reelección presidencial inmediata
1995-06-13 feat(constitucion): Ley 26472 - Reforma del artículo 77
1995-06-12 feat(constitucion): Ley 26470 - Reforma de garantías constitucionales
```

31 reformas desde 1995 hasta 2024, cada una con su fecha real de publicación.

## Normas disponibles

### Constitución y Códigos

| Norma | Identificador | Descripción |
|-------|---------------|-------------|
| Constitución Política | `constitucion-1993` | Constitución de 1993 actualizada |
| Código Civil | `dleg-295` | D. Leg. 295 |
| Código Penal | `dleg-635` | D. Leg. 635 |
| Código Procesal Civil | `dleg-768` | D. Leg. 768 |
| Código Procesal Penal | `dleg-957` | D. Leg. 957 (Nuevo) |
| Código Procesal Constitucional | `ley-31307` | Ley 31307 |
| Código de Comercio | `codigo-comercio` | 1902 |
| Código de Procedimientos Penales | `ley-9024` | Ley 9024 (antiguo) |

### Leyes Orgánicas

| Norma | Identificador |
|-------|---------------|
| LO del Poder Judicial | `ds-017-93-jus` |
| LO del Ministerio Público | `dleg-052` |
| LO del Tribunal Constitucional | `ley-28301` |
| LO de Municipalidades | `ley-27972` |

### Otras normas importantes

| Norma | Identificador |
|-------|---------------|
| Código de los Niños y Adolescentes | `ley-27337` |
| Código de Protección al Consumidor | `ley-29571` |
| TUO del Código Tributario | `ds-133-2013-ef` |
| Ley del Servicio Civil | `ley-30057` |
| Reglamento del Congreso | `reglamento-congreso` |
| Código Penal Militar Policial | `dleg-1094` |
| Código de Justicia Militar | `dleg-961` |

## Estructura

```
leyes/
├── pe/                              ← Legislación nacional
│   ├── constitucion-1993.md         # Constitución Política
│   ├── dleg-295.md                  # Código Civil
│   ├── dleg-635.md                  # Código Penal
│   ├── HISTORIAL_REFORMAS_CONSTITUCIONALES.md
│   │
│   └── reformas-constitucionales/   ← 31 leyes de reforma
│       ├── ley-26470.md             # 1995 - Garantías constitucionales
│       ├── ley-27365.md             # 2000 - No reelección
│       ├── ley-30904.md             # 2019 - Junta Nacional de Justicia
│       ├── ley-31988.md             # 2024 - Bicameralidad
│       └── ...
│
├── pe-lima/                         ← Región Lima (pendiente)
├── pe-cusco/                        ← Región Cusco (pendiente)
└── ...
```

## Formato de archivos

Cada norma usa frontmatter YAML con metadatos:

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
fuente: "https://lpderecho.pe/codigo-civil-peruano-actualizado/"
diarioOficial: "El Peruano"
---

# Código Civil

TÍTULO PRELIMINAR

Artículo I.- La ley se deroga sólo por otra ley...
```

## Tipos de normas

| Prefijo | Tipo | Ejemplo |
|---------|------|---------|
| `constitucion-` | Constitución Política | `constitucion-1993.md` |
| `ley-` | Ley | `ley-27972.md` |
| `dleg-` | Decreto Legislativo | `dleg-295.md` |
| `ds-` | Decreto Supremo | `ds-017-93-jus.md` |
| `du-` | Decreto de Urgencia | `du-001-2024.md` |
| `rm-` | Resolución Ministerial | — |
| `ordenanza-` | Ordenanza Regional/Municipal | — |

## API

Acceso programático disponible en [legalize.crafter.ing](https://legalize.crafter.ing):

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| `GET` | `/api/normas` | Listar y buscar normas |
| `GET` | `/api/normas/:id` | Obtener norma por identificador |
| `GET` | `/api/normas/por-fecha/:fecha` | Normas publicadas en una fecha |
| `GET` | `/api/normas/actualizadas` | Normas modificadas recientemente |
| `GET` | `/api/calendario/:year/:month` | Calendario de publicaciones |
| `GET` | `/api/stats` | Estadísticas generales |

### Ejemplos

```bash
# Buscar normas sobre bancos
curl "https://legalize.crafter.ing/api/normas?q=bancos"

# Obtener el Código Civil
curl "https://legalize.crafter.ing/api/normas/dleg-295"

# Estadísticas
curl "https://legalize.crafter.ing/api/stats"
```

## Stack técnico

- **Monorepo:** Turborepo
- **Web:** Astro
- **API:** Next.js (App Router)
- **Base de datos:** Turso (SQLite en la nube) + Drizzle ORM
- **Scraping:** agent-browser

## Fuentes

- [LP Derecho](https://lpderecho.pe) — Textos legales actualizados
- [SPIJ](https://spij.minjus.gob.pe) — Sistema Peruano de Información Jurídica
- [El Peruano](https://elperuano.pe) — Diario Oficial

El texto legislativo es de dominio público según el Decreto Legislativo 822, Artículo 9.

## Contribuir

¿Encontraste un error? ¿Falta alguna ley o reforma?

1. Abre un [issue](https://github.com/crafter-research/legalize-pe/issues)
2. Indica: nombre de la ley, artículo afectado, fuente oficial

## Licencia

- **Contenido legislativo:** Dominio público
- **Código y herramientas:** [MIT](LICENSE)

---

Un proyecto de [Crafter Station](https://www.crafterstation.com) · Inspirado por [legalize-es](https://github.com/legalize-dev/legalize-es)
