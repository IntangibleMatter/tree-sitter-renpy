/**
 * Tree-sitter grammar for the Ren'Py visual-novel scripting language.
 *
 * Covers top-level statements (label, screen, define, show, menu, etc.), string literals
 * with interpolation/text-tags, Python blocks (injection targets), and ATL transform syntax.
 * This grammar is coarse, but I've added block body handling which is good.
 *
 * DO NOT regenerate parser output (src/) from comments-only changes.
 */
/// <reference types="tree-sitter-cli/dsl" />

module.exports = grammar({
  name: "renpy",

  extras: ($) => [/[ \t\r]/, $.comment],

  word: ($) => $.identifier,

  conflicts: ($) => [],

  externals: ($) => [
    $._newline,
    $._indent,
    $._dedent,
    $.string_start,
    $._string_content,
    $.escape_interpolation,
    $.string_end,

    // mark comments as external token so you always invoke the scanner for reasons explained in the python grammar
    $.comment_alt,
    "]",
    ")",
    "}",
  ],

  rules: {
    source_file: ($) => repeat($._top_level),

    // Top-level: full statement recognition
    _top_level: ($) =>
      choice(
        $.label,
        $.menu,
        $.screen,
        $.define,
        $.default,
        $.transform,
        $.style,
        $.image,
        $.init,
        $.python_block,
        $.if_statement,
        $.elif_clause,
        $.else_clause,
        $.while_statement,
        $.for_statement,
        $.jump,
        $.call,
        $.show,
        $.scene,
        $.hide,
        $.with_statement,
        $.use,
        $.return_statement,
        $.pass_statement,
        $.translate,
        $.camera,
        $.window_statement,
        $.voice,
        $.play,
        $.stop,
        $.queue,
        $.pause_statement,
        $.nvl_statement,
        $.one_line_python,
        $.menu_choice,
        $.say_statement,
        $._newline,
      ),

    // _newline: ($) => /\n/,

    // Block: opaque indented content (lines).
    // Without external scanner, we can't track indentation, so blocks are
    // just sequences of non-empty lines. Each line is captured as a body_line.
    // block: ($) => prec.right(repeat1(choice($.body_line, $._newline))),
    block: ($) => seq($._indent, repeat($._top_level), $._dedent),

    // --- Comments ---
    comment: ($) => token(seq("#", /.*?\n/)),

    // --- Identifiers and names ---
    identifier: ($) => /[a-zA-Z_]\w*/,

    // Dotted name: identifier.identifier.identifier...
    dotted_name: ($) => seq($.identifier, repeat1(seq(".", $.identifier))),

    // Label name: optional leading dot + identifier (+ optional dot-separated parts)
    label_name: ($) =>
      seq(optional("."), $.identifier, repeat(seq(".", $.identifier))),

    // --- Strings ---
    string: ($) =>
      choice(
        $.triple_double_string,
        $.triple_single_string,
        $.double_string,
        $.single_string,
      ),

    triple_double_string: ($) =>
      seq('"""', repeat(choice($.string_content, /[^"\\{\[]+/, /"/)), '"""'),

    triple_single_string: ($) =>
      seq("'''", repeat(choice($.string_content, /[^'\\{\[]+/, /'/)), "'''"),

    double_string: ($) =>
      seq('"', repeat(choice($.string_content, /[^"\\{\[\n]+/)), '"'),

    single_string: ($) =>
      seq("'", repeat(choice($.string_content, /[^'\\{\[\n]+/)), "'"),

    escape_sequence: ($) => token.immediate(/\\./),
    interpolation: ($) => seq("[", /[^\]]+/, "]"),
    text_tag: ($) => seq("{", /[^}]*/, "}"),
    string_content: ($) =>
      choice($.escape_sequence, $.interpolation, $.text_tag),

    // --- Say statement (lowest precedence - fallback for bare strings/dialogue) ---
    say_statement: ($) =>
      prec(
        -1,
        choice(
          seq(field("who", $.identifier), field("what", $.string), $._newline),
          seq(field("what", $.string), $._newline),
        ),
      ),

    // --- Label ---
    label: ($) =>
      prec.right(
        seq(
          "label",
          field("name", $.label_name),
          optional($.parameters),
          optional("hide"),
          ":",
          $._newline,
          $._indent,
          $.block,
        ),
      ),

    // --- Menu ---
    menu: ($) =>
      prec.right(
        seq(
          "menu",
          optional(field("name", $.label_name)),
          optional($.parameters),
          ":",
          $._newline,
          // $._indent,
          $.block,
        ),
      ),

    // Menu choice: "text" followed by optional condition and colon
    menu_choice: ($) =>
      prec.right(
        seq(
          field("caption", $.string),
          optional(seq("if", field("coindentndition", $.expression))),
          ":",
          $._newline,
          // $._indent,
          $.block,
        ),
      ),

    // --- Screen ---
    screen: ($) =>
      prec.right(
        seq(
          "screen",
          field("name", $.identifier),
          optional($.parameters),
          ":",
          $._newline,
          // $._indent,
          $.block,
        ),
      ),

    // --- Define ---
    define: ($) =>
      seq(
        "define",
        // optional($.integer),
        optional($.number),
        field("name", choice($.dotted_name, $.identifier)),
        choice("=", "+=", "|="),
        field("value", $.expression),
        $._newline,
      ),

    // --- Default ---
    default: ($) =>
      seq(
        "default",
        // optional($.integer),
        optional($.number),
        field("name", choice($.dotted_name, $.identifier)),
        "=",
        field("value", $.expression),
        $._newline,
      ),

    // --- Transform ---
    transform: ($) =>
      prec.right(
        seq(
          "transform",
          optional($.number),
          field("name", choice($.dotted_name, $.identifier)),
          optional($.parameters),
          ":",
          $._newline,
          // $._indent,
          $.block,
        ),
      ),

    // --- Style ---
    style: ($) =>
      prec.right(
        seq(
          "style",
          field("name", $.identifier),
          repeat($._style_clause),
          choice(seq(":", $._newline, /*$._indent,*/ $.block), $._newline),
        ),
      ),

    _style_clause: ($) =>
      choice(seq("is", $.identifier), seq("take", $.identifier)),

    // --- Image ---
    image: ($) =>
      prec.right(
        seq(
          "image",
          field("name", $.image_name),
          choice(
            seq("=", field("value", $.expression), $._newline),
            seq(":", $._newline, /*$._indent,*/ $.block),
          ),
        ),
      ),

    image_name: ($) => repeat1($.identifier),

    // --- Init ---
    init: ($) =>
      prec.right(
        1,
        seq(
          "init",
          choice(
            seq(
              optional($.number),
              "python",
              optional("early"),
              optional("hide"),
              optional(seq("in", choice($.dotted_name, $.identifier))),
              ":",
              $._newline,
              // $._indent,
              $.block,
            ),
            seq("offset", "=", $.number, $._newline),
            seq(optional($.number), ":", $._newline, /*$._indent,*/ $.block),
          ),
        ),
      ),

    // --- Python block ---
    python_block: ($) =>
      prec.right(
        seq(
          "python",
          optional("early"),
          optional("hide"),
          optional(seq("in", choice($.dotted_name, $.identifier))),
          ":",
          $._newline,
          // $._indent,
          $.block,
        ),
      ),

    // --- If/elif/else ---
    if_statement: ($) =>
      prec.right(
        seq(
          "if",
          field("condition", $.expression),
          ":",
          $._newline,
          // $._indent,
          $.block,
        ),
      ),

    elif_clause: ($) =>
      prec.right(
        seq(
          "elif",
          field("condition", $.expression),
          ":",
          $._newline,
          // $._indent,
          $.block,
        ),
      ),

    else_clause: ($) =>
      prec.right(seq("else", ":", $._newline, /*$._indent,*/ $.block)),

    // --- While ---
    while_statement: ($) =>
      prec.right(
        seq(
          "while",
          field("condition", $.expression),
          ":",
          $._newline,
          // $._indent,
          $.block,
        ),
      ),

    // --- For ---
    for_statement: ($) =>
      prec.right(
        seq("for", $.expression, ":", $._newline, /*$._indent,*/ $.block),
      ),

    // --- Jump ---
    jump: ($) =>
      seq(
        "jump",
        choice(seq("expression", $.expression), field("target", $.label_name)),
        $._newline,
      ),

    // --- Call ---
    call: ($) =>
      seq(
        "call",
        choice(
          seq("screen", field("name", $.identifier)),
          seq("expression", $.expression),
          seq(field("name", $.label_name), optional($.expression)),
        ),
        $._newline,
      ),

    // --- Show ---
    show: ($) =>
      prec.right(
        seq(
          "show",
          choice(
            seq("screen", $.identifier, optional($.expression)),
            seq("layer", $.identifier, optional($.expression)),
            $.expression,
          ),
          choice($._newline, seq(":", $._newline, /*$._indent,*/ $.block)),
        ),
      ),

    // --- Scene ---
    scene: ($) =>
      prec.right(
        seq(
          "scene",
          optional($.expression),
          choice($._newline, seq(":", $._newline, /*$._indent,*/ $.block)),
        ),
      ),

    // --- Hide ---
    hide: ($) => seq("hide", $.expression, $._newline),

    // --- With ---
    with_statement: ($) => seq("with", $.expression, $._newline),

    // --- Use ---
    use: ($) =>
      seq(
        "use",
        field("name", $.identifier),
        optional($.expression),
        $._newline,
      ),

    // --- Return ---
    return_statement: ($) => seq("return", optional($.expression), $._newline),

    // --- Pass ---
    pass_statement: ($) => seq("pass", $._newline),

    // --- Translate ---
    translate: ($) =>
      prec.right(
        seq(
          "translate",
          $.identifier,
          choice(
            seq("strings", ":", $._newline, /*$._indent,*/ $.block),
            seq("python", ":", $._newline, /*$._indent,*/ $.block),
            seq("style", ":", $._newline, /*$._indent,*/ $.block),
            seq($.identifier, ":", $._newline, /*$._indent,*/ $.block),
          ),
        ),
      ),

    // --- Camera ---
    camera: ($) =>
      prec.right(
        seq(
          "camera",
          optional($.expression),
          choice($._newline, seq(":", $._newline, /*$._indent,*/ $.block)),
        ),
      ),

    // --- Window ---
    window_statement: ($) =>
      seq("window", choice("show", "hide", "auto"), $._newline),

    // --- Voice ---
    voice: ($) => seq("voice", choice("sustain", $.string), $._newline),

    // --- Play ---
    play: ($) => seq("play", $.identifier, $.expression, $._newline),

    // --- Stop ---
    stop: ($) => seq("stop", $.identifier, optional($.expression), $._newline),

    // --- Queue ---
    queue: ($) => seq("queue", $.identifier, $.expression, $._newline),

    // --- Pause ---
    pause_statement: ($) => seq("pause", optional($.expression), $._newline),

    // --- NVL ---
    nvl_statement: ($) =>
      seq("nvl", choice("clear", "show", "hide"), $._newline),

    // --- One-line Python ---
    one_line_python: ($) => seq("$", $.expression, $._newline),

    // --- Expression: rest-of-line content before colon or newline ---
    expression: ($) => /[^\n:]+/,

    // --- Parameters ---
    parameters: ($) => seq("(", optional($._parameter_list), ")"),
    _parameter_list: ($) =>
      seq($.parameter, repeat(seq(",", $.parameter)), optional(",")),
    parameter: ($) => seq($.identifier, optional(seq("=", /[^,)]+/))),

    // --- Numbers ---
    number: ($) => choice($.float, $.integer),
    // integer: ($) => /[+-]?\d+/,
    // float: ($) => /[=-]?\d+\.\d+/,
    // shamelessly taken from python's tree-sitter
    integer: (_) =>
      token(
        choice(
          seq(choice("0x", "0X"), repeat1(/_?[A-Fa-f0-9]+/), optional(/[Ll]/)),
          seq(choice("0o", "0O"), repeat1(/_?[0-7]+/), optional(/[Ll]/)),
          seq(choice("0b", "0B"), repeat1(/_?[0-1]+/), optional(/[Ll]/)),
          seq(
            repeat1(/[0-9]+_?/),
            choice(
              optional(/[Ll]/), // long numbers
              optional(/[jJ]/), // complex numbers
            ),
          ),
        ),
      ),

    float: (_) => {
      const digits = repeat1(/[0-9]+_?/);
      const exponent = seq(/[eE][\+-]?/, digits);

      return token(
        seq(
          choice(
            seq(digits, ".", optional(digits), optional(exponent)),
            seq(optional(digits), ".", digits, optional(exponent)),
            seq(digits, exponent),
          ),
          optional(/[jJ]/),
        ),
      );
    },
  },
});
