# Messaging Phase 8 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make renter-owner messaging fully reliable for listing and booking contexts, with safe persistence, realtime updates, and strict conversation access control.

**Architecture:** Reuse the existing conversation, message, and Socket.IO stack instead of introducing a new messaging system. The work is limited to the current `/messaging` workspace, the conversation APIs, the listing-detail conversation starter, and the socket membership flow. The main risk is inconsistent conversation context, so the implementation should make the server the source of truth for conversation reuse, participant membership, unread state, and content filtering.

**Tech Stack:** Next.js App Router, Prisma/PostgreSQL, Socket.IO, `gyc_auth_token` cookie auth, existing content filter, existing messaging components.

---

### Task 1: Lock conversation creation to the correct listing/booking context

**Files:**
- Modify: `lib/messages.ts`
- Modify: `app/api/messages/conversations/route.ts`
- Modify: `components/listings/ListingDetailPage.tsx`

- [ ] **Step 1: Verify the current conversation key**

Run:
```powershell
rg -n "createOrLoadConversation|startOrGetConversation|resolveConversationParticipants|listingId|bookingId|targetUserId" C:\Users\Victus\Downloads\getyourcave\getyourcave\lib\messages.ts C:\Users\Victus\Downloads\getyourcave\getyourcave\app\api\messages\conversations\route.ts C:\Users\Victus\Downloads\getyourcave\getyourcave\components\listings\ListingDetailPage.tsx
```

Expected: the existing flow already resolves owner/renter/listing/booking context and the reuse key is based on the same four fields: owner, renter, listing, booking.

- [ ] **Step 2: Keep conversation reuse server-side**

Update the conversation creation path so the server always reuses an existing conversation when these fields match:
```ts
{
  ownerUserId,
  renterUserId,
  listingId,
  bookingId
}
```

Do not create a duplicate conversation when a renter opens the same listing or booking thread from a different part of the UI.

- [ ] **Step 3: Make the listing detail CTA create or reopen the same conversation**

When the user starts messaging from a listing detail page, the action should use the listing context already present on the page and navigate to the returned conversation:
```ts
const conversation = await createOrLoadConversation({
  listingId,
  targetUserId: ownerUserId
});
router.push(`/messaging?conversation=${conversation.id}`);
```

If the current page already knows the booking id, include it so the conversation is anchored to the exact booking thread:
```ts
const conversation = await createOrLoadConversation({
  listingId,
  bookingId,
  targetUserId: ownerUserId
});
```

- [ ] **Step 4: Confirm the API still returns the conversation id**

The POST response from `app/api/messages/conversations/route.ts` must include the created/reused conversation id so the UI can navigate directly into the thread.

---

### Task 2: Keep `/messaging` list/detail, unread state, and read receipts consistent

**Files:**
- Modify: `app/messaging/page.tsx`
- Modify: `components/messages/MessagingWorkspace.tsx`
- Modify: `app/api/messages/conversations/[id]/route.ts`
- Modify: `app/api/messages/conversations/[id]/read/route.ts`
- Modify: `lib/messages.ts`

- [ ] **Step 1: Confirm the list endpoint stays role-scoped**

Run:
```powershell
rg -n "listConversationsForUser|getConversationForUser|markConversationRead|unread" C:\Users\Victus\Downloads\getyourcave\getyourcave\app\api\messages\conversations\[id]\route.ts C:\Users\Victus\Downloads\getyourcave\getyourcave\app\api\messages\conversations\[id]\read\route.ts C:\Users\Victus\Downloads\getyourcave\getyourcave\lib\messages.ts
```

Expected: the APIs only return data for the authenticated viewer and reject conversations they are not part of.

- [ ] **Step 2: Keep message sends persisted before realtime broadcast**

The message POST path must keep this order:
1. Validate membership.
2. Save the message in PostgreSQL.
3. Emit the Socket.IO event.

Keep the existing pattern so a refresh still shows the message after send.

- [ ] **Step 3: Preserve read state on conversation open**

When a conversation is opened, call the read endpoint and update the UI after the server marks messages as read:
```ts
await fetch(`/api/messages/conversations/${conversationId}/read`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" }
});
```

Expected: unread counts drop for the viewer after the thread is opened, and the state persists after refresh.

- [ ] **Step 4: Keep the messaging workspace stable after refresh**

