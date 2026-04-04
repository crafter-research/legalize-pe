# PLAN: ICEGOV 2026 Paper + PWA

## Overview

**Goal:** Submit an Ongoing Research paper to ICEGOV 2026 Track 11 (Accelerating Digital Transformation in the Global South)

**Title:** "Digital Leapfrogging for Legal Access: A Civic-Tech Approach to Legislation Digitization in the Global South"

**Deadline:** April 14, 2026
**Time available:** 11 days × 6 hours = 66 hours

---

## Paper Details

| Field | Value |
|-------|-------|
| Conference | ICEGOV 2026 (19th International Conference on Theory and Practice of Electronic Governance) |
| Track | 11 — Accelerating Digital Transformation in the Global South |
| Category | Ongoing Research |
| Pages | 8-10 |
| Abstract | Up to 300 words |
| Submission | https://edas.info (register by Apr 14) |

---

## Three Contributions

1. **C1 — Methodology:** A replicable pipeline for digitizing legislation in countries without open data APIs (scraping + OCR + Markdown + Git)

2. **C2 — Implementation:** An open-source platform (legalize-pe) with web app, REST API (9 endpoints), and offline-capable PWA

3. **C3 — Evaluation:** Empirical comparison showing improvements over Peru's existing system (SPIJ)

---

## Paper Outline

| # | Section | Pages | Content |
|---|---------|-------|---------|
| 1 | Introduction | 1 | Problem: Peru has 200k+ laws, no API, PDFs/photos. Access to justice crisis in Global South. State contributions. |
| 2 | Background / Related Work | 1-1.5 | legalize-es (Spain), Free Law Project (US), legislation.gov.uk (UK), Akoma Ntoso (OASIS standard). Git for versioning concept. |
| 3 | The Peruvian Legal Access Problem | 1 | SPIJ critique, no API, regional laws unpublished in El Peruano, data hostility, 200k+ norms inaccessible. |
| 4 | Methodology / Approach | 2 | Pipeline: scraping (agent-browser, SPIJ) → OCR (Tesseract) → Markdown + frontmatter → Git (commits = reforms) → Database (Turso) → REST API → PWA. Architecture diagram. |
| 5 | Implementation: Legalize-PE | 1.5 | Tech stack (Astro, Next.js, Drizzle, Turso), 119 laws, 9 API endpoints, offline PWA, open source repo. Screenshots. |
| 6 | Preliminary Results | 1 | Comparison table: SPIJ vs legalize-pe (5 metrics). Lighthouse scores. |
| 7 | Discussion & Future Work | 0.5-1 | Limitations (119/200k laws), scaling plan, regional expansion, replicability for other Global South countries. |
| 8 | Conclusion | 0.5 | Summary of contributions, call to action for open legal infrastructure. |
| - | References | ~1 | 20-30 citations |

---

## Comparison Metrics to Collect

| # | Metric | SPIJ | Legalize-PE | How to Measure |
|---|--------|------|-------------|----------------|
| 1 | Page load time | ? sec | ? ms | Chrome DevTools, Lighthouse |
| 2 | Search response time | ? sec | ? ms | Time to find "Código Civil" |
| 3 | API availability | 0 endpoints | 9 endpoints | Document features |
| 4 | Offline capability | No | Yes (PWA) | Test in airplane mode |
| 5 | Lighthouse scores | ? | ? | Performance, Accessibility, PWA |

---

## PWA Requirements

- [ ] Service worker for offline caching
- [ ] Cache all 119 laws for offline reading
- [ ] Installable (manifest.json)
- [ ] Works without internet connection
- [ ] Sync new laws when online

---

## Differentiation from Legalize-ES

| Aspect | Legalize-ES (Spain) | Legalize-PE (Peru) |
|--------|---------------------|-------------------|
| Data source | BOE official API (easy) | Scraping + OCR (hard) |
| Web app | None | Full Astro site |
| REST API | None | 9 endpoints |
| Database | None (Git only) | Turso + Drizzle |
| OCR | Not needed | Tesseract |
| PWA/Offline | No | Yes |

**Key message:** Spain had a government API. Peru has PDFs and photos. We solved the harder problem.

