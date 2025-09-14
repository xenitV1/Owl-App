/**
 * @name Filter False Positive XSS in React
 * @description Filters XSS warnings that are false positives in React/JSX context
 * @kind problem
 * @problem.severity recommendation
 * @id js/react-xss-filter
 */

import javascript

// Find potentially dangerous innerHTML usage
from CallExpr call
where call.getCallee().(Identifier).getName() = "innerHTML"
select call, "innerHTML usage detected - ensure content is sanitized"
