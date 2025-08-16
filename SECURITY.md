# Security Policy

## Reporting Security Issues

If you find a security vulnerability in Envapt, please help me fix it responsibly.

**Please do NOT open a public GitHub issue for security vulnerabilities.**

Instead, send me a message on Discord `@materwelon` OR email me at: **materwelonDhruv@gmail.com**

I'll do my best to respond to security reports within a week.

## What I Consider Security Issues

- Code injection vulnerabilities
- Unauthorized access to environment variables
- Denial of service attacks
- Information disclosure bugs
- Path traversal issues
- Issues in dependencies (I'll most probably use a different dependency till it's fixed)
- Any other issue that could compromise user data or system security

## What I Don't Consider Security Issues

- Issues that require physical access to a user's machine
- Social engineering attacks
- Missing security headers (this is a library, not a web application)

## Supported Versions

I provide security updates for the latest major version only.

Older versions may receive security updates. But that will be decided based on the severity of the issue and the impact on users.

## After Reporting

1. I'll confirm receipt of your report
2. I'll investigate the issue and determine if it's a security vulnerability
3. If confirmed, I'll work on a fix
4. I'll coordinate disclosure timing with you
5. I'll credit you in the security advisory (unless you prefer to remain anonymous)

## Security Best Practices

When using Envapt:

- Don't commit `.env` files to version control
- Use different environment files for different environments
- Validate environment variables in production
- Keep your dependencies updated
- Use the principle of least privilege for environment variables
- Check out [Security Best Practices for Configs](https://12factor.net/config) for more tips

## Questions?

If you have questions about this security policy or about Envapt's security in general, feel free to open a regular GitHub issue.

---

Thanks for helping keep Envapt secure!
