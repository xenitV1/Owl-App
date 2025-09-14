/**
 * @name Next.js Security Checks
 * @description Special security checks for Next.js framework
 * @kind problem
 * @problem.severity warning
 * @id js/nextjs-security-checks
 */

import javascript

// Next.js API route security checks
predicate isNextJSAPIRoute(DataFlow::Node node) {
  exists(Function f |
    f = node.getContainer() and
    f.getName() = "handler" and
    f.getFile().getRelativePath().matches("**/api/**/route.ts")
  )
}

// Next.js middleware security checks
predicate isNextJSMiddleware(DataFlow::Node node) {
  exists(Function f |
    f = node.getContainer() and
    f.getName() = "middleware" and
    f.getFile().getRelativePath().matches("**/middleware.ts")
  )
}

from DataFlow::Node node
where isNextJSAPIRoute(node) or isNextJSMiddleware(node)
select node, "Next.js security pattern detected: $@",
  node, node.toString()
