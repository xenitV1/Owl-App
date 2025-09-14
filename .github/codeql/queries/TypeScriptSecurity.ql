/**
 * @name TypeScript Security Checks
 * @description Security checks specific to TypeScript code
 * @kind problem
 * @problem.severity warning
 * @id js/typescript-security-checks
 */

import javascript
import DataFlow::PathGraph

// Type assertion security checks
predicate isUnsafeTypeAssertion(DataFlow::Node node) {
  exists(TypeAssertion ta |
    ta = node.asExpr() and
    // any type assertions are potential security risks
    ta.getType().toString() = "any"
  )
}

// Strict null check controls
predicate hasStrictNullCheck(DataFlow::Node node) {
  exists(Variable v |
    v = node.asVariable() and
    (v.getType().toString() = "null" or
     v.getType().toString() = "undefined")
  )
}

from DataFlow::Node node
where isUnsafeTypeAssertion(node)
select node, "Unsafe type assertion to 'any' type found"
