# Testing Guide for SecureBank

## Quick Test Scenario

Follow these steps to test all security features:

### Step 1: Create Two User Accounts

**User 1 - Alice**
1. Click "Register"
2. Username: `alice`
3. Password: `alice123`
4. Note the account number shown in the alert

**User 2 - Bob**
1. Logout (if logged in)
2. Click "Register"
3. Username: `bob`
4. Password: `bob123`
5. Note the account number shown in the alert

### Step 2: Test Login & Key Exchange

1. Login as Alice
2. **Observe**: SHA-256 password verification
3. **Observe**: Diffie-Hellman key exchange happens automatically
4. Check "Security" tab to see session keys

### Step 3: Send a Transaction

1. Go to "Transfer" tab
2. Recipient: `bob`
3. Amount: `500`
4. Description: `Payment for services`
5. Click "Transfer Funds"

**What happens behind the scenes:**
- Transaction data is signed with Alice's RSA private key
- Transaction is encrypted with AES using the session key
- Bob's balance increases, Alice's decreases

### Step 4: Verify Transaction Security

1. Go to "History" tab
2. You should see the transaction with:
   - ✅ "Verified" badge (signature verified)
   - 🔒 "AES Encrypted" indicator
   - 📝 "RSA Signed" indicator

### Step 5: View from Recipient's Side

1. Logout
2. Login as Bob (bob / bob123)
3. Check balance (should be $10,500)
4. Go to "History" tab
5. See the incoming transaction with verification

### Step 6: Explore Security Features

**In the Security Tab, you can see:**

1. **Security Overview**
   - Authentication (SHA-256)
   - Key Exchange (Diffie-Hellman)
   - Encryption (AES-256)
   - Digital Signature (RSA-2048)

2. **Session Information**
   - Diffie-Hellman public key
   - Session key (derived from DH)
   - Can copy these keys

3. **RSA Key Pair**
   - Your public key (shareable)
   - Your private key (secret - hidden)

4. **Security Protocol Flow**
   - Complete step-by-step process

### Step 7: Test Invalid Scenarios

**Invalid Transfer:**
1. Try to transfer more than your balance
2. Try to transfer to a non-existent user
3. Try to transfer to yourself
4. Try negative amounts

**Invalid Login:**
1. Try wrong password
2. Try non-existent username

## Verify Security Features

### ✅ SHA-256 Password Hashing
- Open browser DevTools → Application → Local Storage
- Find "users" key
- Notice passwords are hashed (64 hex characters)
- Example: `5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8`

### ✅ Diffie-Hellman Key Exchange
- Go to Security tab
- See "Diffie-Hellman Public Key" (very long hex string)
- Session key is SHA-256 hash of shared secret

### ✅ AES Encryption
- Open Local Storage → "transactions"
- See "encryptedData" field (encrypted ciphertext)
- Cannot read transaction details without session key

### ✅ RSA Digital Signatures
- In transactions, see "signature" field (base64 encoded)
- Verification happens automatically
- Green "Verified" badge confirms signature validity

## Test Data to Verify

After running the test scenario, you should have:

**Alice's Account:**
- Balance: $9,500 (started with $10,000, sent $500)
- 1 outgoing transaction

**Bob's Account:**
- Balance: $10,500 (started with $10,000, received $500)
- 1 incoming transaction

## Advanced Testing

### Test Multiple Transactions
1. Send multiple transactions between users
2. Verify each transaction appears in history
3. Check all signatures verify correctly

### Test Session Persistence
1. Login as a user
2. Refresh the page
3. Should remain logged in (session in localStorage)

### Test Concurrent Users (Multiple Tabs)
1. Open two browser tabs
2. Login as Alice in tab 1
3. Login as Bob in tab 2
4. Send transactions back and forth
5. Verify both users see updated transactions

## Expected Browser Console

No errors should appear in the console. If you see errors, they might be related to:
- Invalid JSON in localStorage
- Encryption/decryption failures
- Signature verification issues

## Security Observations

Watch for these security indicators:

1. **🔐 Password Never Visible**: Passwords are hashed immediately
2. **🔑 Session Keys Unique**: Each login generates new DH keys
3. **🔒 Encrypted Storage**: Transaction data is encrypted in localStorage
4. **✍️ Signatures Valid**: All transactions show "Verified" status
5. **⚠️ Private Keys Protected**: Private keys clearly marked as secret

## Reset Test Data

To start fresh:
1. Open DevTools → Application → Local Storage
2. Clear all data
3. Refresh page
4. Register new users

---

**Happy Testing! 🎉**

This comprehensive test demonstrates all CNS concepts:
- Hashing (SHA-256)
- Symmetric Encryption (AES)
- Asymmetric Cryptography (RSA)
- Key Exchange (Diffie-Hellman)
- Digital Signatures
- Authentication & Authorization
