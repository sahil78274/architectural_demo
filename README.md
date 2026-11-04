# VASTU Architecture Design Studio — Website

A static, dependency-free website for **VASTU Architecture Design Studio** — architectural design,
interior services and construction, led by **Naresh Thakran**.

No build step, no framework, no npm install. Open `index.html` or serve the folder with any static
host. Everything is plain HTML, CSS and a single vanilla JavaScript file.

```
index.html          all content, in reading order
css/style.css       design system + layout + responsive rules
js/config.js        ← the only file you normally need to edit
js/main.js          navigation, reveals, form validation, WhatsApp hand-off
assets/             photography (originals in /assets, optimised in /assets/opt)
assets/opt/         responsive WebP + JPEG derivatives used by the page
fonts/              self-hosted Instrument Serif + Jost (woff2)
```

---

## 1. Things to update before going live

### Phone numbers
Both numbers are wired everywhere: header panel, contact section, footer, click-to-call links and the
JSON-LD block. To change them, update these two places:

- `js/config.js` → `phones` (this drives every WhatsApp link)
- `index.html` → search for `9971343494` and `9991009143` (`tel:` links and visible text)

### Consultation form
Open `js/config.js`:

```js
enquiryEndpoint: "",   // ← empty by default
```

**While `enquiryEndpoint` is empty** the form is honest about what it does: it validates the fields,
then reveals the enquiry as a ready-to-send WhatsApp message. No success message is shown, nothing is
pretended to be stored, and the confirmation panel stays hidden.

**Set `enquiryEndpoint` to a URL** (for example `/api/enquiry` or a form service endpoint) and the form
`POST`s JSON to it instead:

```json
{
  "name": "...", "mobile": "...", "email": "...", "service": "...",
  "propertyType": "...", "location": "...", "budget": "...",
  "preferredDate": "YYYY-MM-DD", "description": "...", "source": "website.consultation"
}
```

The "Request sent" confirmation appears **only** after the endpoint returns a successful response. If
the request fails, the WhatsApp fallback appears with the details still intact.

### Google Maps
`index.html` has a marked block in the contact section (`#map-placeholder`). Replace that `div` with a
Google Maps embed iframe once the studio address is confirmed. **No office address is invented anywhere
on the site** — add it when you have it.

### Project photography
The gallery uses **demo visuals**, clearly labelled "Visual study" and explained in the note beneath the
grid. To publish real work, replace the `<picture>` contents in each `<figure class="work">`, then update
the `alt` text, the category (`.work-cat`) and the caption (`.work-title`). Keep the figure's classes and
the row structure will hold:

| Row | Classes | Layout |
|-----|---------|--------|
| 1 | `work--pano` | full-width 3:1 panorama |
| 2 | `work--half` + `work--half work--offset` | two 4:5 portraits |
| 3 | `work--half` + `work--half work--offset` | two 3:2 landscapes |
| 4 | `work--narrow` + `aside.works-note` | portrait against a text panel |

To add a seventh project, drop a new `<figure class="work work--half">` into the grid, or replace the
`aside.works-note` panel.

---

## 2. Design system

| Token | Value | Use |
|---|---|---|
| `--paper` | `#F8F7F3` | page ground |
| `--white` | `#FFFFFF` | gallery + form panels |
| `--char` | `#202020` | headings, dark sections |
| `--beige` | `#D8C8B4` | accents on dark, italic headings |
| `--bronze` | `#A88B68` | rules, numerals, micro-labels |

Type: **Instrument Serif** for display headings (with a true italic for emphasis), **Jost** for all
body, labels and navigation. Both self-hosted as `woff2` — no third-party font requests, no CDN.

Layout is a 1420px max shell with fluid `clamp()` padding, so the composition holds from 360px to
ultra-wide without breakpoint jumps.

---

## 3. Behaviour notes

- **Sticky navigation** turns from transparent-over-hero to solid paper after the hero, and the mobile
  panel opens as a full-height sheet with keyboard (`Esc`) and scrim dismissal.
- **Scroll reveals** use `IntersectionObserver` at 8% threshold — opacity and a 26px lift only. Images
  ease from a 1.06 crop to 1.0. Nothing bounces, spins or loops.
- **`prefers-reduced-motion`** disables every animation, the hero drift and smooth scrolling.
- **Form validation** runs per field on blur, re-validates on input while a field is in error, blocks
  past dates, checks 10–13 digit mobile numbers and optional-but-valid email, then scrolls to and
  focuses the first problem field with a count in the status line.
- **Service "Enquire Now"** links preset the Select Service dropdown, then focus the first field.
- **Accessibility**: skip link, one `h1` with a logical `h2`/`h3` outline, all form controls labelled,
  `aria-live` on error and status regions, visible focus rings, `aria-expanded`/`aria-controls` on the
  menu button, and body text held at AA contrast or better (muted greys were darkened for this).

---

## 4. Performance

- Hero image preloaded with `imagesrcset`; everything below the fold is `loading="lazy"`.
- All photography served as responsive WebP with a JPEG fallback at the same width, plus explicit
  `width`/`height` on every `<img>` so nothing shifts as the page loads.
- Fonts are `woff2`, subset to Latin, with `font-display: swap` and only the weights actually used.
- Total page weight for a cold visit is roughly 400 KB of imagery before lazy tiles begin loading.
- No JavaScript libraries, no analytics, no external requests of any kind.

---

## 5. Local preview

```bash
python3 -m http.server 8080
# then open http://localhost:8080
```

A server is preferable to opening the file directly, because the WhatsApp hand-off and font loading
behave most realistically over HTTP.
