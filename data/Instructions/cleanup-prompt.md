# Claude Code Task — Clean Repo to Frontend-Only Site

## Context

This repository currently contains a mix of things that don't belong together:
- A Next.js/React frontend (the site — this is what we keep)
- A Python backend (`backend/` folder and related files)
- Docker infrastructure for a multi-service setup (`Dockerfile.frontend`, `Dockerfile.frontend.dev`, `nginx.conf`, `docker-compose` files)
- Pipeline scripts (`scripts/pipeline/`) that belong in a separate engine repo
- Data files (`data/`) that belong in a separate engine repo
- Task documents and architecture specs that are now outdated

The goal of this task is to strip the repo down to **only what belongs to the site and frontend**. This repo will eventually consume the filter engine as an external package. It should contain nothing that isn't directly related to the user-facing Next.js application.

---

## What to Keep — Do Not Touch These

- `src/` — the entire source directory, all of it
- `public/` — all static assets
- `package.json` — keep, but audit (see below)
- `package-lock.json` — keep
- `tsconfig.json` — keep
- `next.config.*` — keep
- `tailwind.config.*` — keep
- `postcss.config.*` — keep
- `.gitignore` — keep, but clean up Python-related entries that no longer apply
- `eslint.config.*` or `.eslintrc.*` — keep
- Any `*.env.example` file — keep

---

## What to Delete — Remove These Entirely

Remove every file and folder in this list. Do not move them, do not archive them, delete them:

- `backend/` — entire directory, Python API server
- `Dockerfile.frontend` — Docker infra, not needed for SaaS frontend
- `Dockerfile.frontend.dev` — same
- `nginx.conf` — belongs to infra, not the site
- `docker-compose.yml` and any `docker-compose.*.yml` variants
- `scripts/` — entire directory, pipeline scripts belong in engine repo
- `data/` — entire directory, data artifacts belong in engine repo
- `*.md` files at the root that are task documents, architecture specs, or pipeline documentation (check each one — only keep a README.md that describes the site itself, and only if one exists and is accurate)
- Any `__pycache__/`, `*.pyc`, `*.py` files anywhere in the repo
- Any `.python-version` or `requirements.txt` or `pyproject.toml` files
- `analyzer.py` or any standalone Python scripts at root level

---

## package.json Audit

After deleting the above, open `package.json` and remove any dependencies or devDependencies that were only used by:
- Pipeline scripts (tsx, playwright if only used in scripts)
- Python integration tooling
- Docker-related tooling

Keep all dependencies that `src/` actually imports. If uncertain whether a dependency is used by the frontend, check with a quick grep before removing it.

---

## After Deletion — Verify the Site Still Works

Run these commands and confirm they succeed without errors:

```bash
npm install
npm run build
```

If `npm run build` fails after the cleanup, investigate and fix. The most likely cause is a `package.json` dependency that was incorrectly removed. Do not leave the build broken.

---

## Final State

After this task, the repo should contain exactly:
- `src/` — Next.js application source
- `public/` — static assets
- Standard config files (`package.json`, `tsconfig.json`, `tailwind.config.*`, etc.)
- `.gitignore`
- Optionally a clean `README.md` describing the site

Nothing else. No Python. No Docker. No pipeline. No data files. No architecture docs.

---

## What NOT to Do

- Do not refactor any code inside `src/`
- Do not change any imports or component logic
- Do not modify any config files beyond what is listed above
- Do not create any new files
- Do not add a README if one doesn't already exist — leave that for the human
