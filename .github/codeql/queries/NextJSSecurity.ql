/**
 * @name Next.js Security Checks
 * @description Special security checks for Next.js framework
 * @kind problem
 * @problem.severity warning
 * @id js/nextjs-security-checks
 */

import javascript

// Find Next.js API routes
from Function f
where f.getName() = "handler" and
      f.getFile().getRelativePath().matches("**/api/**/route.ts")
select f, "Next.js API route detected - ensure proper security validation"
