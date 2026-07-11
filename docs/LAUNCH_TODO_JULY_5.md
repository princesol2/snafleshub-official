# SnaflesHub Launch Todo - July 5, 2026

Today: Wednesday, June 24, 2026  
Launch candidate freeze: Saturday, July 4, 2026  
Public launch target: Sunday, July 5, 2026

This file is the working launch checklist. Keep it updated every day before coding starts and before ending the day.

## Current Status - June 27

### Done

- Frontend dev server runs on `http://127.0.0.1:5175`.
- Backend API runs on `http://127.0.0.1:5000`.
- MongoDB connection works.
- Razorpay test key ID and secret are present in `server/.env`.
- Frontend production build passes.
- Razorpay browser popup opens with test keys.
- Successful Razorpay browser test payment completed locally.
- Razorpay dismiss/close flow marks the payment as failed and restores stock.
- Checkout and order success pages are polished and verified on mobile.
- Vendor login, order list, paid-online order display, cash order display, and order status movement are verified locally.
- Vendor self-order attempts are blocked by both frontend preview checks and backend checkout authorization.
- Core pages exist: home, map, store page, product page, checkout, order success, vendor login, create store, dashboard.
- Vendor dashboard has orders, products, profile, payments, sales, messages, and settings areas in progress.
- Dashboard profile editing was tested locally with a temporary QA store.
- Dashboard logo URL and cover image URL display were tested locally.
- Dashboard settings tab was cleaned up to remove unfinished disabled "Coming soon" cards.
- Dashboard share dialog was cleaned up to remove the unfinished QR placeholder.
- Dashboard payment labels were checked and show customer-friendly labels.
- Vendor login first visual polish pass is complete: storefront image panel, SnaflesHub logo treatment, stronger inputs, and heavier aligned buttons.
- Content and trust pages are present and responding locally: about, support, privacy policy, terms, storefront policy, and refund/payment policy.
- Public storefront QA pass is complete by local route/API checks and source review: store page, product page, cart quantity limits, out-of-stock guards, and sharing link action.
- Store creation/login/product/order/message/payment dashboard smoke test passed with a temporary QA store, including UPI scanner saved during account creation.
- Security review pass is complete for CORS allow-listing, production auth secret requirements, public write endpoint rate limits, malformed token handling, checkout price trust, and env ignore rules.

### In Progress

- Razorpay online checkout flow polish after successful browser test.
- Payment verification and failed/cancelled payment handling polish.
- Demo store support for local testing.
- Map preview UI and store discovery polish.

### Pending

- Repeat Razorpay browser payment pass after any checkout UI change.
- Vendor dashboard order workflow test.
- Real order/message push notifications are not built yet; order and message activity is visible when the dashboard loads.
- Mobile QA for home, map, storefront, cart/order panel, checkout, order success, vendor login, create store, and dashboard. June 27 pass found tap-target and map-marker issues listed below.
- Desktop QA for the same pages, excluding public storefront routes already checked locally.
- Real deployment environment setup.
- Production Razorpay key switch plan.
- Legal/support page professional signoff if needed before public launch.
- Final SEO metadata, favicon, title, social preview polish.
- Performance cleanup, especially large frontend chunks and large images.
- Database backup/export plan before launch.
- Launch smoke test script/checklist.

## Must Not Forget

- Do not launch with test Razorpay keys.
- Do not expose `.env` or secrets.
- Do not leave broken payment states where stock is reduced but order is not confirmed.
- Do not launch until mobile checkout and vendor dashboard are tested.
- Do not deploy without checking legal/support pages and contact details.
- Do not commit generated `dist`, logs, local database folders, or secrets.

## Mobile UI QA Findings - June 27

Tested locally on `http://127.0.0.1:5175` with a 390 x 844 mobile viewport.

### Passed

- Home page and mobile menu have no horizontal overflow or visible control overlap.
- Mobile menu links and auth buttons are at least 44 px tall.
- Map page has no document-level horizontal overflow.
- Public storefront hero actions are at least 46 px tall and do not overlap.
- Checkout form text inputs and primary submit button meet the 44 px touch-target guideline.
- June 27 button weight pass increased mobile map controls, Storefront product actions, cart quantity controls, checkout quantity controls, product detail quantity controls, and social links to at least 44 px.

### Needs Fix Before Launch

- Map store markers overlap heavily when several stores share nearby/default coordinates. Some marker centers are covered by another marker, which can make the intended store hard to tap.

## Daily Plan

### June 12, Friday - Payment Base Audit

