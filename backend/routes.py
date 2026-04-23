# backend/routes.py
import csv
import io
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import StreamingResponse

from models import (
    User, Transaction, AuditLog, Beneficiary, BillPayment,
    RegisterRequest, LoginRequest, TransferRequest, ChangePasswordRequest,
    BeneficiaryCreateRequest, BillPaymentRequest, UpdateProfileRequest,
    UserResponse, TransactionResponse, TokenResponse, MessageResponse,
    AuditLogResponse, AccountSummaryResponse, BeneficiaryResponse, BillPaymentResponse,
)
from auth import (
    hash_password, verify_password, validate_password_strength,
    create_access_token, get_current_user,
)

router = APIRouter(prefix="/api")


# --- Helper: Audit Log ---
async def log_event(event_type: str, username: str = "", ip: str = "", details: str = "", success: bool = True):
    """CIA: Integrity — create an immutable audit trail of all security events."""
    await AuditLog(
        event_type=event_type,
        username=username,
        ip_address=ip,
        details=details,
        success=success,
    ).insert()


def get_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


# --- Health Check (CIA: Availability) ---
@router.get("/health")
async def health_check():
    """System health check — verifies DB connection and uptime."""
    try:
        user_count = await User.count()
        tx_count = await Transaction.count()
        return {
            "status": "healthy",
            "database": "connected",
            "users": user_count,
            "transactions": tx_count,
            "timestamp": datetime.utcnow().isoformat(),
        }
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}


# --- Register ---
@router.post("/register", response_model=MessageResponse)
async def register(req: RegisterRequest, request: Request):
    """Register a new user with password strength validation."""
    ip = get_ip(request)

    existing = await User.find_one(User.username == req.username)
    if existing:
        await log_event("REGISTER", req.username, ip, "Username already exists", False)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already exists")

    if not req.username or len(req.username) < 3:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username must be at least 3 characters")

    strength = validate_password_strength(req.password)
    if not strength["valid"]:
        await log_event("REGISTER", req.username, ip, f"Weak password: {'; '.join(strength['errors'])}", False)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="; ".join(strength["errors"]))

    account_number = "ACC" + uuid.uuid4().hex[:10].upper()

    user = User(
        username=req.username,
        password_hash=hash_password(req.password),
        full_name=req.full_name,
        email=req.email,
        phone=req.phone,
        public_key=req.public_key,
        private_key=req.private_key,
        balance=10000.0,
        account_number=account_number,
    )
    await user.insert()

    await log_event("REGISTER", req.username, ip, f"Account {account_number} created", True)

    return MessageResponse(message="Registration successful", account_number=account_number)


# --- Login ---
@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, request: Request):
    """Authenticate user and return JWT token."""
    ip = get_ip(request)

    user = await User.find_one(User.username == req.username)
    if not user:
        await log_event("LOGIN_FAILED", req.username, ip, "User not found", False)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")

    if not verify_password(req.password, user.password_hash):
        await log_event("LOGIN_FAILED", req.username, ip, "Wrong password", False)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")

    access_token = create_access_token(data={"sub": user.username})

    await log_event("LOGIN_SUCCESS", req.username, ip, "JWT token issued", True)

    return TokenResponse(
        access_token=access_token,
        username=user.username,
        account_number=user.account_number,
    )


