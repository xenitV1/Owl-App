#!/bin/bash

# Owl E2E Test Runner Script
# This script runs comprehensive end-to-end tests for the Owl educational social media platform

set -e

echo "🚀 Starting Owl E2E Test Suite"
echo "=================================="

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
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install Node.js and npm."
        exit 1
    fi
    
    if ! command -v npx &> /dev/null; then
        print_error "npx is not available. Please ensure npm is properly installed."
        exit 1
    fi
    
    # Check if Playwright is installed
    if ! npm list @playwright/test &> /dev/null; then
        print_warning "Playwright is not installed. Installing..."
        npm install --save-dev @playwright/test
    fi
    
    print_success "Dependencies check completed"
}

# Setup test environment
setup_test_environment() {
    print_status "Setting up test environment..."
    
    # Install Playwright browsers if not already installed
    if [ ! -d "node_modules/playwright" ]; then
        print_status "Installing Playwright browsers..."
        PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS=true npx playwright install
    fi
    
    # Create test results directory
    mkdir -p test-results
    
    print_success "Test environment setup completed"
}

# Run specific test suite
run_test_suite() {
    local suite_name=$1
    local suite_command=$2
    
    print_status "Running $suite_name test suite..."
    print_status "Command: $suite_command"
    
    # Start the test suite
    if eval $suite_command; then
        print_success "$suite_name test suite passed"
        return 0
    else
        print_error "$suite_name test suite failed"
        return 1
    fi
}

# Run all test suites
run_all_tests() {
    print_status "Running all E2E test suites..."
    
    local failed_suites=()
    
    # Array of test suites to run
    declare -a test_suites=(
        "Authentication:tests/e2e/auth/"
        "Content Management:tests/e2e/content/"
        "Communities:tests/e2e/communities/"
        "Search and Discovery:tests/e2e/discovery/"
        "Performance:tests/e2e/performance/"
    )
    
    # Run each test suite
    for suite in "${test_suites[@]}"; do
        IFS=':' read -r suite_name suite_path <<< "$suite"
        
        if ! run_test_suite "$suite_name" "npx playwright test $suite_path --config=playwright.config.ts"; then
            failed_suites+=("$suite_name")
        fi
        
        # Add a small delay between test suites
        sleep 2
    done
    
    # Report results
    echo ""
    echo "=================================="
    echo "📊 Test Suite Results"
    echo "=================================="
    
    if [ ${#failed_suites[@]} -eq 0 ]; then
        print_success "All test suites passed!"
        return 0
    else
        print_error "The following test suites failed:"
        for suite in "${failed_suites[@]}"; do
            echo "  - $suite"
        done
        return 1
    fi
}

# Generate test report
generate_report() {
    print_status "Generating test report..."
    
    if [ -f "test-results/index.html" ]; then
        print_success "Test report generated: test-results/index.html"
        print_status "Open the report in your browser to view detailed results"
    else
        print_warning "No test report found. Tests may not have generated any results."
    fi
    
    # Check for JSON report
    if [ -f "test-results.json" ]; then
        print_success "JSON test report generated: test-results.json"
    fi
}

# Main execution
main() {
    echo "🦉 Owl Educational Social Media Platform"
    echo "End-to-End Test Suite"
    echo "=================================="
    echo ""
    
    # Parse command line arguments
    local specific_suite=""
    local generate_report_only=false
    local setup_only=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --suite)
                specific_suite="$2"
                shift 2
                ;;
            --report)
                generate_report_only=true
                shift
                ;;
            --setup)
                setup_only=true
                shift
                ;;
            --help|-h)
                echo "Usage: $0 [OPTIONS]"
                echo ""
                echo "Options:"
                echo "  --suite SUITE    Run specific test suite (auth, content, communities, discovery, performance)"
                echo "  --report         Generate test report only"
                echo "  --setup          Setup test environment only"
                echo "  --help, -h       Show this help message"
                echo ""
                echo "Examples:"
                echo "  $0                    Run all test suites"
                echo "  $0 --suite auth       Run authentication tests only"
                echo "  $0 --report           Generate test report"
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
    
    if [ "$setup_only" = true ]; then
        print_success "Test environment setup completed"
        exit 0
    fi
    
    if [ "$generate_report_only" = true ]; then
        generate_report
        exit 0
    fi
    
    # Run tests
    local exit_code=0
    
    if [ -n "$specific_suite" ]; then
        case $specific_suite in
            "auth")
                run_test_suite "Authentication" "npx playwright test tests/e2e/auth/ --config=playwright.config.ts"
                exit_code=$?
                ;;
            "content")
                run_test_suite "Content Management" "npx playwright test tests/e2e/content/ --config=playwright.config.ts"
                exit_code=$?
                ;;
            "communities")
                run_test_suite "Communities" "npx playwright test tests/e2e/communities/ --config=playwright.config.ts"
                exit_code=$?
                ;;
            "discovery")
                run_test_suite "Search and Discovery" "npx playwright test tests/e2e/discovery/ --config=playwright.config.ts"
                exit_code=$?
                ;;
            "performance")
                run_test_suite "Performance" "npx playwright test tests/e2e/performance/ --config=playwright.config.ts"
                exit_code=$?
                ;;
            *)
                print_error "Unknown test suite: $specific_suite"
                echo "Available suites: auth, content, communities, discovery, performance"
                exit 1
                ;;
        esac
    else
        run_all_tests
        exit_code=$?
    fi
    
    # Generate report
    generate_report
    
    # Final status
    echo ""
    echo "=================================="
    if [ $exit_code -eq 0 ]; then
        print_success "🎉 All E2E tests completed successfully!"
        echo "🦉 Owl platform is ready for production!"
    else
        print_error "❌ Some E2E tests failed. Please review the test results."
        echo "🔧 Check the test report for detailed failure information."
    fi
    echo "=================================="
    
    exit $exit_code
}

# Run main function
main "$@"