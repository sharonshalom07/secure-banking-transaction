export interface User {
  username: string;
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  publicKey: string;
  privateKey: string;
  balance: number;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
}

export interface Transaction {
  id: string;
  from: string;
  to: string;
  fromAccount: string;
  toAccount: string;
  amount: number;
  timestamp: number;
  encryptedData: string;
  signature: string;
  verified?: boolean;
  description?: string;
  transactionType: string;
}

export interface Beneficiary {
  id: string;
  name: string;
  nickname: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  createdAt: string;
}

export interface BillPayment {
  category: string;
  billerName: string;
  consumerNumber: string;
  amount: number;
  referenceNumber: string;
  status: string;
  createdAt: string;
}

export interface Session {
  username: string;
  token: string;
  sessionKey: string;
  publicKey: string;
  privateKey: string;
  dhPublicKey: string;
}

export type AuthView = 'login' | 'register' | 'dashboard';
