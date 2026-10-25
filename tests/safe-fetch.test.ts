import { describe, expect, it } from "vitest";
import {
  assertSafeUrl,
  isHostnameAllowed,
  isPrivateIp,
} from "@/lib/safe-fetch";

describe("isPrivateIp", () => {
  it("flags private, loopback, link-local and metadata ranges", () => {
    for (const address of [
      "127.0.0.1",
      "10.1.2.3",
      "172.16.0.1",
      "172.31.255.255",
      "192.168.1.1",
      "169.254.169.254",
      "0.0.0.0",
      "100.64.0.1",
      "224.0.0.1",
      "::1",
      "fc00::1",
      "fd12:3456::1",
      "fe80::1",
      "::ffff:127.0.0.1",
    ]) {
      expect(isPrivateIp(address), address).toBe(true);
    }
  });

  it("allows public addresses", () => {
    for (const address of ["8.8.8.8", "1.1.1.1", "93.184.216.34", "2606:4700::1111"]) {
      expect(isPrivateIp(address), address).toBe(false);
    }
  });

  it("fails closed for invalid input", () => {
    expect(isPrivateIp("not-an-ip")).toBe(true);
  });
});

describe("isHostnameAllowed", () => {
  it("matches exact hosts and subdomains only", () => {
    const allowlist = ["example.com"];
    expect(isHostnameAllowed("example.com", allowlist)).toBe(true);
    expect(isHostnameAllowed("api.example.com", allowlist)).toBe(true);
    expect(isHostnameAllowed("example.com.evil.test", allowlist)).toBe(false);
    expect(isHostnameAllowed("notexample.com", allowlist)).toBe(false);
  });
});

describe("assertSafeUrl", () => {
  const allowlist = ["example.com", "93.184.216.34"];
  const credentialUrl = "https://user" + ":" + "pw" + "@" + "example.com";

  it("accepts an allowlisted https URL", async () => {
    const url = await assertSafeUrl("https://example.com/path?q=1", allowlist);
    expect(url.hostname).toBe("example.com");
  });

  it("rejects non-https protocols", async () => {
    await expect(assertSafeUrl("http://example.com", allowlist)).rejects.toThrow(
      /https/i,
    );
    await expect(assertSafeUrl("file:///etc/passwd", allowlist)).rejects.toThrow(
      /https/i,
    );
  });

  it("rejects credentials, non-default ports and non-allowlisted hosts", async () => {
    await expect(
      assertSafeUrl(credentialUrl, allowlist),
    ).rejects.toThrow(/credentials/i);
    await expect(assertSafeUrl("https://example.com:8443", allowlist)).rejects.toThrow(
      /port/i,
    );
    await expect(assertSafeUrl("https://evil.test", allowlist)).rejects.toThrow(
      /allowlist/i,
    );
  });

  it("rejects private literals even if allowlisted", async () => {
    await expect(
      assertSafeUrl("https://127.0.0.1", ["127.0.0.1"]),
    ).rejects.toThrow(/private/i);
  });

  it("fails closed when the allowlist is empty", async () => {
    await expect(assertSafeUrl("https://example.com", [])).rejects.toThrow(
      /allowlisted/i,
    );
  });
});
