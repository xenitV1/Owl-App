# 🤝 Contributing to OWL

Thank you for your interest in contributing to OWL! We welcome contributions from the community to help make OWL better for everyone.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Reporting Issues](#reporting-issues)
- [Pull Request Process](#pull-request-process)
- [Development Guidelines](#development-guidelines)

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

- **Node.js 18+** or **Bun**
- **Git**
- Basic knowledge of:
  - TypeScript/JavaScript
  - React/Next.js
  - Database concepts (Prisma/SQLite)

### Quick Setup

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/owl.git

   # For the official repository (if you're not forking):
   # git clone https://github.com/xenitV1/OWL.git
   cd owl
   ```
3. **Install dependencies**:
   ```bash
   bun install
   ```
4. **Set up environment**:
   ```bash
   cp .env.example .env.local
   # Configure your environment variables
   ```
5. **Set up database**:
   ```bash
   bun run db:push
   bun run db:generate
   ```
6. **Start development**:
   ```bash
   bun run dev
   ```

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
```

### Database Setup

```bash
# Push schema to database
bun run db:push

# Generate Prisma client
bun run db:generate

# Reset database (if needed)
bun run db:reset
```

### Running Tests

```bash
# Run all tests
bun run test

# Run specific test file
bun run test -- src/components/MyComponent.test.ts
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
   bun run lint
   ```
4. **Test your changes**:
   ```bash
   bun run build
   bun run test
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

Thank you for contributing to OWL! Your efforts help make educational technology more accessible and effective for students worldwide. 🚀
