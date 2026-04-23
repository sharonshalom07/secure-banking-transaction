const API_BASE = import.meta.env.VITE_API_URL || "/api";

// --- Token Management ---
let authToken: string | null = null;

export function setToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem("sb_token", token);
  } else {
    localStorage.removeItem("sb_token");
  }
}

export function getToken(): string | null {
  if (!authToken) {
    authToken = localStorage.getItem("sb_token");
  }
  return authToken;
}

export function clearToken() {
  authToken = null;
  localStorage.removeItem("sb_token");
}

// --- API Helper ---
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `API error: ${response.status}`);
  }

  return response.json();
}

// --- API Types ---
export interface RegisterPayload {
  username: string;
  password: string;
  full_name: string;
  email: string;
  phone: string;
  public_key: string;
  private_key: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface TransferPayload {
  account_number: string;
  ifsc_code: string;
  amount: number;
  description: string;
  password: string;
  encrypted_data: string;
  signature: string;
  timestamp: number;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export interface BeneficiaryPayload {
  name: string;
  nickname: string;
  account_number: string;
  ifsc_code: string;
  bank_name: string;
}

export interface BillPaymentPayload {
  category: string;
  biller_name: string;
  consumer_number: string;
  amount: number;
  password: string;
}

export interface UpdateProfilePayload {
  full_name: string;
  email: string;
  phone: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  username: string;
  account_number: string;
}

export interface UserProfile {
  username: string;
  full_name: string;
  email: string;
  phone: string;
  balance: number;
  account_number: string;
  ifsc_code: string;
  bank_name: string;
  public_key: string;
  private_key: string;
  created_at: string;
}

export interface TransactionRecord {
  transaction_id: string;
  from_user: string;
  to_user: string;
  from_account: string;
  to_account: string;
  amount: number;
  description: string;
  transaction_type: string;
  encrypted_data: string;
  signature: string;
  timestamp: number;
  verified: boolean;
  created_at: string;
}

export interface BeneficiaryRecord {
  id: string;
  name: string;
  nickname: string;
  account_number: string;
  ifsc_code: string;
  bank_name: string;
  created_at: string;
}

export interface MessageResponse {
  message: string;
  account_number?: string;
}

export interface AuditLogRecord {
  event_type: string;
  username: string;
  ip_address: string;
  details: string;
  success: boolean;
  timestamp: string;
}

export interface HealthStatus {
  status: string;
  database: string;
  users: number;
  transactions: number;
  timestamp: string;
}

export interface AccountSummary {
  total_sent: number;
  total_received: number;
  transaction_count: number;
  largest_sent: number;
  largest_received: number;
}

// --- API Functions ---

export async function apiRegister(data: RegisterPayload): Promise<MessageResponse> {
  return apiFetch<MessageResponse>("/register", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiLogin(data: LoginPayload): Promise<TokenResponse> {
  const result = await apiFetch<TokenResponse>("/login", {
    method: "POST",
    body: JSON.stringify(data),
  });
  setToken(result.access_token);
  return result;
}

export async function apiGetProfile(): Promise<UserProfile> {
  return apiFetch<UserProfile>("/me");
}

export async function apiUpdateProfile(data: UpdateProfilePayload): Promise<MessageResponse> {
  return apiFetch<MessageResponse>("/update-profile", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiTransfer(data: TransferPayload): Promise<MessageResponse> {
  return apiFetch<MessageResponse>("/transfer", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiGetTransactions(): Promise<TransactionRecord[]> {
  return apiFetch<TransactionRecord[]>("/transactions");
}

export async function apiGetMiniStatement(): Promise<TransactionRecord[]> {
  return apiFetch<TransactionRecord[]>("/mini-statement");
}

export async function apiGetStatement(fromDate?: string, toDate?: string): Promise<TransactionRecord[]> {
  const params = new URLSearchParams();
  if (fromDate) params.set("from_date", fromDate);
  if (toDate) params.set("to_date", toDate);
  const qs = params.toString();
  return apiFetch<TransactionRecord[]>(`/statement${qs ? "?" + qs : ""}`);
}

export async function apiGetBeneficiaries(): Promise<BeneficiaryRecord[]> {
  return apiFetch<BeneficiaryRecord[]>("/beneficiaries");
}

export async function apiAddBeneficiary(data: BeneficiaryPayload): Promise<MessageResponse> {
  return apiFetch<MessageResponse>("/beneficiaries", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiDeleteBeneficiary(id: string): Promise<MessageResponse> {
  return apiFetch<MessageResponse>(`/beneficiaries/${id}`, {
    method: "DELETE",
  });
}

export async function apiPayBill(data: BillPaymentPayload): Promise<MessageResponse> {
  return apiFetch<MessageResponse>("/pay-bill", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiChangePassword(data: ChangePasswordPayload): Promise<MessageResponse> {
  return apiFetch<MessageResponse>("/change-password", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function apiGetAuditLogs(): Promise<AuditLogRecord[]> {
  return apiFetch<AuditLogRecord[]>("/audit-logs");
}

export async function apiHealthCheck(): Promise<HealthStatus> {
  return apiFetch<HealthStatus>("/health");
}

export async function apiGetSummary(): Promise<AccountSummary> {
  return apiFetch<AccountSummary>("/summary");
}

export async function apiExportCSV(): Promise<void> {
  const token = getToken();
  const response = await fetch(`${API_BASE}/export-csv`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "securebank_statement.csv";
  a.click();
  window.URL.revokeObjectURL(url);
}

export async function apiLogout(): Promise<void> {
  try {
    await apiFetch<MessageResponse>("/logout", { method: "POST" });
  } finally {
    clearToken();
  }
}
