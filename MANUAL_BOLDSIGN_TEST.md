# BoldSign Integration — Manual Test Guide

> Phase 4: BoldSign digital signature integration for GetYourCave rental contracts.

---

## 1. Required Environment Variables

Add to your `.env` file (never commit values to git):

```
BOLDSIGN_API_KEY=your_api_key_here
BOLDSIGN_WEBHOOK_SECRET=your_webhook_secret_here
BOLDSIGN_API_BASE_URL=https://api.boldsign.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Obtain your API key and webhook secret from the BoldSign dashboard:
- API key: https://app.boldsign.com/Settings/ApiKey
- Webhook: https://app.boldsign.com/Settings/Webhook

---

## 2. Run the App Locally

```bash
npm run dev
# or
node server.ts
```

App will be available at `http://localhost:3000`.

---

## 3. Expose Localhost via ngrok

Install ngrok if not already installed: https://ngrok.com/download

```bash
ngrok http 3000
```

ngrok will output a URL like:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
```

Copy the HTTPS URL — you will need it for the BoldSign webhook.

---

## 4. Configure BoldSign Webhook

1. Go to BoldSign Dashboard → Settings → Webhook
2. Click "Add Webhook"
3. Set **Webhook URL** to:
   ```
   https://YOUR-NGROK-URL/api/contracts/boldsign-webhook
   ```
   Example:
   ```
   https://abc123.ngrok-free.app/api/contracts/boldsign-webhook
   ```
4. In the **Header** section, add a custom header:
   - Header Name: `X-BoldSign-Webhook-Secret`
   - Header Value: any strong random string you choose (e.g. `gyc_local_webhook_secret_2026`)
   - Set the same value as `BOLDSIGN_WEBHOOK_SECRET` in your `.env`
5. Enable the following events:
   - `document.Sent`
   - `signer.Signed`
   - `document.Completed`
   - `document.Declined`
   - `document.Expired`
   - `document.Revoked`
6. Click Save

> **Note:** The ngrok URL changes each time you restart ngrok (unless you have a fixed domain). Update the BoldSign webhook URL whenever ngrok restarts.

---

## 5. Create and Send a Contract

### Step 1: Create a booking
- Register an owner and a renter account
- Owner creates a listing
- Renter books the listing
- Owner approves the booking

### Step 2: Generate the contract (DOCX)
- Navigate to `/contracts`
- Click **Generate** on the approved booking
- Contract status becomes `GENERATED`

### Step 3: Send for BoldSign signature
- Click **Send for Signature** button (visible to owner/admin on GENERATED contracts)
- The app:
  1. Generates a PDF from the contract data (saved to `docs/generated/`)
  2. Uploads the PDF to BoldSign
  3. Configures sequential signing: owner (order 1) → tenant (order 2)
  4. Stores the BoldSign document ID
  5. Updates contract status to `SENT_FOR_SIGNATURE`
  6. Sends in-app notifications to both parties

---

## 6. Expected Status Transitions

| Event | Contract Status |
|---|---|
| Contract generated | `GENERATED` |
| Send for Signature clicked | `SENT_FOR_SIGNATURE` |
| BoldSign confirms document sent | `SENT_FOR_SIGNATURE` |
| Owner signs (signer.Signed, order 1) | `OWNER_SIGNED` |
| Tenant signs (signer.Signed, order 2) | `TENANT_SIGNED` |
| All signed (document.Completed) | `SIGNED` |
| Any signer declines | `SIGNATURE_FAILED` |
| Document expires | `SIGNATURE_FAILED` |

---

## 7. Local File Storage

| File type | Local path |
|---|---|
| Generated PDF | `docs/generated/contract-{id}-{timestamp}.pdf` |
| Signed PDF | `docs/signed/signed-{id}-{timestamp}.pdf` |
| Audit trail | `docs/audit/audit-{id}-{timestamp}.pdf` |

These directories are created automatically when contracts are processed.

---

## 8. Access Control for Signed Files

| Route | Access |
|---|---|
| `GET /api/contracts/[id]/signed-pdf` | Owner, Tenant, or Admin only |
| `GET /api/contracts/[id]/audit-trail` | Owner, Tenant, or Admin only |
| `GET /api/contracts/[id]/download` | Owner, Tenant, or Admin only |

Unauthorized access returns `404` (contract not found or access denied).

---

## 9. Admin Manual Sync

If a webhook is missed (e.g., ngrok was offline):

```bash
curl -X POST http://localhost:3000/api/contracts/{CONTRACT_ID}/sync-boldsign \
  -H "Cookie: gyc_auth_token=YOUR_ADMIN_TOKEN"
```

Or use the admin user session to call the endpoint from the browser dev console:
```js
fetch('/api/contracts/CONTRACT_ID/sync-boldsign', { method: 'POST' }).then(r => r.json()).then(console.log)
```

This calls BoldSign directly and updates the local status + downloads signed files if complete.

---

## 10. Troubleshooting

### Webhook not arriving
- Confirm ngrok is running and URL matches BoldSign webhook config
- Check BoldSign webhook delivery logs in dashboard
- Test with: `curl -X POST https://YOUR-NGROK-URL/api/contracts/boldsign-webhook -H "Content-Type: application/json" -d '{"event":{"eventType":"test"}}'`

### "BoldSign is not configured" error
- Confirm `BOLDSIGN_API_KEY` is set in `.env`
- Restart the dev server after changing `.env`

### Signed PDF not downloaded
- Check server logs for BoldSign download errors
- Ensure the BoldSign document is fully completed before downloading
- Use the sync endpoint to trigger a manual download

### Duplicate webhook events
- The webhook handler is idempotent — duplicate events with the same `eventId` are ignored
- Events without an `eventId` are processed but safe (contract status updates are non-destructive for already-terminal states)

### Signature failure (declined/expired)
- Contract status becomes `SIGNATURE_FAILED`
- `signatureFailedReason` is stored on the contract
- Owner/Admin can click "Send for Signature" again to resend (creates a new BoldSign document)

---

## 11. BoldSign Dashboard Configuration Checklist

- [ ] API key generated and added to `.env`
- [ ] Webhook URL configured with ngrok URL
- [ ] Webhook secret set (same value in BoldSign and `BOLDSIGN_WEBHOOK_SECRET` env var)
- [ ] All 6 webhook events enabled (Sent, Signer Signed, Completed, Declined, Expired, Revoked)
- [ ] Test webhook delivery from BoldSign dashboard using "Test" button
