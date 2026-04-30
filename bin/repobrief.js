#!/usr/bin/env node

import("../dist/cli.js").then(({ createProgram }) => {
  return createProgram().parseAsync(process.argv);
}).catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Failed to start repobrief: ${message}`);
  process.exit(1);
});
