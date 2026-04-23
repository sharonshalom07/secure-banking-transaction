# backend/models.py
from datetime import datetime
from typing import Optional
from beanie import Document
from pydantic import BaseModel, Field


class User(Document):
    username: str
    password_hash: str
    full_name: str = ""
    email: str = ""
    phone: str = ""
    public_key: str = ""
    private_key: str = ""
    balance: float = 10000.0
    account_number: str = ""
    ifsc_code: str = "SECB0001234"
    bank_name: str = "SecureBank"
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"
        indexes = ["username", "account_number"]


class Transaction(Document):
    transaction_id: str
    from_user: str
    to_user: str
    from_account: str = ""
    to_account: str = ""
    amount: float
    description: str = "Transfer"
    transaction_type: str = "transfer"  # transfer, bill_payment
    encrypted_data: str = ""
    signature: str = ""
    timestamp: float = 0
    verified: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "transactions"
        indexes = ["from_user", "to_user", "created_at"]


class Beneficiary(Document):
    owner_username: str
    name: str
    nickname: str = ""
    account_number: str
    ifsc_code: str
    bank_name: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "beneficiaries"
        indexes = ["owner_username"]


class BillPayment(Document):
    username: str
    category: str  # electricity, water, gas, internet, credit_card, insurance, mobile
    biller_name: str
    consumer_number: str
    amount: float
    reference_number: str
    status: str = "completed"
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "bill_payments"
        indexes = ["username"]


class AuditLog(Document):
    """CIA: Integrity — immutable record of all security-relevant events."""
    event_type: str  # LOGIN_SUCCESS, LOGIN_FAILED, REGISTER, TRANSFER, PASSWORD_CHANGE, LOGOUT, BILL_PAYMENT
    username: str = ""
    ip_address: str = ""
    details: str = ""
    success: bool = True
    timestamp: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "audit_logs"
        indexes = ["username", "event_type", "timestamp"]


# --- Pydantic Request/Response Schemas ---

class RegisterRequest(BaseModel):
    username: str
    password: str
    full_name: str = ""
    email: str = ""
    phone: str = ""
    public_key: str = ""
    private_key: str = ""


class LoginRequest(BaseModel):
    username: str
    password: str


class TransferRequest(BaseModel):
    account_number: str
    ifsc_code: str
    amount: float
    description: str = "Fund Transfer"
    password: str  # Re-enter password for confirmation
    encrypted_data: str = ""
    signature: str = ""
    timestamp: float = 0


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class BeneficiaryCreateRequest(BaseModel):
    name: str
    nickname: str = ""
    account_number: str
    ifsc_code: str
    bank_name: str = ""


class BillPaymentRequest(BaseModel):
    category: str
    biller_name: str
    consumer_number: str
    amount: float
    password: str  # Re-enter password for confirmation


class UpdateProfileRequest(BaseModel):
    full_name: str = ""
    email: str = ""
    phone: str = ""


class UserResponse(BaseModel):
    username: str
    full_name: str
    email: str
    phone: str
    balance: float
    account_number: str
    ifsc_code: str
    bank_name: str
    public_key: str
    private_key: str
    created_at: datetime


class TransactionResponse(BaseModel):
    transaction_id: str
    from_user: str
    to_user: str
    from_account: str
    to_account: str
    amount: float
    description: str
    transaction_type: str
    encrypted_data: str
    signature: str
    timestamp: float
    verified: bool
    created_at: datetime


class BeneficiaryResponse(BaseModel):
    id: str
    name: str
    nickname: str
    account_number: str
    ifsc_code: str
    bank_name: str
    created_at: datetime


class BillPaymentResponse(BaseModel):
    category: str
    biller_name: str
    consumer_number: str
    amount: float
    reference_number: str
    status: str
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    username: str
    account_number: str


class MessageResponse(BaseModel):
    message: str
    account_number: Optional[str] = None


class AccountSummaryResponse(BaseModel):
    total_sent: float
    total_received: float
    transaction_count: int
    largest_sent: float
    largest_received: float


class AuditLogResponse(BaseModel):
    event_type: str
    username: str
    ip_address: str
    details: str
    success: bool
    timestamp: datetime
