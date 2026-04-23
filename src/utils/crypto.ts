import CryptoJS from 'crypto-js';
import forge from 'node-forge';

// SHA-256 Password Hashing
export const hashPassword = (password: string): string => {
  return CryptoJS.SHA256(password).toString();
};

// AES Encryption/Decryption
export const encryptAES = (data: string, key: string): string => {
  return CryptoJS.AES.encrypt(data, key).toString();
};

export const decryptAES = (encryptedData: string, key: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedData, key);
  return bytes.toString(CryptoJS.enc.Utf8);
};

// Diffie-Hellman Key Exchange
export class DiffieHellman {
  private static readonly prime = BigInt('0xFFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F14374FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7EDEE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF0598DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB9ED529077096966D670C354E4ABC9804F1746C08CA18217C32905E462E36CE3BE39E772C180E86039B2783A2EC07A28FB5C55DF06F4C52C9DE2BCBF6955817183995497CEA956AE515D2261898FA051015728E5A8AACAA68FFFFFFFFFFFFFFFF');
  private static readonly generator = BigInt(2);
  
  private privateKey: bigint;
  public publicKey: bigint;
  
  constructor() {
    // Generate random private key (256-bit)
    const randomBytes = forge.random.getBytesSync(32);
    this.privateKey = BigInt('0x' + forge.util.bytesToHex(randomBytes)) % (DiffieHellman.prime - BigInt(2)) + BigInt(1);
    
    // Calculate public key: g^private mod p
    this.publicKey = this.modPow(DiffieHellman.generator, this.privateKey, DiffieHellman.prime);
  }
  
  private modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
    let result = BigInt(1);
    base = base % modulus;
    
    while (exponent > 0) {
      if (exponent % BigInt(2) === BigInt(1)) {
        result = (result * base) % modulus;
      }
      exponent = exponent / BigInt(2);
      base = (base * base) % modulus;
    }
    
    return result;
  }
  
  computeSharedSecret(otherPublicKey: bigint): string {
    const sharedSecret = this.modPow(otherPublicKey, this.privateKey, DiffieHellman.prime);
    // Convert to hex string and hash it to get a usable key
    const secretHex = sharedSecret.toString(16);
    return CryptoJS.SHA256(secretHex).toString();
  }
  
  getPublicKey(): string {
    return this.publicKey.toString(16);
  }
}

// RSA Key Generation and Digital Signatures
export class RSAKeyPair {
  public publicKey: string;
  public privateKey: string;
  
  constructor() {
    const keypair = forge.pki.rsa.generateKeyPair({ bits: 2048, e: 0x10001 });
    this.publicKey = forge.pki.publicKeyToPem(keypair.publicKey);
    this.privateKey = forge.pki.privateKeyToPem(keypair.privateKey);
  }
}

export const signData = (data: string, privateKeyPem: string): string => {
  const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
  const md = forge.md.sha256.create();
  md.update(data, 'utf8');
  const signature = privateKey.sign(md);
  return forge.util.encode64(signature);
};

export const verifySignature = (data: string, signature: string, publicKeyPem: string): boolean => {
  try {
    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
    const md = forge.md.sha256.create();
    md.update(data, 'utf8');
    const signatureBytes = forge.util.decode64(signature);
    return publicKey.verify(md.digest().bytes(), signatureBytes);
  } catch (error) {
    return false;
  }
};

// Utility function to generate a random transaction ID
export const generateTransactionId = (): string => {
  return CryptoJS.lib.WordArray.random(16).toString();
};
