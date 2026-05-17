# Verification Uploads

- Verification documents are stored locally under `public/uploads/verification-documents`.
- The folder is created automatically on upload if it does not already exist.
- Uploaded files are served as static assets through Next.js, so they stay VPS-friendly on an IONOS deployment.
- If you place a reverse proxy like Nginx in front of the app, you can also serve this folder directly from the filesystem for lower overhead.
- The storage layer is intentionally isolated in `lib/uploads.ts` so it can be swapped to S3-compatible storage later without changing the UI.

