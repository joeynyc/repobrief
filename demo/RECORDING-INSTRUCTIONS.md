# Recording Instructions (asciinema + agg)

## 1) Install tools

```bash
brew install asciinema
brew install agg
```

Alternative renderer: `svg-term` (`npm i -g svg-term-cli`).

## 2) Record terminal session

```bash
cd /Users/joeyrodriguez/Projects/repobrief/demo
chmod +x demo-script.sh
asciinema rec demo.cast --command "./demo-script.sh"
```

Tips:
- Use a clean terminal theme with high contrast.
- Resize terminal to ~120x32 before recording for a readable GIF.
- Keep typing minimal; the script prints commands clearly.

## 3) Render GIF with agg

```bash
agg demo.cast demo.gif --theme github-dark --font-size 16 --speed 1.0
```

Useful tweaks:
- `--cols 120 --rows 32` for consistent dimensions
- `--idle-time-limit 1.0` to remove long pauses
- `--speed 1.25` for a snappier demo

## 4) Alternative: render SVG then convert

```bash
svg-term --cast demo.cast --out demo.svg --window
# convert SVG to GIF/MP4 with your preferred toolchain
```

## 5) QA checklist before sharing

- `npx repobrief init` succeeds
- `.repobrief/architecture.md` looks populated
- `npx repobrief export --format claude` generates strong output
- First 30 lines of `CLAUDE.md` are visible in the capture
