# Development Workflow

## 🚀 Environment Setup

### Production Environment
- **URL**: https://www.superfocus.live
- **Branch**: `main`
- **Users**: Real users with real data
- **Purpose**: Live application for end users

### Development Environment
- **URL**: https://superfocus-dev.vercel.app
- **Branch**: `develop`
- **Users**: Test users only
- **Purpose**: Testing new features before production

## 🔧 Development Workflow

### 1. Working on Features
```bash
# Switch to development branch
git checkout develop

# Make your changes
# ... edit files ...

# Test locally
npm run dev  # if you have a local dev server
```

### 2. Deploy to Development
```bash
# Deploy to development environment
node scripts/deploy.js dev

# Or manually:
git add .
git commit -m "Feature: your feature description"
git push origin develop
```

### 3. Test in Development Environment
- Visit https://superfocus-dev.vercel.app
- Test all functionality
- Verify no breaking changes
- Check with test users

### 4. Deploy to Production
```bash
# Only after thorough testing in dev
node scripts/deploy.js prod

# Or manually:
git checkout main
git merge develop
git push origin main
```

## 📋 Pre-Production Checklist

Before deploying to production, ensure:

- [ ] All features tested in development environment
- [ ] No breaking changes to existing functionality
- [ ] Database migrations (if any) are safe
- [ ] Environment variables are properly configured
- [ ] No console.log statements in production code
- [ ] Performance impact is acceptable
- [ ] User data integrity is maintained

## 🔒 Environment Variables

### Development
- Uses development Stripe keys (if different)
- Development Clerk configuration
- Test email addresses

### Production
- Production Stripe keys
- Production Clerk configuration
- Real user emails

## 🚨 Emergency Rollback

If production deployment causes issues:

```bash
# Revert to previous commit
git checkout main
git reset --hard HEAD~1
git push origin main --force
```

## 📊 Monitoring

### Development
- Check Vercel logs for development branch
- Monitor development environment performance

### Production
- Monitor real user feedback
- Check error rates in Vercel
- Monitor Stripe webhook success rates

## 🎯 Best Practices

1. **Always test in development first**
2. **Never push directly to main branch**
3. **Use descriptive commit messages**
4. **Keep development and production in sync**
5. **Document breaking changes**
6. **Test with real user scenarios**

## 🔄 Branch Strategy

```
main (production)
  ↑
develop (development)
  ↑
feature/your-feature (optional)
```

- `main`: Production-ready code
- `develop`: Development and testing
- `feature/*`: Individual features (optional)
