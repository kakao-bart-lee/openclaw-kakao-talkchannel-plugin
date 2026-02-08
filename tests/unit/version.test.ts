import { describe, it, expect } from "vitest";
import { PLUGIN_VERSION } from "../../src/version";

describe("PLUGIN_VERSION", () => {
  it("should be a valid semver string", () => {
    expect(PLUGIN_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
