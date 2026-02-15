import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const TAG_LENGTH = 16; // 128 bits

// Get encryption key from environment
const getEncryptionKey = (): Buffer => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is required for encryption');
  }

  // If key is shorter than required, hash it to get the required length
  if (key.length < KEY_LENGTH) {
    return crypto.scryptSync(key, 'salt', KEY_LENGTH);
  }

  // If key is longer, truncate it
  return Buffer.from(key.slice(0, KEY_LENGTH));
};

/**
 * Encrypts sensitive data using AES-256-GCM
 */
export function encrypt(text: string): string {
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipher(ALGORITHM, key);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return format: iv:authTag:encryptedData
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypts data encrypted with the encrypt function
 */
export function decrypt(encryptedText: string): string {
  try {
    const key = getEncryptionKey();
    const parts = encryptedText.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipher(ALGORITHM, key);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Safely decrypts data with error handling - returns empty string on failure
 */
export function safeDecrypt(encryptedText: string): string {
  try {
    return decrypt(encryptedText);
  } catch (error) {
    console.warn('Failed to decrypt data, returning empty string:', error);
    return '';
  }
}

/**
 * Checks if data appears to be encrypted (has the expected format)
 */
export function isEncrypted(text: string): boolean {
  const parts = text.split(':');
  return parts.length === 3 &&
         parts[0].length === IV_LENGTH * 2 && // IV in hex
         parts[1].length === TAG_LENGTH * 2 && // Auth tag in hex
         parts[2].length > 0; // Encrypted data
}

