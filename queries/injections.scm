; Language injection queries — injects Python highlighting into python/init blocks.
((python_block (block) @injection.content)
 (#set! injection.language "python"))

((init (block) @injection.content)
 (#set! injection.language "python"))

((one_line_python (expression) @injection.content)
 (#set! injection.language "python"))

((comment) @injection.content
 (#set! injection.language "comment"))
