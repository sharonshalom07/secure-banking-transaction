# SecureBank - Encrypted Banking Transaction System

A comprehensive cryptography and network security (CNS) lab project demonstrating multiple security layers including authentication, encryption, and digital signatures.

## 🔐 Security Features

This application implements a complete security protocol with the following cryptographic algorithms:

### 1. **Authentication - SHA-256**
- Passwords are hashed using SHA-256 before storage
- No plain text passwords are ever stored
- One-way hash function ensures password security

### 2. **Key Exchange - Diffie-Hellman**
- Secure session key establishment without direct transmission
- Uses 2048-bit prime number for key generation
- Generates unique session keys for each login
- Session keys are used for AES encryption

### 3. **Encryption - AES-256**
- All transaction data is encrypted using AES (Advanced Encryption Standard)
- Uses the session key derived from Diffie-Hellman exchange
- Ensures confidentiality of sensitive transaction information

### 4. **Digital Signatures - RSA-2048**
- Each transaction is signed with the sender's RSA private key
- Signature verification using sender's public key
- Provides authentication, integrity, and non-repudiation
- Prevents transaction tampering and ensures sender authenticity

## 🏗️ Architecture

### Security Protocol Flow

```
1. REGISTRATION
   └─> Generate RSA-2048 key pair
   └─> Hash password with SHA-256
   └─> Store user with hashed password and public key

2. LOGIN
   └─> Verify password hash (SHA-256)
   └─> Perform Diffie-Hellman key exchange
   └─> Generate shared session key
   └─> Create secure session

3. TRANSACTION
   └─> Create transaction data
   └─> Sign with RSA private key (Digital Signature)
   └─> Encrypt with AES using session key
   └─> Store encrypted transaction

4. VERIFICATION
   └─> Decrypt transaction with session key (AES)
   └─> Verify signature with sender's public key (RSA)
   └─> Display verification status
```

## 🚀 Features

- **User Registration & Login**: Secure authentication with SHA-256 password hashing
- **Account Management**: Each user gets a unique account number and starting balance
- **Secure Transfers**: Send money with full encryption and digital signatures
- **Transaction History**: View all transactions with verification status
- **Security Dashboard**: Detailed view of all cryptographic keys and session information
- **Real-time Verification**: Automatic signature verification for all transactions

## 📋 Technologies Used

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Cryptography Libraries**:
  - `crypto-js`: SHA-256 hashing and AES encryption
  - `node-forge`: RSA key generation and digital signatures
- **Storage**: LocalStorage (simulating a database)

## 🎯 How to Use

### 1. Registration
1. Click on "Register" tab
2. Enter a username and password
3. System automatically:
   - Hashes password with SHA-256
   - Generates RSA-2048 key pair
   - Creates account with $10,000 starting balance
   - Assigns unique account number

### 2. Login
1. Enter your credentials
2. System performs:
   - Password hash verification
   - Diffie-Hellman key exchange
   - Session key generation

### 3. Transfer Funds
1. Navigate to "Transfer" tab
2. Enter recipient username and amount
3. Transaction process:
   - Data encrypted with AES-256
   - Signed with RSA private key
   - Stored with signature for verification

### 4. View History
1. Navigate to "History" tab
2. See all transactions with:
   - Encryption indicators
   - Digital signature verification status
   - Transaction details

### 5. Security Info
1. Navigate to "Security" tab
2. View:
   - Session keys and DH public keys
   - RSA public/private keys
   - Complete security protocol flow
   - Algorithm details

## 🔬 Cryptographic Algorithms Demonstrated

| Algorithm | Purpose | Key Size |
|-----------|---------|----------|
| SHA-256 | Password Hashing | 256-bit |
| Diffie-Hellman | Key Exchange | 2048-bit prime |
| AES | Symmetric Encryption | 256-bit |
| RSA | Digital Signatures | 2048-bit |

## 🛡️ Security Guarantees

1. **Confidentiality**: AES encryption ensures only authorized parties can read transaction data
2. **Integrity**: RSA signatures detect any tampering with transaction data
3. **Authentication**: Signatures prove the identity of the transaction sender
4. **Non-repudiation**: Sender cannot deny creating a signed transaction
5. **Secure Key Exchange**: Diffie-Hellman prevents session key interception

## 📝 CNS Lab Requirements Met

✅ **Authentication**: SHA-256 password hashing  
✅ **Hashing**: SHA-256 for passwords and key derivation  
✅ **Encryption**: AES for transaction data  
✅ **Decryption**: AES decryption for viewing transactions  
✅ **Key Exchange**: Diffie-Hellman for session keys  
✅ **Digital Signatures**: RSA signatures for non-repudiation  
✅ **Real-world Application**: Banking transaction system  
✅ **Multiple Security Layers**: 4 different cryptographic algorithms  

## 💡 Key Learning Outcomes

- Understanding password security with cryptographic hashing
- Implementing secure key exchange without direct transmission
- Using symmetric encryption for data confidentiality
- Applying digital signatures for authentication and non-repudiation
- Combining multiple cryptographic techniques in a real application
- Understanding the complete security protocol flow

## 🎓 Educational Value

This project demonstrates:
- How modern banking systems secure transactions
- Real-world application of cryptographic algorithms
- Importance of multiple security layers
- Difference between encryption (confidentiality) and signatures (authenticity)
- Practical implementation of theoretical CNS concepts

## ⚠️ Note

This is an educational project for CNS lab purposes. In a production environment, additional security measures would include:
- Backend server for transaction processing
- Database with proper access controls
- HTTPS/TLS for network communication
- Additional authentication factors (2FA)
- Rate limiting and fraud detection
- Secure key storage (HSM, key vaults)
- Certificate authorities for public key distribution

---

**Built for CNS Lab Project** - Demonstrating comprehensive cryptographic security protocols in a client-server application.
