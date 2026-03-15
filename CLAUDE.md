# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AtypicalTwist is a static single-page cruise vacation discovery platform. Everything lives in one monolithic `index.html` file — HTML structure, CSS styles, and JavaScript logic together (~3,000 lines). There is no build system, no package manager, and no backend.

## Development Workflow

Since there is no build step, editing is direct:
- Edit `index.html` and open it in a browser to preview changes
- Deploy by pushing to `main` (production) or `test-changes` (staging) — Cloudflare serves the static file

To preview locally, just open `index.html` in a browser. There are no local servers, tests, or linters configured.

## Architecture

**Single-file SPA:** All application code is in `index.html`. Sections are separated by HTML comments (e.g., `<!-- HERO -->`, `<!-- SEARCH -->`, `<!-- RESULTS -->`).

**Data layer:** Cruise data is a hardcoded JavaScript array (`mockCruises`) embedded in the `<script>` block. The `API_BASE` is set to `'https://disabled'`, so `fetchCruises()` always falls back to mock data.

**Subscription tiers** are stored in `localStorage` under the key `at_tier`. Values: `free` (2 segments), `explorer` (4 segments, $5/mo), `voyager` (8 segments, $12/mo). `getCurrentTier()` reads this and controls feature gating.

**Email/notifications:** EmailJS handles email capture and cruise inquiries (no server-side code). Public credentials are embedded in the HTML.

**Affiliate links:** Booking CTAs link to Royal Caribbean, Carnival, Norwegian, Virgin Voyages, MSC, Princess, Celebrity, Holland America, VacationsToGo, Stay22, Resort for a Day, and InsureMyTrip.

## Key Functions

| Function | Purpose |
|---|---|
| `fetchCruises()` | Loads cruise data (always returns mock data) |
| `renderCards()` | Renders cruise result cards to the grid |
| `applyFilters()` | Filters cruises by destination, port, duration, price |
| `renderSegments()` | Builds multi-segment itinerary UI |
| `searchSegments()` | Searches within segment builder |
| `openModal()` / `closeModal()` | Modal dialog management |
| `handleEmailSubmit()` / `submitAlerts()` | Email capture forms |
| `submitInquiry()` | Sends cruise inquiry via EmailJS |
| `setSimTier()` | Simulates tier switching (dev helper) |
| `dpOpen()` / `dpClose()` / `dpPick()` | Custom date picker component |

## Design Tokens (CSS Variables)

```css
--ink:   #0f0e0c  /* primary text */
--sand:  #f5f0e8  /* background */
--ocean: #1a3a4a  /* navy accent */
--gold:  #9a7a3f  /* highlight */
--rust:  #c0553a  /* secondary accent */
--mist:  #8a9ea8  /* muted text */
--foam:  #c8dde8  /* light accent */
```

Fonts: Cormorant Garamond (headings), DM Sans (body) via Google Fonts.

## Deployment

Hosted on Cloudflare static hosting. The `_headers` file sets `Content-Type: text/html; charset=utf-8`. Push to `main` to deploy to production; `test-changes` branch is used for staging.
