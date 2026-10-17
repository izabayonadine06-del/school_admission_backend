const { promisify } = require('node:util');
const { randomBytes, scrypt, timingSafeEqual } = require('node:crypto');

const scryptAsync = promisify(scrypt);
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const KEY_LENGTH = 64;

async function hashPassword(password) {
  const salt = randomBytes(16);
  const derivedKey = await scryptAsync(password, salt, KEY_LENGTH, SCRYPT_OPTIONS);
  return `scrypt$${salt.toString('hex')}$${derivedKey.toString('hex')}`;
}

async function verifyPassword(password, storedHash) {
  const [algorithm, saltHex, keyHex] = String(storedHash).split('$');
  if (algorithm !== 'scrypt' || !saltHex || !keyHex || !/^[a-f0-9]+$/i.test(saltHex) || !/^[a-f0-9]+$/i.test(keyHex)) {
    return false;
  }

  const expected = Buffer.from(keyHex, 'hex');
  const salt = Buffer.from(saltHex, 'hex');
  if (expected.length !== KEY_LENGTH || salt.length !== 16) return false;

  const actual = await scryptAsync(password, salt, expected.length, SCRYPT_OPTIONS);
  return timingSafeEqual(actual, expected);
}

module.exports = { hashPassword, verifyPassword };