import { AES_IV_LENGTH, AES_TAG_LENGTH, securityLog } from '@/utils/security';

/**
 * Decrypts the encrypted file content using the provided DEK.
 * This function also performs integrity verification via the AES-GCM tag.
 *
 * @param encryptedBlob The Blob containing IV + Ciphertext + Tag.
 * @param dek The Data Encryption Key (CryptoKey).
 * @returns A Blob containing the decrypted plaintext data.
 */
export async function decryptFileStream(
  encryptedBlob: Blob,
  dek: CryptoKey,
): Promise<Blob> {
  securityLog('Starting decryption and integrity verification.');

  // 1. Read the entire encrypted content
  const encryptedBuffer = await encryptedBlob.arrayBuffer();

  if (encryptedBuffer.byteLength < AES_IV_LENGTH + AES_TAG_LENGTH) {
    throw new Error('Encrypted data too short.');
  }

  // 2. Extract IV (first 12 bytes)
  const iv = new Uint8Array(encryptedBuffer.slice(0, AES_IV_LENGTH));

  // 3. Extract Ciphertext + Tag (remaining bytes)
  const ciphertextWithTag = encryptedBuffer.slice(AES_IV_LENGTH);

  // 4. Decrypt
  const algorithm = { name: 'AES-GCM', iv: iv };

  try {
    const decryptedData = await crypto.subtle.decrypt(
      algorithm,
      dek,
      ciphertextWithTag,
    );

    securityLog('Decryption successful. Integrity verified (Authentication Tag passed).');

    return new Blob([decryptedData], { type: 'application/octet-stream' });
  } catch (e) {
    securityLog('Decryption failed. Authentication Tag verification failed.', 'ERROR');
    throw new Error('Integrity check failed: Data may be corrupted or key is incorrect.');
  }
}