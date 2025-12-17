import { beforeEach, afterAll } from "vitest";
import { promises as fs } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { resetDirectoryInit } from "../storage/index.js";

const TEST_DATA_DIR = join(
  tmpdir(),
  `funnel-design-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
);

process.env.FUNNEL_DESIGN_DATA_DIR = TEST_DATA_DIR;

async function cleanTestDir(): Promise<void> {
  try {
    await fs.rm(TEST_DATA_DIR, { recursive: true, force: true });
  } catch {
    // Directory might not exist yet
  }
  resetDirectoryInit();
}

beforeEach(async () => {
  await cleanTestDir();
});

afterAll(async () => {
  await cleanTestDir();
});
