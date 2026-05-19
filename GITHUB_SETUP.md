# Publishing this extension on GitHub for contributors

The main RadioForUs site may stay on your private VPS git remote. Contributors need a **public GitHub repository** to fork and open pull requests.

## Option A — Extension-only repo (recommended for contributors)

One public repo with only extension files. Easier for volunteers; no full site code exposed.

1. On GitHub: **New repository** → e.g. `radioforus-propagation-extension` → Public.
2. On your machine, from the RadioForUs project:

```bash
cd /path/to/RadioForUs
git subtree split --prefix=chrome-extension -b extension-only
mkdir -p ../radioforus-propagation-extension
cd ../radioforus-propagation-extension
git init
git pull /path/to/RadioForUs extension-only
git remote add origin git@github.com:YOUR_USERNAME/radioforus-propagation-extension.git
git push -u origin main
```

3. On GitHub: **Settings → General → Pull Requests** — allow forks, require PR reviews if you want.
4. Add repo URL to `chrome-extension/README.md` (Contributors section).
5. When you merge a contributor PR on GitHub, pull into your main project:

```bash
cd /path/to/RadioForUs
git subtree pull --prefix=chrome-extension git@github.com:YOUR_USERNAME/radioforus-propagation-extension.git main
```

Deploy `chrome-extension/` to your machine as today; deploy API changes on the VPS separately.

## Option B — Full RadioForUs repo public

Fork-friendly if you are happy open-sourcing the whole site. Point GitHub `origin` as a second remote; keep VPS deploy remote separate.

```bash
git remote add github git@github.com:YOUR_USERNAME/RadioForUs.git
git push github main
```

Contributors PR into `chrome-extension/` on the monorepo.

## Review settings (GitHub)

- **Settings → Branches → Branch protection** on `main`: require pull request, require 1 approval (you).
- **Settings → Collaborators** optional for trusted helpers with direct access.

## Releases

Tag versions matching `manifest.json` (e.g. `v1.2.1`) and attach a zip of the extension folder for testers who do not use git.

```bash
cd chrome-extension
zip -r ../radioforus-propagation-extension-v1.2.1.zip . -x "*.git*"
```

## Chrome Web Store

GitHub = source and contributions. End users still install from the **Chrome Web Store** when published; link the GitHub repo from the store listing for transparency.
