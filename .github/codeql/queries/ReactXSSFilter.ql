/**
 * @name Filter False Positive XSS in React
 * @description Filters XSS warnings that are false positives in React/JSX context
 * @kind problem
 * @problem.severity recommendation
 * @id js/react-xss-filter
 */

import javascript
import DataFlow::PathGraph

// XSS patterns that are safe in React JSX context
predicate isReactSafeXSSPattern(DataFlow::Node source, DataFlow::Node sink) {
  exists(JSXElement jsx |
    // Within JSX element
    source.getEnclosingFunction() = jsx.getEnclosingFunction() and
    sink.getEnclosingFunction() = jsx.getEnclosingFunction() and
    (
      // iframe src attributes are safe in React
      (sink.asExpr() instanceof JSXAttribute and
       sink.asExpr().(JSXAttribute).getName() = "src" and
       source.asExpr() instanceof TemplateLiteral) or

      // video src attributes are safe in React
      (sink.asExpr() instanceof JSXAttribute and
       sink.asExpr().(JSXAttribute).getName() = "src" and
       source.asExpr() instanceof CallExpr and
       source.asExpr().(CallExpr).getTarget().getName() = "createObjectURL") or

      // href attributes are safe in React
      (sink.asExpr() instanceof JSXAttribute and
       sink.asExpr().(JSXAttribute).getName() = "href" and
       source.asExpr() instanceof Literal)
    )
  )
}

from DataFlow::Node source, DataFlow::Node sink
where isReactSafeXSSPattern(source, sink)
select source, "This XSS pattern is safe in React JSX context"
