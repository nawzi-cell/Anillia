import bcrypt from "bcryptjs";

const ROUNDS = 12;

/** Hash a plaintext password with bcrypt (12 rounds). */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, ROUNDS);
}

/** Compare a plaintext password against a bcrypt hash. */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
