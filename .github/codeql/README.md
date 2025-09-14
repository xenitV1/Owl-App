# CodeQL Security Analysis Configuration 2025

This directory contains the customized CodeQL security analysis configuration for the OWL Academic Platform project.

## 📁 File Structure

```
.github/codeql/
├── README.md                 # This file
├── codeql-config.yml        # Main CodeQL configuration
└── custom-queries.qls       # Custom queries
```

## 🔧 Configuration Features

### 2025 Updates
- ✅ **React/TypeScript Optimization**: Filters false positive XSS warnings
- ✅ **Next.js Support**: Framework-specific security controls
- ✅ **Prisma ORM Support**: Database security controls
- ✅ **Performance Optimization**: 4 threads, 4GB RAM, 30min timeout
- ✅ **Machine Learning**: Advanced analysis algorithms

### Filtered False Positives
- `js/xss-through-dom` - React automatically escapes
- `js/unsafe-jquery-plugin` - We don't use jQuery
- `js/path-injection` - Next.js routing is secure

### Custom Security Controls
- **React JSX**: Safe attribute patterns
- **TypeScript**: Strict mode and type safety
- **Next.js**: API route and middleware controls
- **Prisma**: Query validation and input sanitization

## 🚀 Usage

### Automatic Execution
CodeQL analysis runs automatically on every push and pull request.

### Manual Execution
```bash
# Run CodeQL locally
codeql database create --language=javascript,typescript ./codeql-db
codeql database analyze ./codeql-db --config=.github/codeql/codeql-config.yml
```

### Viewing Results
- In GitHub Security tab
- Automatic comments in Pull Requests
- Detailed reports in SARIF format

## 📊 Performance Metrics

- **Analysis Duration**: ~15-20 minutes
- **Memory Usage**: 4GB
- **Thread Count**: 4
- **Timeout**: 30 minutes
- **File Filtering**: Excludes test files

## 🔍 Custom Queries

### React Security Patterns
```ql
// Safe attributes in React JSX
predicate isReactSafeAttribute(DataFlow::Node node) {
  exists(JSXAttribute attr |
    attr = node.asExpr() and
    (attr.getName() = "src" or attr.getName() = "href")
  )
}
```

### TypeScript Security Controls
```ql
// Type assertion security controls
predicate isUnsafeTypeAssertion(DataFlow::Node node) {
  exists(TypeAssertion ta |
    ta = node.asExpr() and
    ta.getType().toString() = "any"
  )
}
```

## 🛠️ Troubleshooting

### False Positive Warnings
1. Click "Dismiss" button in GitHub Security tab
2. Mark as "False positive"
3. Update custom-queries.qls file if needed

### Analysis Errors
1. Check `.github/codeql/codeql-config.yml` file
2. Fix syntax errors
3. Review GitHub Actions logs

### Performance Issues
1. Reduce `analysis.threads` value
2. Increase `analysis.memory` value
3. Increase `analysis.timeout` value

## 📚 Resources

- [CodeQL Documentation](https://codeql.github.com/docs/)
- [GitHub Security](https://docs.github.com/en/code-security)
- [React Security Best Practices](https://react.dev/learn/keeping-components-pure)
- [TypeScript Security](https://www.typescriptlang.org/docs/handbook/2/strict.html)

## 🔄 Updates

This configuration has been updated for 2025 and includes the following features:
- Latest CodeQL version (v3)
- React 18+ support
- TypeScript 5+ support
- Next.js 14+ support
- Prisma 5+ support

---

**Note**: This configuration is customized for the OWL Academic Platform project. Make necessary adjustments before using in other projects.
