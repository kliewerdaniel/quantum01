import CryptoJS from 'crypto-js';

// WebCrypto API utilities for post-quantum compatible encryption
export class QuantumCrypto {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12; // 96 bits for GCM

  // WebCrypto API compatible interfaces
  static KeyPair = {
    publicKey: {} as JsonWebKey,
    privateKey: {} as JsonWebKey
  };

  static EncryptedData = {
    ciphertext: '',
    iv: '',
    tag: ''
  };

  static KyberKeyPair = {
    publicKey: '',
    privateKey: ''
  };

  /**
   * Generate a cryptographically secure symmetric key using WebCrypto API
   */
  static async generateSymmetricKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Export a CryptoKey to base64 string for storage/transmission
   */
  static async exportKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('raw', key);
    return QuantumCrypto.arrayBufferToBase64(exported);
  }

  /**
   * Import a base64 string back to CryptoKey
   */
  static async importKey(keyData: string): Promise<CryptoKey> {
    const keyBuffer = QuantumCrypto.base64ToArrayBuffer(keyData);
    return await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: this.ALGORITHM },
      false, // not extractable
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt a message using AES-GCM with WebCrypto API
   */
  static async encryptMessage(message: string, key: CryptoKey): Promise<string> {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(message);
      const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));

      const encrypted = await crypto.subtle.encrypt(
        { name: this.ALGORITHM, iv },
        key,
        data
      );

      // Combine IV and ciphertext
      const encryptedData = new Uint8Array(iv.length + encrypted.byteLength);
      encryptedData.set(iv);
      encryptedData.set(new Uint8Array(encrypted as ArrayBuffer), iv.length);

      return QuantumCrypto.arrayBufferToBase64(encryptedData.buffer);
    } catch (error) {
      console.error('WebCrypto encryption failed:', error);
      throw new Error('Encryption failed - falling back to CryptoJS');
    }
  }

  /**
   * Decrypt a message using AES-GCM with WebCrypto API
   */
  static async decryptMessage(encryptedMessage: string, key: CryptoKey): Promise<string> {
    try {
      const encryptedData = QuantumCrypto.base64ToArrayBuffer(encryptedMessage);
      const encryptedArray = new Uint8Array(encryptedData);

      const iv = encryptedArray.slice(0, this.IV_LENGTH);
      const ciphertext = encryptedArray.slice(this.IV_LENGTH);

      const decrypted = await crypto.subtle.decrypt(
        { name: this.ALGORITHM, iv },
        key,
        ciphertext.buffer
      );

      const decoder = new TextDecoder();
      return decoder.decode(decrypted);
    } catch (error) {
      console.error('WebCrypto decryption failed:', error);
      throw new Error('Decryption failed - falling back to CryptoJS');
    }
  }

  /**
   * Derive a key from password using PBKDF2 via WebCrypto API
   */
  static async deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 200000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: this.ALGORITHM, length: this.KEY_LENGTH },
      false, // not extractable
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Generate secure random bytes using WebCrypto API
   */
  static getRandomBytes(length: number): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(length));
  }

  /**
   * Utility: Convert ArrayBuffer to base64 string
   */
  static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach(b => binary += String.fromCharCode(b));
    return btoa(binary);
  }

  /**
   * Utility: Convert base64 string to ArrayBuffer
   */
  static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Generate salt for password derivation
   */
  static generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(16));
  }
}

// Legacy compatibility functions (for fallback)
export interface KeyPair {
  publicKey: string;
  privateKey: string;
}

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  nonce?: string; // for backward compatibility
  tag?: string;
}

// Generate a random symmetric key (256 bits) - LEGACY
export function generateSymmetricKey(): string {
  return CryptoJS.lib.WordArray.random(32).toString(); // 256 bits
}

// Generate a key pair (simplified - in real quantum: would use quantum RNG) - LEGACY
export function generateKeyPair(): KeyPair {
  const privateKey = generateSymmetricKey();
  const publicKey = CryptoJS.SHA256(privateKey).toString();

  return {
    privateKey,
    publicKey: publicKey
  };
}

// Encrypt message with AES-GCM (via WebCrypto) or fallback to CBC - LEGACY
export async function encryptMessage(message: string, key: string): Promise<EncryptedData> {
  try {
    // Try WebCrypto first
    const cryptoKey = await QuantumCrypto.importKey(key);
    const encrypted = await QuantumCrypto.encryptMessage(message, cryptoKey);
    const iv = QuantumCrypto.getRandomBytes(12);
    return {
      ciphertext: encrypted,
      iv: QuantumCrypto.arrayBufferToBase64(iv),
      tag: '' // GCM handles integrity
    };
  } catch (error) {
    // Fallback to CBC
    console.warn('WebCrypto failed, falling back to CBC encryption');
    const nonce = CryptoJS.lib.WordArray.random(16);
    const encrypted = CryptoJS.AES.encrypt(message, key, {
      iv: nonce,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    return {
      ciphertext: encrypted.toString(),
      iv: nonce.toString(),
      nonce: nonce.toString()
    };
  }
}

// Decrypt message with AES-GCM or fallback - LEGACY
export async function decryptMessage(encryptedData: EncryptedData, key: string): Promise<string> {
  try {
    // Try WebCrypto first
    const cryptoKey = await QuantumCrypto.importKey(key);
    const decrypted = await QuantumCrypto.decryptMessage(encryptedData.ciphertext, cryptoKey);
    return decrypted;
  } catch (error) {
    // Fallback to CBC
    console.warn('WebCrypto decryption failed, falling back to CBC');
    const iv = encryptedData.nonce || encryptedData.iv;
    const decrypted = CryptoJS.AES.decrypt(encryptedData.ciphertext, key, {
      iv: CryptoJS.enc.Hex.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });

    return decrypted.toString(CryptoJS.enc.Utf8);
  }
}

// Hash password using SHA-256 - LEGACY
export function hashPassword(password: string): string {
  return CryptoJS.SHA256(password).toString();
}

// Generate secure random bytes - LEGACY
export async function getRandomBytes(length: number): Promise<Uint8Array> {
  if (window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return array;
  } else {
    const array = new Uint8Array(length);
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
    return array;
  }
}

// Derive key from password using PBKDF2 - LEGACY
export function deriveKeyFromPassword(password: string, salt: string, iterations: number = 10000): string {
  return CryptoJS.PBKDF2(password, salt, {
    keySize: 256 / 32,
    iterations: iterations
  }).toString();
}
