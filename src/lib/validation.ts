import { NextRequest } from 'next/server';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitized?: any;
}

export function validateAndSanitizeInput(
  input: any,
  rules: {
    required?: boolean;
    type?: 'string' | 'number' | 'email' | 'url' | 'boolean';
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: RegExp;
    enum?: any[];
    custom?: (value: any) => boolean | string;
  }
): ValidationResult {
  const errors: string[] = [];
  let sanitized = input;

  // Check if required
  if (rules.required && (input === undefined || input === null || input === '')) {
    errors.push('This field is required');
    return { isValid: false, errors };
  }

  // Skip further validation if not required and empty
  if (!rules.required && (input === undefined || input === null || input === '')) {
    return { isValid: true, errors: [] };
  }

  // Type validation and sanitization
  switch (rules.type) {
    case 'string':
      if (typeof input !== 'string') {
        errors.push('Must be a string');
      } else {
        sanitized = input.trim();
        
        if (rules.minLength !== undefined && sanitized.length < rules.minLength) {
          errors.push(`Must be at least ${rules.minLength} characters long`);
        }
        
        if (rules.maxLength !== undefined && sanitized.length > rules.maxLength) {
          errors.push(`Must be no more than ${rules.maxLength} characters long`);
        }
        
        if (rules.pattern && !rules.pattern.test(sanitized)) {
          errors.push('Format is invalid');
        }
      }
      break;

    case 'number':
      const num = Number(input);
      if (isNaN(num)) {
        errors.push('Must be a number');
      } else {
        sanitized = num;
        
        if (rules.min !== undefined && sanitized < rules.min) {
          errors.push(`Must be at least ${rules.min}`);
        }
        
        if (rules.max !== undefined && sanitized > rules.max) {
          errors.push(`Must be no more than ${rules.max}`);
        }
      }
      break;

    case 'email':
      if (typeof input !== 'string') {
        errors.push('Must be a string');
      } else {
        sanitized = input.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(sanitized)) {
          errors.push('Must be a valid email address');
        }
      }
      break;

    case 'url':
      if (typeof input !== 'string') {
        errors.push('Must be a string');
      } else {
        sanitized = input.trim();
        try {
          new URL(sanitized);
        } catch {
          errors.push('Must be a valid URL');
        }
      }
      break;

    case 'boolean':
      if (typeof input !== 'boolean') {
        errors.push('Must be a boolean');
      }
      break;
  }

  // Enum validation
  if (rules.enum && !rules.enum.includes(sanitized)) {
    errors.push(`Must be one of: ${rules.enum.join(', ')}`);
  }

  // Custom validation
  if (rules.custom) {
    const customResult = rules.custom(sanitized);
    if (customResult !== true) {
      errors.push(typeof customResult === 'string' ? customResult : 'Custom validation failed');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized,
  };
}

