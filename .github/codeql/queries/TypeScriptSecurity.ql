/**
 * @name TypeScript Security Checks
 * @description Security checks specific to TypeScript code
 * @kind problem
 * @problem.severity warning
 * @id js/typescript-security-checks
 */

import javascript

// Find eval() usage which is dangerous
from CallExpr call
where call.getCallee().(Identifier).getName() = "eval"
select call, "Dangerous eval() usage found"
