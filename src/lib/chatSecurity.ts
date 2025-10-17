/**
 * Chat Security Utilities
 * Provides security checks for chat messages, links, and files
 */

// Potentially malicious file extensions
const MALICIOUS_FILE_EXTENSIONS = [
  ".exe",
  ".bat",
  ".cmd",
  ".com",
  ".pif",
  ".scr",
  ".vbs",
  ".js",
  ".jar",
  ".app",
  ".deb",
  ".pkg",
  ".dmg",
  ".msi",
  ".php",
  ".asp",
  ".aspx",
  ".jsp",
  ".py",
  ".rb",
  ".pl",
  ".sh",
  ".ps1",
  ".vb",
  ".wsf",
  ".reg",
];

// Safe file extensions for images and documents
const SAFE_FILE_EXTENSIONS = [
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
  ".bmp",
  ".ico",
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
  ".txt",
  ".csv",
  ".rtf",
];

// Suspicious URL patterns
const SUSPICIOUS_URL_PATTERNS = [
  /bit\.ly/i,
  /tinyurl\.com/i,
  /shortened/i,
  /t\.co/i,
  /goo\.gl/i,
  /ow\.ly/i,
  /is\.gd/i,
  /buff\.ly/i,
  /adf\.ly/i,
  /bit\.do/i,
  /mcaf\.ee/i,
  /tiny\.cc/i,
  /short\.link/i,
];

// Common phishing domains
const PHISHING_DOMAINS = [
  "paypal-security.com",
  "microsoft-security.com",
  "google-security.com",
  "apple-security.com",
  "amazon-security.com",
  "facebook-security.com",
  "instagram-security.com",
  "twitter-security.com",
  "linkedin-security.com",
  "verify-account.com",
  "secure-login.com",
  "account-verification.com",
];

// Profanity words list (simplified)
const PROFANITY_WORDS = [
  "damn",
  "hell",
  "ass",
  "bastard",
  "bitch",
  "crap",
  "dick",
  "piss",
  "shit",
  "son of a bitch",
  "whore",
  "slut",
  "fuck",
  "fucking",
  "motherfucker",
];

/**
 * Check if a URL is suspicious or potentially malicious
 */
export function isSuspiciousUrl(url: string): {
  isSuspicious: boolean;
  reason?: string;
} {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Check for suspicious URL shorteners
    for (const pattern of SUSPICIOUS_URL_PATTERNS) {
      if (pattern.test(url)) {
        return { isSuspicious: true, reason: "URL shortener detected" };
      }
    }

    // Check for phishing domains
    for (const domain of PHISHING_DOMAINS) {
      if (hostname.includes(domain)) {
        return { isSuspicious: true, reason: "Potential phishing domain" };
      }
    }

    // Check for IP addresses instead of domain names
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) {
      return { isSuspicious: true, reason: "Direct IP address" };
    }

    // Check for non-standard ports
    if (urlObj.port && ![80, 443].includes(parseInt(urlObj.port))) {
      return { isSuspicious: true, reason: "Non-standard port" };
    }

    return { isSuspicious: false };
  } catch (error) {
    return { isSuspicious: true, reason: "Invalid URL format" };
  }
}

/**
 * Check if a file extension is potentially malicious
 */
export function isSuspiciousFile(filename: string): {
  isSuspicious: boolean;
  reason?: string;
} {
  const extension = filename.toLowerCase().substring(filename.lastIndexOf("."));

  // Check for malicious extensions
  if (MALICIOUS_FILE_EXTENSIONS.includes(extension)) {
    return { isSuspicious: true, reason: "Potentially malicious file type" };
  }

  // Check for double extensions (e.g., image.jpg.exe)
  const parts = filename.split(".");
  if (parts.length > 2) {
    const lastExtension = parts[parts.length - 1].toLowerCase();
    const secondLastExtension = parts[parts.length - 2].toLowerCase();

    if (MALICIOUS_FILE_EXTENSIONS.includes(`.${lastExtension}`)) {
      return { isSuspicious: true, reason: "File with double extension" };
    }
  }

  return { isSuspicious: false };
}

