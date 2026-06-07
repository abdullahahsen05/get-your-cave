/**
 * Notification display-time i18n helpers.
 *
 * Notifications are stored in the DB with English text because they are
 * generated server-side where the user's display locale is not available.
 * These helpers translate the known system notification types at render time
 * so the bell panel, toast popups, and the /notifications page all respect
 * the currently-selected language.
 *
 * Custom/unknown notification text passes through unchanged.
 */

type TranslateFn = (key: string, options?: Record<string, string | number>) => string;

const TITLE_KEY_MAP: Record<string, string> = {
  "Payment received": "notifications.paymentReceived",
  "Owner payout completed": "notifications.ownerPayoutCompleted",
  "Payment failed": "notifications.paymentFailed",
  "Request accepted": "notifications.requestAccepted",
  "Request rejected": "notifications.requestRejected",
  "Booking request": "notifications.bookingRequest",
  "Booking cancelled": "notifications.bookingCancelled",
  "Listing published": "notifications.listingPublished",
  "Listing rejected": "notifications.listingRejected",
  "Listing expired": "notifications.listingExpired",
  "Document approved": "notifications.documentApproved",
  "Document rejected": "notifications.documentRejected",
  "Documents required": "notifications.documentsRequired",
  "Documents approved": "notifications.documentsApproved",
  "Payment refunded": "notifications.paymentRefunded",
  "Refund processed": "notifications.refundProcessed",
  "Withdrawal requested": "notifications.withdrawalRequested",
  "Withdrawal processing": "notifications.withdrawalProcessing",
  "Withdrawal paid": "notifications.withdrawalPaid",
  "Withdrawal rejected": "notifications.withdrawalRejected",
  "Withdrawal cancelled": "notifications.withdrawalCancelled",
  "Contract sent for signature": "notifications.contractSentForSignature",
  "You signed the contract": "notifications.ownerSignedContract",
  "Owner signed the contract": "notifications.ownerSignedContract",
  "Tenant signed the contract": "notifications.tenantSignedContract",
  "Contract fully signed": "notifications.contractFullySigned",
  "Contract signature failed": "notifications.contractSignatureFailed",
  "Phone number verified": "notifications.phoneVerified",
  "Account activated": "notifications.accountActivated",
};

export function translateNotificationTitle(title: string, t: TranslateFn): string {
  const key = TITLE_KEY_MAP[title];
  if (key) {
    const translated = t(key);
    if (translated !== key) return translated;
  }

  // "New message from {{name}}"
  const msgMatch = title.match(/^New message from (.+)$/);
  if (msgMatch?.[1]) {
    const translated = t("notifications.newMessageFrom", { name: msgMatch[1] });
    if (!translated.startsWith("notifications.")) return translated;
  }

  return title;
}

export function translateNotificationBody(
  title: string,
  body: string | null,
  t: TranslateFn,
): string | null {
  if (!body) return null;

  try {
    switch (title) {
      case "Payment received": {
        const m = body.match(/booking ([\w-]+) was received/);
        if (m?.[1]) return t("notifications.bodyPaymentReceived", { bookingNumber: m[1] });
        break;
      }
      case "Owner payout completed": {
        const m = body.match(/booking ([\w-]+) was added/);
        if (m?.[1]) return t("notifications.bodyOwnerPayoutCompleted", { bookingNumber: m[1] });
        break;
      }
      case "Payment failed": {
        if (body.includes("recurring")) {
          return t("notifications.bodyPaymentFailedRecurring");
        }
        if (body.includes("Stripe")) {
          return t("notifications.bodyPaymentFailedStripe");
        }
        break;
      }
      case "Request accepted": {
        const m = body.match(/request ([\w-]+) was accepted/);
        if (m?.[1]) return t("notifications.bodyRequestAccepted", { bookingNumber: m[1] });
        break;
      }
      case "Request rejected": {
        const m = body.match(/request ([\w-]+) was rejected/);
        if (m?.[1]) return t("notifications.bodyRequestRejected", { bookingNumber: m[1] });
        break;
      }
      case "Booking cancelled": {
        const mRenter = body.match(/Your booking ([\w-]+) has been cancelled/);
        if (mRenter?.[1]) return t("notifications.bodyBookingCancelledRenter", { bookingNumber: mRenter[1] });
        const mOwner = body.match(/Booking ([\w-]+) was cancelled by the renter/);
        if (mOwner?.[1]) return t("notifications.bodyBookingCancelledOwner", { bookingNumber: mOwner[1] });
        break;
      }
      case "Booking request": {
        const m = body.match(/new booking request for (.+)\.$/);
        if (m?.[1]) return t("notifications.bodyBookingRequest", { listingTitle: m[1] });
        break;
      }
      case "Listing published": {
        const m = body.match(/listing "(.+)" is now published/);
        if (m?.[1]) return t("notifications.bodyListingPublished", { listingTitle: m[1] });
        break;
      }
      case "Listing rejected": {
        const m = body.match(/listing "(.+)" was rejected/);
        if (m?.[1]) return t("notifications.bodyListingRejected", { listingTitle: m[1] });
        break;
      }
      case "Document approved": {
        const m = body.match(/Your (.+) was approved\./);
        if (m?.[1]) return t("notifications.bodyDocumentApproved", { docType: m[1] });
        break;
      }
      case "Document rejected": {
        const m = body.match(/Your (.+) was rejected\./);
        if (m?.[1]) return t("notifications.bodyDocumentRejected", { docType: m[1] });
        break;
      }
      case "Payment refunded": {
        const m = body.match(/invoice ([\w-]+) has been refunded/);
        if (m?.[1]) return t("notifications.bodyPaymentRefunded", { invoiceNumber: m[1] });
        break;
      }
      case "Refund processed": {
        const m = body.match(/payment for (.+) was refunded/);
        if (m?.[1]) return t("notifications.bodyRefundProcessed", { listingTitle: m[1] });
        break;
      }
      case "Documents required":
        return t("notifications.bodyDocumentsRequired");
      case "Documents approved":
        return t("notifications.bodyDocumentsApproved");
      case "Phone number verified": {
        const m = body.match(/phone number (.+) has been verified/);
        if (m?.[1]) return t("notifications.bodyPhoneVerified", { phone: m[1] });
        break;
      }
      case "Account activated":
        return t("notifications.bodyAccountActivated");
      case "Listing expired": {
        const m = body.match(/listing "(.+)" is now archived/);
        if (m?.[1]) return t("notifications.bodyListingExpired", { listingTitle: m[1] });
        break;
      }
    }
  } catch {
    // Fall through to return the original body on any error
  }

  return body;
}

/** Translate both title and body of a notification. */
export function translateNotification(
  notification: { title: string; body: string | null },
  t: TranslateFn,
): { title: string; body: string | null } {
  return {
    title: translateNotificationTitle(notification.title, t),
    body: translateNotificationBody(notification.title, notification.body, t),
  };
}
