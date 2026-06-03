/**
 * Crypto Utilities for OAuth Token Encryption
 *
 * Uses AES-GCM (256-bit) encryption with Web Crypto API for secure token storage.
 * Each encryption generates a random 12-byte IV prepended to the ciphertext.
 */

const ALGORITHM = "AES-GCM";
const IV_LENGTH = 12; // 96 bits, recommended for AES-GCM
const KEY_LENGTH = 32; // 256 bits

/**
 * Retrieves and imports the encryption key from environment variable.
 * The key must be a base64-encoded 32-byte (256-bit) value.
 *
 * @throws Error if TOKEN_ENCRYPTION_KEY is not set or invalid
 */
async function getEncryptionKey(): Promise<CryptoKey> {
  const keyBase64 = Deno.env.get("TOKEN_ENCRYPTION_KEY");

  if (!keyBase64) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY environment variable is not set. " +
        "Generate a 32-byte key with: openssl rand -base64 32"
    );
  }

  const keyBytes = Uint8Array.from(atob(keyBase64), (c) => c.charCodeAt(0));

  if (keyBytes.length !== KEY_LENGTH) {
    throw new Error(
      `TOKEN_ENCRYPTION_KEY must be ${KEY_LENGTH} bytes (256 bits). ` +
        `Got ${keyBytes.length} bytes. Generate with: openssl rand -base64 32`
    );
  }

  return await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: ALGORITHM },
    false, // not extractable
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts a plaintext string using AES-GCM with a random IV.
 *
 * @param plaintext - The string to encrypt (e.g., OAuth access token)
 * @returns Base64-encoded string containing IV (12 bytes) + ciphertext
 *
 * @example
 * const encrypted = await encryptToken(accessToken);
 * // Store encrypted in database
 */
export async function encryptToken(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();

  // Generate random IV for each encryption
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  // Encode plaintext to bytes
  const encoder = new TextEncoder();
  const plaintextBytes = encoder.encode(plaintext);

  // Encrypt
  const ciphertext = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    plaintextBytes
  );

  // Combine IV + ciphertext
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(ciphertext), iv.length);

  // Return as base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts an encrypted token string.
 *
 * @param encrypted - Base64-encoded string from encryptToken (IV + ciphertext)
 * @returns The original plaintext string
 * @throws Error if decryption fails (invalid key, corrupted data, or tampered ciphertext)
 *
 * @example
 * const accessToken = await decryptToken(encryptedFromDb);
 */
export async function decryptToken(encrypted: string): Promise<string> {
  const key = await getEncryptionKey();

  // Decode from base64
  const combined = Uint8Array.from(atob(encrypted), (c) => c.charCodeAt(0));

  if (combined.length < IV_LENGTH + 1) {
    throw new Error("Invalid encrypted data: too short");
  }

  // Extract IV and ciphertext
  const iv = combined.slice(0, IV_LENGTH);
  const ciphertext = combined.slice(IV_LENGTH);

  // Decrypt
  const plaintextBytes = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    ciphertext
  );

  // Decode to string
  const decoder = new TextDecoder();
  return decoder.decode(plaintextBytes);
}
