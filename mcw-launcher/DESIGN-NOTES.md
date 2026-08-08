# MCW Launcher — V3 Design Notes

## Concept: World Control System

This is a ground-up redesign, not a reskin of the previous MCW Launcher website.

### Visual direction
- Obsidian / graphite base instead of Minecraft-green everywhere.
- Acid-lime only for action and healthy state; ice-blue for preview/beta state.
- Large editorial typography paired with compact monospace system labels.
- Product UI is the hero: the launcher mockup is treated as a dimensional control deck.
- “Worlds” are visualized as independent stacked objects instead of generic feature cards.
- Borders, grids and dense metadata give the site a software-product feel rather than a gaming template feel.

### Interaction direction
- Floating glass navigation.
- Mouse parallax on the launcher mockup (desktop only).
- Small magnetic CTA movement (desktop only).
- Scroll reveal with reduced-motion fallback.
- Hash-based Home / Releases navigation.
- Release/Beta tabs, search, release detail, notes and direct download.
- GitHub Releases API cache (10 minutes) + stale cache fallback.
- Dark/light theme stored in localStorage.

### Design research translated into MCW
- Linear: product storytelling, restrained UI density, strong typographic hierarchy.
- Raycast: launcher/command-product feeling and floating interface layers.
- Vercel: typography, thin grid lines, technical visual language.
- Cursor: hero centered around the product rather than decorative illustration.
- Modrinth: mod-management information density and download/channel clarity.
- Lunar Client: game-first positioning and prominent download affordance.

The result intentionally does not copy the layout, colors, branding, or assets of any one reference site.

## Replace in repository

Replace these files in `mcw-launcher/`:
- `index.html`
- `styles.css`
- `script.js`

Keep the existing `assets/` directory. The page still references `assets/favicon.svg`.

## Local test

From the repository root:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000/mcw-launcher/
```

Using a local HTTP server is recommended because the page fetches GitHub Releases data.
