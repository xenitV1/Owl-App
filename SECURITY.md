# 🔐 Security Guidelines

## Environment Variables

### ⚠️ Critical Security Notice
Never commit sensitive information to version control. All secrets should be stored in environment variables.

### Required Environment Variables

1. **Database Credentials**
   ```env
   POSTGRES_PASSWORD=your_secure_random_password
   ```

2. **Authentication Secrets**
   ```env
   NEXTAUTH_SECRET=your_random_32_character_secret
   ```

3. **OAuth Credentials**
   ```env
   GOOGLE_CLIENT_ID=your_google_oauth_client_id
   GOOGLE_CLIENT_SECRET=your_google_oauth_secret
   ```

### Setting Up Environment Variables

1. **Development**
   ```bash
   # Copy the example file
   cp .env.example .env
   
   # Edit with your actual values
   nano .env
   ```

2. **Production (Docker)**
   ```bash
   # Create production environment file
   cp .env.example .env.production
   
   # Edit with production values
   nano .env.production
   
   # Use with docker-compose
   docker-compose --env-file .env.production up
   ```

3. **Deployment Platforms**
   - **Vercel**: Add variables in dashboard
   - **Railway**: Use railway CLI or dashboard
   - **Docker**: Use --env-file flag

### Security Best Practices

#### Password Requirements
- Minimum 16 characters
- Include uppercase, lowercase, numbers, symbols
- Use password generator tools
- Never reuse passwords

#### Secret Management
- Use different secrets for each environment
- Rotate secrets regularly
- Never share secrets via email/chat
- Use secure secret management tools

#### OAuth Setup
1. Create separate OAuth apps for each environment
2. Restrict redirect URLs to your domains only
3. Enable two-factor authentication for OAuth provider accounts
4. Regularly review OAuth permissions

### Common Security Mistakes to Avoid

❌ **DON'T DO THIS:**
```yaml
# docker-compose.yml
environment:
  - DATABASE_URL=postgresql://user:password123@db:5432/mydb
```

✅ **DO THIS:**
```yaml
# docker-compose.yml
environment:
  - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
```

❌ **DON'T DO THIS:**
```env
# .env file committed to git
NEXTAUTH_SECRET=abc123
GOOGLE_CLIENT_SECRET=real_secret_here
```

✅ **DO THIS:**
```env
# .env.example file (safe to commit)
NEXTAUTH_SECRET=your_nextauth_secret_here
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

### Incident Response

If you accidentally commit secrets:

1. **Immediate Action**
   - Change all exposed passwords/secrets immediately
   - Revoke OAuth tokens
   - Check for unauthorized access

2. **Git History Cleanup**
   ```bash
   # Remove sensitive files from git history
   git filter-branch --force --index-filter \
   'git rm --cached --ignore-unmatch .env' \
   HEAD
   
   # Force push (destructive!)
   git push origin --force --all
   ```

3. **Prevention**
   - Review this security guide
   - Set up pre-commit hooks
   - Use secret scanning tools

### Monitoring & Alerts

- Enable failed login monitoring
- Set up alerts for suspicious activity
- Regular security audits
- Keep dependencies updated

## 🔐 Security Policy

### Reporting Security Vulnerabilities

If you discover a security vulnerability in OWL, please report it responsibly:

**📧 Contact:** Send details to [mehmet.apaydin0@gmail.com](mailto:mehmet.apaydin0@gmail.com)

**⏰ Response Time:** We will acknowledge your report within 48 hours and provide a more detailed response within 7 days.

**🔒 Disclosure:** Please do not publicly disclose the vulnerability until we have had time to address it.

### What to Include in Your Report

- **Description:** Clear description of the vulnerability
- **Steps to reproduce:** Detailed reproduction steps
- **Impact:** Potential impact and severity
- **Environment:** Browser, OS, and other relevant details
- **Contact information:** How we can reach you for follow-up

### Security Best Practices for Contributors

When contributing to OWL:

- **Never commit secrets** to the repository
- **Use environment variables** for sensitive configuration
- **Follow secure coding practices** outlined in our guidelines
- **Report security issues** through proper channels, not public issues

### Security Updates

Security updates and patches will be:
- Released as soon as possible after verification
- Documented in release notes
- Communicated through our community channels

Thank you for helping keep OWL secure! 🛡️

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security Guidelines](https://nextjs.org/docs/advanced-features/security-headers)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)