# --- Profile ---
@router.get("/me", response_model=UserResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    """Get current user's profile."""
    return UserResponse(
        username=current_user.username,
        full_name=current_user.full_name,
        email=current_user.email,
        phone=current_user.phone,
        balance=current_user.balance,
        account_number=current_user.account_number,
        ifsc_code=current_user.ifsc_code,
        bank_name=current_user.bank_name,
        public_key=current_user.public_key,
        private_key=current_user.private_key,
        created_at=current_user.created_at,
    )


# --- Update Profile ---
@router.post("/update-profile", response_model=MessageResponse)
async def update_profile(req: UpdateProfileRequest, request: Request, current_user: User = Depends(get_current_user)):
    """Update user profile details."""
    ip = get_ip(request)

    if req.full_name:
        current_user.full_name = req.full_name
    if req.email:
        current_user.email = req.email
    if req.phone:
        current_user.phone = req.phone

    await current_user.save()
    await log_event("PROFILE_UPDATE", current_user.username, ip, "Profile updated", True)

    return MessageResponse(message="Profile updated successfully")


# --- Transfer (requires account number, IFSC, and password) ---
@router.post("/transfer", response_model=MessageResponse)
async def transfer(req: TransferRequest, request: Request, current_user: User = Depends(get_current_user)):
    """Execute a fund transfer to another account. Requires password re-entry for security."""
    ip = get_ip(request)

    # Verify password
    if not verify_password(req.password, current_user.password_hash):
        await log_event("TRANSFER", current_user.username, ip, "Password verification failed", False)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect password. Transaction cancelled.")

    if req.amount <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Amount must be greater than zero")

    if req.amount > current_user.balance:
        await log_event("TRANSFER", current_user.username, ip, f"Insufficient balance for ${req.amount:.2f}", False)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient balance")

    # Find recipient by account number
    recipient = await User.find_one(User.account_number == req.account_number)
    if not recipient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipient account not found. Please verify the account number.")

    # Verify IFSC code matches
    if recipient.ifsc_code != req.ifsc_code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="IFSC code does not match the recipient's account. Please verify bank details.")

    # Cannot transfer to yourself
    if recipient.username == current_user.username:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot transfer to your own account")

    # Execute transfer
    current_user.balance -= req.amount
    recipient.balance += req.amount
    await current_user.save()
    await recipient.save()

    transaction = Transaction(
        transaction_id=uuid.uuid4().hex,
        from_user=current_user.username,
        to_user=recipient.username,
        from_account=current_user.account_number,
        to_account=req.account_number,
        amount=req.amount,
        description=req.description or "Fund Transfer",
        transaction_type="transfer",
        encrypted_data=req.encrypted_data,
        signature=req.signature,
        timestamp=req.timestamp,
        verified=True,
    )
    await transaction.insert()

    await log_event("TRANSFER", current_user.username, ip,
                     f"${req.amount:.2f} to {recipient.username} ({req.account_number})", True)

    return MessageResponse(message=f"Successfully transferred ${req.amount:.2f} to account {req.account_number}")


# --- Beneficiaries ---
@router.get("/beneficiaries", response_model=list[BeneficiaryResponse])
async def get_beneficiaries(current_user: User = Depends(get_current_user)):
    """Get all saved beneficiaries for the current user."""
    bens = await Beneficiary.find(
        Beneficiary.owner_username == current_user.username
    ).sort("-created_at").to_list()

    return [
        BeneficiaryResponse(
            id=str(b.id),
            name=b.name,
            nickname=b.nickname,
            account_number=b.account_number,
            ifsc_code=b.ifsc_code,
            bank_name=b.bank_name,
            created_at=b.created_at,
        )
        for b in bens
    ]


@router.post("/beneficiaries", response_model=MessageResponse)
async def add_beneficiary(req: BeneficiaryCreateRequest, request: Request, current_user: User = Depends(get_current_user)):
    """Add a new beneficiary."""
    ip = get_ip(request)

    # Check if beneficiary with same account already exists
    existing = await Beneficiary.find_one(
        Beneficiary.owner_username == current_user.username,
        Beneficiary.account_number == req.account_number,
    )
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Beneficiary with this account number already exists")

    ben = Beneficiary(
        owner_username=current_user.username,
        name=req.name,
        nickname=req.nickname or req.name,
        account_number=req.account_number,
        ifsc_code=req.ifsc_code,
        bank_name=req.bank_name or "Unknown Bank",
    )
    await ben.insert()

    await log_event("BENEFICIARY_ADD", current_user.username, ip, f"Added {req.name} ({req.account_number})", True)
    return MessageResponse(message=f"Beneficiary '{req.name}' added successfully")


@router.delete("/beneficiaries/{beneficiary_id}", response_model=MessageResponse)
async def delete_beneficiary(beneficiary_id: str, request: Request, current_user: User = Depends(get_current_user)):
    """Delete a saved beneficiary."""
    ip = get_ip(request)
    from beanie import PydanticObjectId

    try:
        ben = await Beneficiary.get(PydanticObjectId(beneficiary_id))
    except Exception:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Beneficiary not found")

    if not ben or ben.owner_username != current_user.username:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Beneficiary not found")

    await ben.delete()
    await log_event("BENEFICIARY_DELETE", current_user.username, ip, f"Deleted {ben.name} ({ben.account_number})", True)

    return MessageResponse(message=f"Beneficiary '{ben.name}' deleted")


