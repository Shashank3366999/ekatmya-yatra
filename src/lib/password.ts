/**
 * Password hashing using scrypt from node:crypto.
 *
 * Deliberately dependency-free: no bcrypt/argon2 native module to compile,
 * which keeps deploys (and this repo's install) light. scrypt with these
 * parameters is a sound choice for password storage.
 */
import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number,
) => Promise<Buffer>;

const N = 16384; // CPU/memory cost
const R = 8;
const P = 1;
const KEYLEN = 64;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, KEYLEN);
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${derived.toString("base64")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;

  const salt = Buffer.from(parts[4], "base64");
  const expected = Buffer.from(parts[5], "base64");
  const derived = await scrypt(password, salt, expected.length);

  return derived.length === expected.length && timingSafeEqual(derived, expected);
}
