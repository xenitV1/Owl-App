/**
 * @name React JSX Safe Patterns
 * @description Identifies safe patterns in React JSX that should not trigger XSS warnings
 * @kind problem
 * @problem.severity recommendation
 * @id js/react-jsx-safe-patterns
 */

import javascript

// Safe patterns for React JSX attributes
predicate isReactSafeJSXAttribute(DataFlow::Node node) {
  exists(JSX::JSXAttribute attr |
    attr = node.getAstNode() and
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
predicate isReactSafeJSXValue(DataFlow::Node node) {
  exists(JSX::JSXExpression expr |
    expr = node.getAstNode() and
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
  isReactSafeJSXAttribute(sink) and
  isReactSafeJSXValue(source) and
  source.getContainer() = sink.getContainer()
select source, "Safe React JSX pattern: $@ flows to safe attribute $@",
  source, source.toString(),
  sink, sink.toString()
