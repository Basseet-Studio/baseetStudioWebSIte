# Data Model: Fix RTL Mobile Layout

**Feature**: 001-fix-rtl-mobile-layout  
**Date**: 2026-02-11

## Entities

This feature involves no data entities. It is a purely presentational change affecting CSS stylesheets and Hugo HTML templates. No YAML data files, Markdown content files, or i18n keys are created, modified, or deleted.

## State Transitions

The mobile menu has two visual states that remain unchanged by this feature:

| State | CSS Class | Transform (LTR) | Transform (RTL) |
|-------|-----------|------------------|------------------|
| Closed (default) | — | `translateX(100%)` | `translateX(-100%)` |
| Open | `.open` | `translateX(0)` | `translateX(0)` |

The state transition is triggered by the existing JavaScript (toggle `open` class). No changes to state logic are required.
