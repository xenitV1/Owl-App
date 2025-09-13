# 🤝 Contributing to OWL - Academic Social Learning Platform

Thank you for your interest in contributing to OWL! We welcome contributions from the community to help make this academic social learning platform better for students, teachers, and academics worldwide.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Reporting Issues](#reporting-issues)
- [Pull Request Process](#pull-request-process)
- [Development Guidelines](#development-guidelines)
- [Project Architecture](#project-architecture)
- [Security Guidelines](#security-guidelines)

## 🤝 Code of Conduct

This project follows a code of conduct to ensure a welcoming environment for all contributors. By participating, you agree to:

- Be respectful and inclusive
- Focus on constructive feedback
- Accept responsibility for mistakes
- Show empathy towards other contributors
- Help create a positive community

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** and **npm**
- **Git**
- Basic knowledge of:
  - TypeScript/JavaScript
  - React/Next.js 15
  - Database concepts (Prisma/SQLite)
  - Tailwind CSS
  - Modern web development practices

### Quick Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/OWL.git
   cd OWL
   ```
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Set up environment**:
   ```bash
   cp .env.example .env.local
   # Configure your environment variables (see Environment Variables section)
   ```
5. **Set up database**:
   ```bash
   npm run db:push
   npm run db:generate
   ```
6. **Start development server**:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000`

## 🛠️ Development Setup

### Environment Variables

Create a `.env.local` file with the required variables (see `.env.example` for template):

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Firebase (Optional - for file storage and real-time features)
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_PRIVATE_KEY="your-private-key"
FIREBASE_CLIENT_EMAIL="your-client-email"

# Development
NODE_ENV="development"
```

### Database Setup

```bash
# Push schema to database
npm run db:push

# Generate Prisma client
npm run db:generate

# Reset database (if needed)
npm run db:reset
```

### Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:push      # Push schema to database
npm run db:generate  # Generate Prisma client
npm run db:migrate   # Create migration
npm run db:reset     # Reset database

# Testing (E2E setup)
npm run test:e2e:setup-data   # Set up test data
npm run test:e2e:cleanup-data # Clean up test data
npm run test:e2e:reset-db     # Reset test database
```

## 💡 How to Contribute

### Types of Contributions

We welcome various types of contributions:

- 🐛 **Bug fixes** - Fix existing issues
- ✨ **New features** - Add new functionality
- 📚 **Documentation** - Improve docs or add examples
- 🎨 **UI/UX improvements** - Enhance user interface
- 🔧 **Performance optimizations** - Improve performance
- 🌐 **Internationalization** - Add new languages
- 🧪 **Tests** - Add or improve test coverage

### Finding Issues to Work On

1. Check our [GitHub Issues](https://github.com/xenitV1/OWL/issues)
2. Look for issues labeled:
   - `good first issue` - Great for beginners
   - `help wanted` - High priority items
   - `enhancement` - Feature requests
   - `bug` - Bug fixes needed

### Development Workflow

1. **Choose an issue** or create your own
2. **Create a branch** for your work:
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/issue-number-description
   ```
3. **Make your changes**
4. **Test your changes** thoroughly
5. **Commit your changes**:
   ```bash
   git commit -m "feat: add new feature description"
   ```
6. **Push to your fork**:
   ```bash
   git push origin your-branch-name
   ```
7. **Create a Pull Request**

## 🐛 Reporting Issues

### Bug Reports

When reporting bugs, please include:

- **Clear title** describing the issue
- **Steps to reproduce** the bug
- **Expected behavior**
- **Actual behavior**
- **Screenshots** if applicable
- **Environment info**:
  - Browser and version
  - Operating system
  - Node.js version
  - Any other relevant details

### Feature Requests

For feature requests, please include:

- **Clear description** of the feature
- **Use case** - why is this needed?
- **Implementation ideas** if you have any
- **Mockups** or examples if applicable

## 🔄 Pull Request Process

### Before Submitting

1. **Update documentation** if needed
2. **Add tests** for new features
3. **Ensure code passes linting**:
   ```bash
   npm run lint
   ```
4. **Test your changes**:
   ```bash
   npm run build
   # Note: Currently using E2E test setup scripts
   ```

### PR Template

Please use this template for your pull requests:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Performance improvement

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots to show visual changes

## Additional Notes
Any additional information or context
```

### Review Process

1. **Automated checks** will run first
2. **Code review** by maintainers
3. **Testing** and validation
4. **Approval** and merge

## 📝 Development Guidelines

### Code Style

- Use **TypeScript** for all new code
- Follow **ESLint** rules
- Use **Prettier** for code formatting
- Write **meaningful commit messages**

### Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Tests
- `chore`: Maintenance

### Naming Conventions

- **Components**: PascalCase (`UserProfile.tsx`)
- **Files**: kebab-case (`user-profile.ts`)
- **Functions**: camelCase (`getUserData`)
- **Constants**: SCREAMING_SNAKE_CASE (`API_BASE_URL`)

### Testing Guidelines

- Write tests for new features
- Aim for good test coverage
- Use descriptive test names
- Test both success and error cases

### Documentation

- Update README for significant changes
- Add JSDoc comments for complex functions
- Keep API documentation current
- Add examples for new features

## 🎯 Areas for Contribution

### High Priority

- **Bug fixes** and stability improvements
- **Performance optimizations**
- **Accessibility improvements**
- **Mobile responsiveness**

### Medium Priority

- **New features** from the roadmap
- **UI/UX enhancements**
- **Additional language support**
- **Documentation improvements**

### Good for Beginners

- **UI component improvements**
- **Documentation updates**
- **Simple bug fixes**
- **Test coverage improvements**

## 📞 Getting Help

If you need help:

1. **Check existing issues** and documentation
2. **Ask in discussions** for general questions
3. **Create an issue** for specific problems
4. **Join our community** chat (if available)

## 🙏 Recognition

Contributors will be:
- Listed in repository contributors
- Mentioned in release notes
- Recognized in our community
- Eligible for special mentions

---

## 🏗️ Project Architecture

### Tech Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS 4
- **Backend**: Next.js API Routes, Prisma ORM, SQLite
- **Authentication**: NextAuth.js with Google OAuth
- **Real-time**: Socket.io for live notifications
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: Zustand, React Query
- **File Storage**: Firebase (optional)
- **Security**: DOMPurify for HTML sanitization, Zod for validation

### Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── [locale]/          # Internationalized routes (en, tr)
│   │   ├── admin/         # Admin dashboard
│   │   ├── communities/   # Community features
│   │   ├── moderation/    # Moderation tools
│   │   ├── posts/         # Content creation
│   │   └── ...           # Other pages
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication
│   │   ├── admin/         # Admin APIs
│   │   ├── communities/   # Community management
│   │   ├── posts/         # Content management
│   │   └── ...           # Other APIs
│   └── landing/           # Landing page
├── components/            # React components
│   ├── admin/            # Admin components
│   ├── auth/             # Authentication components
│   ├── communities/      # Community components
│   ├── content/          # Content components
│   ├── moderation/       # Moderation components
│   ├── ui/               # shadcn/ui components
│   └── work-environment/ # Workspace components
├── contexts/             # React contexts
├── hooks/                # Custom hooks
├── lib/                  # Utility functions
│   ├── auth.ts          # Authentication utilities
│   ├── db.ts            # Database utilities
│   ├── validation.ts    # Input validation & sanitization
│   └── ...              # Other utilities
├── messages/             # Internationalization files
└── types/                # TypeScript definitions
```

### Key Features
- **Academic Content Sharing**: Study materials, notes, exam prep
- **Social Learning**: Communities, groups, following system
- **Advanced Moderation**: Content filtering, reporting, appeals
- **Real-time Features**: Notifications, live updates
- **Admin Dashboard**: User management, analytics, moderation
- **Internationalization**: English and Turkish support

## 🔒 Security Guidelines

### Security-First Development
OWL handles sensitive academic and user data. All contributions must follow security best practices:

#### Input Validation & Sanitization
- **Use Zod schemas** for all API input validation
- **HTML sanitization** with DOMPurify (already implemented)
- **SQL injection prevention** through Prisma ORM
- **XSS protection** with React's built-in protections

#### Authentication & Authorization
- **NextAuth.js** for secure authentication
- **Role-based access control** (Student, Teacher, Academician, Admin)
- **Two-factor authentication** support
- **Session management** with secure cookies

#### Data Protection
- **Environment variables** for sensitive configuration
- **Database encryption** for sensitive data
- **Content filtering** for inappropriate content
- **Privacy controls** for user data

#### Security Checklist
Before submitting any code:
- [ ] Input validation with Zod schemas
- [ ] No hardcoded secrets or credentials
- [ ] Proper error handling without information leakage
- [ ] SQL injection prevention (use Prisma queries)
- [ ] XSS protection (sanitize user input)
- [ ] CSRF protection (NextAuth.js handles this)
- [ ] Rate limiting on API endpoints
- [ ] Secure file upload handling

#### Reporting Security Issues
If you discover a security vulnerability:
1. **DO NOT** create a public issue
2. **DO NOT** discuss it in public channels
3. Contact maintainers privately
4. Provide detailed reproduction steps
5. Allow time for fix before public disclosure

### Code Security Standards
- All user input must be validated and sanitized
- Database queries must use Prisma ORM (no raw SQL)
- API routes must implement proper authentication checks
- File uploads must be validated and scanned
- Environment variables must be used for all secrets

---

Thank you for contributing to OWL! Your efforts help make educational technology more accessible and effective for students worldwide. 🚀
