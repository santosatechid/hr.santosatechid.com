import { expect, test } from "bun:test";

import {
  decryptFaceTemplate,
  encryptFaceTemplate,
} from "../../services/hris/faceTemplate.ts";

const key = Buffer.alloc(32, 7).toString("base64");
const template = [0.125, -0.5, 0.75];

test("encrypts and decrypts a face template with the same key", () => {
  const encrypted = encryptFaceTemplate(template, key);

  expect(encrypted).not.toEqual(template);
  expect(decryptFaceTemplate(encrypted, key)).toEqual(template);
});

test("rejects malformed keys and a different decryption key", () => {
  expect(() => encryptFaceTemplate(template, "not-a-key")).toThrow();
  expect(() => decryptFaceTemplate(encryptFaceTemplate(template, key), Buffer.alloc(32, 8).toString("base64"))).toThrow();
});