/**
 * SECURITY FIX: Improved HTML sanitization function
 * 
 * The previous regex-based approach was vulnerable to XSS attacks due to:
 * 1. Malformed HTML tags like </script > (with spaces)
 * 2. Case sensitivity issues
 * 3. Complex nested structures
 * 4. Browser HTML parser quirks
 * 
 * This improved version handles more edge cases, but for production use,
 * consider using a dedicated library like DOMPurify.
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  let sanitized = input;

  // Remove script tags with comprehensive patterns that handle malformed HTML
  // This addresses the CodeQL alert about regex bypass vulnerabilities
  
  // Remove opening script tags
  sanitized = sanitized.replace(/<script[^>]*>/gi, '');
  
  // Remove closing script tags (including malformed ones like </script foo="bar">)
  // This pattern specifically addresses the CodeQL vulnerability
  sanitized = sanitized.replace(/<\/script[^>]*>/gi, '');
  
  // Additional catch-all for any remaining script-related tags
  sanitized = sanitized.replace(/<\/?script[^>]*>/gi, '');
  
  // Remove iframe tags
  sanitized = sanitized.replace(/<\/?iframe[^>]*>/gi, '');
  
  // Remove object tags
  sanitized = sanitized.replace(/<\/?object[^>]*>/gi, '');
  
  // Remove embed tags
  sanitized = sanitized.replace(/<\/?embed[^>]*>/gi, '');
  
  // Remove applet tags (legacy but still dangerous)
  sanitized = sanitized.replace(/<\/?applet[^>]*>/gi, '');
  
  // Remove form tags (prevent CSRF)
  sanitized = sanitized.replace(/<\/?form[^>]*>/gi, '');
  
  // Remove input tags
  sanitized = sanitized.replace(/<\/?input[^>]*>/gi, '');
  
  // Remove dangerous event handlers (more comprehensive)
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*[^>\s]+/gi, '');
  
  // Remove javascript: URLs (case insensitive)
  sanitized = sanitized.replace(/javascript\s*:/gi, '');
  
  // Remove data: URLs for SVG (potential XSS vector)
  sanitized = sanitized.replace(/data\s*:\s*image\/svg\+xml/gi, '');
  
  // Remove vbscript: URLs
  sanitized = sanitized.replace(/vbscript\s*:/gi, '');
  
  // Remove expression() in CSS (IE-specific XSS)
  sanitized = sanitized.replace(/expression\s*\(/gi, '');
  
  // Remove style attributes that might contain expressions
  sanitized = sanitized.replace(/\s*style\s*=\s*["'][^"']*expression[^"']*["']/gi, '');
  
  // Remove potentially dangerous CSS
  sanitized = sanitized.replace(/@import/gi, '');
  
  // Remove HTML comments that might contain script
  sanitized = sanitized.replace(/<!--[\s\S]*?-->/g, '');
  
  // Remove CDATA sections
  sanitized = sanitized.replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '');
  
  // SECURITY FIX: Correct entity decoding order to prevent double unescaping
  // Must decode &amp; LAST to prevent breaking other entities like &quot;
  sanitized = sanitized
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    .replace(/&#x60;/g, '`')
    .replace(/&#x3D;/g, '=')
    .replace(/&amp;/g, '&'); // Must be last to prevent double unescaping

  return sanitized;
}

export function validatePostData(data: any): ValidationResult {
  const errors: string[] = [];
  const sanitized: any = {};

  // Validate title
  const titleValidation = validateAndSanitizeInput(data.title, {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 200,
  });
  if (!titleValidation.isValid) {
    errors.push(...titleValidation.errors);
  } else {
    sanitized.title = titleValidation.sanitized;
  }

  // Validate content
  if (data.content) {
    const contentValidation = validateAndSanitizeInput(data.content, {
      type: 'string',
      maxLength: 10000,
    });
    if (!contentValidation.isValid) {
      errors.push(...contentValidation.errors);
    } else {
      sanitized.content = sanitizeHtml(contentValidation.sanitized);
    }
  }

  // Validate subject
  if (data.subject) {
    const subjectValidation = validateAndSanitizeInput(data.subject, {
      type: 'string',
      maxLength: 50,
    });
    if (!subjectValidation.isValid) {
      errors.push(...subjectValidation.errors);
    } else {
      sanitized.subject = subjectValidation.sanitized;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized,
  };
}

export function validateCommentData(data: any): ValidationResult {
  const errors: string[] = [];
  const sanitized: any = {};

  // Validate content
  const contentValidation = validateAndSanitizeInput(data.content, {
    required: true,
    type: 'string',
    minLength: 1,
    maxLength: 1000,
  });
  if (!contentValidation.isValid) {
    errors.push(...contentValidation.errors);
  } else {
    sanitized.content = sanitizeHtml(contentValidation.sanitized);
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized,
  };
}

export function validateReportData(data: any): ValidationResult {
  const errors: string[] = [];
  const sanitized: any = {};

  // Validate reason
  const reasonValidation = validateAndSanitizeInput(data.reason, {
    required: true,
    type: 'string',
    enum: ['spam', 'harassment', 'inappropriate', 'copyright', 'impersonation', 'misinformation', 'other'],
  });
  if (!reasonValidation.isValid) {
    errors.push(...reasonValidation.errors);
  } else {
    sanitized.reason = reasonValidation.sanitized;
  }

  // Validate description
  if (data.description) {
    const descriptionValidation = validateAndSanitizeInput(data.description, {
      type: 'string',
      maxLength: 500,
    });
    if (!descriptionValidation.isValid) {
      errors.push(...descriptionValidation.errors);
    } else {
      sanitized.description = sanitizeHtml(descriptionValidation.sanitized);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized,
  };
}