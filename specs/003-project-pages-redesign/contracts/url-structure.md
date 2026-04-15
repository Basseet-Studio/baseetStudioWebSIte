# URL Contract: Project Pages Redesign

**Feature**: 003-project-pages-redesign  
**Date**: 2026-04-15

---

## URL Structure

All URLs follow the pattern `/<lang>/projects/<slug>/<sub-page>/` where `<lang>` is omitted for the default language (English).

### Project Landing Pages

| Project | English URL | Arabic URL |
|---------|-----------|------------|
| Money Box | `/projects/money-box/` | `/ar/projects/money-box/` |
| Numu | `/projects/numu/` | `/ar/projects/numu/` |
| Matrix | `/projects/matrix/` | `/ar/projects/matrix/` |
| Chopshop | `/projects/chopshop/` | `/ar/projects/chopshop/` |
| Deshi Kitchen | `/projects/deshikitchen/` | `/ar/projects/deshikitchen/` |

### Features Pages

| Project | English URL | Arabic URL |
|---------|-----------|------------|
| Money Box | `/projects/money-box/features/` | `/ar/projects/money-box/features/` |
| Numu | `/projects/numu/features/` | `/ar/projects/numu/features/` |
| Matrix | `/projects/matrix/features/` | `/ar/projects/matrix/features/` |
| Chopshop | `/projects/chopshop/features/` | `/ar/projects/chopshop/features/` |
| Deshi Kitchen | `/projects/deshikitchen/features/` | `/ar/projects/deshikitchen/features/` |

### Demo Pages

| Project | English URL | Arabic URL |
|---------|-----------|------------|
| Money Box | `/projects/money-box/demo/` | `/ar/projects/money-box/demo/` |
| Numu | `/projects/numu/demo/` | `/ar/projects/numu/demo/` |
| Matrix | `/projects/matrix/demo/` | `/ar/projects/matrix/demo/` |
| Chopshop | `/projects/chopshop/demo/` | `/ar/projects/chopshop/demo/` |
| Deshi Kitchen | `/projects/deshikitchen/demo/` | `/ar/projects/deshikitchen/demo/` |

### Terms Pages

| Project | English URL | Arabic URL |
|---------|-----------|------------|
| Money Box | `/projects/money-box/terms/` | `/ar/projects/money-box/terms/` |
| Numu | `/projects/numu/terms/` | `/ar/projects/numu/terms/` |
| Matrix | `/projects/matrix/terms/` | `/ar/projects/matrix/terms/` |
| Chopshop | `/projects/chopshop/terms/` | `/ar/projects/chopshop/terms/` |
| Deshi Kitchen | `/projects/deshikitchen/terms/` | `/ar/projects/deshikitchen/terms/` |

### Total: 40 URLs (20 English + 20 Arabic)

---

## Unchanged URLs

These existing URLs MUST continue to work after migration:

| URL | Content | Notes |
|-----|---------|-------|
| `/projects/` | Projects listing page | No change |
| `/ar/projects/` | Arabic projects listing | No change |
| `/projects/money-box/` | Money Box landing | Same URL, different template |
| All other project landing URLs | Same pattern | Same URL, new layout |

### Out-of-Scope Projects (URLs preserved, no changes)

- `/projects/photorestore-ai/`
- `/projects/medical-education-app/`
- `/projects/nss-virtual-education-fair/`
- `/projects/bd-railway-automated-timetable/`
- `/projects/malaysian-business-websites/`

These remain as flat content files using `layout: branded`.
