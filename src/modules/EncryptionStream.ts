import { AES_IV_LENGTH, securityLog } from '@/utils/security';

/**
 * Encrypts a file using the provided DEK and returns a Blob containing the IV, encrypted data, and authentication tag.
 *
 * NOTE ON STREAMING: Due to limitations in the browser's SubtleCrypto API for stateful AES-GCM streaming,
 * this implementation reads the entire file into memory before encryption. For true GB-sized streaming,
 * a custom Web Worker implementation using chunking and a stateful cipher (or AES-CTR+HMAC) would be required.
 * This approach ensures AES-GCM integrity (single IV, single tag).
 *
 * @param file The input File object.
 * @param dek The Data Encryption Key (CryptoKey).
 * @returns A Blob containing the IV, encrypted data, and authentication tag.
 */
export async function encryptFileStream(file: File, dek: CryptoKey): Promise<Blob> {
  securityLog(`Starting encryption for file: ${file.name}`);

  // 1. Read file into memory (limitation for GB files)
  const fileBuffer = await file.arrayBuffer();
  securityLog(`File loaded into memory (${fileBuffer.byteLength} bytes).`);

  // 2. Generate unique IV
  const iv = crypto.getRandomValues(new Uint8Array(AES_IV_LENGTH));

  // 3. Encrypt data (Ciphertext + Authentication Tag)
  const algorithm = { name: 'AES-GCM', iv: iv };

  const encryptedDataWithTag = await crypto.subtle.encrypt(
    algorithm,
    dek,
    fileBuffer,
  );

  // 4. Output format: IV (12 bytes) + Ciphertext + Tag (16 bytes)
  const ivBuffer = iv.buffer;
  const encryptedBlob = new Blob([ivBuffer, encryptedDataWithTag], {
    type: 'application/octet-stream',
  });

  securityLog('File encryption complete.');
  return encryptedBlob;
}