#!/bin/bash
# Clean demo of repobrief

clear
echo ""
echo "  ⚡ RepoBrief — Give any AI agent instant understanding of your codebase"
echo ""
sleep 2

# Setup a demo project
echo "  Let's try it on a real project..."
sleep 1
echo ""
echo "  $ cd /tmp/demo-project && git clone --depth 1 https://github.com/expressjs/express ."
cd /tmp && rm -rf demo-project && mkdir demo-project && cd demo-project && git clone --depth 1 https://github.com/expressjs/express . 2>/dev/null
echo "  ✓ Cloned Express.js"
sleep 1

echo ""
echo "  $ npx repobrief init"
echo ""
node /Users/joeyrodriguez/Projects/repobrief/bin/repobrief.js init
sleep 2

echo ""
echo "  $ cat .repobrief/architecture.md"
echo ""
cat .repobrief/architecture.md
sleep 3

echo ""
echo "  $ npx repobrief export --format claude"
echo ""
node /Users/joeyrodriguez/Projects/repobrief/bin/repobrief.js export --format claude
sleep 1

echo ""
echo "  $ head -35 CLAUDE.md"
echo ""
head -35 CLAUDE.md
sleep 4

echo ""
echo "  ⚡ That's it. Your AI agent is briefed."
echo ""
sleep 2
