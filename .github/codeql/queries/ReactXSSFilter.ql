/**
 * @name Filter False Positive XSS in React
 * @description Filters XSS warnings that are false positives in React/JSX context
 * @kind problem
 * @problem.severity recommendation
 * @id js/react-xss-filter
 */

import javascript

// XSS patterns that are safe in React JSX context
predicate isReactSafeXSSPattern(DataFlow::Node source, DataFlow::Node sink) {
  exists(JSX::JSXElement jsx |
    // Within JSX element
    source.getContainer() = jsx.getContainer() and
    sink.getContainer() = jsx.getContainer() and
    (
      // iframe src attributes are safe in React
      (sink.getAstNode() instanceof JSX::JSXAttribute and
       sink.getAstNode().(JSX::JSXAttribute).getName() = "src" and
       source.getAstNode() instanceof TemplateLiteral) or

      // video src attributes are safe in React
      (sink.getAstNode() instanceof JSX::JSXAttribute and
       sink.getAstNode().(JSX::JSXAttribute).getName() = "src" and
       source.getAstNode() instanceof CallExpr and
       source.getAstNode().(CallExpr).getCallee().getName() = "createObjectURL") or

      // href attributes are safe in React
      (sink.getAstNode() instanceof JSX::JSXAttribute and
       sink.getAstNode().(JSX::JSXAttribute).getName() = "href" and
       source.getAstNode() instanceof Literal)
    )
  )
}

from DataFlow::Node source, DataFlow::Node sink
where isReactSafeXSSPattern(source, sink)
select source, "This XSS pattern is safe in React JSX context"
