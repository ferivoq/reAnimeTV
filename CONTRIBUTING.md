# Contributing to AnimeTV

This guide explains how to add new anime sources and how to fix or update existing ones. For overall architecture and technical details, see [ARCHITECTURE.md](ARCHITECTURE.md).

## How Sources Work

AnimeTV loads a WebView with content from anime streaming sites. The app intercepts network requests: `/__view/*` serves local assets, and `/__proxy/*` forwards requests to source sites. Each source has an index (SD): 1 = AnimeKAI, 2 = Hianime. Users can switch sources and domains via Settings → Source Server.

---

## Project Layout (Sources)

| File | Purpose |
|------|---------|
| [app/src/main/assets/view/bootstrap.js](app/src/main/assets/view/bootstrap.js) | Source names, domain lists, `__SD` constants, domain health check |
| [app/src/main/assets/view/sources/config.js](app/src/main/assets/view/sources/config.js) | Source registry placeholder |
| [app/src/main/assets/view/sources/animekai.js](app/src/main/assets/view/sources/animekai.js) | AnimeKAI (SD 1) API client |
| [app/src/main/assets/view/sources/hianime.js](app/src/main/assets/view/sources/hianime.js) | Hianime (SD 2) minimal config |
| [app/src/main/assets/view/core.js](app/src/main/assets/view/core.js) | Shared UI, source dispatch: `recent_parse`, `home_parser`, `_API.getView`, `_API.getTooltip`, `pb` video loading |
| [app/src/main/assets/view/build-view.js](app/src/main/assets/view/build-view.js) | Concatenates sources into `m.js` |

---

## Adding a New Source

### A. Java & Electron Domains

- **[Conf.java](app/src/main/java/com/amarullz/androidtv/animetvjmto/Conf.java)**  
  Add the new domain to `SOURCE_DOMAINS` at the index matching your new SD number (e.g. index 3 for SD 3).

- **[electron/src/libs/common.js](electron/src/libs/common.js)**  
  Add the same domain to the `dns` array.

### B. Bootstrap

- **[bootstrap.js](app/src/main/assets/view/bootstrap.js)**  
  - Add display name to `__SOURCE_NAME`
  - Add domain list to `__SOURCE_DOMAINS`
  - Define constant (e.g. `const __SD3=(__SD==3)`)
  - Update migration block so users on removed sources are migrated (e.g. `if (__SD>3){ ... }`)

### C. Source File

- Create `sources/newsource.js` with your API client (e.g. `req`, `getTooltip`, `getView`, `loadVideo`, `parseHomeSlideshow`).
- Add it to the `files` array in [build-view.js](app/src/main/assets/view/build-view.js).

### D. Core Integration

In [core.js](app/src/main/assets/view/core.js), add branches for your source in:

- **`home.init_homepage`** – Homepage section URLs (Recently Updated, Latest Dub, etc.)
- **`home.recent_load`** – Handle response format: JSON (`v.result`) vs raw HTML
- **`home.recent_parse`** – Parse list HTML/JSON into the expected data shape (see Data Contracts below)
- **`home.home_parser`** – Parse slideshow/carousel, or delegate to your source module
- **`_API.getView`** – Load anime page and episode list
- **`_API.getTooltip`** – Load tooltip/anime info
- **`pb` video loading** – Hook into the playback path for your source

### E. Domain Health Check

- `SD_CHECK_DOMAIN` in bootstrap.js uses `chk_url` and `chk_json` to test domains. Ensure your source exposes a testable endpoint (e.g. `/manifest.json` with a known key), or document any custom behavior.

### F. Build

Run `npm run build:view` to regenerate `m.js`. This also runs automatically before Gradle and Electron builds.

---

## Fixing or Updating Existing Sources

### AnimeKAI (SD 1)

- **Files:** [sources/animekai.js](app/src/main/assets/view/sources/animekai.js), [core.js](app/src/main/assets/view/core.js)
- **APIs:** `/ajax/home/items`, `/ajax/episodes/list`, `/ajax/links/list`, `/ajax/links/view`; [enc-dec.app](https://enc-dec.app) for Mega streams
- **Common fixes:**
  - Homepage "Loading data...": API returns `{"status":200,"result":"<html>"}`. In `recent_load`, use `JSON.parse(r.responseText)` and pass `v.result` to `recent_parse`, not raw `r.responseText`.
  - Selector changes: `recent_parse` for SD 1 expects `div.aitem`, `[data-tip]`, `a.title[title]`, etc. Adjust if the site HTML changes.
  - Domain mirrors: update `__SOURCE_DOMAINS` and `Conf.SOURCE_DOMAINS`.
  - vrf/rc4 and enc-dec: see [tools/notes/new-source-notes.md](tools/notes/new-source-notes.md) and [tools/utils/vrf.js](tools/utils/vrf.js).

### Hianime (SD 2)

- **Files:** [sources/hianime.js](app/src/main/assets/view/sources/hianime.js), [core.js](app/src/main/assets/view/core.js)
- **APIs:** Full-page HTML (`/recently-updated`, `/dubbed-anime`), `/ajax/v2/episode/...`
- **Parsers in core.js:** `home.hi_parse`, `home.hi_tipurl`, `home.hi_animeid`
- **Common fixes:**
  - Selector changes: `hi_parse` uses `section div.film_list-wrap div.flw-item`, `.film-name a`, `.tick-sub`, `.tick-dub`, etc.
  - URL structure and domain mirrors: update `__SOURCE_DOMAINS` and `Conf.SOURCE_DOMAINS`.

### General

- **Domain changes:** Update both [Conf.java](app/src/main/java/com/amarullz/androidtv/animetvjmto/Conf.java) `SOURCE_DOMAINS` and [bootstrap.js](app/src/main/assets/view/bootstrap.js) `__SOURCE_DOMAINS`.
- **Stream decoding:** Vidplay, MegaUp, Megaf, MegaCloud, RapidCloud – see [tools/notes/new-source-notes.md](tools/notes/new-source-notes.md) and enc-dec.app for AnimeKAI.

---

## Data Contracts

Your parsers must produce objects in these shapes.

**Recent list item** (output of `recent_parse`):

```js
{ url, title, title_jp, poster, tip, ep, epsub, epdub, eptotal, type, duration, adult }
```

**Tooltip** (output of `getTooltip`):

```js
{ title, title_jp, synopsis, poster, url, ttid, ep, genre, duration, status, epdata, more }
```

---

## Tools and Reference

| Resource | Purpose |
|----------|---------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Architecture, proxy flow, TV provider |
| [tools/notes/new-source-notes.md](tools/notes/new-source-notes.md) | APIs, vrf/rc4, enc-dec.app, Mega decoding |
| [tools/utils/vrf.js](tools/utils/vrf.js) | AnimeKAI vrf encode/decode |
| [tools/utils/kai.js](tools/utils/kai.js) | AnimeKAI utilities (loaded at runtime) |
| `npm run build:view` | Rebuild m.js from sources |

---

## Testing

- **Android:** `./gradlew assembleDebug`, run on device or emulator
- **Electron:** `npm run pack-linux`, `pack-win`, or `pack-mac`, then run the app
- **Source switching:** Settings → Source Server to change source and benchmark domains
