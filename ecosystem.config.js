module.exports = {
  apps: [
    {
      name: "owl-platform",
      script: "server-production.js",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
      },
      env_production: {
        NODE_ENV: "production",
        PORT: 3000,
        HOSTNAME: "0.0.0.0",
      },
      // Auto-restart configuration
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",

      // Logging configuration
      log_file: "./logs/combined.log",
      out_file: "./logs/out.log",
      error_file: "./logs/error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",

      // Time-based logging rotation
      log_rotate: true,
      max_log_size: "10M",
      rotate_interval: "0 0 * * *", // Daily rotation

      // Cluster mode configuration
      instances: "max", // Use all available CPU cores
      exec_mode: "cluster",

      // Health check
      health_check: {
        path: "/health",
        interval: 30000,
        timeout: 5000,
        max_restarts: 5,
        min_uptime: "10s",
      },

      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,

      // Source map support for error tracking
      source_map_support: true,

      // Disable interference with Next.js dev server
      ignore_watch: ["node_modules", ".next", ".git", "logs", "coverage"],

      // Environment-specific settings
      merge_logs: true,

      // Deployment configuration
      deploy: {
        production: {
          user: "deploy",
          host: ["your-server.com"],
          ref: "origin/main",
          repo: "https://github.com/your-username/owl-platform.git",
          path: "/var/www/owl-platform",
          "post-deploy":
            "npm ci --only=production && npm run build && pm2 reload owl-platform --update-env",
          "pre-setup":
            "mkdir -p /var/www/owl-platform /var/backups/owl-platform /var/log/owl-platform",
        },
      },
    },
    {
      name: "category-detection-cron",
      script: "scripts/run-category-detection.js",
      cron_restart: "0 */12 * * *", // Her 12 saatte bir (00:00 ve 12:00)
      autorestart: false,
      watch: false,
      instances: 1,
      exec_mode: "fork",
      log_file: "./logs/category-detection.log",
      out_file: "./logs/category-detection-out.log",
      error_file: "./logs/category-detection-error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      env: {
        NODE_ENV: "production",
      },
    },
    {
      name: "grade-changes-cron",
      script: "scripts/apply-grade-changes.js",
      cron_restart: "0 * * * *", // Her saat başı
      autorestart: false,
      watch: false,
      instances: 1,
      exec_mode: "fork",
      log_file: "./logs/grade-changes.log",
      out_file: "./logs/grade-changes-out.log",
      error_file: "./logs/grade-changes-error.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
