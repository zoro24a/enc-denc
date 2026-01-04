import { PBKDF2_PARAMS, securityLog } from '@/utils/security';

/**
 * Derives a 256-bit key using PBKDF2 (Password-Based Key Derivation Function 2).
 * @param secret The password or email string.
 * @param salt The salt (Uint8Array).
 * @returns A CryptoKey object suitable for AES operations.
 */
export async function deriveKeyPBKDF2(
  secret: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  securityLog('Starting PBKDF2 key derivation.');

  // 1. Import the secret as a raw key
  const secretBuffer = new TextEncoder().encode(secret);
  const baseKey = await crypto.subtle.importKey(
    'raw',
    secretBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );

  // 2. Derive the final key
  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: PBKDF2_PARAMS.iterations,
      hash: PBKDF2_PARAMS.hash,
    },
    baseKey,
    { name: 'AES-GCM', length: PBKDF2_PARAMS.keyLen * 8 }, // Key length in bits
    true, // MUST be extractable for HKDF combination
    ['encrypt', 'decrypt', 'wrapKey', 'unwrapKey'],
  );

  securityLog('PBKDF2 key derivation successful.');
  return derivedKey;
}