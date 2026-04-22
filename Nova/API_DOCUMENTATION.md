# Nova Project - API Documentation

This guide explains how the API in this project works and describes each path step-by-step in simple English.

## Overview
The API is the "brain" of the project's backend. It handles user registration, login, profile management, and administrative tasks. 
- **Base URL:** `/api/v1/user`
- **Authentication:** Uses JSON Web Tokens (JWT). When you log in or register, you get a "token" which you must send with future requests to prove who you are.

---

## Step-by-Step API Paths

### 1. User Registration
- **Path:** `POST /register`
- **What it does:** Creates a new account for a user.
- **Required Info:** Full name, email, password, and agreement to terms.
- **Result:** If successful, you are registered and receive a login token.

### 2. User Login
- **Path:** `POST /login`
- **What it does:** Checks your email and password to let you into the system. It works for both regular users and admins.
- **Required Info:** Email and password.
- **Result:** You receive a token and your user details (ID, Name, Email, Role).

### 3. Get My Profile
- **Path:** `GET /me`
- **What it does:** Retrieves the full profile information of the currently logged-in user.
- **Security:** Requires a valid login token.
- **Result:** Returns all data for your account.

### 4. Update Profile
- **Path:** `PUT /profile`
- **What it does:** Allows you to change your personal details like phone number, address, city, etc.
- **Security:** Requires a valid login token.
- **Result:** Updates your information in the database.

### 5. Forgot Password
- **Path:** `POST /forgot-password`
- **What it does:** Starts password reset flow by sending a one-time reset link to the registered email.
- **Required Info:** Email.
- **Security:** Rate limited and always returns a generic success message to avoid user enumeration.

### 6. Reset Password
- **Path:** `POST /reset-password/:token`
- **What it does:** Resets password using the reset token from email.
- **Required Info:** New password, confirm password.
- **Security:** Token is hashed in database and expires in 15 minutes.

---

## Administrative Paths (Restricted)
These paths only work if you are logged in as an **Admin**.

### 7. Get All Users
- **Path:** `GET /admin/users`
- **What it does:** Shows a list of every person registered in the system (both Users and Admins).
- **Extra Feature:** You can search for specific users by name or email using a "search" parameter.

### 8. Change User Role
- **Path:** `PATCH /admin/users/:userId/role`
- **What it does:** Allows an admin to promote a user to an Admin or demote an Admin back to a regular User.
- **Note:** You cannot remove your own admin status.

### 9. Delete User
- **Path:** `DELETE /admin/users/:userId`
- **What it does:** Permanently removes a user or an admin account from the system.
- **Note:** You cannot delete your own account.

---

## How to use these in the Frontend
1. **Send Requests:** Use a tool like `axios` to send data to these paths.
2. **Handle Tokens:** Store the `token` in `localStorage` after login.
3. **Include Headers:** For protected paths (like `/me` or admin paths), include the token in the request header:
   `Authorization: Bearer <your_token>`

---

## Step-by-Step Execution Flow (Seed Root)

To help you understand how the code works "behind the scenes," here is the path a request takes from the moment the server starts until it reaches the database.

### Phase 1: Server Startup
1.  **`Nova/server/server.js`**: This is the starting point. It loads your settings (`.env`), connects to the database (`connectDB`), and starts the server on a port (usually 5000).
2.  **`Nova/server/config/db.js`**: This file handles the actual connection to MongoDB.
3.  **`Nova/server/app.js`**: The server imports this file to set up "Middlewares" (tools that process requests) like CORS (for security) and JSON parsing. It also connects the main API paths.

