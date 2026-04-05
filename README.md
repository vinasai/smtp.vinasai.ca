# SMTP Middleware - smtp.vinasai.ca

A centralized email delivery middleware developed by **Vinasai Inc** to solve SMTP port restrictions on Digital Ocean servers. Instead of configuring SMTP directly on each service, all applications route email requests through this middleware, which validates API keys and delivers emails via Gmail SMTP.

## Why This Exists

Digital Ocean blocks outgoing SMTP ports (25, 465, 587) by default on their servers. This means services hosted on Digital Ocean cannot send emails directly via SMTP.

**The Solution:**
Rather than requesting port unblocking for each server or using expensive third-party email services per project, Vinasai Inc built this centralized middleware hosted on RackNerd, which has no SMTP restrictions.

```
Service A (DO)  ──┐
Service B (DO)  ──┤──▶  smtp.vinasai.ca  ──▶  Gmail SMTP  ──▶  Recipient
Service C (DO)  ──┘     (RackNerd VPS)
```

Each service authenticates with a unique API key, then passes its own Gmail credentials in the request. The middleware validates the key against MongoDB and forwards the email.

## Architecture

```
smtp-middleware/
├── backend/
│   ├── src/
│   │   ├── server.js                  # Express app entry point
│   │   ├── config/
│   │   │   └── db.js                  # MongoDB connection
│   │   ├── models/
│   │   │   └── project.model.js       # Project + API key schema
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js     # API key validation
│   │   │   └── admin.middleware.js    # JWT admin auth
│   │   ├── controllers/
│   │   │   ├── admin.controller.js    # PIN login
│   │   │   ├── project.controller.js  # Project CRUD
│   │   │   └── mail.controller.js     # Email sending
│   │   ├── routes/
│   │   │   ├── admin.routes.js
│   │   │   ├── project.routes.js
│   │   │   └── mail.routes.js
│   │   └── services/
│   │       └── mail.service.js        # Nodemailer Gmail SMTP
└── frontend/                          # React admin dashboard
    └── src/
        ├── pages/
        │   ├── Login.jsx
        │   └── Dashboard.jsx
        └── api/
            └── api.js
```

## How It Works

### 1. Project Registration

An admin creates a project via the dashboard at `https://smtp.vinasai.ca`. Each project gets a unique auto-generated API key stored in MongoDB.

### 2. API Key Validation

When a DO service sends an email request, it includes its API key in the `x-api-key` header. The middleware looks up the key in MongoDB:

- If not found → `403 Invalid API key`
- If revoked → `403 API key has been revoked`
- If valid → proceeds to send email

### 3. Email Delivery

The service provides its own Gmail address and app password in the request body. The middleware creates a Nodemailer transporter using those credentials and sends via `smtp.gmail.com:465`.

## Admin Dashboard

The dashboard is available at `https://smtp.vinasai.ca` and is restricted to admins only.

### Login

- Authenticated via a PIN number stored in the server `.env` as `ADMIN_PIN`
- On successful login, a JWT token is issued valid for 8 hours

### Features

- **Create projects** — each project gets a unique API key
- **Copy API keys** — one-click copy to clipboard
- **Revoke keys** — instantly block a service from sending emails
- **Regenerate keys** — issue a new key (old key stops working immediately)
- **Delete projects** — permanently remove a project
- **Stats** — view total, active, and revoked project counts

## API Reference

### Send Email

```
POST /api/send-mail
```

**Headers:**
| Header | Required | Description |
|--------|----------|-------------|
| `x-api-key` | ✅ | API key from the dashboard |
| `Content-Type` | ✅ | `application/json` |

**Request Body:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `from` | string | ✅ | Sender Gmail address |
| `appPassword` | string | ✅ | Gmail app password |
| `to` | string | ✅ | Recipient email address |
| `subject` | string | ✅ | Email subject |
| `body` | string | ✅ | HTML email body |
| `replyTo` | string | ❌ | Reply-to email address |
| `attachments` | array | ❌ | File attachments (see below) |

**Attachment Object:**
| Field | Type | Description |
|-------|------|-------------|
| `filename` | string | Original filename (e.g. `resume.pdf`) |
| `content` | string | Base64 encoded file content |
| `encoding` | string | Must be `"base64"` |
| `contentType` | string | MIME type (e.g. `application/pdf`) |

**Success Response `200`:**

```json
{
  "success": true,
  "message": "Email sent successfully",
  "project": "avenue24.ca",
  "messageId": "<abc123@gmail.com>"
}
```

**Error Responses:**
| Status | Message |
|--------|---------|
| `400` | Missing required fields |
| `401` | Missing x-api-key header |
| `403` | Invalid API key |
| `403` | API key has been revoked |
| `500` | Failed to send email |

---

### Admin Login

```
POST /api/admin/login
```

```json
{ "pin": "123456" }
```

Returns a JWT token valid for 8 hours.

### Project Endpoints

All project routes require `Authorization: Bearer <token>` header.

| Method   | Endpoint                       | Description          |
| -------- | ------------------------------ | -------------------- |
| `GET`    | `/api/projects`                | List all projects    |
| `POST`   | `/api/projects`                | Create a new project |
| `PATCH`  | `/api/projects/:id/revoke`     | Revoke API key       |
| `PATCH`  | `/api/projects/:id/regenerate` | Regenerate API key   |
| `DELETE` | `/api/projects/:id`            | Delete a project     |

### Health Check

```
GET /health
```

```json
{ "status": "SMTP middleware running" }
```

## Environment Variables

Create a `.env` file in the `backend/` directory:

```env
PORT=
MONGO_URI=
ADMIN_PIN=your-pin
JWT_SECRET=your-jwt-secret
```

