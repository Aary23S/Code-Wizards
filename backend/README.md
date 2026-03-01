# 🚀 Code-Wizards Express Backend

Migration from Firebase Cloud Functions to Express.js

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Add Service Account Key

Copy your Firebase service account key as `code-wizards-key.json` in this directory:

```bash
# Get it from Firebase Console → Project Settings → Service Accounts
# Generate New Private Key and save as:
./code-wizards-key.json
```

### 3. Setup Environment Variables

Update `.env` file:

```env
FIREBASE_PROJECT_ID=code-wizards-9e993
GOOGLE_APPLICATION_CREDENTIALS=./code-wizards-key.json
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 4. Start Development Server

```bash
npm run dev
```

Server will start on `http://localhost:3001`

---

## 📁 Project Structure

```
src/
├── index.ts              # Express app entry point
├── config/
│   ├── firebase.ts       # Firebase Admin SDK setup
│   └── adminWhitelist.ts # Admin email configuration
├── middleware/
│   ├── auth.ts           # Firebase token verification
│   └── errorHandler.ts   # Global error handling
├── routes/
│   ├── users.ts          # User registration, profile management
│   ├── posts.ts          # Create/read posts (coming soon)
│   ├── guidance.ts       # Guidance requests (coming soon)
│   ├── alumni.ts         # Alumni dashboard (coming soon)
│   ├── admin.ts          # Admin actions (coming soon)
│   └── safety.ts         # Safety reports (coming soon)
└── utils/
    └── validators.ts     # Zod input validation schemas
```

---

## API Endpoints

### Users

- `POST /api/users/register-student` - Register as student
- `POST /api/users/register-alumni` - Register as alumni
- `GET /api/users/profile` - Get user profile
- `PATCH /api/users/profile` - Update profile
- `GET /api/users/activity` - Get activity history

### Posts _(coming soon)_

- `POST /api/posts` - Create post
- `GET /api/posts` - Get posts
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Like post
- `POST /api/posts/:id/comment` - Comment on post

### Guidance _(coming soon)_

- `POST /api/guidance/request` - Request guidance
- `POST /api/guidance/:id/reply` - Reply to request

### Alumni _(coming soon)_

- `GET /api/alumni/stats` - Get stats

### Admin _(coming soon)_

- `GET /api/admin/dashboard` - Dashboard
- `POST /api/admin/announcements` - Create announcement
- `POST /api/admin/approve-alumni` - Approve alumni

### Safety _(coming soon)_

- `POST /api/safety/report` - Report student

---

## 🔐 Authentication

All protected routes require Firebase ID token:

```typescript
// In request headers:
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

The `verifyFirebaseToken` middleware automatically verifies the token.

---

## 📝 Adding New Routes

1. Create file in `src/routes/`
2. Import auth middleware if needed
3. Export router
4. Import in `src/index.ts` and register route

Example:

```typescript
// src/routes/newfeature.ts
import { Router } from 'express';
import { verifyFirebaseToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

router.post('/', verifyFirebaseToken, async (req: AuthRequest, res, next) => {
    try {
        // Your logic here
        res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

export default router;
```

---

## 🧪 Testing Locally

```bash
# Start backend
npm run dev

# In another terminal, test endpoint:
curl http://localhost:3001/api/health
```

---

## 🚀 Deployment (Railway)

1. Create Railway project
2. Connect GitHub repo
3. Set environment variables in Railway dashboard
4. Deploy: `npm start`

---

## 📌 Notes

- Firestore database remains unchanged
- Firebase Authentication remains unchanged
- This backend replaces only Cloud Functions
- All business logic migrated from TypeScript Functions

---

**Status:** Backend structure created, ready for route completion
