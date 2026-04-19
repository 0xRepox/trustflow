# TrustFlow Brand Assets

Visual identity for TrustFlow, built on and aligned with the Arc Network design language.

---

## Files

| File | Use |
|------|-----|
| `logo-dark.svg` | Primary logo — white on dark backgrounds |
| `logo-light.svg` | Secondary logo — dark on light backgrounds |
| `icon.svg` | Standalone icon mark |
| `favicon.svg` | Browser tab icon (32×32 tile) |
| `og-image.svg` | Social share card (1200×630) |
| `banner.svg` | GitHub / landing banner (1500×500) |
| `tokens.css` | All design tokens as CSS custom properties |

---

## Color Palette

| Token | Hex | Role |
|-------|-----|------|
| `--color-blue-soft` | `#ACC6E9` | Icon, highlights, secondary text |
| `--color-blue-vivid` | `#3898EC` | CTAs, links, arrows |
| `--color-blue-deep` | `#2F578C` | Dark accents, light-bg version |
| `--color-blue-muted` | `#7A9FC4` | Descriptions, subtext |
| `--color-bg-base` | `#0D1B2A` | Page background |
| `--color-bg-elevated` | `#162F4A` | Cards, surfaces |
| `--color-accent-label` | `#C9893A` | `{CATEGORY}` labels |

---

## Typography

| Role | Font | Weight |
|------|------|--------|
| Headings | Space Grotesk | 300 (light) + 700 (bold) |
| Body | DM Sans | 400, 500 |
| Monospace / labels | Space Mono | 400 |

**Google Fonts import:**
```html
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;700&family=DM+Sans:wght@400;500&family=Space+Mono&display=swap" rel="stylesheet">
```

---

## Logo Usage

### Do
- Use `logo-dark.svg` on all dark backgrounds (navy, black)
- Use `logo-light.svg` on white/light gray backgrounds
- Maintain minimum clear space equal to the icon height on all sides

### Don't
- Don't recolor the wordmark or icon
- Don't stretch or distort the SVG
- Don't place on busy photographic backgrounds without an overlay

---

## Icon Mark

The TrustFlow icon represents a USDC payment stream:
- **Left dot** (`#ACC6E9`) — the subscriber/source
- **S-curve wave** — the per-second streaming path
- **Arrow + right dot** (`#3898EC`) — the merchant/destination

The S-curve intentionally echoes Arc Network's arc motif.

---

## Arc Network Alignment

TrustFlow follows Arc's design language:
- Dark navy gradient backgrounds
- Thin decorative arc curves as background elements
- Space Grotesk for bold headlines
- `{MONOSPACE LABELS}` in Space Mono with amber/orange color
- Clean white-outlined buttons
- Soft blue (`#ACC6E9`) as the primary accent color
