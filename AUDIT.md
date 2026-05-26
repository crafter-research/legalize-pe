# Corpus Audit

Last checked: 2026-05-26

## Scope

| Path | Files | Status |
|---|---:|---|
| `pe/` | 1,622 | National corpus, including constitutional reform files |
| `pe/reformas-constitucionales/` | 31 | Constitutional reform history |
| `pe-cus/` | 5 | Cusco regional pioneer corpus |

## Repository Shape

The repository is corpus-only:

- Markdown corpus files live under `pe/` and `pe-cus/`.
- Project code, web app, scrapers, API, and CLIs live in [`crafter-research/legalize-pe-engine`](https://github.com/crafter-research/legalize-pe-engine).
- Historical research notes remain under `docs/` and `PLAN.md`.

## Known Gaps

- `pe-cus/` uses `date_precision: year` for the five pioneer ordinances because the linked PDFs are scanned images and exact publication dates were not extractable without OCR.
- National legacy metadata still contains source quality variance inherited from the first migration. Downstream consumers should treat `source`, `official_journal`, and `date_precision` as audit fields.
- Federation listing is still pending upstream merge in [legalize-dev/legalize#17](https://github.com/legalize-dev/legalize/pull/17).
