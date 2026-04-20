# TrustFlow Design System

TrustFlow is a **streaming subscription protocol** built on [Arc Network](https://arc.network). It replaces traditional monthly billing with per-second USDC streams — subscribers pay only for time consumed, merchants receive real-time revenue with no chargebacks.

## Sources

- **Brand assets**: `uploads/` — logos, tokens, icon, banner, og-image
- **Brand README**: `uploads/README.md` — color palette, typography, usage rules
- **Codebase**: GitHub `0xRepox/trustflow` — full monorepo (Foundry contracts + Next.js app)
- **App source**: imported from `app/app/` and `app/components/` — Next.js pages and components

---

## Product Surfaces

| Surface | Description |
|---|---|
| **Merchant Dashboard** | Next.js web app — manage plans, view streams, handle disputes, see overview stats |
| **Subscriber Checkout** | Public `/subscribe/[planId]` page — wallet connect → approve USDC → create stream |
| **Smart Contracts** | Foundry — `PlanRegistry`, `StreamManager`, `DisputeResolver` on Arc Testnet |

---

## CONTENT FUNDAMENTALS

### Tone & Voice
- **Direct and technical** — TrustFlow speaks to crypto-native users and developers; no hand-holding, no fluff
- **Confident but minimal** — short, declarative sentences. No filler. One line per idea.
- **Lowercase-first labels** — UI labels use sentence case, not Title Case. e.g. "Active streams", not "Active Streams"
- **Monospace labels for categories** — `{CATEGORY}` labels use Space Mono with amber/orange color
- **No emoji** — TrustFlow does not use emoji in UI or copy. Exception: ✓ checkmark on success screens
- **"you" perspective** — Copy is user-centric: "Your stream is live", "Connect your wallet to view"
- **Numbers are shown precisely** — USDC to 2 decimal places in UI, 6 decimal places for per-second rates
- **Technical precision** — "wei", "per-second", "onchain" written as single words; `$0.000011 USDC/s` style rates shown

### Specific Examples
- CTA: `Subscribe · $29.99 USDC`
- Status message: `Your stream is live. You're being charged $0.000011 USDC/s and can cancel anytime.`
- Empty state: `No plans yet.`
- Loading: `Loading plan…` (ellipsis, not "...")
- Error: `Error: insufficient funds`
- Labels: `{STREAMING}`, `{USDC}`, `{ARC NETWORK}`

---

## VISUAL FOUNDATIONS

### Colors
- **Page background**: `#0D1B2A` — deep navy, near-black
- **Surface (cards)**: `#0F2236` → `#162F4A` — layered elevation via slightly lighter navy
- **Primary accent**: `#ACC6E9` — soft Arc blue; used for secondary text, icons, highlights
- **CTA / interactive**: `#3898EC` — vivid Arc blue; buttons, links, active states
- **Deep accent**: `#2F578C` — darker blue for muted accents on lighter backgrounds
- **Subtext**: `#7A9FC4` — muted blue-gray for descriptions and secondary labels
- **Label / orange accent**: `#C9893A` — warm amber for `{MONOSPACE LABELS}` and warnings
- **Success**: `#4CAF7D` — green for active streams, positive values
- **Error**: `#E05555` — red for errors, insufficient balance

### Typography
- **Headings**: Space Grotesk — 300 (light display) + 700 (bold headlines)
- **Body**: DM Sans — 400/500, clean and readable
- **Mono/labels**: Space Mono — 400, for addresses, rates, `{TAGS}`, code
- App currently uses **Geist** (Next.js default) — brand spec calls for Space Grotesk/DM Sans

### Backgrounds
- Flat dark navy (#0D1B2A) as page background
- Thin decorative arc curves as SVG background elements (per Arc Network alignment)
- `linear-gradient(135deg, #0D1B2A 0%, #1A3A5C 100%)` for hero/banner sections
- No photographic backgrounds in app; og-image and banner use SVG illustration

### Cards
- Background: `#0F2236` or `#162F4A`
- Border: `rgba(172, 198, 233, 0.15)` — subtle blue-tinted border
- Border radius: `12px` (lg) for cards, `8px` (md) for inputs/small items
- Shadow: `0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3)`
- Hover: border upgrades to `rgba(56,152,236,0.35)` (vivid blue) — no background change
- No left-border-only accent patterns

### Buttons
- **Primary**: `bg-blue-600` (`#3898EC`) → hover `#5AABF0` — full fill, rounded-lg
- **Secondary/ghost**: `bg-gray-800` border `border-gray-700` — dark muted
- **Destructive text**: `text-red-400` hover `text-red-300` — inline, no background
- **Disabled**: `opacity-50` on any variant
- Border radius: `8px` md for small, `12px` lg for full-width CTAs
- Transitions: `transition-colors` only — no scale/transform on press

### Borders
- Default: `rgba(172, 198, 233, 0.15)` — barely-there blue tint
- Strong: `rgba(172, 198, 233, 0.30)`
- Active/hover: `rgba(56, 152, 236, 0.35)` — vivid blue glow border
- Warning context: `border-yellow-800/40`
- Error context: `border-red-800`
- Success context: `border-green-800`

### Shadows & Glow
- Cards: `0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3)`
- Blue glow (accent elements): `0 0 24px rgba(56,152,236,0.25)`
- Soft glow (large surfaces): `0 0 40px rgba(172,198,233,0.12)`

### Animation & Motion
- Simple `transition-colors` on interactive elements — no easing curves defined
- No page transitions or complex animations in current app
- Arc Network motif: decorative arc/S-curve used statically in logo and icon

### Iconography
- **No icon font** in the codebase — no Lucide, Heroicons, or similar
- The TrustFlow icon mark (S-curve + dots) is the primary visual motif
- Status indicators: colored dot-free; use badge pills instead
- Address display: truncated `0x1234…5678` format in Space Mono
- Wallet addresses shown as mono text, not icons

### Status Badges
- `Active`: `bg-green-900 text-green-300` rounded-full
- `Paused`: `bg-yellow-900 text-yellow-300` rounded-full
- `Cancelled` / `Inactive`: `bg-gray-800 text-gray-400` rounded-full
- `Open` dispute: `bg-yellow-900/30 text-yellow-400` rounded-full
- `Responded`: `bg-blue-900/30 text-blue-400` rounded-full

### Layout
- Max content width: `max-w-6xl` (72rem) centered with `px-6 py-8`
- Nav: full-width `border-b border-gray-800`, `px-6 py-4`, flex row
- Checkout card: `max-w-md` centered, standalone page (no nav)
- Spacing scale: 4px base unit (--space-1), multiples of 4

### Corner Radii
- `4px` (sm) — pills/badges inner
- `8px` (md) — inputs, small buttons, inner panels
- `12px` (lg) — cards, large panels (default)
- `16px` (xl) — modals, checkout card
- `9999px` (full) — status pills, tags

### Transparency & Blur
- Overlay: `rgba(13, 27, 42, 0.85)` — no backdrop blur currently used
- Elevated panels use solid dark colors, not frosted glass

---

## ICONOGRAPHY

TrustFlow does not use a third-party icon library. The visual identity centers on:
- **The TrustFlow icon mark** (`assets/icon.svg`) — S-curve stream with source/destination dots
- **The wordmark logos** (`assets/logo-dark.svg`, `assets/logo-light.svg`)
- Status communication via **color-coded badge pills**, not icons
- Wallet addresses as truncated monospace strings
- **No emoji** in UI; only the `✓` unicode checkmark on the subscription success screen

If an icon library is needed, **Lucide** (stroke-weight 1.5, clean geometric) is the closest match to TrustFlow's aesthetic. Link from CDN: `https://unpkg.com/lucide@latest/dist/umd/lucide.min.js`

---

## File Index

```
README.md                  ← This file
colors_and_type.css        ← All CSS custom properties + semantic type styles
SKILL.md                   ← Agent skill definition

assets/
  logo-dark.svg            ← Primary logo (white, for dark backgrounds)
  logo-light.svg           ← Secondary logo (dark, for light backgrounds)
  icon.svg                 ← Standalone icon mark
  favicon.svg              ← Browser favicon
  og-image.svg             ← Social share card (1200×630)
  banner.svg               ← GitHub/landing banner (1500×500)

preview/
  colors-bg.html           ← Background color swatches
  colors-blue.html         ← Blue palette swatches
  colors-semantic.html     ← Semantic / status colors
  colors-text.html         ← Text color ramp
  type-heading.html        ← Heading type specimens
  type-body.html           ← Body + mono type specimens
  type-scale.html          ← Full type scale
  spacing.html             ← Spacing tokens
  radii-shadows.html       ← Border radius + shadow system
  components-buttons.html  ← Button variants
  components-cards.html    ← Card + surface variants
  components-badges.html   ← Status badges + labels
  components-inputs.html   ← Form input styles

ui_kits/
  merchant-dashboard/
    index.html             ← Interactive merchant dashboard prototype
    Nav.jsx                ← Top navigation component
    StatCard.jsx           ← Overview stat card
    PlanCard.jsx           ← Plan list item
    StreamsTable.jsx       ← Streams data table
    DisputeCard.jsx        ← Dispute item with actions
    OverviewPage.jsx       ← Overview screen
    PlansPage.jsx          ← Plans management screen
    StreamsPage.jsx        ← Streams list screen
    DisputesPage.jsx       ← Disputes inbox screen
    SubscribePage.jsx      ← Public checkout flow
```
