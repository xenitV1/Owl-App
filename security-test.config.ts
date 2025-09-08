import { defineConfig, devices } from '@playwright/test';

/**
 * Aggressive security testing configuration for admin panel penetration testing
 * This configuration includes advanced security testing scenarios and attack simulation
 */
export default defineConfig({
  testDir: './tests/e2e/admin-security',
  
  // Single worker for security testing to avoid detection
  workers: 1,
  
  // Detailed reporting for security findings
  reporter: [
    ['html', { 
      outputFolder: 'security-test-results/',
      fileName: 'security-report.html'
    }],
    ['json', { 
      outputFile: 'security-test-results/security-findings.json' 
    }],
    ['list'],
    ['dot']
  ],

  use: {
    // Base URL
    baseURL: 'http://localhost:3000',
    
    // Full trace collection for security analysis
    trace: 'on',
    
    // Screenshot on each step for security documentation
    screenshot: 'on',
    
    // Record video for security audit trail
    video: 'on',
    
    // Aggressive HTTP headers for security testing
    extraHTTPHeaders: {
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Cache-Control': 'max-age=0'
    },
    
    // Ignore HTTPS errors for comprehensive testing
    ignoreHTTPSErrors: true,
    
    // Mobile viewport for responsive security testing
    viewport: { width: 375, height: 667 },
    
    // Reduced timeouts for aggressive testing
    actionTimeout: 5000,
    navigationTimeout: 15000,
    
    // User agent rotation for evasion
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  },

  // Configure projects for different attack scenarios
  projects: [
    {
      name: 'attack-simulation-chrome',
      use: { 
        ...devices['Desktop Chrome'],
        // Aggressive launch options for attack simulation
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-blink-features=AutomationControlled',
            '--disable-extensions',
            '--disable-plugins',
            '--disable-images',
            '--disable-javascript-har-promises',
            '--disable-background-timer-throttling',
            '--disable-renderer-backgrounding',
            '--disable-backgrounding-occluded-windows',
            '--disable-client-side-phishing-detection',
            '--disable-crash-reporter',
            '--disable-extensions-except=./plugin',
            '--disable-component-extensions-with-background-pages',
            '--disable-default-apps',
            '--disable-features=TranslateUI',
            '--disable-ipc-flooding-protection',
            '--enable-automation',
            '--password-store=basic',
            '--use-mock-keychain',
            '--single-process'
          ]
        },
        // Context options for stealth
        contextOptions: {
          ignoreHTTPSErrors: true,
          javaScriptEnabled: true,
          bypassCSP: true
        }
      },
    },

    {
      name: 'stealth-attack-firefox',
      use: { 
        ...devices['Desktop Firefox'],
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--disable-gpu',
            '--privacy',
            '--private-window'
          ]
        }
      },
    },

    {
      name: 'mobile-attack-simulation',
      use: { 
        ...devices['iPhone 12'],
        // Mobile attack simulation
        launchOptions: {
          args: [
            '--no-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--disable-gpu'
          ]
        }
      },
    },
  ],

  // Metadata for security testing
  metadata: {
    testType: 'penetration-testing',
    target: 'admin-panel-security',
    priority: 'critical',
    compliance: ['SOC2', 'GDPR', 'KVKK', 'HIPAA'],
    testEnvironment: 'security-testing',
    scanType: 'comprehensive-vulnerability-assessment',
    attackSurface: 'admin-panel',
    testingMethodology: 'owasp-top-10',
    riskLevel: 'high'
  },

  // No retries for security testing (false positives are important)
  retries: 0,

  // Extended timeout for comprehensive security testing
  timeout: 120000,

  // Expect timeout for security assertions
  expect: {
    timeout: 15000,
  },

  // Web server configuration
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 180000,
  },

  // Output directory for security test results
  outputDir: 'security-test-results/',

  // Test match patterns for security tests
  testMatch: [
    '**/admin-security/**/*.spec.ts',
    '**/security-*.spec.ts',
    '**/penetration-*.spec.ts'
  ],

  // Test ignore patterns
  testIgnore: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.next/**',
    '**/production/**'
  ],
});