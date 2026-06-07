export const SMS_DEV_MODE = process.env.SMS_DEV_MODE === "true";

function getTwilioConfig() {
  return {
    accountSid: process.env.TWILIO_ACCOUNT_SID?.trim() ?? "",
    authToken: process.env.TWILIO_AUTH_TOKEN?.trim() ?? "",
    verifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID?.trim() ?? "",
  };
}

function isTwilioConfigured() {
  const { accountSid, authToken, verifyServiceSid } = getTwilioConfig();
  return Boolean(accountSid && authToken && verifyServiceSid);
}

/**
 * Send an OTP to the given phone number.
 * In dev mode: does nothing (caller stores SMS_DEV_OTP).
 * In production: sends via Twilio Verify.
 */
export async function sendOtp(phone: string): Promise<{ sent: boolean; error?: string }> {
  if (SMS_DEV_MODE) {
    if (process.env.NODE_ENV !== "production") {
      console.log("[sms:dev] SMS_DEV_MODE=true — skipping real SMS for", phone);
    }
    return { sent: true };
  }

  if (!isTwilioConfigured()) {
    console.error("[sms] Twilio is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SERVICE_SID.");
    return { sent: false, error: "SMS service is not configured." };
  }

  const { accountSid, authToken, verifyServiceSid } = getTwilioConfig();

  try {
    const twilio = (await import("twilio")).default;
    const client = twilio(accountSid, authToken);
    const verification = await client.verify.v2.services(verifyServiceSid).verifications.create({
      to: phone,
      channel: "sms",
    });
    console.log("[sms] Twilio verification status:", verification.status, "to:", phone);
    return { sent: true };
  } catch (err) {
    const twilioErr = err as { code?: number; message?: string; status?: number };
    console.error("[sms] Twilio sendOtp error — code:", twilioErr.code, "status:", twilioErr.status, "message:", twilioErr.message);
    return { sent: false, error: "Failed to send verification code. Please try again." };
  }
}

/**
 * Verify an OTP code via Twilio Verify.
 * Only called in production mode. In dev mode the caller handles verification locally.
 */
export async function verifyOtpWithTwilio(
  phone: string,
  code: string,
): Promise<{ valid: boolean; error?: string }> {
  if (!isTwilioConfigured()) {
    return { valid: false, error: "SMS service is not configured." };
  }

  const { accountSid, authToken, verifyServiceSid } = getTwilioConfig();

  try {
    const twilio = (await import("twilio")).default;
    const client = twilio(accountSid, authToken);
    const check = await client.verify.v2.services(verifyServiceSid).verificationChecks.create({
      to: phone,
      code,
    });
    return { valid: check.status === "approved" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Twilio error";
    console.error("[sms] Twilio verifyOtp error:", message);
    return { valid: false, error: "Verification failed. Please try again." };
  }
}

/**
 * Normalize a phone number to E.164 format (basic).
 * Strips spaces/dashes/parentheses. Adds + if missing.
 */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/[\s\-().]/g, "");
  if (!digits.startsWith("+")) {
    return `+${digits}`;
  }
  return digits;
}