# --- Bill Payment ---
@router.post("/pay-bill", response_model=MessageResponse)
async def pay_bill(req: BillPaymentRequest, request: Request, current_user: User = Depends(get_current_user)):
    """Pay a bill. Requires password confirmation."""
    ip = get_ip(request)

    # Verify password
    if not verify_password(req.password, current_user.password_hash):
        await log_event("BILL_PAYMENT", current_user.username, ip, "Password verification failed", False)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect password. Payment cancelled.")

    if req.amount <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Amount must be greater than zero")

    if req.amount > current_user.balance:
        await log_event("BILL_PAYMENT", current_user.username, ip, f"Insufficient balance for ${req.amount:.2f}", False)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient balance")

    # Deduct amount
    current_user.balance -= req.amount
    await current_user.save()

    ref_number = "BP" + uuid.uuid4().hex[:12].upper()

    # Create bill payment record
    bp = BillPayment(
        username=current_user.username,
        category=req.category,
        biller_name=req.biller_name,
        consumer_number=req.consumer_number,
        amount=req.amount,
        reference_number=ref_number,
        status="completed",
    )
    await bp.insert()

    # Also create a transaction record for history
    tx = Transaction(
        transaction_id=uuid.uuid4().hex,
        from_user=current_user.username,
        to_user=req.biller_name,
        from_account=current_user.account_number,
        to_account=req.consumer_number,
        amount=req.amount,
        description=f"Bill Payment - {req.category.replace('_', ' ').title()} ({req.biller_name})",
        transaction_type="bill_payment",
        timestamp=datetime.utcnow().timestamp(),
        verified=True,
    )
    await tx.insert()

    await log_event("BILL_PAYMENT", current_user.username, ip,
                     f"${req.amount:.2f} to {req.biller_name} ({req.category}), Ref: {ref_number}", True)

    return MessageResponse(message=f"Bill payment of ${req.amount:.2f} to {req.biller_name} successful. Reference: {ref_number}")


# --- Transaction History ---
@router.get("/transactions", response_model=list[TransactionResponse])
async def get_transactions(current_user: User = Depends(get_current_user)):
    """Get current user's transaction history."""
    transactions = await Transaction.find(
        {"$or": [
            {"from_user": current_user.username},
            {"to_user": current_user.username},
        ]}
    ).sort("-created_at").to_list()

    return [
        TransactionResponse(
            transaction_id=t.transaction_id,
            from_user=t.from_user,
            to_user=t.to_user,
            from_account=t.from_account,
            to_account=t.to_account,
            amount=t.amount,
            description=t.description,
            transaction_type=t.transaction_type,
            encrypted_data=t.encrypted_data,
            signature=t.signature,
            timestamp=t.timestamp,
            verified=t.verified,
            created_at=t.created_at,
        )
        for t in transactions
    ]


# --- Mini Statement (last 5 transactions) ---
@router.get("/mini-statement", response_model=list[TransactionResponse])
async def get_mini_statement(current_user: User = Depends(get_current_user)):
    """Get last 5 transactions for dashboard quick view."""
    transactions = await Transaction.find(
        {"$or": [
            {"from_user": current_user.username},
            {"to_user": current_user.username},
        ]}
    ).sort("-created_at").limit(5).to_list()

    return [
        TransactionResponse(
            transaction_id=t.transaction_id,
            from_user=t.from_user,
            to_user=t.to_user,
            from_account=t.from_account,
            to_account=t.to_account,
            amount=t.amount,
            description=t.description,
            transaction_type=t.transaction_type,
            encrypted_data=t.encrypted_data,
            signature=t.signature,
            timestamp=t.timestamp,
            verified=t.verified,
            created_at=t.created_at,
        )
        for t in transactions
    ]