- [x] Confirm Razorpay test keys are configured locally.
- [x] Confirm API can create a Razorpay test order.
- [x] Test Razorpay popup with test keys in browser.
- [x] Complete one successful online test payment.
- [x] Verify order changes from `payment_pending` to `confirmed`.
- [x] Verify payment changes to `paid`.
- [x] Test closing the Razorpay window in browser.
- [x] Test failed payment path through API.
- [x] Confirm stock is restored after failed online payment.
- [x] Confirm cash/manual checkout still works.
- [x] Fix payment verification hardening found today.

Notes:

- Online order creation works with Razorpay test mode.
- Failed online payment cleanup returns product stock correctly.
- Cash/manual checkout creates a confirmed order and the order-success token endpoint works.
- Payment verification now checks Razorpay provider payment details before confirming an order.
- Browser popup opened with Razorpay test keys from customer checkout.
- Successful browser payment completed with domestic Razorpay test card. Verified order `6a2c4251f85cfbcf3b7194b3` became `confirmed` and payment became `paid`.
- Razorpay close flow showed exit confirmation, returned to checkout with "Payment window was closed before payment finished.", and verified order `6a2c42e7f85cfbcf3b7194c9` became `payment_failed` with payment `failed`.
- Stock after the successful paid order and dismissed payment cleanup is correct for `Handmade Neem Soap`: `10`.

### June 13, Saturday - Checkout and Order Success Polish

- [x] Review checkout page UI on mobile and desktop.
- [x] Improve payment option copy and error states.
- [x] Verify order success page for cash and online orders.
- [x] Confirm confirmation token behavior works.
- [x] Add or update manual test notes for checkout.

Notes:

- Checkout mobile layout was verified with no horizontal overflow.
- Order success mobile layout was verified with no horizontal overflow.
- Order success now shows the correct payment label for online, pay-at-store, and cash/manual orders.
- Demo checkout completed through the browser and loaded the confirmation page with valid token `demo-confirmed`.
- Unprofessional storefront CTA copy was replaced: customer buttons now use `Buy now` and `Add to cart`.

### June 14, Sunday - Vendor Order Workflow

- [x] Test vendor login.
- [x] Test dashboard order list after cash order.
- [x] Test dashboard order list after paid online order.
- [x] Test moving orders through statuses.
- [x] Confirm customers cannot fake vendor self-orders.

Notes:

- Created temporary QA store `SH-CRAFTS-42093` and verified vendor login through the browser.
- Dashboard showed both a cash/manual order and a paid online order with professional payment labels.
- Cash order moved from `preparing` to `completed` from the dashboard UI.
- Vendor self-order attempt returned backend `403` and remains blocked.
- Backend now rejects vendor workflow updates for `payment_pending` and `payment_failed` online orders.
- Dashboard mobile layout was verified with no horizontal overflow; dashboard tabs now use a compact two-column mobile layout.
- Temporary QA store, orders, payment records, product, and vendor account were removed from local MongoDB after verification.

### June 15, Monday - Dashboard Profile and Settings

- [x] Test profile editing.
- [x] Test logo URL and cover image URL display.
- [x] Check settings tab.
- [x] Check payment tab labels.
- [x] Remove or hide incomplete dashboard features that look unfinished.

Notes:

- Created temporary QA store `SH-QAGOOD-40856` and logged in through the real storefront login form.
- Profile edits saved successfully and updated the dashboard header/profile rows.
- Logo and cover image URLs rendered in the dashboard header after saving.
- Payment method changed to UPI and displayed as `Digital payment: launchqa@upi`.
- Settings tab now shows only working cards: password reset and public page link.
- Removed disabled email verification and two-factor "Coming soon" cards from settings.
- Removed unfinished QR placeholder from the share-store dialog.
- Frontend production build passed after dashboard cleanup.
- Existing large frontend chunk warning remains pending under performance cleanup.
- Temporary QA store and vendor account were removed from local MongoDB after verification.

### June 16, Tuesday - Product Management

- [x] Test add product.
- [x] Test edit product.
- [x] Test delete product.
- [x] Test product stock changes.
- [x] Test product images and empty states.

Notes:

- Completed early on June 15 with temporary QA store `SH-PRODUC-63056`.
- Empty product state showed correctly before products were added.
- Added product with image URL, price `₹499`, and stock `7`; product card rendered image and available stock label.
- Edited product name, image, price to `₹599`, and stock to `2`; product card updated and showed `Low stock`.
- Deleted product successfully; dashboard returned to the empty product state.
- Temporary Product QA store and vendor account were removed from local MongoDB after verification.

### June 17, Wednesday - Storefront QA

