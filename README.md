# RadioForUs Propagation — Chrome extension

Browser extension for [RadioForUs](https://radioforus.co.uk/) — HF and VHF/UHF band conditions at a glance.

Built by [Jack Brown](https://jackbrown.xyz/) for the RadioForUs community.

## Features

- HF bands with day (D) and night (N) — Good / Fair / Poor
- VHF / UHF (6 m, 4 m, 2 m, 70 cm) in the same layout
- Favourite bands (HF and VHF), managed in Settings
- Links tab (PSK Reporter, Reverse Beacon, DX Summit, HamQSL, RFU)
- Light / dark theme, callsign for PSK map link, stale-data warning
- Offline cache via Chrome storage

## Requirements

- Google Chrome (or Chromium)
- Live API: `https://radioforus.co.uk/api/propagation-summary.php`  
  Propagation data must be synced on the server (`propagation/data/` via the RFU dashboard).

## Install (developers / testers)

1. Clone this repository (or download a release zip).
2. Open `chrome://extensions`
3. Enable **Developer mode**
4. **Load unpacked** → select this folder (must contain `manifest.json`)

## Privacy

https://radioforus.co.uk/extension-privacy.php

## Contribute

We welcome pull requests. Read [CONTRIBUTING.md](CONTRIBUTING.md) for fork → branch → PR workflow and review process.

**Do not commit secrets** (API keys, passwords, `.env` files).

## API

`GET https://radioforus.co.uk/api/propagation-summary.php`

Server-side builder: `includes/rfu_propagation_api.php` in the main RadioForUs site repo.

## Chrome Web Store

Distribution for most users will be via the Chrome Web Store once published. GitHub is for source, issues, and contributions.

## Licence

MIT — see [LICENSE](LICENSE). The RadioForUs name and logo are project branding; do not imply official endorsement without permission.
