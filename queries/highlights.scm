; Tree-sitter highlighting queries for Ren'Py syntax.
; Keywords
["label" "menu" "screen" "define" "default" "transform" "style"
 "image" "init" "python" "if" "elif" "else" "while" "for"
 "jump" "call" "show" "scene" "hide" "with" "use" "return"
 "pass" "translate" "camera" "window" "voice" "play" "stop"
 "queue" "pause" "nvl" "early" "in" "expression"
 "offset" "is" "take" "strings" "auto" "sustain" "clear"
 "layer"] @keyword

; Definition names
(label name: (label_name (identifier) @function))
(screen name: (identifier) @function)
(define name: (identifier) @variable)
(define name: (dotted_name) @variable)
(default name: (identifier) @variable)
(default name: (dotted_name) @variable)
(transform name: (identifier) @function)
(transform name: (dotted_name) @function)
(style name: (identifier) @type)
(image name: (image_name) @constant)

; References
(jump target: (label_name (identifier) @function))
(call name: (identifier) @function)
(call name: (label_name (identifier) @function))
(use name: (identifier) @function)

; Strings
(string) @string
(escape_sequence) @string.escape
(interpolation) @embedded
(text_tag) @tag

; Comments
(comment) @comment

; Numbers
(integer) @number

; Operators
["=" "+=" "|="] @operator

; Punctuation
[":" "." "," "$"] @punctuation.delimiter
["(" ")" "[" "]" "{" "}"] @punctuation.bracket