### Phase 2: When a Request Arrives (e.g., Get Users)
1.  **`app.js`**: Sees the request URL (e.g., `/api/v1/user/admin/users`) and sends it to the correct "Router."
2.  **`Nova/server/routes/authRoutes.js`**: Matches the path to a specific controller function.
3.  **`Nova/server/middlewares/authMiddleware.js`**: Before the request reaches the controller, this "Security Guard" checks if your login token (JWT) is valid.
4.  **`Nova/server/middlewares/roleMiddleware.js`**: If it's an admin path, this guard checks if you actually have Admin permission.
5.  **`Nova/server/controllers/userController.js`**: If everything is okay, this function runs. It decides what to do (e.g., "Find all users").
6.  **`Nova/server/models/User.js`**: The controller uses this "Blueprint" to talk to MongoDB.
7.  **Database (MongoDB)**: The final step. Data is saved or retrieved, and the result is sent all the way back to your browser!

---

## Password Reset Email Configuration
To send reset links directly to user email, configure these in server `.env`:
- `APP_NAME`
- `CLIENT_URL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

---

## Razorpay Payment Gateway

### Required Environment Variables
- `RAZORPAY_KEY_ID` in `server/.env`
- `RAZORPAY_KEY_SECRET` in `server/.env`
- `VITE_RAZORPAY_KEY_ID` in `client/.env`

### Checkout Flow
1. The checkout page creates a pending Razorpay order on the backend.
2. The Razorpay checkout window opens in the browser.
3. On success, the frontend sends the payment signature back to the backend.
4. The backend verifies the signature and marks the order as paid.
5. If the popup is closed or payment fails, the reserved order is cancelled and stock is restored.

### New Order Routes
- `POST /api/v1/orders/razorpay/create`
- `POST /api/v1/orders/razorpay/verify`
- `POST /api/v1/orders/razorpay/cancel`

## Order Confirmation Notifications

After a checkout succeeds, Nova sends an order confirmation email and SMS in the background. It also sends a separate admin alert email containing the full order snapshot and the customer details.

### Email Content
- Thank-you note for the customer
- Order number
- Payment method
- Total amount
- Item summary
- Shipping location when available

### Admin Email Content
- Full order details
- Customer details
- Shipping address
- Line items
- Payment result details when available
- Return request details when available

### Admin Email Recipients
Nova resolves admin recipients from saved admin accounts first, including both `Admin` records and `User` records with the admin role.

You can also use these environment variables as explicit fallback recipients:
- `ADMIN_ORDER_EMAIL`
- `ORDER_NOTIFICATION_EMAIL`
- `ADMIN_EMAIL`

If no admin recipient is found, the order still succeeds and the admin email step is skipped.

## Order Cancellation Notifications

When an order is cancelled, Nova sends the same full-detail email format to both the customer and the admin recipient(s).

### Cancellation Triggers
- Admin updates the order status to `Cancelled`
- Customer cancels a pending Razorpay order before payment is captured
- Customer cancels any order before delivery through the order tracking page

### User Cancellation Route
- `POST /api/v1/orders/:id/cancel`
- Body: `reason`
- Requirement: the order must belong to the logged-in user and must not already be delivered

### Cancellation Email Content
- Full order details
- Customer details
- Shipping address
- Line items
- Payment result details when available
- Return request details when available
- Cancellation reason when provided

The customer email is sent to the order owner, and the admin email is sent to the resolved admin recipient list.

### SMS Content
- Short confirmation message
- Order number
- Total amount
- Item summary

### Required Environment Variables for SMS
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

If the SMS variables are not configured, the order still succeeds and the SMS step is skipped.

## Order Return Requests

Customers can request a return after an order is marked as delivered.

When a customer submits a return request, an email is sent to the admin recipient list only. When an admin approves or rejects the request, an email is sent to the customer only.

### Customer Request
- `POST /api/v1/orders/:id/return-request`
- Body: `reason`
- Requirement: the order must belong to the logged-in user and must already be delivered.

### Return Notifications
- Admin receives the return request with order and customer details
- Customer receives the admin decision with order and return request details

### Admin Review
- `PATCH /api/v1/orders/:id/return-request`
- Body: `status` and optional `adminNote`
- Allowed statuses: `Approved`, `Rejected`, `Completed`

Return requests are stored on the order record so both the profile page and admin order-details page can show the latest return state.