import { describe, expect, it } from "vitest";
import { MAX_UPLOAD_BYTES, validateUpload } from "@/lib/upload";

const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

describe("validateUpload", () => {
  it("accepts a PNG by magic bytes and returns a random name", async () => {
    const result = await validateUpload({
      name: "photo.png",
      size: png.byteLength,
      declaredType: "image/png",
      bytes: new Uint8Array(png),
    });

    expect(result.mime).toBe("image/png");
    expect(result.extension).toBe("png");
    expect(result.safeName).toMatch(/^[0-9a-f-]{36}\.png$/);
  });

  it("rejects content that does not match its extension", async () => {
    await expect(
      validateUpload({
        name: "photo.jpg",
        size: png.byteLength,
        bytes: new Uint8Array(png),
      }),
    ).rejects.toThrow(/extension/i);
  });

  it("rejects unknown content and empty files", async () => {
    const fake = Buffer.from("not an image");
    await expect(
      validateUpload({
        name: "fake.png",
        size: fake.byteLength,
        bytes: new Uint8Array(fake),
      }),
    ).rejects.toThrow(/could not be determined/i);

    await expect(
      validateUpload({ name: "empty.png", size: 0, bytes: new Uint8Array() }),
    ).rejects.toThrow(/empty/i);
  });

  it("rejects oversized files before reading content", async () => {
    await expect(
      validateUpload({
        name: "big.png",
        size: MAX_UPLOAD_BYTES + 1,
        bytes: new Uint8Array(),
      }),
    ).rejects.toThrow(/5 MB/i);
  });

  it("rejects path traversal in file names", async () => {
    await expect(
      validateUpload({
        name: "../photo.png",
        size: png.byteLength,
        bytes: new Uint8Array(png),
      }),
    ).rejects.toThrow(/name/i);
  });

  it("rejects declared types that do not match the bytes", async () => {
    await expect(
      validateUpload({
        name: "photo.png",
        size: png.byteLength,
        declaredType: "application/pdf",
        bytes: new Uint8Array(png),
      }),
    ).rejects.toThrow(/content type/i);
  });
});
