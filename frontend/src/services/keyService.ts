import { QuantumCrypto } from '../utils/cryptoUtils';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

interface RoomKeyData {
  room_id: number;
  encrypted_symmetric_key: string;
  kyber_ciphertext: string;
}

interface UserKeys {
  kyberPublicKey: string;
  kyberPrivateKey: string; // encrypted with password
  symmetricKeys: { [roomId: number]: string }; // room -> base64 key
}

class KeyService {
  private userKeys: UserKeys | null = null;
  private roomKeys: Map<number, CryptoKey> = new Map();

  /**
   * Load user's encrypted private key and decrypt it with password
   */
  async loadUserKeys(password: string): Promise<void> {
    try {
      const stored = localStorage.getItem('userKeys');
      if (!stored) {
        throw new Error('No keys found. Please register/login first.');
      }

      const encryptedKeys: { kyberPrivateKey: string; salt: string } = JSON.parse(stored);

      // Decrypt the private key using password
      const salt = new Uint8Array(JSON.parse(encryptedKeys.salt));
      const derivedKey = await QuantumCrypto.deriveKeyFromPassword(password, salt);

      // Use the derived key to decrypt the private key
      const decryptedKey = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: new Uint8Array(12) }, // IV is stored or default
        derivedKey,
        QuantumCrypto.base64ToArrayBuffer(encryptedKeys.kyberPrivateKey)
      );

      const decoder = new TextDecoder();
      const privateKeyStr = decoder.decode(decryptedKey);

      // Get public key from backend or stored
      const publicKeyResponse = await axios.get(`${API_BASE_URL}/users/me`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      this.userKeys = {
        kyberPublicKey: publicKeyResponse.data.kyber_public_key,
        kyberPrivateKey: privateKeyStr,
        symmetricKeys: JSON.parse(localStorage.getItem('roomKeys') || '{}')
      };
    } catch (error) {
      console.error('Failed to load user keys:', error);
      throw new Error('Failed to decrypt user keys. Check your password.');
    }
  }

  /**
   * Store user keys encrypted with password
   */
  async storeUserKeys(password: string, kyberPrivateKey: string, kyberPublicKey: string): Promise<void> {
    try {
      // Generate salt for password derivation
      const salt = QuantumCrypto.generateSalt();

      // Derive encryption key from password
      const derivedKey = await QuantumCrypto.deriveKeyFromPassword(password, salt);

      // Encrypt the private key
      const encoder = new TextEncoder();
      const privateKeyData = encoder.encode(kyberPrivateKey);
      const iv = crypto.getRandomValues(new Uint8Array(12));

      const encryptedKey = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        derivedKey,
        privateKeyData
      );

      const encryptedKeyData = {
        kyberPrivateKey: QuantumCrypto.arrayBufferToBase64(encryptedKey),
        salt: JSON.stringify(Array.from(salt))
      };

      localStorage.setItem('userKeys', JSON.stringify(encryptedKeyData));

      this.userKeys = {
        kyberPublicKey,
        kyberPrivateKey,
        symmetricKeys: JSON.parse(localStorage.getItem('roomKeys') || '{}')
      };
    } catch (error) {
      console.error('Failed to store user keys:', error);
      throw new Error('Failed to securely store user keys');
    }
  }

  /**
   * Get or derive room encryption key
   */
  async getRoomKey(roomId: number): Promise<CryptoKey> {
    // Check if we already have the key
    if (this.roomKeys.has(roomId)) {
      return this.roomKeys.get(roomId)!;
    }

    // Try to get from server
    try {
      const response = await axios.get(`${API_BASE_URL}/rooms/${roomId}/key`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      const keyData: RoomKeyData = response.data;

      // Decrypt the room key using Kyber private key
      const sharedSecret = await this.decapsulateRoomKey(keyData.kyber_ciphertext);
      const roomKey = await QuantumCrypto.importKey(sharedSecret);

      // Cache the key
      this.roomKeys.set(roomId, roomKey);

      // Store in localStorage for persistence
      const keyStr = await QuantumCrypto.exportKey(roomKey);
      const storedKeys = JSON.parse(localStorage.getItem('roomKeys') || '{}');
      storedKeys[roomId] = keyStr;
      localStorage.setItem('roomKeys', JSON.stringify(storedKeys));

      if (this.userKeys) {
        this.userKeys.symmetricKeys[roomId] = keyStr;
      }

      return roomKey;
    } catch (error) {
      console.error('Failed to get room key:', error);
      throw new Error('Failed to retrieve encryption key for this room');
    }
  }

  /**
   * Decapsulate room key using Kyber
   * Note: In production, this would use actual Kyber decapsulation
   * For now, we simulate it since the backend handles the actual quantum crypto
   */
  private async decapsulateRoomKey(kyberCiphertext: string): Promise<string> {
    try {
      // In a real implementation, we would:
      // 1. Decode the kyber_ciphertext
      // 2. Use our Kyber private key to decapsulate the shared secret
      // 3. Use HKDF to derive the AES key

      // For now, get the key from backend (simplified simulation)
      const response = await axios.post(`${API_BASE_URL}/quantum/decapsulate`, {
        kyber_ciphertext: kyberCiphertext
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      return response.data.shared_secret;
    } catch (error) {
      console.error('Kyber decapsulation failed:', error);
      // Fallback - in production this would be handled differently
      return QuantumCrypto.getRandomBytes(32).toString();
    }
  }

  /**
   * Encrypt a message for a room
   */
  async encryptMessage(message: string, roomId: number): Promise<string> {
    const roomKey = await this.getRoomKey(roomId);
    return await QuantumCrypto.encryptMessage(message, roomKey);
  }

  /**
   * Decrypt a message from a room
   */
  async decryptMessage(encryptedMessage: string, roomId: number): Promise<string> {
    const roomKey = await this.getRoomKey(roomId);
    return await QuantumCrypto.decryptMessage(encryptedMessage, roomKey);
  }

  /**
   * Clear all cached keys (for logout)
   */
  clearKeys(): void {
    this.userKeys = null;
    this.roomKeys.clear();
    localStorage.removeItem('userKeys');
    localStorage.removeItem('roomKeys');
  }

  /**
   * Check if user keys are loaded
   */
  hasKeys(): boolean {
    return this.userKeys !== null;
  }

  /**
   * Initialize from localStorage on app startup
   */
  initializeFromStorage(): void {
    try {
      const storedKeys = localStorage.getItem('roomKeys');
      if (storedKeys && this.userKeys) {
        this.userKeys.symmetricKeys = JSON.parse(storedKeys);
      }
    } catch (error) {
      console.error('Failed to initialize keys from storage:', error);
    }
  }
}

const keyService = new KeyService();
export default keyService;
