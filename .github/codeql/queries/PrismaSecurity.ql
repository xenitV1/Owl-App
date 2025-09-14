/**
 * @name Prisma Security Checks
 * @description Security checks for Prisma ORM usage
 * @kind problem
 * @problem.severity warning
 * @id js/prisma-security-checks
 */

import javascript

// Prisma query security checks
predicate isPrismaQuery(DataFlow::Node node) {
  exists(CallExpr call |
    call = node.getAstNode() and
    (call.getCallee().getName().matches("find*") or
     call.getCallee().getName().matches("create*") or
     call.getCallee().getName().matches("update*") or
     call.getCallee().getName().matches("delete*"))
  )
}

// Prisma input validation
predicate hasPrismaInputValidation(DataFlow::Node node) {
  exists(CallExpr call |
    call = node.getAstNode() and
    isPrismaQuery(node) and
    // Check if there are arguments (basic validation)
    exists(call.getAnArgument())
  )
}

from DataFlow::Node node
where isPrismaQuery(node) and not hasPrismaInputValidation(node)
select node, "Prisma query without proper input validation"
