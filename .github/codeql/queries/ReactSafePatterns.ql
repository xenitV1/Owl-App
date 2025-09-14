/**
 * @name React JSX Safe Patterns
 * @description Identifies safe patterns in React JSX that should not trigger XSS warnings
 * @kind problem
 * @problem.severity recommendation
 * @id js/react-jsx-safe-patterns
 */

import javascript

// Find React components (functions that return JSX)
from Function f
where f.getName().matches("*Component") or
      f.getName().matches("*Page") or
      f.getName().matches("*Layout")
select f, "React component detected: " + f.getName()
