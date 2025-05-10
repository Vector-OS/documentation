import crypto from "crypto";

/**
 * Hashes a password using PBKDF2 with SHA-512.
 * @param {string} password - The password to hash.
 * @returns {Promise<string>} - The hashed password.
 */
const hashPassword = async (password: string): Promise<string> => {
  const salt = crypto.randomBytes(16).toString("hex");
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 100000, 64, "sha512", (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
};

const verifyPassword = async (password: string, storedHash: string): Promise<boolean> => {
  const [salt, hash] = storedHash.split(":");
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, 100000, 64, "sha512", (err, derivedKey) => {
      if (err) reject(err);
      resolve(derivedKey.toString("hex") === hash);
    });
  });
};

export { hashPassword, verifyPassword };