Make sure the selected conversation can survive a refresh or deep link like:
```text
/messaging?conversation=<id>
```

Expected: the thread opens directly and loads the correct conversation detail instead of falling back to an empty state.

---

### Task 3: Keep realtime Socket.IO and content filtering working without widening access

**Files:**
- Modify: `lib/socket/server.ts`
- Modify: `lib/socket/events.ts`
- Modify: `components/messages/MessagingWorkspace.tsx`
- Inspect only: `lib/content-filter.ts`
- Inspect only: `server.ts`

- [ ] **Step 1: Verify socket auth and room membership**

Run:
```powershell
rg -n "gyc_auth_token|joinConversation|leaveConversation|sendMessage|messageRead|typing|socketError" C:\Users\Victus\Downloads\getyourcave\getyourcave\lib\socket\server.ts C:\Users\Victus\Downloads\getyourcave\getyourcave\lib\socket\events.ts
```

Expected: the socket still authenticates from the existing auth cookie and only joins conversation rooms for conversations the user belongs to.

- [ ] **Step 2: Keep realtime event order unchanged**

Preserve the existing sequence for a new message:
1. message is saved
2. `newMessage` is emitted
3. `conversationUpdated` is emitted
4. typing state is cleared if needed

Expected: both participants see the message update without needing a hard refresh.

- [ ] **Step 3: Keep server-side content filtering authoritative**

If the content filter blocks a message, do not save it and do not emit it.

Expected: blocked text returns a clean error in the UI and does not appear in the conversation after refresh.

- [ ] **Step 4: Keep unauthorized users out of the room**

Expected behavior:
- renter 1 cannot open renter 2 conversations
- owner 1 cannot open owner 2 conversations
- public users cannot access `/messaging`

---

### Task 4: Validate dashboard links and finish with full verification

**Files:**
- Modify if needed: `app/owner/dashboard/page.tsx`
- Modify if needed: `app/renter/dashboard/page.tsx`
- Modify if needed: `lib/dashboard/owner.ts`
- Modify if needed: `lib/dashboard/renter.ts`
- Modify if needed: `components/messages/MessagingWorkspace.tsx`

- [ ] **Step 1: Keep any existing dashboard conversation links pointed at the correct thread**

If the owner or renter dashboard already links into messaging, make sure those links resolve to the exact conversation id and do not create a new thread.

Expected: clicking a message link from a dashboard opens the same thread the user expects.

- [ ] **Step 2: Run code quality checks**

Run:
```powershell
npm.cmd run lint
npx.cmd tsc --noEmit
npm.cmd run build
```

Expected:
- lint passes
- typecheck passes
- build passes

- [ ] **Step 3: Manual browser test plan**

1. Run `npm run db:seed-demo` if the DB was reset.
2. Run `npm run dev`.
3. Log in as `renter1@getyourcave.com`.
4. Open `/messaging`.
5. Confirm seeded conversations and message history load.
6. Send a message to Owner 1.
7. Refresh the page and confirm the message persists.
8. Log in as `owner1@getyourcave.com` in another session.
9. Open `/messaging`.
10. Confirm Owner 1 sees the same thread and the renter’s message.
11. Send a reply and confirm renter 1 receives it.
12. Confirm the same thread can be reopened from a listing detail page without duplicating the conversation.
13. Confirm renter 2 and owner 2 cannot see renter 1 / owner 1 conversations.
14. Confirm a logged-out user cannot open `/messaging`.
15. If content filtering is present, try a blocked message and confirm it does not save or broadcast.

- [ ] **Step 4: Commit once the flow is verified**

Use a small, focused commit when the messaging flow passes the browser tests:
```powershell
git add app/api/messages app/messaging components/messages components/listings lib/messages.ts lib/socket
git commit -m "feat: harden messaging conversation flow"
```

---

### Self-check against the Phase 8 spec

- Conversation creation: covered by Task 1.
- Messaging page visibility and conversation ownership: covered by Task 2.
- Sending messages and persistence: covered by Task 2 and Task 3.
- Socket.IO realtime behavior: covered by Task 3.
- Content filtering: covered by Task 3.
- Read/unread state: covered by Task 2.
- Dashboard integration: covered by Task 4.
- Permissions/data isolation: covered by Tasks 1 through 4.

