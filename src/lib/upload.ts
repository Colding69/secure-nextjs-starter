import { fileTypeFromBuffer } from "file-type";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const ALLOWED_TYPES = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  pdf: "application/pdf",
} as const;

type AllowedExtension = keyof typeof ALLOWED_TYPES;

export type UploadCandidate = {
  name: string;
  size: number;
  declaredType?: string;
  bytes: Uint8Array;
};

export type ValidatedUpload = {
  mime: string;
  extension: AllowedExtension;
  safeName: string;
  size: number;
};

function extensionOf(name: string): string {
  const index = name.lastIndexOf(".");
  return index === -1 ? "" : name.slice(index + 1).toLowerCase();
}

export async function validateUpload(
  candidate: UploadCandidate,
): Promise<ValidatedUpload> {
  if (!Number.isInteger(candidate.size) || candidate.size <= 0) {
    throw new Error("Empty file");
  }
  if (candidate.size > MAX_UPLOAD_BYTES) {
    throw new Error("File exceeds the 5 MB limit");
  }
  if (
    candidate.name.includes("/") ||
    candidate.name.includes("\\") ||
    candidate.name.includes("\0") ||
    candidate.name.trim().length === 0
  ) {
    throw new Error("Invalid file name");
  }
  if (candidate.bytes.byteLength !== candidate.size) {
    throw new Error("File size does not match the payload");
  }

  const detected = await fileTypeFromBuffer(candidate.bytes);
  if (!detected) {
    throw new Error("File type could not be determined");
  }

  const extension = detected.ext as AllowedExtension;
  const expectedMime = ALLOWED_TYPES[extension];
  if (!expectedMime) {
    throw new Error("File type is not allowed");
  }

  const originalExtension = extensionOf(candidate.name);
  if (originalExtension && originalExtension !== "jpeg" && originalExtension !== extension) {
    throw new Error("File extension does not match its content");
  }

  if (candidate.declaredType && candidate.declaredType !== expectedMime) {
    throw new Error("Declared content type does not match the file");
  }

  return {
    mime: expectedMime,
    extension,
    safeName: `${crypto.randomUUID()}.${extension}`,
    size: candidate.size,
  };
}
