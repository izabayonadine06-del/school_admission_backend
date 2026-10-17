require('dotenv').config();
const readline = require('node:readline/promises');
const pool = require('./pool');
const { hashPassword } = require('../utils/password');

async function readHidden(prompt) {
  if (!process.stdin.isTTY || typeof process.stdin.setRawMode !== 'function') {
    throw new Error('Run this command in an interactive terminal so the password can be entered without displaying it.');
  }

  process.stdout.write(prompt);
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');

  return new Promise((resolve, reject) => {
    let value = '';
    const restore = () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      process.stdin.removeListener('data', onData);
      process.stdout.write('\n');
    };
    const onData = (key) => {
      if (key === '\u0003') {
        restore();
        reject(new Error('Cancelled'));
      } else if (key === '\r' || key === '\n') {
        restore();
        resolve(value);
      } else if (key === '\u0008' || key === '\u007f') {
        value = value.slice(0, -1);
      } else if (key >= ' ') {
        value += key;
      }
    };
    process.stdin.on('data', onData);
  });
}

async function createHeadteacher() {
  const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const fullName = (await prompt.question('Headteacher full name: ')).trim();
    const email = (await prompt.question('Headteacher email: ')).trim().toLowerCase();
    prompt.close();

    if (fullName.length < 2 || fullName.length > 160) throw new Error('Name must be between 2 and 160 characters.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) throw new Error('Enter a valid email address.');
    const password = await readHidden('Password (12-128 characters; input hidden): ');
    if (password.length < 12 || password.length > 128) throw new Error('Password must be between 12 and 128 characters.');

    const passwordHash = await hashPassword(password);
    const result = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role)
       VALUES ($1, $2, $3, 'HEADTEACHER')
       RETURNING id, full_name AS "fullName", email, role`,
      [fullName, email, passwordHash]
    );
    console.log('Headteacher account created:', result.rows[0]);
  } finally {
    prompt.close();
    await pool.end();
  }
}

createHeadteacher().catch((error) => {
  console.error('Could not create headteacher account:', error.message);
  process.exitCode = 1;
});