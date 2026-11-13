import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

type EncryptedTemplate = {
  version: 1;
  iv: string;
  tag: string;
  data: string;
};

function encryptionKey(encodedKey: string) {
  const key = Buffer.from(encodedKey, "base64");
  if (key.length !== 32 || key.toString("base64") !== encodedKey.trim()) {
    throw new Error("FACE_TEMPLATE_ENCRYPTION_KEY must be base64-encoded 32-byte key");
  }
  return key;
}

export function encryptFaceTemplate(template: number[], encodedKey: string): string {
  if (template.length === 0 || !template.every(Number.isFinite)) {
    throw new Error("Face template must contain finite numbers");
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(encodedKey), iv);
  const data = Buffer.concat([
    cipher.update(JSON.stringify(template), "utf8"),
    cipher.final(),
  ]);
  const encrypted: EncryptedTemplate = {
    version: 1,
    iv: iv.toString("base64"),
    tag: cipher.getAuthTag().toString("base64"),
    data: data.toString("base64"),
  };
  return JSON.stringify(encrypted);
}

export function decryptFaceTemplate(encryptedValue: string, encodedKey: string): number[] {
  const encrypted = JSON.parse(encryptedValue) as EncryptedTemplate;
  if (encrypted.version !== 1) throw new Error("Unsupported face template version");

  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(encodedKey),
    Buffer.from(encrypted.iv, "base64"),
  );
  decipher.setAuthTag(Buffer.from(encrypted.tag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(encrypted.data, "base64")),
    decipher.final(),
  ]).toString("utf8");
  const template = JSON.parse(plaintext) as unknown;
  if (!Array.isArray(template) || !template.every(Number.isFinite)) {
    throw new Error("Stored face template is invalid");
  }
  return template as number[];
}