**Citation:** Acknowledge legalize-es as inspiration for "Git = legislation versioning" concept.

---

## Schedule (April 4-14, 2026)

| Day | Date | Hours | Focus | Deliverables |
|-----|------|-------|-------|--------------|
| 1 | Apr 4 | 6 | Metrics + Setup | Collect 5 metrics. Create paper document. Draft Introduction. |
| 2 | Apr 5 | 6 | Background | Write Related Work. Research 20+ citations. |
| 3 | Apr 6 | 6 | Problem + Method | Write Sections 3-4. Document pipeline. |
| 4 | Apr 7 | 6 | Implementation | Write Section 5. Screenshots. Architecture diagram. |
| 5 | Apr 8 | 6 | PWA Build | Service worker. Offline caching. Manifest. |
| 6 | Apr 9 | 6 | PWA + Results | Test PWA offline. Write Section 6 with metrics table. |
| 7 | Apr 10 | 6 | Discussion + Draft | Write Sections 7-8. Complete first draft. |
| 8 | Apr 11 | 6 | Revision 1 | Structure, flow, clarity. Add citations. |
| 9 | Apr 12 | 6 | Revision 2 | Grammar, formatting. Finalize figures. Check page count. |
| 10 | Apr 13 | 6 | Final Polish | Abstract (300 words). Submission prep. Final checks. |
| 11 | Apr 14 | 2-4 | **SUBMIT** | Submit to EDAS before deadline. |

---

## Technical Deliverables

### By April 14:
- [ ] Paper PDF (8-10 pages)
- [ ] PWA with offline access deployed
- [ ] Architecture diagram (pipeline visualization)
- [ ] Screenshots (web app, API response, diff viewer)
- [ ] Comparison metrics table
- [ ] Lighthouse report screenshots

### Already Done:
- [x] 119 laws in Git repository
- [x] Astro web app (legalize.crafter.ing)
- [x] Next.js API (9 endpoints)
- [x] Turso database with Drizzle
- [x] Git history viewer
- [x] Diff comparison viewer
- [x] Scraping pipeline (agent-browser)
- [x] OCR pipeline (Tesseract)
- [x] Open source repo (GitHub)

---

## References to Include

### Open Legal Infrastructure
- [ ] legalize-es (Enrique Lopez) — inspiration, Git for Spanish legislation
- [ ] Free Law Project — US case law
- [ ] legislation.gov.uk — UK official legislation platform
- [ ] Akoma Ntoso — OASIS standard for legislative documents
- [ ] Germany GRIT project — Git for German laws

### Digital Governance / Global South
- [ ] UN E-Government Survey reports
- [ ] Access to justice in developing countries literature
- [ ] Digital divide / connectivity statistics for Peru
- [ ] SPIJ documentation / criticism

### Technical
- [ ] Git version control semantics
- [ ] PWA / Service Workers
- [ ] OCR for document digitization

---

## Risks & Mitigations

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| PWA takes longer than expected | Medium | Start Day 5, have 2 days buffer. Minimum viable = offline cache only. |
| Can't find enough citations | Low | Use Google Scholar, ACM DL, related work sections of similar papers. |
| Page count too long/short | Medium | Adjust Discussion section. Add/remove screenshots. |
| SPIJ blocks scraping during metrics | Low | Use cached data, screenshots as evidence. |
| Submission system issues | Low | Submit Day 10 evening, have full Day 11 as buffer. |

---

## Success Criteria

Paper is ready to submit when:
- [ ] 8-10 pages (not counting references)
- [ ] Abstract ≤ 300 words
- [ ] All 8 sections complete
- [ ] 3 contributions clearly stated
- [ ] 5 comparison metrics with data
- [ ] Architecture diagram included
- [ ] At least 2 screenshots
- [ ] 20+ references
- [ ] PWA deployed and working offline
- [ ] Double-blind ready (no author names in PDF)

---

## Contact

- **ICEGOV:** https://icegov.org
- **Submission:** https://edas.info
- **legalize-pe:** https://github.com/crafter-research/legalize-pe
- **Live site:** https://legalize.crafter.ing
