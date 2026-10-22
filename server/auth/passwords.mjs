import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

/**
 * Password hashing.
 *
 * Passwords are never stored, only a salted scrypt hash. scrypt is memory-hard,
 * so a leaked database is expensive to brute-force even on GPUs, and it ships
 * with Node - no native dependency to compile on the server.
 *
 * Stored format: `scrypt$N$r$p$<salt base64>$<hash base64>`. The parameters
 * travel with each hash, so they can be raised later without breaking the
 * passwords already saved.
 */

const PARAMS = { N: 2 ** 15, r: 8, p: 1 };
const KEY_LENGTH = 64;
const SALT_BYTES = 16;
// scrypt needs 128 * N * r bytes; Node's default cap (32 MB) is exactly that, so leave headroom.
const MAX_MEMORY = 64 * 1024 * 1024;

function derive(password, salt, { N, r, p }) {
  return new Promise((resolve, reject) => {
    scrypt(password.normalize('NFKC'), salt, KEY_LENGTH, { N, r, p, maxmem: MAX_MEMORY }, (error, key) =>
      error ? reject(error) : resolve(key)
    );
  });
}

export async function hashPassword(password) {
  const salt = randomBytes(SALT_BYTES);
  const key = await derive(password, salt, PARAMS);
  const { N, r, p } = PARAMS;
  return `scrypt$${N}$${r}$${p}$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(password, stored) {
  const parts = typeof stored === 'string' ? stored.split('$') : [];
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

  const [, N, r, p, saltB64, hashB64] = parts;
  const expected = Buffer.from(hashB64, 'base64');
  const key = await derive(password, Buffer.from(saltB64, 'base64'), {
    N: Number(N),
    r: Number(r),
    p: Number(p),
  });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

/**
 * A real hash of a random password, checked when the email is unknown. Without
 * it, "no such account" answers measurably faster than "wrong password", which
 * tells an attacker which emails are registered.
 */
let dummyHash = null;
export async function burnPasswordCheck(password) {
  dummyHash ??= await hashPassword(randomBytes(16).toString('hex'));
  await verifyPassword(password, dummyHash);
  return false;
}