- [x] Test public store page.
- [x] Test product detail page.
- [x] Test cart quantity updates.
- [x] Test out-of-stock behavior.
- [x] Test store sharing links.

Notes:

- Verified locally with store `6a29922cd55ee1af729d6388` and product `6a2ae37d50958a6101a3a2f4`.
- Store and product routes returned `200`; store and product APIs returned successful data.
- Cart quantity controls clamp to available stock in source review, and checkout blocks unavailable stock before submitting.
- Out-of-stock products are disabled in the product grid and product detail panel.
- Added a public storefront Share button with Web Share support and clipboard fallback.
- Frontend production build passed after the change. Full mobile click-through still belongs to the final regression pass.

### June 18, Thursday - Map and Discovery QA

- [x] Test map load with real stores.
- [x] Test demo store behavior.
- [x] Test search/filter behavior.
- [ ] Test marker preview cards.
- [x] Test mobile map layout.

Notes:

- `/map` returned `200 OK` locally, and `/api/stores` returned real map-ready stores with coordinates.
- Search/filter API returned matching stores for `Fashion`.
- Demo store fallback remains wired into the map store list for local/demo discovery.
- Fixed the mobile map tap flow: markers are now larger touch targets, projected marker positions avoid the search/satellite/reset control area, and fit-to-stores uses mobile-safe top/bottom padding.
- Moved mobile MapLibre controls above the bottom results tray so native zoom/location controls do not cover store cards.
- Smoothed MapLibre interactions by reducing mouse-wheel and touchpad zoom sensitivity, tuning mobile pinch zoom, setting explicit zoom limits, and containing map overscroll.
- Opened the fixed map in Edge at `http://127.0.0.1:5175/map`.
- Frontend production build passed after the map changes. Existing large frontend chunk warning remains pending.

### June 19, Friday - Create Store Flow

- [x] Test full vendor store creation.
- [ ] Verify validation messages.
- [ ] Verify duplicate phone/email handling.
- [x] Verify created store appears on map when coordinates exist.
- [ ] Verify Punjabi/English text does not break layout.

Notes:

- Added `upiQrUrl` to store records so owners can add a UPI scanner during account creation and later edit it from the dashboard profile.
- The onboarding media step now accepts a UPI scanner image URL and previews it before store creation.
- The dashboard payments panel shows scanner readiness, and manual checkout shows the saved scanner to customers.
- Smoke tested with temporary store `SH-OTHER-12885`: create store, login, product listing, customer order, customer message, dashboard order read, dashboard message read, and payment record read all succeeded.
- Frontend production build passed after the UPI scanner change. Existing large frontend chunk warning remains.

### June 20, Saturday - Content and Trust Pages

- [x] Review about page.
- [x] Review support page.
- [x] Review privacy policy.
- [x] Review terms of use.
- [x] Review vendor policy.
- [x] Add refund/payment policy if needed for Razorpay trust.

Notes:

- Updated the launch checklist from June 16 to June 20.
- Added `/refund-payment-policy` as a public trust page covering payment collection, fulfilment responsibility, failed/cancelled payments, refund requests, timing, and cash/pay-at-store orders.
- Added the refund/payment policy route to the app router.
- Added the refund/payment policy footer link with English and Punjabi labels.
- Confirmed local HTTP `200 OK` responses for `/about`, `/support`, `/privacy-policy`, `/terms-and-conditions`, `/terms-of-use`, `/vendor-policy`, `/refund-payment-policy`, `/map`, and `/vendor/create-store`.
- Frontend production build passed after content/trust page changes. Existing large frontend chunk warning remains pending under performance cleanup.

### June 21, Sunday - Mobile Design Pass

- [ ] Test home on mobile.
- [ ] Test map on mobile.
- [ ] Test store page on mobile.
- [ ] Test checkout on mobile.
- [ ] Test vendor dashboard on mobile.
- [ ] Fix overlapping text, cramped buttons, and scroll issues.

### June 22, Monday - Desktop Design Pass

- [ ] Test all main pages at desktop width.
- [ ] Fix visual spacing issues.
- [ ] Check nav alignment.
- [ ] Check forms, modals, and cards.
- [ ] Remove rough/demo-looking UI.

### June 23, Tuesday - Performance Cleanup

- [ ] Compress or replace oversized images.
- [ ] Review bundle size warning.
- [ ] Consider route-level code splitting.
- [ ] Check loading states.
- [ ] Check slow network behavior.

### June 24, Wednesday - Security Review

