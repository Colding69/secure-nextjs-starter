import { describe, expect, it } from "vitest";
import { redact } from "@/lib/audit";

const address = ["analyst", "example.com"].join("@");
const tokenValue = ["ghp", "x".repeat(24)].join("_");
const bearerValue = ["Bearer", "y".repeat(24)].join(" ");

describe("redact", () => {
  it("redacts email addresses", () => {
    expect(redact(`contact ${address} now`)).toBe("contact [email] now");
  });

  it("redacts token-like values", () => {
    expect(redact(`token ${tokenValue}`)).toBe("token [token]");
    expect(redact(`Authorization: ${bearerValue}`)).toBe(
      "Authorization: [token]",
    );
  });

  it("keeps non-sensitive text unchanged", () => {
    expect(redact("preview.fetch example.com")).toBe("preview.fetch example.com");
  });
});
