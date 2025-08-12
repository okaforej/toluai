module.exports = {
  ci: {
    collect: {
      // Where to run Lighthouse
      url: [
        'http://localhost:5173/',
        'http://localhost:5173/login',
        'http://localhost:5173/dashboard',
        'http://localhost:5173/clients',
        'http://localhost:5173/assessments'
      ],
      // Number of times to run Lighthouse per URL
      numberOfRuns: 3,
      // Lighthouse settings
      settings: {
        preset: 'desktop',
        chromeFlags: '--no-sandbox',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
        },
      },
    },
    assert: {
      // Performance assertions
      assertions: {
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        'categories:pwa': 'off',
        
        // Specific metrics
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 3000 }],
        'first-meaningful-paint': ['warn', { maxNumericValue: 2000 }],
        'speed-index': ['warn', { maxNumericValue: 3000 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        
        // Resource hints
        'uses-rel-preconnect': 'warn',
        'uses-rel-preload': 'off',
        
        // Images
        'uses-optimized-images': 'warn',
        'uses-webp-images': 'warn',
        'uses-responsive-images': 'warn',
        
        // JavaScript
        'unused-javascript': ['warn', { maxLength: 2 }],
        'uses-long-cache-ttl': 'warn',
        'unminified-javascript': 'error',
        
        // Accessibility
        'color-contrast': 'error',
        'heading-order': 'warn',
        'image-alt': 'error',
        'link-name': 'error',
        'meta-viewport': 'error',
        
        // Best practices
        'errors-in-console': 'warn',
        'no-document-write': 'error',
        'geolocation-on-start': 'error',
        'doctype': 'error',
        'no-vulnerable-libraries': 'error',
        
        // SEO
        'document-title': 'error',
        'meta-description': 'warn',
        'http-status-code': 'error',
        'font-size': 'warn',
        'tap-targets': 'warn',
      },
    },
    upload: {
      // Where to upload results
      target: 'temporary-public-storage',
      // GitHub status check
      githubStatusContextSuffix: 'lhci/lighthouse',
    },
    server: {
      // Configuration for LHCI server (if using one)
      // storage: {
      //   storageMethod: 'sql',
      //   sqlDatabasePath: './lhci.db',
      // },
    },
  },
};