# Contributing to RadioForUs Propagation (Chrome extension)

Thank you for helping improve the extension. All changes go through **pull request review** before merge.

## Before you start

1. Read [README.md](README.md) for scope and install steps.
2. Test with **Load unpacked** in `chrome://extensions`.
3. Confirm the RFU propagation API returns data (or use cached data offline).
4. Never commit credentials, tokens, or personal server paths.

## Workflow

1. **Fork** the repository on GitHub (see repo link in the project README).
2. **Clone** your fork locally.
3. Create a branch from `main` (or `master`):
   - `fix/short-description` for bugs
   - `feat/short-description` for features
4. Make focused changes — prefer small PRs over huge ones.
5. Test the popup: Bands, Links, Settings, light/dark theme, favourites.
6. **Push** to your fork and open a **Pull Request** against the upstream default branch.
7. A maintainer will review, request changes if needed, and merge.

## What to change here

This folder is self-contained:

| File | Role |
|------|------|
| `manifest.json` | Extension metadata and permissions |
| `popup.html` / `popup.css` / `popup.js` | Popup UI |
| `service_worker.js` | Background refresh and toolbar badge |
| `theme-boot.js` | Theme flash prevention |
| `icons/` | Extension icons |

API and propagation cache live on the **RadioForUs website** (`api/propagation-summary.php`, `includes/rfu_propagation_api.php`). If your change needs new JSON fields, coordinate in the PR description — site changes may be required in the main site repo.

## Code expectations

- Match existing style (plain JS, no build step unless agreed in an issue first).
- Keep diffs minimal — do not reformat unrelated files.
- Use `chrome.storage.local` for user preferences (theme, favourites, callsign).
- Respect user privacy: no tracking, no extra host permissions without discussion.
- **No comments in code** unless a maintainer asks for them on a specific block.

## Pull request checklist

- [ ] Tested locally with Load unpacked
- [ ] No secrets or personal URLs in the diff
- [ ] `manifest.json` version bumped if you ship user-visible changes (patch/minor as appropriate)
- [ ] README or CONTRIBUTING updated if behaviour or install steps change
- [ ] PR description explains **what** and **why**

## Reporting bugs

Open a GitHub **Issue** with:

- Chrome version
- Extension version (`manifest.json`)
- Steps to reproduce
- Expected vs actual behaviour
- Screenshot if UI-related

## Questions

Open an issue labeled `question` or contact the RadioForUs team via the site.

Maintainers: Jack Brown and RadioForUs project owners.
