# SPIJ vs Legalize-PE: Metrics Comparison

## Date Collected: 2026-04-04

---

## 1. Page Load Time (First Contentful Paint)

**How to measure:** Chrome DevTools > Network tab > Disable cache > Hard refresh

| Site | URL | Load Time | Notes |
|------|-----|-----------|-------|
| SPIJ | https://spij.minjus.gob.pe | _____ sec | |
| Legalize-PE | https://legalize.pe | _____ sec | |

---

## 2. Search Response Time

**How to measure:** Time from pressing Enter to results appearing. Search for "Código Civil"

| Site | Search Query | Response Time | Results Count |
|------|--------------|---------------|---------------|
| SPIJ | "Código Civil" | _____ sec | _____ |
| Legalize-PE | "Código Civil" | _____ sec | _____ |

---

## 3. API Availability

| Feature | SPIJ | Legalize-PE |
|---------|------|-------------|
| Public REST API | ❌ No | ✅ Yes |
| API Documentation | ❌ No | ✅ Yes |
| Total Endpoints | 0 | 9 |

### Legalize-PE API Endpoints:
1. `GET /api/normas` — List and search laws (filters: q, tipo, jurisdiccion, estado, fecha)
2. `GET /api/normas/:id` — Get specific law by identifier
3. `GET /api/normas/por-fecha/:fecha` — Laws published on specific date
4. `GET /api/normas/actualizadas` — Recently modified laws
5. `GET /api/normas/:id/history` — Git history for a law
6. `GET /api/normas/:id/diff` — Compare versions of a law
7. `GET /api/normas/:id/at/:commit` — View law at specific Git commit
8. `GET /api/calendario/:year/:month` — Publication calendar
9. `GET /api/stats` — General statistics

---

## 4. Offline Capability

**How to measure:** Chrome DevTools > Network tab > Toggle "Offline" > Try to navigate

| Site | Works Offline? | Cached Content | Service Worker |
|------|----------------|----------------|----------------|
| SPIJ | ❌ No | ❌ | ❌ |
| Legalize-PE | ✅ Yes | Laws, UI | ✅ |

---

## 5. Lighthouse Scores

**How to measure:** Chrome DevTools > Lighthouse tab > Generate report (Mobile)

### SPIJ (https://spij.minjus.gob.pe)
| Category | Score |
|----------|-------|
| Performance | _____ /100 |
| Accessibility | _____ /100 |
| Best Practices | _____ /100 |
| SEO | _____ /100 |
| PWA | ❌ N/A |

### Legalize-PE (https://legalize.pe)
| Category | Score |
|----------|-------|
| Performance | _____ /100 |
| Accessibility | _____ /100 |
| Best Practices | _____ /100 |
| SEO | _____ /100 |
| PWA | _____ /100 |

---

## Summary Table (for paper)

| Metric | SPIJ | Legalize-PE | Improvement |
|--------|------|-------------|-------------|
| Page Load (FCP) | _____ s | _____ s | _____x faster |
| Search Response | _____ s | _____ s | _____x faster |
| API Endpoints | 0 | 9 | ∞ |
| Offline Access | No | Yes | ✅ |
| Lighthouse Perf | _____  | _____ | +_____ pts |
| Lighthouse A11y | _____ | _____ | +_____ pts |

---

## Test Environment
- Browser: Chrome _____
- Device: _____
- Connection: _____
- Date: 2026-04-04
