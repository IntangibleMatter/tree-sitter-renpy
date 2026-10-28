; Outline queries — defines symbols shown in the editor's symbol outline panel.
(label
  "label" @context
  name: (label_name (identifier) @name)) @item

(screen
  "screen" @context
  name: (identifier) @name) @item

(define
  "define" @context
  name: (_) @name) @item

(default
  "default" @context
  name: (_) @name) @item

(transform
  "transform" @context
  name: (_) @name) @item

(style
  "style" @context
  name: (identifier) @name) @item

(image
  "image" @context
  name: (image_name) @name) @item
