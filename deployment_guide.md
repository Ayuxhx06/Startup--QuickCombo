# QuickCombo Deployment Guide (24/7 Free Hosting)

Follow these steps to get your project live forever without cold starts.

## 1. Database (Neon.tech)
1. Go to [Neon.tech](https://neon.tech/) and create a free account.
2. Create a new project.
3. Copy the **Connection String** from the dashboard. It starts with `postgres://...`
4. This will be your `DATABASE_URL`.

## 2. Backend (Koyeb.com)
1. Go to [Koyeb.com](https://www.koyeb.com/) and create a free account.
2. Click **Create Service** -> **GitHub**.
3. Select your repository: `Startup--QuickCombo`.
4. **Choose Instance Type:** Select **"Free"** (Washington D.C. or Frankfurt).
5. **Environment Variables:** Add the following:
   - `DATABASE_URL`: (The string you copied from Neon)
   - `SECRET_KEY`: (A random long string)
   - `DEBUG`: `False`
   - `ALLOWED_HOSTS`: `*`
   - `BREVO_API_KEY`: (Your Brevo key)
   - `CORS_ALLOWED_ORIGINS`: `https://your-vercel-domain.vercel.app` (Add this later)
6. Click **Deploy**.

## 3. Frontend (Vercel.com)
1. Go to [Vercel.com](https://vercel.com/) and connect your GitHub.
2. Select the `frontend` directory as the root.
3. **Environment Variables:** Add:
   - `NEXT_PUBLIC_API_URL`: (Your Koyeb service URL, e.g. `https://xxx.koyeb.app`)
   - `NEXT_PUBLIC_UPI_ID`: `ayushtomar061004-1@okaxis`
   - `NEXT_PUBLIC_UPI_NAME`: `Ayush Tomar`
4. Click **Deploy**.

---

### Post-Deployment: Seeding Data
Once the backend is live on Koyeb:
1. Go to the **Console** tab in your Koyeb service.
2. Run: `python manage.py migrate`
3. Run: `python manage.py shell -c "import seed_disco; seed_disco.seed_disco()"`
4. Run: `python manage.py shell -c "import fix_categories; fix_categories.fix_categories()"`

Now your app is live and synced!
