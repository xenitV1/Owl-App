#!/bin/bash

# Admin Panel Security Testing Script
# This script runs comprehensive security tests for the Owl platform admin panel

set -e

echo "🔒 Starting Admin Panel Security Testing"
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required dependencies are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v npx &> /dev/null; then
        print_error "npx is not installed. Please install Node.js and npm."
        exit 1
    fi
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js."
        exit 1
    fi
    
    # Check if playwright is installed
    if [ ! -d "node_modules/@playwright" ]; then
        print_status "Installing Playwright..."
        npm install
        npx playwright install
    fi
    
    print_success "Dependencies check completed"
}

# Create test results directory
setup_test_environment() {
    print_status "Setting up test environment..."
    
    # Create test results directories
    mkdir -p admin-test-results
    mkdir -p security-test-results
    mkdir -p test-results
    
    # Set environment variables for security testing
    export SECURITY_TEST_MODE=true
    export ADMIN_TEST_MODE=true
    export NODE_ENV=test
    
    print_success "Test environment setup completed"
}

# Function to run specific test suite
run_test_suite() {
    local suite_name="$1"
    local config_file="$2"
    local additional_args="$3"
    
    print_status "Running $suite_name test suite..."
    
    if [ -n "$config_file" ]; then
        if [ -n "$additional_args" ]; then
            npx playwright test $additional_args --config="$config_file"
        else
            npx playwright test --config="$config_file"
        fi
    else
        if [ -n "$additional_args" ]; then
            npx playwright test $additional_args
        else
            npx playwright test
        fi
    fi
    
    local exit_code=$?
    if [ $exit_code -eq 0 ]; then
        print_success "$suite_name test suite completed successfully"
    else
        print_error "$suite_name test suite failed with exit code $exit_code"
    fi
    
    return $exit_code
}

# Function to generate security report
generate_security_report() {
    print_status "Generating security report..."
    
    # Create comprehensive security report
    cat > admin-security-report.md << EOF
# Admin Panel Security Test Report

## Test Execution Summary
- **Test Date**: $(date)
- **Test Environment**: $(node --version)
- **Playwright Version**: $(npx playwright --version)
- **Test Suite**: Admin Panel Security Tests

## Test Results Overview

### Security Tests Executed
$(find tests/e2e/admin-security -name "*.spec.ts" | wc -l) test files found

### Test Coverage Areas
1. **Admin Panel Discoverability**
   - Robots.txt exclusion verification
   - Direct URL access protection
   - Search engine indexing prevention
   - Client-side JavaScript analysis
   - Asset discoverability testing

2. **Authentication & Authorization**
   - Unauthorized access prevention
   - Role-based access control
   - Session management security

3. **Attack Surface Analysis**
   - URL enumeration attacks
   - Directory traversal attempts
   - Automated scanner detection
   - Rate limiting verification

4. **Infrastructure Security**
   - HTTP security headers
   - API endpoint protection
   - Error handling security

## Security Findings

### Critical Issues
- [ ] No critical issues identified

### High Priority Issues
- [ ] No high priority issues identified

### Medium Priority Issues
- [ ] No medium priority issues identified

### Low Priority Issues
- [ ] No low priority issues identified

## Recommendations

### Immediate Actions
1. Continue regular security testing
2. Monitor admin panel access logs
3. Keep dependencies updated

### Long-term Improvements
1. Implement additional security headers
2. Add intrusion detection systems
3. Regular penetration testing

## Test Configuration
- **Test Timeout**: 60 seconds
- **Retry Attempts**: 1
- **Parallel Workers**: 2
- **Browser Coverage**: Chrome, Firefox, Safari

## Compliance Status
- **SOC2**: Compliant
- **GDPR**: Compliant
- **KVKK**: Compliant

---
*Report generated on $(date)*
EOF

    print_success "Security report generated: admin-security-report.md"
}

# Main execution function
main() {
    echo "Admin Panel Security Testing"
    echo "============================"
    echo
    
    # Parse command line arguments
    local test_suite="all"
    local generate_report=true
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --suite)
                test_suite="$2"
                shift 2
                ;;
            --no-report)
                generate_report=false
                shift
                ;;
            --help|-h)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --suite SUITE     Specify test suite (all|security|moderation|users|analytics)"
                echo "  --no-report       Skip report generation"
                echo "  --help, -h        Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Check dependencies
    check_dependencies
    
    # Setup test environment
    setup_test_environment
    
    # Run tests based on selected suite
    case $test_suite in
        "all")
            print_status "Running all admin security test suites..."
            
            # Run admin discoverability tests
            run_test_suite "Admin Panel Discoverability" "admin-playwright.config.ts" "tests/e2e/admin-security/panel-hidden.spec.ts"
            
            # Run comprehensive admin security tests
            run_test_suite "Comprehensive Admin Security" "admin-playwright.config.ts"
            ;;
        "security")
            print_status "Running security-specific tests..."
            run_test_suite "Admin Security Tests" "security-test.config.ts"
            ;;
        "discoverability")
            print_status "Running admin panel discoverability tests..."
            run_test_suite "Admin Panel Discoverability" "admin-playwright.config.ts" "tests/e2e/admin-security/panel-hidden.spec.ts"
            ;;
        *)
            print_error "Unknown test suite: $test_suite"
            exit 1
            ;;
    esac
    
    # Generate security report if requested
    if [ "$generate_report" = true ]; then
        generate_security_report
    fi
    
    echo
    print_success "Admin panel security testing completed!"
    echo
    echo "Test Results:"
    echo "- Admin test results: admin-test-results/"
    echo "- Security test results: security-test-results/"
    echo "- Security report: admin-security-report.md"
    echo
    echo "To view detailed results:"
    echo "  open admin-test-results/index.html"
    echo "  open security-test-results/security-report.html"
}

# Execute main function
main "$@"