- [x] Review CORS settings.
- [x] Review auth token secret.
- [x] Review rate limits.
- [x] Review checkout validation.
- [x] Confirm server does not trust client prices.
- [x] Confirm env secrets are ignored by git.

Notes:

- Confirmed production startup requires `CORS_ORIGIN`, `MONGODB_URI`, and `AUTH_TOKEN_SECRET`.
- Confirmed CORS uses an explicit allow-list in production and keeps local development flexible.
- Added public write endpoint rate limits for checkout, payment verification/failure callbacks, and storefront customer messages.
- Improved rate limit responses with standard limit, remaining, reset, and retry headers.
- Hardened token verification so malformed bearer tokens return `401` instead of risking a server error.
- Disabled Express `X-Powered-By` and confirmed security headers are returned: `X-Content-Type-Options`, `X-Frame-Options`, and `Referrer-Policy`.
- Confirmed checkout uses server-side product prices and stock checks before order creation.
- Confirmed `.env`, local env files, logs, generated build output, and local QA artifacts are ignored by git.
- Added `TRUST_PROXY=true` to `.env.example` for production proxy deployments.
- Backend restarted cleanly and `/api/health` returned `200`.
- Frontend production build passed after the security pass. Existing large frontend chunk warning remains pending under performance cleanup.

### June 25, Thursday - Deployment Setup

- [ ] Choose final frontend host.
- [ ] Choose final backend host.
- [ ] Configure production MongoDB.
- [ ] Configure production env vars.
- [ ] Configure production CORS origin.
- [ ] Confirm deployment commands.

### June 26, Friday - First Staging Deploy

- [ ] Deploy frontend to staging.
- [ ] Deploy backend to staging.
- [ ] Run health check.
- [ ] Test login, map, store, checkout, dashboard on staging.
- [ ] Log all staging issues.

### June 27, Saturday - Fix Staging Issues

- [ ] Fix critical staging bugs.
- [ ] Fix mobile staging bugs.
- [ ] Fix payment staging bugs.
- [ ] Re-run staging checkout tests.

### June 28, Sunday - Razorpay Production Readiness

- [ ] Confirm Razorpay account/business setup.
- [ ] Confirm production key availability.
- [ ] Confirm webhook needs.
- [ ] Confirm payment/refund policy pages.
- [ ] Document test-key to live-key switch steps.

### June 29, Monday - Data and Backup Plan

- [ ] Create database backup/export plan.
- [ ] Confirm seed/demo data strategy.
- [ ] Remove unwanted demo data from production.
- [ ] Confirm admin/vendor test accounts.

### June 30, Tuesday - Final Feature Freeze

- [ ] Stop adding new features unless launch-blocking.
- [ ] Finish all open payment/dashboard/map bugs.
- [ ] Run full manual test pass.
- [ ] Build frontend.
- [ ] Prepare release notes.

### July 1, Wednesday - Full Regression

- [ ] Customer discovery flow.
- [ ] Customer checkout flow.
- [ ] Vendor login flow.
- [ ] Vendor dashboard flow.
- [ ] Store creation flow.
- [ ] Legal/support pages.

### July 2, Thursday - Launch Polish

- [ ] Final copy cleanup.
- [ ] Final image/logo/favicon check.
- [ ] Final responsive check.
- [ ] Final performance check.
- [ ] Final SEO/social metadata check.

### July 3, Friday - Launch Candidate

- [ ] Deploy release candidate.
- [ ] Test production-like env with Razorpay test mode or approved live setup.
- [ ] Check logs.
- [ ] Fix only launch-blocking bugs.
- [ ] Prepare rollback plan.

### July 4, Saturday - Freeze and Smoke Test

- [ ] No new features.
- [ ] Run final smoke test.
- [ ] Confirm production env vars.
- [ ] Confirm domain and SSL.
- [ ] Confirm support contact works.
- [ ] Confirm launch checklist is complete.

### July 5, Sunday - Launch Day

- [ ] Switch to production deployment.
- [ ] Switch Razorpay to live keys only when ready.
- [ ] Run homepage smoke test.
- [ ] Run map smoke test.
- [ ] Run store page smoke test.
- [ ] Run cash checkout smoke test.
- [ ] Run online payment smoke test with approved method.
- [ ] Monitor backend logs.
- [ ] Monitor first vendor/customer issues.

## Daily Closing Checklist

- [x] Update this file with what changed today.
- [x] Run `npm run build` in `client`.
- [x] Check server starts cleanly.
- [x] Check `git status --short`.
- [x] Commit only clean, reviewed work. Skipped commit because the worktree is still dirty and no commit was requested.
- [x] Write tomorrow's first task at the top of the next date.
