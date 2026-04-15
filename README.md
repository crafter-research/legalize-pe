# Legalize — Peru

Legislacion peruana como repositorio Git. Cada ley es un fichero Markdown, cada reforma un commit con la fecha real de publicacion.

**Web:** [legalize.crafter.ing](https://legalize.crafter.ing)

## Estadisticas

| Categoria | Cantidad |
|-----------|----------|
| Normas legales | 1,614 |
| Reformas constitucionales | 31 |

## Funcionalidades

### Web

- **Busqueda inteligente** — Fuzzy search con Fuse.js por titulo e identificador
- **Historial de versiones** — Ver cambios de cada norma a lo largo del tiempo
- **Comparador de versiones** — Diff unificado y lado a lado estilo GitHub
- **PWA** — Funciona offline, instalable en movil
- **Descarga** — Exportar normas en Markdown

### API

| Endpoint | Descripcion |
|----------|-------------|
| `GET /api/normas/:id/history` | Historial de commits de una norma |
| `GET /api/normas/:id/at/:commit` | Contenido en un commit especifico |
| `GET /api/normas/:id/diff?from=X&to=Y` | Diff unificado entre versiones |
| `GET /api/normas/:id/compare?from=X&to=Y` | Comparacion lado a lado |

```bash
# Historial del Codigo Civil
curl "https://legalize.crafter.ing/api/normas/dleg-295/history"

# Diff entre dos versiones
curl "https://legalize.crafter.ing/api/normas/dleg-295/diff?from=abc123&to=def456"
```

## Inicio rapido

```bash
git clone https://github.com/crafter-research/legalize-pe.git
cd legalize-pe

# Ver el Articulo 2 de la Constitucion
grep -A 20 "Articulo 2" leyes/pe/constitucion-1993.md

# Historial de reformas constitucionales
git log --oneline --date=short --format="%ad %s" -- leyes/pe/reformas-constitucionales/
```

## Estructura

```
legalize-pe/
├── apps/
│   └── web/                    # Astro + PWA
├── packages/
│   ├── git/                    # Utilidades Git para historial
│   ├── parser/                 # Parser de frontmatter YAML
│   └── scraper/                # Scraping de fuentes oficiales
└── leyes/
    └── pe/                     # Legislacion nacional
        ├── constitucion-1993.md
        ├── dleg-295.md         # Codigo Civil
        ├── dleg-635.md         # Codigo Penal
        └── reformas-constitucionales/
```

## Normas principales

| Norma | Identificador |
|-------|---------------|
| Constitucion Politica | `constitucion-1993` |
| Codigo Civil | `dleg-295` |
| Codigo Penal | `dleg-635` |
| Codigo Procesal Civil | `dleg-768` |
| Codigo Procesal Penal | `dleg-957` |
| Codigo Procesal Constitucional | `ley-31307` |
| LO del Poder Judicial | `ds-017-93-jus` |
| LO de Municipalidades | `ley-27972` |

## Formato

```yaml
---
titulo: "Decreto Legislativo N 295 - Codigo Civil"
identificador: "dleg-295"
rango: "decreto-legislativo"
fechaPublicacion: "1984-07-25"
estado: "vigente"
fuente: "https://spij.minjus.gob.pe"
---

# Codigo Civil

TITULO PRELIMINAR

Articulo I.- La ley se deroga solo por otra ley...
```

## Stack

- **Monorepo:** Turborepo + pnpm
- **Web:** Astro (static + SSR)
- **PWA:** Workbox
- **Busqueda:** Fuse.js
- **Git:** simple-git

## Desarrollo

```bash
pnpm install
pnpm dev          # Inicia web en localhost:4321
pnpm build        # Build de produccion
```

## Fuentes

- [SPIJ](https://spij.minjus.gob.pe) — Sistema Peruano de Informacion Juridica
- [El Peruano](https://elperuano.pe) — Diario Oficial

El texto legislativo es de dominio publico segun el Decreto Legislativo 822, Articulo 9.

## Licencia

- **Contenido legislativo:** Dominio publico
- **Codigo:** [MIT](LICENSE)

---

[Crafter Station](https://www.crafterstation.com)
