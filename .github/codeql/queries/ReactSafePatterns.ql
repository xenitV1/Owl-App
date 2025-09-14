/**
 * @name React JSX Safe Patterns
 * @description Identifies safe patterns in React JSX that should not trigger XSS warnings
 * @kind problem
 * @problem.severity recommendation
 * @id js/react-jsx-safe-patterns
 */

import javascript
import DataFlow::PathGraph

// Safe patterns for React JSX attributes
predicate isReactSafeAttribute(DataFlow::Node node) {
  exists(JSXAttribute attr |
    attr = node.asExpr() and
    (
      // src attributes are safe in React
      attr.getName() = "src" or
      // href attributes are safe in React
      attr.getName() = "href" or
      // className attributes are safe in React
      attr.getName() = "className" or
      // title attributes are safe in React
      attr.getName() = "title"
    )
  )
}

// Safe values in React JSX
predicate isReactSafeValue(DataFlow::Node node) {
  exists(JSXExpression expr |
    expr = node.asExpr() and
    (
      // Template literals are safe
      expr instanceof TemplateLiteral or
      // String literals are safe
      expr instanceof Literal or
      // Function calls are safe (like URL.createObjectURL)
      expr instanceof CallExpr or
      // Variable references are safe (controlled variables)
      expr instanceof Identifier
    )
  )
}

from DataFlow::Node source, DataFlow::Node sink
where
  isReactSafeAttribute(sink) and
  isReactSafeValue(source) and
  source.getEnclosingFunction() = sink.getEnclosingFunction()
select source, "Safe React JSX pattern: $@ flows to safe attribute $@",
  source, source.toString(),
  sink, sink.toString()
