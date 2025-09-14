/**
 * @name Prisma Security Checks
 * @description Security checks for Prisma ORM usage
 * @kind problem
 * @problem.severity warning
 * @id js/prisma-security-checks
 */

import javascript

// Find Prisma queries that might be unsafe
from CallExpr call
where call.getCallee().(Identifier).getName().matches("find*") or
      call.getCallee().(Identifier).getName().matches("create*") or
      call.getCallee().(Identifier).getName().matches("update*") or
      call.getCallee().(Identifier).getName().matches("delete*")
select call, "Prisma query detected - ensure proper input validation"
