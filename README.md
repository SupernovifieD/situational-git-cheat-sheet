# Situational Git Cheat Sheet

A static, situation-first Git reference for real development problems.

Live site: https://supernovified.github.io/situational-git-cheat-sheet/

## Why this exists?

Most Git cheat sheets are command-first. This project is situation-first: users start from _“what went wrong?”_ and get practical commands with risk labels and safer alternatives. Also, this repo is for the moments you cannot use AI for whatever resean. 

## What’s in the site

- Situation cards generated from `git-situational-cheat-sheet.md`
- Clear danger labels: `SAFE`, `CAUTION`, `DANGER`, `RECOVERY`
- Panic Mode quick actions
- Client-side search + filters
- Copy buttons for command blocks
- Dark/light theme toggle (dark by default, persisted in `localStorage`)

## Tech stack

No framework, no build step:

- `index.html` – page structure and static sections
- `assets/styles.css` – design system and responsive styles
- `assets/app.js` – Markdown parsing, card rendering, search/filter logic, interactions
- `git-situational-cheat-sheet.md` – source content

## How content works

`assets/app.js` parses `git-situational-cheat-sheet.md` at runtime and builds the cards.

The parser supports:

- Numbered top-level categories (`# 1. ...`, `# 2. ...`)
- Markdown tables for situation/command rows
- Recipe blocks like `## Recipe: "..."` with fenced code blocks
- Danger inference and safer-step suggestions based on command patterns

If the Markdown fails to load, the site shows an in-page error message.

## Local development

This is a static site. You can open `index.html` directly, but using a local HTTP server is recommended so `fetch()` works consistently.

```bash
# from repo root
python3 -m http.server 8080
```

Then open: `http://localhost:8080`

## Contributing

- Open an issue for missing situations or unclear recipes.
- Keep copy practical and short.
- Prefer safer/reversible guidance on shared branches.
- Test on both desktop and mobile widths before opening a PR.

## License

MIT — see [LICENSE](LICENSE).
