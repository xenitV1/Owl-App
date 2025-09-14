/**
 * @name TypeScript Security Checks
 * @description Security checks specific to TypeScript code
 * @kind problem
 * @problem.severity warning
 * @id js/typescript-security-checks
 */

import javascript

// Type assertion security checks
predicate isUnsafeTypeAssertion(DataFlow::Node node) {
  exists(TypeScript::TypeAssertion ta |
    ta = node.getAstNode() and
    // any type assertions are potential security risks
    ta.getTypeAnnotation().toString() = "any"
  )
}

from DataFlow::Node node
where isUnsafeTypeAssertion(node)
select node, "Unsafe type assertion to 'any' type found"
