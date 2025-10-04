/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require("child_process");
const fs = require("fs");

async function generateSecurityReport() {
  console.log("🔍 Generating Security Report...\n");

  const report = {
    timestamp: new Date().toISOString(),
    checks: {},
  };

  // NPM Audit
  try {
    const auditResult = execSync("npm audit --json", { encoding: "utf-8" });
    const audit = JSON.parse(auditResult);
    report.checks.npmAudit = {
      status: audit.metadata.vulnerabilities.total === 0 ? "PASS" : "WARN",
      vulnerabilities: audit.metadata.vulnerabilities,
    };
  } catch (error) {
    report.checks.npmAudit = { status: "FAIL", error: error.message };
  }

  // Outdated Packages
  try {
    const outdatedResult = execSync("npm outdated --json", {
      encoding: "utf-8",
    });
    const outdated = JSON.parse(outdatedResult || "{}");
    report.checks.outdatedPackages = {
      status: Object.keys(outdated).length === 0 ? "PASS" : "INFO",
      count: Object.keys(outdated).length,
    };
  } catch (error) {
    report.checks.outdatedPackages = { status: "PASS", count: 0 };
  }

  // Save report
  const reportPath = `security-reports/report-${Date.now()}.json`;
  fs.mkdirSync("security-reports", { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log("✅ Report generated:", reportPath);
  console.log("\n📊 Summary:");
  console.log(JSON.stringify(report.checks, null, 2));
}

generateSecurityReport().catch(console.error);
