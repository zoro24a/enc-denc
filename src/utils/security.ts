// Constants for PBKDF2
export const PBKDF2_PARAMS = {
  iterations: 600000, // High iteration count for security
  hash: 'SHA-256',
  keyLen: 32, // 256 bits (32 bytes) for key derivation
};

// Constants for AES-256-GCM
export const AES_KEY_LENGTH = 256; // bits
export const AES_IV_LENGTH = 12; // bytes (96 bits)
export const AES_TAG_LENGTH = 16; // bytes (128 bits)

// Salt length for KDFs
export const SALT_LENGTH = 16; // bytes

/**
 * Generates a cryptographically secure random salt.
 * @param length Length of the salt in bytes.
 * @returns Uint8Array salt.
 */
export function generateSalt(length: number = SALT_LENGTH): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Logs security-relevant events (placeholder for a real logging system).
 */
export function securityLog(message: string, level: 'INFO' | 'WARN' | 'ERROR' = 'INFO') {
  console.log(`[SECURITY ${level}] ${new Date().toISOString()}: ${message}`);
}