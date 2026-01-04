import { AES_KEY_LENGTH, AES_IV_LENGTH, securityLog } from '@/utils/security';

/**
 * Generates a random Data Encryption Key (DEK) for AES-256-GCM.
 */
export async function generateDataEncryptionKey(): Promise<CryptoKey> {
  securityLog('Generating random DEK.');
  return crypto.subtle.generateKey(
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    true, // Extractable for wrapping
    ['encrypt', 'decrypt'],
  );
}

/**
 * Derives the Master Key (KM) from the Password Key (KP) and Email Key (KE) using HKDF.
 * @param kp Password Key (CryptoKey)
 * @param ke Email Key (CryptoKey)
 * @returns Master Key (CryptoKey)
 */
export async function deriveMasterKey(kp: CryptoKey, ke: CryptoKey): Promise<CryptoKey> {
  securityLog('Deriving Master Key (KM) using HKDF.');

  // 1. Export raw key materials
  const kpRaw = await crypto.subtle.exportKey('raw', kp);
  const keRaw = await crypto.subtle.exportKey('raw', ke);

  // 2. Concatenate KP and KE to form the input keying material (IKM)
  const ikm = new Uint8Array(kpRaw.byteLength + keRaw.byteLength);
  ikm.set(new Uint8Array(kpRaw), 0);
  ikm.set(new Uint8Array(keRaw), kpRaw.byteLength);

  // 3. Import IKM as a key for HKDF
  const hkdfKey = await crypto.subtle.importKey(
    'raw',
    ikm,
    { name: 'HKDF' },
    false,
    ['deriveKey'],
  );

  // 4. Derive KM (256 bits)
  const km = await crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(0), // Salt is implicitly handled by Argon2id salts
      info: new TextEncoder().encode('Dyad File Encryption Master Key'),
    },
    hkdfKey,
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    false, // KM does not need to be extractable
    ['encrypt', 'decrypt'], // KM must be usable for AES-GCM encryption/decryption (wrapping/unwrapping DEK)
  );

  securityLog('Master Key derivation complete.');
  return km;
}

/**
 * Wraps the Data Encryption Key (DEK) using the Master Key (KM) via AES-GCM.
 * @param dek The DEK to wrap.
 * @param km The Master Key used for wrapping.
 * @returns Object containing the wrapped key (ArrayBuffer) and the IV used for wrapping (Uint8Array).
 */
export async function wrapDataKey(
  dek: CryptoKey,
  km: CryptoKey,
): Promise<{ wrappedKey: ArrayBuffer; iv: Uint8Array }> {
  securityLog('Wrapping DEK using KM (AES-GCM).');

  // 1. Export DEK raw material
  const dekRaw = await crypto.subtle.exportKey('raw', dek);

  // 2. Generate IV for wrapping
  const iv = crypto.getRandomValues(new Uint8Array(AES_IV_LENGTH));

  // 3. Encrypt (wrap) the DEK raw material using KM
  const wrappedKey = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    km,
    dekRaw,
  );

  securityLog('DEK wrapping complete.');
  return { wrappedKey, iv };
}

/**
 * Unwraps the Data Encryption Key (DEK) using the Master Key (KM).
 * @param wrappedKey The wrapped DEK (ArrayBuffer).
 * @param iv The IV used during wrapping (Uint8Array).
 * @param km The Master Key used for unwrapping.
 * @returns The unwrapped DEK (CryptoKey).
 */
export async function unwrapDataKey(
  wrappedKey: ArrayBuffer,
  iv: Uint8Array,
  km: CryptoKey,
): Promise<CryptoKey> {
  securityLog('Attempting to unwrap DEK.');

  try {
    // 1. Decrypt (unwrap) the DEK raw material using KM
    const dekRaw = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      km,
      wrappedKey,
    );

    // 2. Import the raw DEK material back into a CryptoKey
    const dek = await crypto.subtle.importKey(
      'raw',
      dekRaw,
      { name: 'AES-GCM' },
      true,
      ['encrypt', 'decrypt'],
    );

    securityLog('DEK unwrapping successful.');
    return dek;
  } catch (e) {
    securityLog('DEK unwrapping failed. Invalid password/email combination.', 'ERROR');
    throw new Error('Authentication failed: Invalid password or receiver email.');
  }
}