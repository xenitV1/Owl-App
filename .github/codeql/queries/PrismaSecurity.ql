/**
 * @name Prisma Security Checks
 * @description Security checks for Prisma ORM usage
 * @kind problem
 * @problem.severity warning
 * @id js/prisma-security-checks
 */

import javascript
import DataFlow::PathGraph

// Prisma query security checks
predicate isPrismaQuery(DataFlow::Node node) {
  exists(CallExpr call |
    call = node.asExpr() and
    (call.getTarget().getName().matches("find*") or
     call.getTarget().getName().matches("create*") or
     call.getTarget().getName().matches("update*") or
     call.getTarget().getName().matches("delete*"))
  )
}

// Prisma input validation
predicate hasPrismaInputValidation(DataFlow::Node node) {
  exists(CallExpr call |
    call = node.asExpr() and
    isPrismaQuery(call) and
    // Input validation check
    call.getAnArgument().getType().toString() != "any"
  )
}

from DataFlow::Node node
where isPrismaQuery(node) and not hasPrismaInputValidation(node)
select node, "Prisma query without proper input validation"
