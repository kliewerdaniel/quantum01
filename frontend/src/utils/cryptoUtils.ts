import CryptoJS from 'crypto-js';

// Client-side encryption utilities compatible with backend quantum encryption
// Note: This is simplified for demo - production would use WebCrypto API or libsodium

export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export interface EncryptedData {
  ciphertext: string;
  nonce: string;
  tag?: string;
}

// Generate a random symmetric key (256 bits)
export function generateSymmetricKey(): string {
  return CryptoJS.lib.WordArray.random(32).toString(); // 256 bits
}

// Generate a key pair (simplified - in real quantum: would use quantum RNG)
export function generateKeyPair(): KeyPair {
  // This is a placeholder - actual quantum key generation would be done on backend
  // Client-side we primarily handle symmetric encryption with quantum-derived keys
  const privateKey = generateSymmetricKey();
  const publicKey = CryptoJS.SHA256(privateKey).toString(); // Hash for public key

  return {
    privateKey,
    publicKey: publicKey
  };
}

// Encrypt message with AES-CBC (GCM not available in crypto-js, use CBC for compatibility)
export function encryptMessage(message: string, key: string): EncryptedData {
  try {
    const nonce = CryptoJS.lib.WordArray.random(16); // 128-bit IV for CBC
    const encrypted = CryptoJS.AES.encrypt(message, key, {
      iv: nonce,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    return {
      ciphertext: encrypted.toString(),
      nonce: nonce.toString(),
      // For CBC we don't have a separate tag, ciphertext includes everything
    };
  } catch (error) {
    throw new Error('Encryption failed');
  }
}

// Decrypt message with AES-CBC
export function decryptMessage(encryptedData: EncryptedData, key: string): string {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData.ciphertext, key, {
      iv: CryptoJS.enc.Hex.parse(encryptedData.nonce),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    throw new Error('Decryption failed');
  }
}

// Hash password using SHA-256 (for client-side preprocessing)
export function hashPassword(password: string): string {
  return CryptoJS.SHA256(password).toString();
}

// Generate secure random bytes (using Web Crypto API if available)
export async function getRandomBytes(length: number): Promise<Uint8Array> {
  if (window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return array;
  } else {
    // Fallback for older browsers
    const array = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }
}

// Derive key from password using PBKDF2
export function deriveKeyFromPassword(password: string, salt: string, iterations: number = 10000): string {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32,
    iterations: iterations
  }).toString();
}
