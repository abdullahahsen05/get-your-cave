# Phase 5 — Twilio SMS Phone Verification

## Summary
Users can verify their phone number via SMS OTP from their profile page (/profile). A dev/test mode lets local testing work without burning Twilio credits.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `TWILIO_ACCOUNT_SID` | Prod only | Twilio Account SID from twilio.com console |
| `TWILIO_AUTH_TOKEN` | Prod only | Twilio Auth Token |
| `TWILIO_VERIFY_SERVICE_SID` | Prod only | Twilio Verify Service SID |
| `SMS_DEV_MODE` | Yes | `"true"` = skip SMS, use SMS_DEV_OTP instead |
| `SMS_DEV_OTP` | Dev only | OTP accepted in dev mode (default: `123456`) |

## Dev Mode Setup
1. Set `SMS_DEV_MODE=true` in `.env`
2. Set `SMS_DEV_OTP=123456` (or any code you want)
3. No Twilio credentials needed
4. Server log will print: `[phone-verification:dev] dev OTP for +33... is 123456`
5. Never commit real Twilio credentials

## Production Twilio Setup
1. Create a Twilio account at https://twilio.com
2. Go to Verify → Services → Create a Verify Service
3. Copy the Service SID (starts with `VA...`)
4. Set `SMS_DEV_MODE=false`
5. Fill in TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID in `.env`

## Files Changed
| File | Change |
|---|---|
| `prisma/schema.prisma` | Added `phoneVerified`, `phoneVerifiedAt` to User; new `PhoneVerification` model |
| `lib/auth.ts` | Added `phoneVerified`, `phoneVerifiedAt` to `SafeUser` + `safeUserSelect` |
| `lib/sms.ts` | New — Twilio/dev-mode send, verify, normalizePhone |
| `lib/phone-verification.ts` | New — OTP challenge CRUD, rate limiting, markPhoneVerified |
| `app/api/auth/phone/send-otp/route.ts` | New — POST send OTP route |
| `app/api/auth/phone/verify-otp/route.ts` | New — POST verify OTP route |
| `components/profile/PhoneVerificationSection.tsx` | New — self-contained verification UI |
| `components/profile/ProfileSettingsWorkspace.tsx` | Mounted PhoneVerificationSection |
| `components/admin/AdminUsersWorkspace.tsx` | phoneVerified badge in detail panel |
| `lib/admin.ts` | Added phoneVerified to getAdminUsers select |
| `app/api/admin/users/[id]/route.ts` | Added phoneVerified to publicUserSelect |
| `locales/en/common.json` | phoneVerification.* keys + common.unverified |
| `locales/fr/common.json` | Same in French |

## API Routes

### POST /api/auth/phone/send-otp
**Auth required.** Body: `{ "phone": "+33612345678" }`
- Normalizes phone to E.164
- Rate-limits: max 3 active challenges per user
- Dev mode: stores hashed `SMS_DEV_OTP`, no real SMS
- Production: sends via Twilio Verify

Response: `{ "sent": true, "phone": "+33612345678" }`

### POST /api/auth/phone/verify-otp
**Auth required.** Body: `{ "phone": "+33612345678", "code": "123456" }`
- Dev mode: validates against stored hash
- Production: calls Twilio VerificationCheck
- On success: sets `user.phoneVerified = true`, `user.phoneVerifiedAt = now`
- Sends in-app notification

Response: `{ "verified": true, "phone": "+33612345678" }`

## UI Flow
1. User goes to `/profile`
2. "Phone Verification" section appears below personal info
3. User enters phone number → clicks "Send Code"
4. In dev mode: check server logs for OTP
5. User enters code → clicks "Verify"
6. Section shows green "Verified" badge with phone number

## Rate Limiting & Abuse Notes
- Max 3 active (unconsumed, unexpired) challenges per user at a time → 429 if exceeded
- Max 5 verify attempts per challenge → blocked after 5 wrong codes
- OTP expires after 10 minutes
- Codes are bcrypt-hashed before DB storage in dev mode
- Consumed challenges cannot be reused (consumedAt check)
- Production: Twilio Verify handles all security (rate limiting, fraud prevention)

## Manual Test Steps
1. Set `SMS_DEV_MODE=true`, `SMS_DEV_OTP=123456` in `.env`
2. Restart dev server: `npm run dev`
3. Login as any user
4. Navigate to `/profile`
5. Find "Phone Verification" section
6. Enter phone: `+33612345678`
7. Click "Send Code" → check server log for OTP confirmation
8. Enter code: `999999` → expect "Incorrect code" error
9. Enter code: `123456` → expect success + green "Verified" badge
10. Confirm DB: `SELECT "phoneVerified", "phoneVerifiedAt" FROM "User" WHERE email = '<email>';`
    Expected: `phoneVerified = true`, `phoneVerifiedAt` set
11. Try same code again → expect "This code has already been used"
12. Try entering a new code without requesting → expect "No active verification found"

## DB Schema Added
```prisma
model PhoneVerification {
  id           String    @id @default(uuid())
  userId       String
  phone        String
  codeHash     String?   -- null in production Twilio mode
  expiresAt    DateTime
  attemptCount Int       @default(0)
  maxAttempts  Int       @default(5)
  consumedAt   DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```
