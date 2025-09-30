from pqcrypto.kem.kyber768 import keypair, encap, decap
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
import os

def generate_kyber_keypair():
    """
    Generate Kyber768 public and private keys for key encapsulation.
    Returns tuple: (public_key bytes, private_key bytes)
    """
    public_key, private_key = keypair()
    return public_key, private_key

def encapsulate_key(public_key):
    """
    Encapsulate a symmetric key using Kyber KEM.
    Returns tuple: (shared_secret, ciphertext)
    """
    return encap(public_key)

def decapsulate_key(private_key, ciphertext):
    """
    Decapsulate the shared secret using Kyber KEM.
    """
    return decap(ciphertext, private_key)

def encrypt_message(message: str, shared_secret: bytes) -> bytes:
    """
    Encrypt a message using AES-GCM with the shared secret.
    Returns encrypted data.
    """
    # Derive key from shared secret
    salt = os.urandom(16)
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
        backend=default_backend()
    )
    key = kdf.derive(shared_secret)

    # Generate nonce
    iv = os.urandom(12)

    # Encrypt
    encryptor = Cipher(
        algorithms.AES(key),
        modes.GCM(iv),
        backend=default_backend()
    ).encryptor()

    encrypted = encryptor.update(message.encode()) + encryptor.finalize()
    tag = encryptor.tag

    return salt + iv + tag + encrypted

def decrypt_message(encrypted_data: bytes, shared_secret: bytes) -> str:
    """
    Decrypt a message using AES-GCM with the shared secret.
    Returns decrypted string.
    """
    # Parse encrypted data
    salt = encrypted_data[:16]
    iv = encrypted_data[16:28]
    tag = encrypted_data[28:44]
    ciphertext = encrypted_data[44:]

    # Derive key
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
        backend=default_backend()
    )
    key = kdf.derive(shared_secret)

    # Decrypt
    decryptor = Cipher(
        algorithms.AES(key),
        modes.GCM(iv, tag),
        backend=default_backend()
    ).decryptor()

    try:
        decrypted = decryptor.update(ciphertext) + decryptor.finalize()
        return decrypted.decode()
    except:
        raise ValueError("Decryption failed")
