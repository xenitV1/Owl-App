/* eslint-disable @typescript-eslint/no-require-imports */
const https = require("https");
const fs = require("fs");

/**
 * Advanced Copyright Violation Checker
 * Daily automated checks for code theft and license violations
 */

const PROJECT_NAME = "Owl-App";
const YOUR_USERNAME = "xenitV1";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // Optional: Better rate limits

// HIGHLY SPECIFIC identifiers - unique to your project
const UNIQUE_STRINGS = [
  // Project-specific unique names
  '"Owl Educational Social Platform"',
  "xenitV1/Owl-App", // Your specific repo reference

  // Your specific component combinations (unlikely to exist elsewhere)
  "RssFeedCard work-environment",
  "useWorkspaceStore addCard removeCard",
  "RetroThemeDemo FontSizeContext",

  // Your specific utility combinations
  "richNoteManager contentCleaner rssThumbnails",
  "pickThumbnail extractFirstImageFromHtml",
  "cleanRssContent sanitize-html DOMPurify",

  // Your specific file structure patterns
  "src/components/work-environment/RssFeedCard",
  "src/hooks/useWorkspaceStore",
  "src/lib/rssThumbnails",

  // Your specific function signatures with implementation
  'extractYouTubeVideoId "youtu.be" "youtube.com/watch"',
  'extractSpotifyEmbedUrl "open.spotify.com/embed"',
];

// Minimum stars for HIGH confidence (reduced false positives)
const HIGH_CONFIDENCE_STARS = 50;

async function searchGitHub(query) {
  return new Promise((resolve, reject) => {
    const headers = {
      "User-Agent": "Copyright-Checker",
      Accept: "application/vnd.github.v3+json",
    };

    // Use token for better rate limits (60 -> 5000 requests/hour)
    if (GITHUB_TOKEN) {
      headers.Authorization = `token ${GITHUB_TOKEN}`;
    }

    const options = {
      hostname: "api.github.com",
      path: `/search/code?q=${encodeURIComponent(query)}&per_page=10`,
      headers,
    };

    https
      .get(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            const parsed = JSON.parse(data);
            // Check rate limit
            if (res.headers["x-ratelimit-remaining"]) {
              console.log(
                `   Rate limit remaining: ${res.headers["x-ratelimit-remaining"]}`,
              );
            }
            resolve(parsed);
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

function generateReport(violations) {
  const timestamp = new Date().toISOString();
  const report = {
    timestamp,
    totalViolations: violations.length,
    violations,
    summary: {
      uniqueRepositories: [...new Set(violations.map((v) => v.repository))]
        .length,
      criticalViolations: violations.filter((v) => v.confidence === "HIGH")
        .length,
    },
  };

  // Save report
  const reportPath = `security-reports/copyright-report-${Date.now()}.json`;
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  return report;
}

async function checkCopyright() {
  console.log("🔍 Advanced Copyright Violation Check\n");
  console.log(`📅 Date: ${new Date().toLocaleString()}`);
  console.log(`👤 Checking for: ${YOUR_USERNAME}/${PROJECT_NAME}\n`);

  const violations = [];
  const allSearchTerms = UNIQUE_STRINGS;

  for (let i = 0; i < allSearchTerms.length; i++) {
    const searchTerm = allSearchTerms[i];
    try {
      console.log(
        `[${i + 1}/${allSearchTerms.length}] Searching for: "${searchTerm}"`,
      );

      const results = await searchGitHub(
        `${searchTerm} -user:${YOUR_USERNAME} -repo:${YOUR_USERNAME}/${PROJECT_NAME}`,
      );

      if (results.total_count > 0) {
        console.log(`⚠️  Found ${results.total_count} potential matches:`);

        results.items?.slice(0, 10).forEach((item) => {
          const stars = item.repository.stargazers_count || 0;

          // Determine confidence level
          let confidence = "LOW";
          if (stars >= HIGH_CONFIDENCE_STARS) {
            confidence = "HIGH";
          } else if (stars >= 10) {
            confidence = "MEDIUM";
          }

          // Skip LOW confidence to reduce false positives
          if (confidence === "LOW") {
            return;
          }

          const violation = {
            searchTerm,
            repository: item.repository.full_name,
            url: item.html_url,
            path: item.path,
            stars,
            lastUpdate: item.repository.updated_at,
            confidence,
            language: item.repository.language,
          };

          violations.push(violation);

          console.log(
            `   ${violation.confidence === "HIGH" ? "🚨" : "⚠️"} ${item.repository.full_name}`,
          );
          console.log(`      File: ${item.path}`);
          console.log(`      Stars: ⭐ ${item.repository.stargazers_count}`);
          console.log(`      URL: ${item.html_url}`);
        });
      } else {
        console.log(`   ✅ No violations found`);
      }
      console.log("");

      // Rate limit: 10 requests per minute for unauthenticated, 30/min with token
      const delay = GITHUB_TOKEN ? 2000 : 6000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 SUMMARY REPORT");
  console.log("=".repeat(60) + "\n");

  if (violations.length === 0) {
    console.log("✅ No copyright violations detected!");
    console.log("🛡️  Your code appears to be safe.\n");
  } else {
    console.log(`⚠️  Total potential violations: ${violations.length}`);
    console.log(
      `🚨 Critical (HIGH confidence): ${violations.filter((v) => v.confidence === "HIGH").length}`,
    );
    console.log(
      `📁 Unique repositories: ${[...new Set(violations.map((v) => v.repository))].length}\n`,
    );

    console.log("🔝 Top violators by stars:");
    violations
      .sort((a, b) => b.stars - a.stars)
      .slice(0, 5)
      .forEach((v, i) => {
        console.log(
          `   ${i + 1}. ${v.repository} (⭐ ${v.stars}) - ${v.confidence}`,
        );
        console.log(`      ${v.url}`);
      });

    // Generate detailed report
    const report = generateReport(violations);
    console.log(`\n📄 Detailed report saved: ${report.timestamp}`);
    console.log(`   security-reports/copyright-report-${Date.now()}.json\n`);
  }

  console.log("=".repeat(60));
  console.log("✅ Copyright check complete!");
  console.log("=".repeat(60) + "\n");

  // Exit with error code if violations found
  if (violations.filter((v) => v.confidence === "HIGH").length > 0) {
    console.log("⚠️  HIGH confidence violations detected!");
    console.log("   Review the report and take action if necessary.\n");
    process.exit(1);
  }
}

checkCopyright().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
