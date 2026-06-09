# SnaflesHub Official

SnaflesHub is a local commerce platform for discovering nearby stores, browsing products, placing manual orders, and helping vendors manage storefronts from a dashboard.

## Features

- Customer landing page and store discovery map
- Public storefront pages with product grids
- Product detail, checkout, and order success flow
- Vendor login and store creation
- Vendor dashboard for products, store profile, sharing, and order management
- Manual cash/UPI-friendly order flow
- English and Punjabi language support
- MongoDB-backed Express API

## Project Structure

```text
snafleshub/
  client/   React + Vite frontend
  server/   Express + MongoDB backend
```

## Requirements

- Node.js 18 or newer
- npm
- MongoDB connection string

## Frontend Setup

```bash
cd client
npm install
npm run dev
```

The frontend runs on:

```text
http://127.0.0.1:5175
```

Optional frontend environment variable:

```text
VITE_API_URL=http://127.0.0.1:5000
```

## Backend Setup

```bash
cd server
npm install
copy .env.example .env
npm start
```

The backend runs on:

```text
http://127.0.0.1:5000
```

Required backend environment variables:

```text
PORT=5000
MONGODB_URI=your_mongodb_connection_string
```

For production, also configure:

```text
AUTH_TOKEN_SECRET=your_secret
CORS_ORIGIN=https://your-frontend-domain.com
NODE_ENV=production
```

## Useful Scripts

Frontend:

```bash
npm run dev
npm run build
npm run preview
```

Backend:

```bash
npm start
npm run dev
npm run seed
```

## Main Routes

Customer:

- `/`
- `/map`
- `/store/:id`
- `/store/:storeId/product/:productId`
- `/store/:storeId/checkout`
- `/store/:storeId/order-success/:orderId`

Vendor:

- `/vendor/login`
- `/vendor/verify`
- `/vendor/create-store`
- `/vendor/dashboard`

Info:

- `/about`
- `/support`
- `/privacy-policy`
- `/terms-of-use`
- `/terms-and-conditions`
- `/vendor-policy`

## Notes

- `.env`, logs, local Mongo data, audit reports, recordings, build output, and dependency folders are intentionally ignored.
- Vendor self-checkout is blocked in both frontend and backend to prevent fake sales from a store owner account.
- Stores appear on the map only when they have valid map coordinates.
