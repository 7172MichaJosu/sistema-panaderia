import crypto from "node:crypto";

const KEY_LENGTH = 64;

export function verifyPassword(password, salt, expectedHash) {
  if (!password || !salt || !expectedHash) return false;

  const actual = crypto.scryptSync(password, salt, KEY_LENGTH);
  const expected = Buffer.from(expectedHash, "base64");
  if (actual.length !== expected.length) return false;

  return crypto.timingSafeEqual(actual, expected);
}
