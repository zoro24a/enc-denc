import { AES_IV_LENGTH, SALT_LENGTH, securityLog } from '@/utils/security';

const MAGIC_HEADER = new Uint8Array([0x44, 0x59, 0x41, 0x44]); // 'DYAD'

interface Metadata {
  fileName: string;
  sp: string; // Base64 encoded Password Salt
  se: string; // Base64 encoded Email Salt
  wiv: string; // Base64 encoded Wrapping IV
  wdek: string; // Base64 encoded Wrapped DEK
}

/**
 * Converts ArrayBuffer to Base64 string.
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converts Base64 string to ArrayBuffer.
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Packages metadata into a Uint8Array header buffer.
 */
export function packageMetadata(
  fileName: string,
  sp: Uint8Array,
  se: Uint8Array,
  wiv: Uint8Array,
  wdek: ArrayBuffer,
): Uint8Array {
  securityLog('Packaging metadata header.');

  const metadata: Metadata = {
    fileName,
    sp: arrayBufferToBase64(sp.buffer),
    se: arrayBufferToBase64(se.buffer),
    wiv: arrayBufferToBase64(wiv.buffer),
    wdek: arrayBufferToBase64(wdek),
  };

  const metadataJson = JSON.stringify(metadata);
  const metadataBuffer = new TextEncoder().encode(metadataJson);

  // Header structure: MAGIC (4) + Length (4) + Metadata JSON (N)
  const headerLength = MAGIC_HEADER.byteLength + 4 + metadataBuffer.byteLength;
  const header = new Uint8Array(headerLength);
  const view = new DataView(header.buffer);

  let offset = 0;

  // 1. Magic Header (4 bytes)
  header.set(MAGIC_HEADER, offset);
  offset += MAGIC_HEADER.byteLength;

  // 2. Metadata Length (4 bytes, Little Endian)
  view.setUint32(offset, metadataBuffer.byteLength, true);
  offset += 4;

  // 3. Metadata JSON
  header.set(metadataBuffer, offset);

  securityLog(`Metadata packaged. Total header size: ${headerLength} bytes.`);
  return header;
}

export interface ParsedMetadata {
  fileName: string;
  sp: Uint8Array;
  se: Uint8Array;
  wiv: Uint8Array;
  wdek: ArrayBuffer;
  headerLength: number;
}

/**
 * Parses the metadata header from the start of a file stream.
 * @param file The input File object.
 * @returns Parsed metadata and the length of the header.
 */
export async function parseMetadata(file: File): Promise<ParsedMetadata> {
  securityLog('Starting metadata parsing.');

  // Read the first 8 bytes (Magic + Length)
  const magicAndLengthBuffer = await file.slice(0, 8).arrayBuffer();
  const view = new DataView(magicAndLengthBuffer);

  // 1. Verify Magic Header
  const magic = new Uint8Array(magicAndLengthBuffer.slice(0, 4));
  if (
    magic[0] !== MAGIC_HEADER[0] ||
    magic[1] !== MAGIC_HEADER[1] ||
    magic[2] !== MAGIC_HEADER[2] ||
    magic[3] !== MAGIC_HEADER[3]
  ) {
    throw new Error('Invalid file format: Magic header mismatch.');
  }

  // 2. Read Metadata Length
  const metadataLength = view.getUint32(4, true); // Little Endian

  const headerLength = 8 + metadataLength;

  // 3. Read the full metadata JSON
  const metadataJsonBuffer = await file.slice(8, headerLength).arrayBuffer();
  const metadataJson = new TextDecoder().decode(metadataJsonBuffer);

  let metadata: Metadata;
  try {
    metadata = JSON.parse(metadataJson);
  } catch (e) {
    throw new Error('Invalid file format: Metadata JSON parsing failed.');
  }

  // 4. Decode Base64 fields
  const parsed: ParsedMetadata = {
    fileName: metadata.fileName,
    sp: base64ToArrayBuffer(metadata.sp) as Uint8Array,
    se: base64ToArrayBuffer(metadata.se) as Uint8Array,
    wiv: base64ToArrayBuffer(metadata.wiv) as Uint8Array,
    wdek: base64ToArrayBuffer(metadata.wdek),
    headerLength: headerLength,
  };

  // Basic sanity checks
  if (parsed.sp.byteLength !== SALT_LENGTH || parsed.se.byteLength !== SALT_LENGTH) {
    throw new Error('Metadata integrity check failed: Invalid salt length.');
  }
  if (parsed.wiv.byteLength !== AES_IV_LENGTH) {
    throw new Error('Metadata integrity check failed: Invalid wrapping IV length.');
  }

  securityLog(`Metadata parsed successfully. Header length: ${headerLength}.`);
  return parsed;
}