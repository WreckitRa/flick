# Admin Authentication Setup

## Quick Start

1. **Generate password hash:**

   ```bash
   cd backend
   tsx scripts/generate-password-hash.ts your-secure-password
   ```

2. **Add to your `.env` file:**

   ```env
   ADMIN_PASSWORD_HASH="<generated-hash>"
   JWT_SECRET="your-random-secret-key-here"
   ```

3. **Restart backend:**

   ```bash
   pnpm dev:backend
   ```

4. **Access admin:**
   - Go to `http://localhost:3001`
   - You'll be redirected to `/login`
   - Enter your password

## Security Notes

- Use a strong password
- Keep `JWT_SECRET` secret and random
- Tokens expire after 7 days
- Password is hashed with bcrypt (10 rounds)

## Files Created

- `backend/src/routers/admin.ts` - Login API
- `admin/app/login/page.tsx` - Login UI
- `admin/components/AuthGuard.tsx` - Route protection
- `admin/lib/auth.ts` - Token management

