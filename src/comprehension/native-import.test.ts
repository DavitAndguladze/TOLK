import { execFileSync } from "node:child_process";
import { expect, test } from "vitest";

// R3's ingestion CLI imports these with native Node type stripping (scripts/ingest-gatsby.mjs), which
// can't resolve an extensionless runtime import (comms 0016, 0041). Bundlers can, so only this catches it.
const modules = ["oci-chapter-check-generator", "chapter-check-generator", "oci-key-point-grader", "oci-chat"];

test.each(modules)("%s loads with native Node type stripping", (name) => {
  const script = `import(${JSON.stringify(`./src/comprehension/${name}.ts`)}).then((m) => console.log(Object.keys(m).length))`;
  const out = execFileSync(process.execPath, ["--experimental-strip-types", "--no-warnings", "-e", script], { encoding: "utf8" });

  expect(Number(out.trim())).toBeGreaterThan(0);
});