/**
 * Check if a file is safe for upload
 */
export function isSafeFile(
  filename: string,
  size?: number,
): { isSafe: boolean; reason?: string } {
  // Check file extension
  const extension = filename.toLowerCase().substring(filename.lastIndexOf("."));

  if (!SAFE_FILE_EXTENSIONS.includes(extension)) {
    return { isSafe: false, reason: "File type not allowed" };
  }

  // Check file size (default 10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (size && size > maxSize) {
    return { isSafe: false, reason: "File size exceeds limit (10MB)" };
  }

  return { isSafe: true };
}

/**
 * Check for profanity in text
 */
export function containsProfanity(text: string): {
  hasProfanity: boolean;
  words?: string[];
} {
  const lowerText = text.toLowerCase();
  const foundWords: string[] = [];

  for (const word of PROFANITY_WORDS) {
    if (lowerText.includes(word)) {
      foundWords.push(word);
    }
  }

  return {
    hasProfanity: foundWords.length > 0,
    words: foundWords.length > 0 ? foundWords : undefined,
  };
}

/**
 * Extract URLs from text
 */
export function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
}

/**
 * Sanitize message content
 */
export function sanitizeMessage(content: string): {
  sanitizedContent: string;
  hasSuspiciousContent: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  let hasSuspiciousContent = false;
  let sanitizedContent = content;

  // Check for profanity
  const profanityCheck = containsProfanity(content);
  if (profanityCheck.hasProfanity) {
    hasSuspiciousContent = true;
    warnings.push(
      `Contains inappropriate language: ${profanityCheck.words?.join(", ")}`,
    );

    // Replace profanity with asterisks
    for (const word of profanityCheck.words || []) {
      const regex = new RegExp(`\\b${word}\\b`, "gi");
      sanitizedContent = sanitizedContent.replace(
        regex,
        "*".repeat(word.length),
      );
    }
  }

  // Check for suspicious URLs
  const urls = extractUrls(content);
  for (const url of urls) {
    const urlCheck = isSuspiciousUrl(url);
    if (urlCheck.isSuspicious) {
      hasSuspiciousContent = true;
      warnings.push(`Suspicious URL detected: ${urlCheck.reason}`);

      // Replace suspicious URLs with a warning
      sanitizedContent = sanitizedContent.replace(
        url,
        `[SUSPICIOUS LINK REMOVED: ${urlCheck.reason}]`,
      );
    }
  }

  return {
    sanitizedContent,
    hasSuspiciousContent,
    warnings,
  };
}

/**
 * Check if message should be blocked entirely
 */
export function shouldBlockMessage(
  content: string,
  filename?: string,
): {
  shouldBlock: boolean;
  reason?: string;
} {
  // Check for extremely malicious content
  const profanityCheck = containsProfanity(content);
  if (
    profanityCheck.hasProfanity &&
    profanityCheck.words &&
    profanityCheck.words.length > 3
  ) {
    return { shouldBlock: true, reason: "Excessive inappropriate language" };
  }

  // Check for suspicious files
  if (filename) {
    const fileCheck = isSuspiciousFile(filename);
    if (fileCheck.isSuspicious) {
      return { shouldBlock: true, reason: fileCheck.reason };
    }
  }

  // Check for multiple suspicious URLs
  const urls = extractUrls(content);
  let suspiciousUrlCount = 0;

  for (const url of urls) {
    const urlCheck = isSuspiciousUrl(url);
    if (urlCheck.isSuspicious) {
      suspiciousUrlCount++;
    }
  }

  if (suspiciousUrlCount > 2) {
    return { shouldBlock: true, reason: "Multiple suspicious links detected" };
  }

  return { shouldBlock: false };
}