# --- Account Statement with Date Filter ---
@router.get("/statement", response_model=list[TransactionResponse])
async def get_statement(
    from_date: str = "",
    to_date: str = "",
    current_user: User = Depends(get_current_user),
):
    """Get account statement with optional date range filter."""
    query = {"$or": [
        {"from_user": current_user.username},
        {"to_user": current_user.username},
    ]}

    if from_date or to_date:
        date_filter = {}
        if from_date:
            try:
                date_filter["$gte"] = datetime.fromisoformat(from_date)
            except ValueError:
                pass
        if to_date:
            try:
                date_filter["$lte"] = datetime.fromisoformat(to_date + "T23:59:59")
            except ValueError:
                pass
        if date_filter:
            query["created_at"] = date_filter

    transactions = await Transaction.find(query).sort("-created_at").to_list()

    return [
        TransactionResponse(
            transaction_id=t.transaction_id,
            from_user=t.from_user,
            to_user=t.to_user,
            from_account=t.from_account,
            to_account=t.to_account,
            amount=t.amount,
            description=t.description,
            transaction_type=t.transaction_type,
            encrypted_data=t.encrypted_data,
            signature=t.signature,
            timestamp=t.timestamp,
            verified=t.verified,
            created_at=t.created_at,
        )
        for t in transactions
    ]


# --- Change Password (CIA: Confidentiality) ---
@router.post("/change-password", response_model=MessageResponse)
async def change_password(req: ChangePasswordRequest, request: Request, current_user: User = Depends(get_current_user)):
    """Change password — requires current password verification."""
    ip = get_ip(request)

    if not verify_password(req.current_password, current_user.password_hash):
        await log_event("PASSWORD_CHANGE", current_user.username, ip, "Wrong current password", False)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")

    strength = validate_password_strength(req.new_password)
    if not strength["valid"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="; ".join(strength["errors"]))

    current_user.password_hash = hash_password(req.new_password)
    await current_user.save()

    await log_event("PASSWORD_CHANGE", current_user.username, ip, "Password changed successfully", True)

    return MessageResponse(message="Password changed successfully")


# --- Audit Logs (CIA: Integrity) ---
@router.get("/audit-logs", response_model=list[AuditLogResponse])
async def get_audit_logs(current_user: User = Depends(get_current_user)):
    """Get security audit logs for the current user."""
    logs = await AuditLog.find(
        AuditLog.username == current_user.username
    ).sort("-timestamp").limit(50).to_list()

    return [
        AuditLogResponse(
            event_type=log.event_type,
            username=log.username,
            ip_address=log.ip_address,
            details=log.details,
            success=log.success,
            timestamp=log.timestamp,
        )
        for log in logs
    ]


# --- Account Summary (Banking) ---
@router.get("/summary", response_model=AccountSummaryResponse)
async def account_summary(current_user: User = Depends(get_current_user)):
    """Get account summary with stats."""
    sent = await Transaction.find({"from_user": current_user.username}).to_list()
    received = await Transaction.find({"to_user": current_user.username}).to_list()

    total_sent = sum(t.amount for t in sent)
    total_received = sum(t.amount for t in received)
    largest_sent = max((t.amount for t in sent), default=0)
    largest_received = max((t.amount for t in received), default=0)

    return AccountSummaryResponse(
        total_sent=total_sent,
        total_received=total_received,
        transaction_count=len(sent) + len(received),
        largest_sent=largest_sent,
        largest_received=largest_received,
    )


# --- Export Transactions CSV (Banking) ---
@router.get("/export-csv")
async def export_csv(current_user: User = Depends(get_current_user)):
    """Export transactions as CSV file."""
    transactions = await Transaction.find(
        {"$or": [{"from_user": current_user.username}, {"to_user": current_user.username}]}
    ).sort("-created_at").to_list()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Date", "Type", "From", "To", "Amount", "Description", "Transaction ID", "Verified"])

    for t in transactions:
        tx_type = "Sent" if t.from_user == current_user.username else "Received"
        date_str = t.created_at.strftime("%Y-%m-%d %H:%M:%S")
        writer.writerow([date_str, tx_type, t.from_user, t.to_user, f"${t.amount:.2f}", t.description, t.transaction_id, t.verified])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=securebank_statement_{current_user.username}.csv"},
    )


# --- Logout ---
@router.post("/logout", response_model=MessageResponse)
async def logout(request: Request, current_user: User = Depends(get_current_user)):
    """Logout — logs the event."""
    ip = get_ip(request)
    await log_event("LOGOUT", current_user.username, ip, "User logged out", True)
    return MessageResponse(message="Logged out successfully")
