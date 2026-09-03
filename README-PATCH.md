# mahiru7229.github.io page rebuild

This patch contains only the files that need to be replaced/added in the existing website repository.

## Replace

- `/index.html` — rebuilt personal card page.
- `/mcw_core/index.html` — rebuilt MCW Core download/install/live-docs page.

## Optional background files

### Main card

Default stays exactly on the existing image:

`/assets/img/bg/user_bg.jpg`

To override it, add:

`/assets/img/bg/custom_bg.jpg`

If `custom_bg.jpg` exists, the page uses it. If it is missing or fails to load, the page automatically keeps `user_bg.jpg`.

### MCW Core page

Add or replace:

`/mcw_core/assets/background.jpg`

If this file exists, the Core page uses it. If it does not exist, the Core page keeps its built-in gradient background.

There is intentionally NO browser upload / URL input UI.

## Live Core documentation

The MCW Core page reads documentation from:

`https://github.com/mahiru7229/mcw-launcher-core`

It discovers Markdown files under `docs/` plus `README.md`, `RELEASE.md`, and `CHANGELOG.md` by using the GitHub public API, then loads selected Markdown from `raw.githubusercontent.com`.

Features:

- automatic document list discovery
- EN / VI filter
- search
- in-page Markdown rendering
- tables and code blocks
- syntax highlighting
- relative Markdown links rewritten to open inside the reader when possible
- images rewritten to raw GitHub paths
- shareable `?doc=...` URL
- button to open the current document on GitHub

## Release downloads

The Core page attempts to resolve the latest GitHub Release automatically. It looks for:

- `.whl` package
- full/source `.zip`
- docs `.zip`

If no matching release asset exists, source falls back to the main repository ZIP and the wheel button opens the Releases page.
