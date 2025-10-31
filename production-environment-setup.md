# 🌐 Production Environment Setup Guide

## 1. Supabase Production Setup

### 1.1 Create Production Project
1. **Go to [Supabase Dashboard](https://supabase.com/dashboard)**
2. **Click "New Project"**
3. **Choose organization** and enter project details:
   - **Name:** `dagmal-production`
   - **Database Password:** Generate a strong password (save it!)
   - **Region:** Choose closest to your users (e.g., `eu-west-1` for Europe)
4. **Click "Create new project"**
5. **Wait for setup to complete** (2-3 minutes)

### 1.2 Run Database Setup
1. **Go to SQL Editor** in your new project
2. **Copy and paste** the contents of `production-database-setup.sql`
3. **Click "Run"** to execute the script
4. **Verify** all tables and indexes are created successfully

### 1.3 Configure Authentication
1. **Go to Authentication > Settings**
2. **Configure Site URL:** `https://yourdomain.com`
3. **Add Redirect URLs:**
   - `https://yourdomain.com/auth/callback`
   - `https://yourdomain.com/auth/signup`
   - `https://yourdomain.com/auth/reset-password`
4. **Enable Email Confirmations:** ✅
5. **Enable Phone Confirmations:** ✅ (if needed)

### 1.4 Set up Storage
1. **Go to Storage**
2. **Create bucket:** `restaurant-images`
3. **Set policies:**
   - **Public access** for viewing images
   - **Authenticated users** can upload
4. **Create bucket:** `menu-pdfs` (if needed)

## 2. Environment Variables

### 2.1 Create `.env.production` file
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App Configuration
VITE_APP_NAME=Dagmal
VITE_APP_URL=https://yourdomain.com
VITE_APP_ENV=production

# Email Configuration (if using custom SMTP)
VITE_SMTP_HOST=smtp.your-provider.com
VITE_SMTP_PORT=587
VITE_SMTP_USER=your-email@domain.com
VITE_SMTP_PASS=your-email-password

# Analytics (optional)
VITE_GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID
VITE_SENTRY_DSN=your-sentry-dsn

# Admin Configuration
VITE_ADMIN_EMAIL=admin@yourdomain.com
VITE_SUPPORT_EMAIL=support@yourdomain.com
```

### 2.2 Get Supabase Keys
1. **Go to Settings > API** in your Supabase project
2. **Copy the following:**
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

## 3. Domain and SSL Setup

### 3.1 Choose Domain
- **Primary domain:** `dagmal.no` (or your chosen domain)
- **Subdomain:** `app.dagmal.no` (optional)
- **Admin subdomain:** `admin.dagmal.no` (optional)

### 3.2 DNS Configuration
```
# A Records
@                    A    your-server-ip
www                  A    your-server-ip
app                  A    your-server-ip
admin                A    your-server-ip

# CNAME Records (if using CDN)
cdn                  CNAME your-cdn-domain.com
```

### 3.3 SSL Certificate
- **Use Let's Encrypt** (free) or your hosting provider's SSL
- **Ensure HTTPS** is enforced
- **Set up HSTS** headers for security

## 4. Hosting Platform Setup

### 4.1 Vercel (Recommended)
1. **Connect GitHub repository**
2. **Set environment variables** in Vercel dashboard
3. **Configure build settings:**
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
4. **Set up custom domain**
5. **Enable automatic deployments**

### 4.2 Netlify (Alternative)
1. **Connect GitHub repository**
2. **Set environment variables**
3. **Configure build settings:**
   - **Build Command:** `npm run build`
   - **Publish Directory:** `dist`
4. **Set up custom domain**
5. **Enable form handling** (if needed)

### 4.3 Self-Hosted (Advanced)
1. **Set up VPS** (DigitalOcean, AWS, etc.)
2. **Install Node.js** and PM2
3. **Set up Nginx** as reverse proxy
4. **Configure SSL** with Let's Encrypt
5. **Set up monitoring** and backups

## 5. CDN Configuration

### 5.1 Cloudflare (Recommended)
1. **Add your domain** to Cloudflare
2. **Update nameservers** in your domain registrar
3. **Enable features:**
   - **Auto Minify:** CSS, HTML, JS
   - **Brotli Compression:** ✅
   - **Browser Cache TTL:** 1 month
   - **Always Use HTTPS:** ✅
4. **Set up Page Rules** for caching

### 5.2 AWS CloudFront (Alternative)
1. **Create CloudFront distribution**
2. **Set origin** to your hosting platform
3. **Configure caching behaviors**
4. **Set up custom error pages**

## 6. Database Optimization

### 6.1 Connection Pooling
- **Enable PgBouncer** in Supabase
- **Set connection limits** appropriately
- **Monitor connection usage**

### 6.2 Query Optimization
- **Add database indexes** (already in setup script)
- **Enable query logging** for monitoring
- **Set up slow query alerts**

### 6.3 Backup Strategy
- **Enable Point-in-Time Recovery** in Supabase
- **Set up automated backups**
- **Test restore procedures** regularly

## 7. Security Configuration

### 7.1 API Security
- **Enable RLS** (Row Level Security) ✅
- **Set up API rate limiting**
- **Configure CORS** properly
- **Use HTTPS** everywhere

### 7.2 Authentication Security
- **Enable email verification** ✅
- **Set strong password requirements**
- **Enable 2FA** (if needed)
- **Set up session management**

### 7.3 File Upload Security
- **Validate file types** and sizes
- **Scan uploads** for malware
- **Use secure file storage**
- **Set up access controls**

## 8. Monitoring Setup

### 8.1 Application Monitoring
- **Set up Sentry** for error tracking
- **Configure alerts** for critical errors
- **Monitor performance** metrics
- **Set up uptime monitoring**

### 8.2 Database Monitoring
- **Monitor query performance**
- **Set up slow query alerts**
- **Track connection usage**
- **Monitor storage usage**

## 9. Testing Checklist

### 9.1 Pre-Deployment Tests
- [ ] **All database migrations** run successfully
- [ ] **Environment variables** are set correctly
- [ ] **Authentication** works in production
- [ ] **File uploads** work properly
- [ ] **Email notifications** are sent
- [ ] **SSL certificate** is valid
- [ ] **CDN** is serving content correctly

### 9.2 Post-Deployment Tests
- [ ] **User registration** works
- [ ] **Restaurant registration** works
- [ ] **Deal claiming** works
- [ ] **Notifications** are sent
- [ ] **Admin panel** is accessible
- [ ] **Mobile responsiveness** is correct
- [ ] **Performance** is acceptable

## 10. Rollback Plan

### 10.1 Database Rollback
- **Keep backup** of previous schema
- **Document all migrations** with timestamps
- **Test rollback procedures** in staging

### 10.2 Application Rollback
- **Keep previous deployment** ready
- **Set up blue-green deployment**
- **Test rollback** procedures

### 10.3 Emergency Contacts
- **Database admin:** [contact info]
- **DevOps engineer:** [contact info]
- **Hosting support:** [contact info]

---

## 🚀 Next Steps

1. **Run the database setup script** in your production Supabase
2. **Set up your hosting platform** (Vercel/Netlify)
3. **Configure your domain** and SSL
4. **Set up monitoring** and alerts
5. **Test everything** thoroughly before going live

## 📞 Support

If you encounter any issues during setup:
1. **Check Supabase documentation**
2. **Review hosting platform guides**
3. **Test in staging environment first**
4. **Keep backups** of all configurations





