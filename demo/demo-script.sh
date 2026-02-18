#!/bin/bash
# Demo script for recording a GIF with asciinema or similar
# Shows repobrief in action on a real project

set -euo pipefail

# Setup
cd /tmp
rm -rf demo-project
git clone --depth 1 https://github.com/expressjs/express demo-project
cd demo-project

# The magic
echo "$ npx repobrief init"
npx repobrief init

echo ""
echo "$ cat .repobrief/architecture.md"
cat .repobrief/architecture.md

echo ""
echo "$ npx repobrief export --format claude"
npx repobrief export --format claude

echo ""
echo "$ head -30 CLAUDE.md"
head -30 CLAUDE.md