| Variable     | Description                   |
| ------------ | ----------------------------- |
| `PORT`       | Port the server listens on    |
| `MONGO_URI`  | MongoDB connection string     |
| `ADMIN_PIN`  | PIN to login to the dashboard |
| `JWT_SECRET` | Secret for signing JWT tokens |

## Integrating into a Service

### Step 1 — Create a project

Go to `https://smtp.vinasai.ca` → login → create a project → copy the API key.

### Step 2 — Add environment variables

Add to your service's `.env`:

```env
SMTP_MIDDLEWARE_URL=https://smtp.vinasai.ca/api/send-mail
SMTP_MIDDLEWARE_KEY=your-api-key-from-dashboard
EMAIL_USER=yourgmail@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
EMAIL_TO_USER=client@gmail.com
```

### Step 3 — Replace SMTP code

**Node.js (basic)**

```javascript
const axios = require("axios");

await axios.post(
  process.env.SMTP_MIDDLEWARE_URL,
  {
    from: process.env.EMAIL_USER,
    appPassword: process.env.EMAIL_PASS,
    to: process.env.EMAIL_TO_USER,
    subject: "Your subject",
    body: "<p>Your HTML body</p>",
  },
  {
    headers: {
      "x-api-key": process.env.SMTP_MIDDLEWARE_KEY,
      "Content-Type": "application/json",
    },
  },
);
```

**Node.js (with attachments)**

Attachments must be base64 encoded before sending. This is useful for sending files like resumes, invoices, or reports that are already in memory (e.g. from a multer upload).

```javascript
const axios = require("axios");
const fs = require("fs");

// If file is a Buffer (e.g. from multer memoryStorage)
const base64File = fileBuffer.toString("base64");

// If file is on disk
// const base64File = fs.readFileSync("/path/to/file").toString("base64");

await axios.post(
  process.env.SMTP_MIDDLEWARE_URL,
  {
    from: process.env.EMAIL_USER,
    appPassword: process.env.EMAIL_PASS,
    to: process.env.EMAIL_TO_USER,
    subject: "Your subject",
    body: "<p>Your HTML body</p>",
    replyTo: "applicant@example.com",
    attachments: [
      {
        filename: "resume.pdf",
        content: base64File,
        encoding: "base64",
        contentType: "application/pdf",
      },
    ],
  },
  {
    headers: {
      "x-api-key": process.env.SMTP_MIDDLEWARE_KEY,
      "Content-Type": "application/json",
    },
    timeout: 30000, // 30s timeout for large files
  },
);
```

**Next.js (TypeScript)**

```typescript
await fetch(process.env.SMTP_MIDDLEWARE_URL as string, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": process.env.SMTP_MIDDLEWARE_KEY as string,
  },
  body: JSON.stringify({
    from: process.env.EMAIL_USER,
    appPassword: process.env.EMAIL_PASS,
    to: process.env.EMAIL_TO_USER,
    subject: "Your subject",
    body: "<p>Your HTML body</p>",
  }),
});
```

**Python**

```python
import requests
import os

requests.post(
    os.environ["SMTP_MIDDLEWARE_URL"],
    json={
        "from": os.environ["EMAIL_USER"],
        "appPassword": os.environ["EMAIL_PASS"],
        "to": os.environ["EMAIL_TO_USER"],
        "subject": "Your subject",
        "body": "<p>Your HTML body</p>"
    },
    headers={
        "x-api-key": os.environ["SMTP_MIDDLEWARE_KEY"],
        "Content-Type": "application/json"
    }
)
```

**PHP**

```php
$ch = curl_init($_ENV["SMTP_MIDDLEWARE_URL"]);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json",
    "x-api-key: " . $_ENV["SMTP_MIDDLEWARE_KEY"]
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    "from" => $_ENV["EMAIL_USER"],
    "appPassword" => $_ENV["EMAIL_PASS"],
    "to" => $_ENV["EMAIL_TO_USER"],
    "subject" => "Your subject",
    "body" => "<p>Your HTML body</p>"
]));
$response = curl_exec($ch);
curl_close($ch);
```

## Gmail App Password Setup

Each service needs a Gmail app password:

1. Go to [myaccount.google.com](https://myaccount.google.com)
2. Security → Enable **2-Step Verification**
3. Search **"App passwords"**
4. Create one (e.g. name it after your service)
5. Copy the 16-character password
6. Use it as `EMAIL_PASS` — never your regular Gmail password

## Deployment

The middleware is deployed via GitHub Actions on every push to `main`.

The pipeline:

1. Builds the React frontend on the GitHub runner
2. Copies the built `dist/` to the RackNerd server via SCP
3. SSHs into RackNerd, clones the latest code, installs dependencies
4. Writes the `.env` from GitHub environment variables
5. Restarts the app with pm2

**Required GitHub Secrets:**
| Secret | Description |
|--------|-------------|
| `SSH_PRIVATE_KEY` | Private key to SSH into RackNerd |
| `SSH_HOST` | RackNerd server IP |
| `SSH_USER` | SSH username |
| `WORK_DIR` | Deployment path on server |

**Required GitHub Variables:**
| Variable | Description |
|----------|-------------|
| `BACKEND_ENV` | Full contents of `backend/.env` |

## Tech Stack

| Layer           | Technology                |
| --------------- | ------------------------- |
| Backend         | Node.js, Express          |
| Frontend        | React, Vite, Tailwind CSS |
| Database        | MongoDB                   |
| Email           | Nodemailer + Gmail SMTP   |
| Auth            | JWT + PIN                 |
| Process Manager | pm2                       |
| Reverse Proxy   | Nginx                     |
| SSL             | Let's Encrypt (Certbot)   |
| CI/CD           | GitHub Actions            |
| Hosting         | RackNerd VPS              |

_Developed By **Vinasai Inc**_
