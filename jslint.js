// jslint.js
// 2025-05-28
// Copyright (c) 2015 Douglas Crockford  (www.JSLint.com)

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// The Software shall be used for Good, not Evil.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

// jslint(source, option_object, global_array) is a function that takes 3
// arguments. The second two arguments are optional.

//      source          A text to analyze, a string or an array of strings.
//      option_object   An object whose keys correspond to option names.
//      global_array    An array of strings containing global variables that
//                      the file is allowed readonly access.

// jslint returns an object containing its results. The object contains a lot
// of valuable information. It can be used to generate reports. The object
// contains:

//      directives: an array of directive comment tokens.
//      edition: the version of JSLint that did the analysis.
//      exports: the names exported from the module.
//      froms: an array of strings representing each of the imports.
//      global: an object representing the global object. Its .context property
//              is an object containing a property for each global variable.
//      id: "(JSLint)"
//      json: true if the file is a JSON text.
//      lines: an array of strings, the source.
//      module: true if an import or export statement was used.
//      ok: true if no warnings were generated. This is what you want.
//      option: the option argument.
//      property: a property object.
//      stop: true if JSLint was unable to finish. You don't want this.
//      tokens: an array of objects representing the tokens in the file.
//      tree: the token objects arranged in a tree.
//      warnings: an array of warning objects. A warning object can contain:
//          name: "JSLintError"
//          column: A column number in the file.
//          line: A line number in the file.
//          code: A warning code string.
//          message: The warning message string.
//          a: Exhibit A.
//          b: Exhibit B.
//          c: Exhibit C.
//          d: Exhibit D.

// jslint works in several phases. In any of these phases, errors might be
// found. Sometimes JSLint is able to recover from an error and continue
// parsing. In some cases, it can not and will stop early. If that should
// happen, repair your code and try again.

// Phases:

//      0. If the source is a single string, split it into an array of strings.
//      1. Turn the source into an array of tokens.
//      2. Furcate the tokens into a parse tree.
//      3. Walk the tree, traversing all of the nodes of the tree. It is a
//          recursive traversal. Each node may be processed on the way down
//          (preaction) and on the way up (postaction).
//      4. Check the whitespace between the tokens.

// jslint can also examine JSON text. It decides that a file is JSON text if
// the first token is "[" or "{". Processing of JSON text is much simpler than
// the processing of JavaScript programs. Only the first three phases are
// required.

// WARNING: JSLint will hurt your feelings.

/*property
    a, and, arity, assign, b, bad_assignment_a, bad_directive_a, bad_get,
    bad_import_meta_a, bad_module_name_a, bad_option_a, bad_property_a, bad_set,
    bitwise, block, body, browser, bun, c, calls, catch, closer, closure, code,
    column, concat, constant, context, couch, create, d, dead, default, deno,
    devel, directive, directives, disrupt, dot, duplicate_a, edition, ellipsis,
    else, empty_block, eval, every, expected_a, expected_a_at_b_c, expected_a_b,
    expected_a_b_from_c_d, expected_a_before_b, expected_a_next_at_b,
    expected_digits_after_a, expected_four_digits, expected_identifier_a,
    expected_line_break_a_b, expected_regexp_factor_a, expected_space_a_b,
    expected_statements_a, expected_string_a, expected_type_string_a, exports,
    expression, extra, finally, flag, forEach, free, freeze, freeze_exports,
    from, froms, fud, fudge, function, function_in_loop, g, getset, global, i,
    id, identifier, import, indexOf, infix_in, init, isArray, isNaN, join, json,
    keys, label, label_a, lbp, led, length, level, line, lines, live, long,
    loop, m, margin, match, message, misplaced_a, misplaced_directive_a,
    missing_browser, missing_m, module, naked_block, name, names,
    nested_comment, new, node, not_label_a, nr, nud, null, number_isNaN, ok,
    open, opening, option, out_of_scope_a, parameters, property, push, quote,
    raw, redefinition_a_b, replace, required_a_optional_b, reserved_a, role,
    scope, search, shebang, shift, slice, snug, sort, split, startsWith,
    statement, stop, subscript_a, test, this, thru, tjs, todo_comment, tokens,
    too_long, too_many_digits, tree, try, type, u, unclosed_comment,
    unclosed_mega, unclosed_string, undeclared_a, unexpected_a,
    unexpected_a_after_b, unexpected_a_before_b, unexpected_at_top_level_a,
    unexpected_char_a, unexpected_comment, unexpected_directive_a,
    unexpected_expression_a, unexpected_label_a, unexpected_parens,
    unexpected_space_a_b, unexpected_statement_a, unexpected_trailing_space,
    unexpected_typeof_a, unexpected_var, uninitialized_a, unreachable_a,
    unregistered_property_a, unshift, unused_a, use_double, use_open,
    use_spaces, used, value, variable, warning, warnings, web,
    weird_condition_a, weird_expression_a, weird_loop, weird_relation_a, white,
    wrap_condition, wrap_immediate, wrap_parameter, wrap_regexp, wrap_unary,
    wrapped, writable, y
*/

function empty() {

// The empty function produces a new empty object that inherits nothing. This is
// much better than '{}' because confusions around accidental method names like
// 'constructor' are completely avoided.

    return Object.create(null);
}

function populate(array, object = empty(), value = true) {

// Augment an object by taking property names from an array of strings.

    array.forEach(function (name) {
        object[name] = value;
    });
    return object;
}

const language = [

// These are the globals that are provided by the language standard.

    "AggregateError", "Array", "ArrayBuffer", "Boolean", "DataView", "Date",
    "decodeURI", "decodeURIComponent", "encodeURI", "encodeURIComponent",
    "Error", "EvalError", "FinalizationRegistry", "Float32Array",
    "Float64Array", "Int8Array", "Int16Array", "Int32Array", "Intl", "JSON",
    "Map", "Math", "Number", "Object", "parseInt", "parseFloat", "Promise",
    "Proxy", "RangeError", "ReferenceError", "Reflect", "RegExp", "Set",
    "String", "Symbol", "SyntaxError", "TypeError", "Uint8Array",
    "Uint8ClampedArray", "Uint16Array", "Uint32Array", "URIError", "WeakMap",
    "WeakRef", "WeakSet"
];

const web = [

// These are the globals that are provided by web runtimes.

    "AbortController", "AbortSignal", "atob", "Blob", "btoa",
    "ByteLengthQueuingStrategy", "clearInterval", "clearTimeout",
    "CompressionStream", "CountQueuingStrategy", "Crypto", "crypto",
    "CryptoKey", "DecompressionStream", "DOMException", "Event", "EventTarget",
    "fetch", "File", "FormData", "Headers", "navigator", "performance",
    "queueMicrotask", "ReadableByteStreamController", "ReadableStream",
    "ReadableStreamBYOBReader", "ReadableStreamBYOBRequest",
    "ReadableStreamDefaultController", "ReadableStreamDefaultReader", "Request",
    "Response", "setInterval", "setTimeout", "structuredClone", "SubtleCrypto",
    "TextDecoder", "TextDecoderStream", "TextEncoder", "TextEncoderStream",
    "TransformStream", "TransformStreamDefaultController", "URL",
    "URLSearchParams", "WebAssembly", "WritableStream",
    "WritableStreamDefaultController"
];

const allowed_option = {

// These are the options that are recognized in the option object or that may
// appear in a /*jslint*/ directive. Most options will have a boolean value,
// usually true. Some options will also predefine some number of global
// variables.

    bitwise: true,
    browser: web.concat([
        "addEventListener", "AudioContext", "caches", "cancelAnimationFrame",
        "CharacterData", "customElements", "document", "DocumentType",
        "DOMParser", "Element", "FileReader", "FontFace", "getComputedStyle",
        "history", "indexedDB", "IntersectionObserver", "isSecureContext",
        "localStorage", "location", "matchMedia", "MediaRecorder",
        "MutationObserver", "Node", "postMessage", "removeEventListener",
        "requestAnimationFrame", "ResizeObserver", "RTCPeerConnection",
        "screen", "sessionStorage", "scrollTo", "WebSocket", "Worker",
        "XMLHttpRequest"
    ]),
    bun: web.concat([
        "Bun", "WebSocket", "Worker"
    ]),
    couch: [
        "emit", "getRow", "isArray", "log", "provides", "registerType",
        "require", "send", "start", "sum", "toJSON"
    ],
    deno: web.concat([
        "addEventListener", "Deno", "FileReader", "localStorage",
        "removeEventListener", "sessionStorage", "WebSocket", "Worker"
    ]),
    devel: [
        "alert", "confirm", "console", "prompt"
    ],
    eval: true,
    fudge: true,
    getset: true,
    global: [
        "globalThis"
    ],
    long: true,
    node: web.concat([
        "clearImmediate", "exports", "module", "require", "setImmediate",
        "__dirname", "__filename"
    ]),
    null: true,
    this: true,
    tjs: web.concat([
        "tjs", "WebSocket", "Worker"
    ]),
    web,
    white: true
};

const anticondition = populate([
    "?", "~", "&", "|", "^", "<<", ">>", ">>>", "+", "-", "*", "/", "%",
    "typeof", "(number)", "(string)"
]);

// These are the bitwise operators.

const bitwiseop = populate([
    "~", "^", "^=", "&", "&=", "|", "|=", "<<", "<<=", ">>", ">>=",
    ">>>", ">>>="
]);

const escapeable = populate([
    "\\", "/", "`", "b", "f", "n", "r", "t"
]);

const opener = {

// The open and close pairs.

    "(": ")",       // paren
    "[": "]",       // bracket
    "{": "}",       // brace
    "${": "}"       // mega
};

// The relational operators.

const relationop = populate([
    "!=", "!==", "==", "===", "<", "<=", ">", ">="
]);

// This is the set of infix operators that require a space on each side.

const spaceop = populate([
    "!=", "!==", "%", "%=", "&", "&=", "&&", "*", "*=", "+=", "-=", "/",
    "/=", "<", "<=", "<<", "<<=", "=", "==", "===", "=>", ">", ">=",
    ">>", ">>=", ">>>", ">>>=", "^", "^=", "|", "|=", "||"
]);

const bundle = {

// The bundle contains the raw text messages that are generated by jslint. It
// seems that they are all error messages and warnings. There are no "Atta
// boy!" or "You are so awesome!" messages. There is no positive reinforcement
// or encouragement. This relentless negativity can undermine self-esteem and
// wound the inner child. But if you accept it as sound advice rather than as
// personal criticism, it can make your programs better.

    and: "The '&&' subexpression should be wrapped in parens.",
    bad_assignment_a: "Bad assignment to '{a}'.",
    bad_directive_a: "Bad directive '{a}'.",
    bad_get: "A get function takes no parameters.",
    bad_import_meta_a: "Bad import.meta property '{a}'.",
    bad_module_name_a: "Bad module name '{a}'.",
    bad_option_a: "Bad option '{a}'.",
    bad_property_a: "Bad property name '{a}'.",
    bad_set: "A set function takes one parameter.",
    duplicate_a: "Duplicate '{a}'.",
    empty_block: "Empty block.",
    expected_a: "Expected '{a}'.",
    expected_a_at_b_c: "Expected '{a}' at column {b}, not column {c}.",
    expected_a_b: "Expected '{a}' and instead saw '{b}'.",
    expected_a_b_from_c_d: (
        "Expected '{a}' to match '{b}' from line {c} and instead saw '{d}'."
    ),
    expected_a_before_b: "Expected '{a}' before '{b}'.",
    expected_a_next_at_b: "Expected '{a}' at column {b} on the next line.",
    expected_digits_after_a: "Expected digits after '{a}'.",
    expected_four_digits: "Expected four digits after '\\u'.",
    expected_identifier_a: "Expected an identifier and instead saw '{a}'.",
    expected_line_break_a_b: "Expected a line break between '{a}' and '{b}'.",
    expected_regexp_factor_a: "Expected a regexp factor and instead saw '{a}'.",
    expected_space_a_b: "Expected one space between '{a}' and '{b}'.",
    expected_statements_a: "Expected statements before '{a}'.",
    expected_string_a: "Expected a string and instead saw '{a}'.",
    expected_type_string_a: "Expected a type string and instead saw '{a}'.",
    freeze_exports: (
        "Expected 'Object.freeze('. All export values should be frozen."
    ),
    function_in_loop: "Don't make functions within a loop.",
    infix_in: (
        "Unexpected 'in'. Compare with undefined, "
        + "or use the hasOwnProperty method instead."
    ),
    label_a: "'{a}' is a statement label.",
    misplaced_a: "Place '{a}' at the outermost level.",
    misplaced_directive_a: (
        "Place the '/*{a}*/' directive before the first statement."
    ),
    missing_browser: "/*global*/ requires the Assume a browser option.",
    missing_m: "Expected 'm' flag on a multiline regular expression.",
    naked_block: "Naked block.",
    nested_comment: "Nested comment.",
    not_label_a: "'{a}' is not a label.",
    number_isNaN: "Use Number.isNaN function to compare with NaN.",
    out_of_scope_a: "'{a}' is out of scope.",
    redefinition_a_b: "Redefinition of '{a}' from line {b}.",
    required_a_optional_b: (
        "Required parameter '{a}' after optional parameter '{b}'."
    ),
    reserved_a: "Reserved name '{a}'.",
    subscript_a: "['{a}'] is better written in dot notation.",
    todo_comment: "Unexpected TODO comment.",
    too_long: "Line is longer than 80 characters.",
    too_many_digits: "Too many digits.",
    unclosed_comment: "Unclosed comment.",
    unclosed_mega: "Unclosed mega literal.",
    unclosed_string: "Unclosed string.",
    undeclared_a: "Undeclared '{a}'.",
    unexpected_a: "Unexpected '{a}'.",
    unexpected_a_after_b: "Unexpected '{a}' after '{b}'.",
    unexpected_a_before_b: "Unexpected '{a}' before '{b}'.",
    unexpected_at_top_level_a: "Expected '{a}' to be in a function.",
    unexpected_char_a: "Unexpected character '{a}'.",
    unexpected_comment: "Unexpected comment.",
    unexpected_directive_a: "When using modules, don't use directive '/*{a}'.",
    unexpected_expression_a: (
        "Unexpected expression '{a}' in statement position."
    ),
    unexpected_label_a: "Unexpected label '{a}'.",
    unexpected_parens: "Don't wrap function literals in parens.",
    unexpected_space_a_b: "Unexpected space between '{a}' and '{b}'.",
    unexpected_statement_a: (
        "Unexpected statement '{a}' in expression position."
    ),
    unexpected_trailing_space: "Unexpected trailing space.",
    unexpected_typeof_a: (
        "Unexpected 'typeof'. Use '===' to compare directly with {a}."
    ),
    unexpected_var: "Unexpected var, use let or const instead.",
    uninitialized_a: "Uninitialized '{a}'.",
    unreachable_a: "Unreachable '{a}'.",
    unregistered_property_a: "Unregistered property name '{a}'.",
    unused_a: "Unused '{a}'.",
    use_double: "Use double quotes, not single quotes.",
    use_open: (
        "Wrap a ternary expression in parens, "
        + "with a line break after the left paren."
    ),
    use_spaces: "Use spaces, not tabs.",
    weird_condition_a: "Weird condition '{a}'.",
    weird_expression_a: "Weird expression '{a}'.",
    weird_loop: "Weird loop.",
    weird_relation_a: "Weird relation '{a}'.",
    wrap_condition: "Wrap the condition in parens.",
    wrap_immediate: (
        "Wrap an immediate function invocation in parentheses to assist "
        + "the reader in understanding that the expression is the result "
        + "of a function, and not the function itself."
    ),
    wrap_parameter: "Wrap the parameter in parens.",
    wrap_regexp: "Wrap this regexp in parens to avoid confusion.",
    wrap_unary: "Wrap the unary expression in parens."
};

// Regular expression literals:

function tag_regexp(strings) {
    return new RegExp(strings.raw[0].replace(/\s/g, ""));
}

// supplant {variables}
const rx_supplant = /\{([^{}]*)\}/g;
// carriage return, carriage return linefeed, or linefeed
const rx_crlf = tag_regexp `
      \n
    | \r \n?
`;
const rx_identifier = tag_regexp ` ^(
    [ a-z A-Z _ $ ]
    [ a-z A-Z 0-9 _ $ ]*
)$`;
const rx_module = tag_regexp ` ^ [ a-z A-Z 0-9 _ $ : . @ \- \/ ]+ $ `;
const rx_bad_property = tag_regexp `
    ^_
  | \$
  | Sync $
  | _ $
`;
const rx_star_slash = tag_regexp ` \* \/ `;
const rx_slash_star = tag_regexp ` \/ \* `;
// slash star or ending slash
const rx_slash_star_or_slash = tag_regexp ` \/ \* | \/ $ `;
// uncompleted work comment
const rx_todo = tag_regexp ` \b (?:
    todo
  | TO \s? DO
  | HACK
) \b `;
const rx_tab = /\t/g;
const rx_directive = tag_regexp ` ^ (
    jslint
  | property
  | global
) \s+ ( .* ) $ `;
const rx_directive_part = tag_regexp ` ^ (
    [ a-z A-Z $ _ ] [ a-z A-Z 0-9 $ _ ]*
) (?:
    : \s* ( true | false )
)? ,? \s* ( .* ) $ `;
const rx_token = tag_regexp ` ^ (
    (\s+)
  | (
      [ a-z A-Z _ $ ]
      [ a-z A-Z 0-9 _ $ ]*
    )
  | [
      ( ) { } \[ \] , : ; ' " ~ \`
    ]
  | \? [ ? . ]?
  | = (?:
        = =?
      | >
    )?
  | \.+
  | \* [ * \/ = ]?
  | \/ [ * \/ ]?
  | \+ [ = + ]?
  | - [ = \- ]?
  | [ \^ % ] =?
  | & [ & = ]?
  | \| [ | = ]?
  | >{1,3} =?
  | < <? =?
  | ! (?:
        !
      | = =?
    )?
  | (
        0
      | [ 1-9 ] [ 0-9 ]*
    )
) ( .* ) $ `;
const rx_digits = /^[0-9]*/;
const rx_hexs = /^[0-9A-F]*/i;
const rx_octals = /^[0-7]*/;
const rx_bits = /^[01]*/;
const rx_mega = /[`\\]|\$\{/;
const rx_JSON_number = tag_regexp ` ^
    -?
    (?: 0 | [ 1-9 ] \d* )
    (?: \. \d* )?
    (?: [ e E ] [ \- + ]? \d+ )?
$ `;
const rx_initial_cap = /^[A-Z]/;

function is_letter(string) {
    return (
        (string >= "a" && string <= "z\uffff")
        || (string >= "A" && string <= "Z\uffff")
    );
}

function supplant(string, object) {
    return string.replace(rx_supplant, function (found, filling) {
        const replacement = object[filling];
        return (
            replacement !== undefined
            ? replacement
            : found
        );
    });
}

let anon;               // The guessed name for anonymous functions.
let blockage;           // The current block.
let block_stack;        // The stack of blocks.
let blocks;             // The array containing all of the blocks.
let declared_globals;   // The object containing the global declarations.
let directives;         // The directive comments.
let directive_mode;     // true if directives are still allowed.
let early_stop;         // true if JSLint can not finish.
let exports;            // The exported names and values.
let froms;              // The array collecting all import specifier strings.
let fudge;              // The first natural number: 0 or 1.
let functionage;        // The current function.
let global;             // The global object; the outermost context.
let json_mode;          // true if parsing JSON.
let lines;              // The array containing source lines.
let mega_mode;          // true if currently parsing a megastring literal.
let module_mode;        // true if import or export was used.
let next_token;         // The next token to be examined in the parse.
let option;             // The options parameter.
let property;           // The object containing the tallied property names.
let shebang;            // true if a #! was seen on the first line.
let stack;              // The stack of functions.
let syntax;             // The object containing the parser.
let token;              // The current token being examined in the parse.
let token_nr;           // The number of the next token.
let tokens;             // The array of tokens.
let tenure;             // The predefined property registry.
let tree;               // The abstract parse tree.
let warnings;           // The array collecting all generated warnings.

// Error reportage functions:

function artifact(the_token) {

// Return a string representing an artifact.

    if (the_token === undefined) {
        the_token = next_token;
    }
    return (
        (the_token.id === "(string)" || the_token.id === "(number)")
        ? String(the_token.value)
        : the_token.id
    );
}

function artifact_line(the_token) {

// Return the fudged line number of an artifact.

    if (the_token === undefined) {
        the_token = next_token;
    }
    return the_token.line + fudge;
}

function artifact_column(the_token) {

// Return the fudged column number of an artifact.

    if (the_token === undefined) {
        the_token = next_token;
    }
    return the_token.from + fudge;
}

function warn_at(code, line, column, a, b, c, d) {

// Report an error at some line and column of the program. The warning object
// resembles an exception.

    const warning = {
        name: "JSLintError",
        column,
        line,
        code
    };
    if (a !== undefined) {
        warning.a = a;
    }
    if (b !== undefined) {
        warning.b = b;
    }
    if (c !== undefined) {
        warning.c = c;
    }
    if (d !== undefined) {
        warning.d = d;
    }
    warning.message = supplant(bundle[code] || code, warning);
    warnings.push(warning);
    return warning;
}

function stop_at(code, line, column, a, b, c, d) {

// Same as warn_at, except that it stops the analysis.

    throw warn_at(code, line, column, a, b, c, d);
}

function warn(code, the_token, a, b, c, d) {

// Same as warn_at, except the warning will be associated with a specific token.
// If there is already a warning on this token, suppress the new one. It is
// likely that the first warning will be the most meaningful.

    if (the_token === undefined) {
        the_token = next_token;
    }
    if (the_token.warning === undefined) {
        the_token.warning = warn_at(
            code,
            the_token.line,
            the_token.from,
            a || artifact(the_token),
            b,
            c,
            d
        );
        return the_token.warning;
    }
}

function stop(code, the_token, a, b, c, d) {

// Similar to warn and stop_at. If the token already had a warning, that
// warning will be replaced with this new one. It is likely that the stopping
// warning will be the more meaningful.

    if (the_token === undefined) {
        the_token = next_token;
    }
    delete the_token.warning;
    throw warn(code, the_token, a, b, c, d);
}

// Tokenize:

function tokenize(source) {

// tokenize takes a source and produces from it an array of token objects.
// JavaScript is notoriously difficult to tokenize because of the horrible
// interactions between automatic semicolon insertion, regular expression
// literals, and now megastring literals. JSLint benefits from eliminating
// automatic semicolon insertion and nested megastring literals, which allows
// full tokenization to precede parsing.

// If the source is not an array, then it is split into lines at the
// carriage return/linefeed.

    lines = (
        Array.isArray(source)
        ? source
        : source.split(rx_crlf)
    );
    tokens = [];

    let char;                   // a popular character
    let column = 0;             // the column number of the next character
    let first;                  // the first token
    let from;                   // the starting column number of the token
    let line = -1;              // the line number of the next character
    let nr = 0;                 // the next token number
    let previous = global;      // the previous token including comments
    let prior = global;         // the previous token excluding comments
    let mega_from;              // the starting column of megastring
    let mega_line;              // the starting line of megastring
    let regexp_seen;            // regular expression literal seen on this line
    let snippet;                // a piece of string
    let source_line = "";       // the remaining line source string
    let whole_line = "";        // the whole line source string

    if (lines[0].startsWith("#!")) {
        line = 0;
        shebang = true;
    }

    function next_line() {

// Put the next line of source in source_line. If the line contains tabs,
// replace them with spaces and give a warning. Also warn if the line contains
// unsafe characters or is too damn long.

        let at;
        if (
            !option.long
            && whole_line.length > 80
            && !json_mode
            && first
            && !regexp_seen
        ) {
            warn_at("too_long", line, 80);
        }
        column = 0;
        line += 1;
        regexp_seen = false;
        source_line = lines[line];
        whole_line = source_line || "";
        if (source_line !== undefined) {
            at = source_line.search(rx_tab);
            if (at >= 0) {
                if (!option.white) {
                    warn_at("use_spaces", line, at + 1);
                }
                source_line = source_line.replace(rx_tab, " ");
            }
            if (!option.white && source_line.slice(-1) === " ") {
                warn_at(
                    "unexpected_trailing_space",
                    line,
                    source_line.length - 1
                );
            }
        }
        return source_line;
    }

// Most tokens, including the identifiers, operators, and punctuators, can be
// found with a regular expression. Regular expressions can not correctly match
// regular expression literals, so we will match those the hard way. String
// literals and number literals can be matched by regular expressions, but they
// don't provide good warnings. The functions snip, next_char, back_char,
// some_digits, and escape help in the parsing of literals.

    function snip() {

// Remove the last character from snippet.

        snippet = snippet.slice(0, -1);
    }

    function next_char(match) {

// Get the next character from the source line. Remove it from the source_line,
// and append it to the snippet. Optionally check that the previous character
// matched an expected value.

        if (match !== undefined && char !== match) {
            return stop_at(
                (
                    char === ""
                    ? "expected_a"
                    : "expected_a_b"
                ),
                line,
                column - 1,
                match,
                char
            );
        }
        if (source_line) {
            char = source_line[0];
            source_line = source_line.slice(1);
            snippet += char;
        } else {
            char = "";
            snippet += " ";
        }
        column += 1;
        return char;
    }

    function back_char() {

// Back up one character by moving a character from the end of the snippet to
// the front of the source_line.

        if (snippet) {
            char = snippet.slice(-1);
            source_line = char + source_line;
            column -= 1;
            snip();
        } else {
            char = "";
        }
        return char;
    }

    function some_digits(rx, quiet) {
        const digits = source_line.match(rx)[0];
        const length = digits.length;
        if (!quiet && length === 0) {
            warn_at("expected_digits_after_a", line, column, snippet);
        }
        column += length;
        source_line = source_line.slice(length);
        snippet += digits;
        next_char();
        return length;
    }

    function escape(extra) {
        next_char("\\");
        if (escapeable[char] === true) {
            return next_char();
        }
        if (char === "") {
            return stop_at("unclosed_string", line, column);
        }
        if (char === "u") {
            if (next_char("u") === "{") {
                if (json_mode) {
                    warn_at("unexpected_a", line, column - 1, char);
                }
                if (some_digits(rx_hexs) > 5) {
                    warn_at("too_many_digits", line, column - 1);
                }
                if (next_char() !== "}") {
                    stop_at("expected_a_before_b", line, column, "}", char);
                }
                return next_char();
            }
            back_char();
            if (some_digits(rx_hexs, true) < 4) {
                warn_at("expected_four_digits", line, column - 1);
            }
            return;
        }
        if (extra && extra.indexOf(char) >= 0) {
            return next_char();
        }
        warn_at("unexpected_a_before_b", line, column - 2, "\\", char);
    }

    function make(id, value, identifier) {

// Make the token object and append it to the tokens list.

        const the_token = {
            from,
            id,
            identifier: Boolean(identifier),
            line,
            nr,
            thru: column
        };
        tokens[nr] = the_token;
        nr += 1;

// Directives must appear before the first statement.

        if (id !== "(comment)" && id !== ";") {
            directive_mode = false;
        }

// If the token is to have a value, give it one.

        if (value !== undefined) {
            the_token.value = value;
        }

// If this token is an identifier that touches a preceding number, or
// a "/", comment, or regular expression literal that touches a preceding
// comment or regular expression literal, then give a missing space warning.
// This warning is not suppressed by option.white.

        if (
            previous.line === line
            && previous.thru === from
            && (id === "(comment)" || id === "(regexp)" || id === "/")
            && (previous.id === "(comment)" || previous.id === "(regexp)")
        ) {
            warn(
                "expected_space_a_b",
                the_token,
                artifact(previous),
                artifact(the_token)
            );
        }
        if (previous.id === "." && id === "(number)") {
            warn("expected_a_before_b", previous, "0", ".");
        }
        if (prior.id === "." && the_token.identifier) {
            the_token.dot = true;
        }

// The previous token is used to detect adjacency problems.

        previous = the_token;

// The prior token is a previous token that was not a comment. The prior token
// is used to disambiguate "/", which can mean division or regular expression
// literal.

        if (previous.id !== "(comment)") {
            prior = previous;
        }
        return the_token;
    }

    function parse_directive(the_comment, body) {

// JSLint recognizes three directives that can be encoded in comments. This
// function processes one item, and calls itself recursively to process the
// next one.

        const result = body.match(rx_directive_part);
        if (result) {
            let allowed;
            const name = result[1];
            const value = result[2];
            if (the_comment.directive === "jslint") {
                allowed = allowed_option[name];
                if (
                    typeof allowed === "boolean"
                    || typeof allowed === "object"
                ) {
                    if (
                        value === ""
                        || value === "true"
                        || value === undefined
                    ) {
                        option[name] = true;
                        if (Array.isArray(allowed)) {
                            populate(allowed, declared_globals, false);
                        }
                    } else if (value === "false") {
                        option[name] = false;
                    } else {
                        warn("bad_option_a", the_comment, name + ":" + value);
                    }
                } else {
                    warn("bad_option_a", the_comment, name);
                }
            } else if (the_comment.directive === "property") {
                if (tenure === undefined) {
                    tenure = empty();
                }
                tenure[name] = true;
            } else if (the_comment.directive === "global") {
                if (value) {
                    warn("bad_option_a", the_comment, name + ":" + value);
                }
                declared_globals[name] = false;
                module_mode = the_comment;
            }
            return parse_directive(the_comment, result[3]);
        }
        if (body) {
            return stop("bad_directive_a", the_comment, body);
        }
    }

    function comment(snippet) {

// Make a comment object. Comments are not allowed in JSON text. Comments can
// include directives and notices of incompletion.

        const the_comment = make("(comment)", snippet);
        if (Array.isArray(snippet)) {
            snippet = snippet.join(" ");
        }
        if (!option.devel && rx_todo.test(snippet)) {
            warn("todo_comment", the_comment);
        }
        const result = snippet.match(rx_directive);
        if (result) {
            if (!directive_mode) {
                warn_at("misplaced_directive_a", line, from, result[1]);
            } else {
                the_comment.directive = result[1];
                parse_directive(the_comment, result[2]);
            }
            directives.push(the_comment);
        }
        return the_comment;
    }

    function regexp() {

// Parse a regular expression literal.

        let multi_mode = false;
        let result;
        let value;
        regexp_seen = true;

        function quantifier() {

// Match an optional quantifier.

            if (char === "?" || char === "*" || char === "+") {
                next_char();
            } else if (char === "{") {
                if (some_digits(rx_digits, true) === 0) {
                    warn_at("expected_a_before_b", line, column, "0", ",");
                }
                if (char === ",") {
                    some_digits(rx_digits, true);
                }
                next_char("}");
            } else {
                return;
            }
            if (char === "?") {
                next_char("?");
            }
        }

        function subklass() {

// Match a character in a character class.

            if (char === "\\") {
                escape("BbDdSsWw-[]^");
                return true;
            }
            if (
                char === ""
                || char === "["
                || char === "]"
                || char === "/"
                || char === "^"
                || char === "-"
            ) {
                return false;
            }
            if (char === " ") {
                warn_at("expected_a_b", line, column, "\\u0020", " ");
            } else if (char === "`" && mega_mode) {
                warn_at("unexpected_a", line, column, "`");
            }
            next_char();
            return true;
        }

        function ranges() {

// Match a range of subclasses.

            if (subklass()) {
                if (char === "-") {
                    next_char("-");
                    if (!subklass()) {
                        return stop_at("unexpected_a", line, column - 1, "-");
                    }
                }
                return ranges();
            }
        }

        function klass() {

// Match a class.

            next_char("[");
            if (char === "^") {
                next_char("^");
            }
            (function classy() {
                ranges();
                if (char !== "]" && char !== "") {
                    warn_at(
                        "expected_a_before_b",
                        line,
                        column - 1,
                        "\\",
                        char
                    );
                    next_char();
                    return classy();
                }
            }());
            next_char("]");
        }

        function choice() {

            function group() {

// Match a group that starts with left paren.

                next_char("(");
                if (char === "?") {
                    next_char("?");
                    if (char === "<") {
                        next_char("<");
                        if (char === "!") {
                            next_char("!");
                        } else {
                            next_char("=");
                        }
                    } else if (char === "=" || char === "!") {
                        next_char();
                    } else {
                        next_char(":");
                    }
                } else if (char === ":") {
                    warn_at("expected_a_before_b", line, column, "?", ":");
                }
                choice();
                next_char(")");
            }

            function factor() {
                if (
                    char === ""
                    || char === "/"
                    || char === "]"
                    || char === ")"
                ) {
                    return false;
                }
                if (char === "(") {
                    group();
                    return true;
                }
                if (char === "[") {
                    klass();
                    return true;
                }
                if (char === "\\") {
                    escape("BbDdSsWw^${}[]():=!.|*+?");
                    return true;
                }
                if (
                    char === "?"
                    || char === "+"
                    || char === "*"
                    || char === "}"
                    || char === "{"
                ) {
                    warn_at(
                        "expected_a_before_b",
                        line,
                        column - 1,
                        "\\",
                        char
                    );
                } else if (char === "`") {
                    if (mega_mode) {
                        warn_at("unexpected_a", line, column - 1, "`");
                    }
                } else if (char === " ") {
                    warn_at(
                        "expected_a_b",
                        line,
                        column - 1,
                        "\\s",
                        " "
                    );
                } else if (char === "$") {
                    if (source_line[0] !== "/") {
                        multi_mode = true;
                    }
                } else if (char === "^") {
                    if (snippet !== "^") {
                        multi_mode = true;
                    }
                }
                next_char();
                return true;
            }

            function sequence(follow) {
                if (factor()) {
                    quantifier();
                    return sequence(true);
                }
                if (!follow) {
                    warn_at("expected_regexp_factor_a", line, column, char);
                }
            }

// Match a choice (a sequence that can be followed by | and another choice).

            sequence();
            if (char === "|") {
                next_char("|");
                return choice();
            }
        }

// Scan the regexp literal. Give a warning if the first character is = because
// /= looks like a division assignment operator.

        snippet = "";
        next_char();
        if (char === "=") {
            warn_at("expected_a_before_b", line, column, "\\", "=");
        }
        choice();

// Make sure there is a closing slash.

        snip();
        value = snippet;
        next_char("/");

// Process dangling flag letters.

        const allowed = {
            g: true,
            i: true,
            m: true,
            u: true,
            y: true
        };
        const flag = empty();
        (function make_flag() {
            if (is_letter(char)) {
                if (allowed[char] !== true) {
                    warn_at("unexpected_a", line, column, char);
                }
                allowed[char] = false;
                flag[char] = true;
                next_char();
                return make_flag();
            }
        }());
        back_char();
        if (char === "/" || char === "*") {
            return stop_at("unexpected_a", line, from, char);
        }
        result = make("(regexp)", char);
        result.flag = flag;
        result.value = value;
        if (multi_mode && !flag.m) {
            warn_at("missing_m", line, column);
        }
        return result;
    }

    function string(quote) {

// Make a string token.

        let the_token;
        snippet = "";
        next_char();

        return (function next() {
            if (char === quote) {
                snip();
                the_token = make("(string)", snippet);
                the_token.quote = quote;
                return the_token;
            }
            if (char === "") {
                return stop_at("unclosed_string", line, column);
            }
            if (char === "\\") {
                escape(quote);
            } else if (char === "`") {
                if (mega_mode) {
                    warn_at("unexpected_a", line, column, "`");
                }
                next_char("`");
            } else {
                next_char();
            }
            return next();
        }());
    }

    function frack() {
        if (char === ".") {
            some_digits(rx_digits);
        }
        if (char === "E" || char === "e") {
            next_char();
            if (char !== "+" && char !== "-") {
                back_char();
            }
            some_digits(rx_digits);
        }
    }

    function number() {
        if (snippet === "0") {
            next_char();
            if (char === ".") {
                frack();
            } else if (char === "b") {
                some_digits(rx_bits);
            } else if (char === "o") {
                some_digits(rx_octals);
            } else if (char === "x") {
                some_digits(rx_hexs);
            }
        } else {
            next_char();
            frack();
        }

// If the next character after a number is a digit or letter, then something
// unexpected is going on.

        if (
            (char >= "0" && char <= "9")
            || (char >= "a" && char <= "z")
            || (char >= "A" && char <= "Z")
        ) {
            return stop_at(
                "unexpected_a_after_b",
                line,
                column - 1,
                snippet.slice(-1),
                snippet.slice(0, -1)
            );
        }
        back_char();
        return make("(number)", snippet);
    }

    function lex() {
        let array;
        let i = 0;
        let j = 0;
        let last;
        let result;
        let the_token;

// This should properly be a tail recursive function, but sadly, conformant
// implementations of ES6 are still rare. This is the ideal code:

//      if (!source_line) {
//          source_line = next_line();
//          from = 0;
//          return (
//              source_line === undefined
//              ? (
//                  mega_mode
//                  ? stop_at("unclosed_mega", mega_line, mega_from)
//                  : make("(end)")
//              )
//              : lex()
//          );
//      }

// Unfortunately, incompetent JavaScript engines will sometimes fail to execute
// it correctly. So for now, we do it the old fashioned way.

        while (!source_line) {
            source_line = next_line();
            from = 0;
            if (source_line === undefined) {
                return (
                    mega_mode
                    ? stop_at("unclosed_mega", mega_line, mega_from)
                    : make("(end)")
                );
            }
        }

        from = column;
        result = source_line.match(rx_token);

// result[1] token
// result[2] whitespace
// result[3] identifier
// result[4] number
// result[5] rest

        if (!result) {
            return stop_at(
                "unexpected_char_a",
                line,
                column,
                source_line[0]
            );
        }

        snippet = result[1];
        column += snippet.length;
        source_line = result[5];

// Whitespace was matched. Call lex again to get more.

        if (result[2]) {
            return lex();
        }

// The token is an identifier.

        if (result[3]) {
            return make(snippet, undefined, true);
        }

// The token is a number.

        if (result[4]) {
            return number(snippet);
        }

// The token is a string.

        if (snippet === "\"") {
            return string(snippet);
        }
        if (snippet === "'") {
            warn_at("use_double", line, column);
            return string(snippet);
        }

// The token is a megastring. We don't allow any kind of mega nesting.

        if (snippet === "`") {
            if (mega_mode) {
                return stop_at("expected_a_b", line, column, "}", "`");
            }
            snippet = "";
            mega_from = from;
            mega_line = line;
            mega_mode = true;

// Parsing a mega literal is tricky. First make a ` token.

            make("`");
            from += 1;

// Then loop, building up a string, possibly from many lines, until seeing
// the end of file, a closing `, or a ${ indicting an expression within the
// string.

            (function part() {
                const at = source_line.search(rx_mega);

// If neither ` nor ${ is seen, then the whole line joins the snippet.

                if (at < 0) {
                    snippet += source_line + "\n";
                    return (
                        next_line() === undefined
                        ? stop_at("unclosed_mega", mega_line, mega_from)
                        : part()
                    );
                }
                snippet += source_line.slice(0, at);
                column += at;
                source_line = source_line.slice(at);
                if (source_line[0] === "\\") {
                    snippet += source_line.slice(0, 2);
                    source_line = source_line.slice(2);
                    column += 2;
                    return part();
                }

// if either ` or ${ was found, then the preceding joins the snippet to become
// a string token.

                make("(string)", snippet).quote = "`";
                snippet = "";

// If ${, then make tokens that will become part of an expression until
// a } token is made.

                if (source_line[0] === "$") {
                    column += 2;
                    make("${");
                    source_line = source_line.slice(2);
                    (function expr() {
                        const id = lex().id;
                        if (id === "{") {
                            return stop_at(
                                "expected_a_b",
                                line,
                                column,
                                "}",
                                "{"
                            );
                        }
                        if (id !== "}") {
                            return expr();
                        }
                    }());
                    snippet = "";
                    return part();
                }
            }());
            source_line = source_line.slice(1);
            column += 1;
            mega_mode = false;
            return make("`");
        }

// The token is a // comment.

        if (snippet === "//") {
            snippet = source_line;
            source_line = "";
            the_token = comment(snippet);
            if (mega_mode) {
                warn("unexpected_comment", the_token, "`");
            }
            return the_token;
        }

// The token is a /* comment.

        if (snippet === "/*") {
            array = [];
            if (source_line[0] === "/") {
                warn_at("unexpected_a", line, column + i, "/");
            }
            (function next() {
                if (source_line > "") {
                    i = source_line.search(rx_star_slash);
                    if (i >= 0) {
                        return;
                    }
                    j = source_line.search(rx_slash_star);
                    if (j >= 0) {
                        warn_at("nested_comment", line, column + j);
                    }
                }
                array.push(source_line);
                source_line = next_line();
                if (source_line === undefined) {
                    return stop_at("unclosed_comment", line, column);
                }
                return next();
            }());
            snippet = source_line.slice(0, i);
            j = snippet.search(rx_slash_star_or_slash);
            if (j >= 0) {
                warn_at("nested_comment", line, column + j);
            }
            array.push(snippet);
            column += i + 2;
            source_line = source_line.slice(i + 2);
            return comment(array);
        }

// The token is a slash.

        if (snippet === "/") {

// The / can be a division operator or the beginning of a regular expression
// literal. It is not possible to know which without doing a complete parse.
// We want to complete the tokenization before we begin to parse, so we will
// estimate. This estimator can fail in some cases. For example, it can not
// know if "}" is ending a block or ending an object literal, so it can
// behave incorrectly in that case; it is not meaningful to divide an
// object, so it is likely that we can get away with it. We avoided the worst
// cases by eliminating automatic semicolon insertion.

            if (prior.identifier) {
                if (!prior.dot) {
                    if (prior.id === "return") {
                        return regexp();
                    }
                    if (
                        prior.id === "(begin)"
                        || prior.id === "case"
                        || prior.id === "delete"
                        || prior.id === "in"
                        || prior.id === "instanceof"
                        || prior.id === "new"
                        || prior.id === "typeof"
                        || prior.id === "void"
                        || prior.id === "yield"
                    ) {
                        the_token = regexp();
                        return stop("unexpected_a", the_token);
                    }
                }
            } else {
                last = prior.id[prior.id.length - 1];
                if ("(,=:?[".indexOf(last) >= 0) {
                    return regexp();
                }
                if ("!&|{};~+-*%/^<>".indexOf(last) >= 0) {
                    the_token = regexp();
                    warn("wrap_regexp", the_token);
                    return the_token;
                }
            }
            if (source_line[0] === "=") {
                column += 1;
                source_line = source_line.slice(1);
                snippet = "/=";
                warn_at("unexpected_a", line, column, "/=");
            }
        }
        return make(snippet);
    }

    first = lex();
    json_mode = first.id === "{" || first.id === "[";

// This loop will be replaced with a recursive call to lex when ES6 has been
// finished and widely deployed and adopted.

    while (true) {
        if (lex().id === "(end)") {
            break;
        }
    }
}

// Parsing:

// Parsing weaves the tokens into an abstract syntax tree. During that process,
// a token may be given any of these properties:

//      arity       string
//      label       identifier
//      name        identifier
//      expression  expressions
//      block       statements
//      else        statements (else, catch)

// Specialized tokens may have additional properties.

function survey(name) {
    let id = name.id;

// Tally the property name. If it is a string, only tally strings that conform
// to the identifier rules.

    if (id === "(string)") {
        id = name.value;
        if (!rx_identifier.test(id)) {
            return id;
        }
    } else if (id === "`") {
        if (name.value.length === 1) {
            id = name.value[0].value;
            if (!rx_identifier.test(id)) {
                return id;
            }
        }
    } else if (!name.identifier) {
        return stop("expected_identifier_a", name);
    }

// If we have seen this name before, increment its count.

    if (typeof property[id] === "number") {
        property[id] += 1;

// If this is the first time seeing this property name, and if there is a
// tenure list, then it must be on the list. Otherwise, it must conform to
// the rules for good property names.

    } else {
        if (tenure !== undefined) {
            if (tenure[id] !== true) {
                warn("unregistered_property_a", name);
            }
        } else {
            if (name.identifier && rx_bad_property.test(id)) {
                warn("bad_property_a", name);
            }
        }
        property[id] = 1;
    }
    return id;
}

function dispense() {

// Deliver the next token, skipping the comments.

    const cadet = tokens[token_nr];
    token_nr += 1;
    if (cadet.id === "(comment)") {
        if (json_mode) {
            warn("unexpected_a", cadet);
        }
        return dispense();
    } else {
        return cadet;
    }
}

function lookahead() {

// Look ahead one token without advancing.

    const old_token_nr = token_nr;
    const cadet = dispense();
    token_nr = old_token_nr;
    return cadet;
}

function advance(id, match) {

// Produce the next token.

// Attempt to give helpful names to anonymous functions.

    if (token.identifier && token.id !== "function") {
        anon = token.id;
    } else if (token.id === "(string)" && rx_identifier.test(token.value)) {
        anon = token.value;
    }

// Attempt to match next_token with an expected id.

    if (id !== undefined && next_token.id !== id) {
        return (
            match === undefined
            ? stop("expected_a_b", next_token, id, artifact())
            : stop(
                "expected_a_b_from_c_d",
                next_token,
                id,
                artifact(match),
                artifact_line(match),
                artifact(next_token)
            )
        );
    }

// Promote the tokens, skipping comments.

    token = next_token;
    next_token = dispense();
    if (next_token.id === "(end)") {
        token_nr -= 1;
    }
}

// Parsing of JSON is simple:

function json_value() {
    let negative;
    if (next_token.id === "{") {
        return (function json_object() {
            const brace = next_token;
            const object = empty();
            const properties = [];
            brace.expression = properties;
            advance("{");
            if (next_token.id !== "}") {
                (function next() {
                    let name;
                    let value;
                    if (next_token.quote !== "\"") {
                        warn(
                            "unexpected_a",
                            next_token,
                            next_token.quote
                        );
                    }
                    name = next_token;
                    advance("(string)");
                    if (object[token.value] !== undefined) {
                        warn("duplicate_a", token);
                    } else if (token.value === "__proto__") {
                        warn("bad_property_a", token);
                    } else {
                        object[token.value] = token;
                    }
                    advance(":");
                    value = json_value();
                    value.label = name;
                    properties.push(value);
                    if (next_token.id === ",") {
                        advance(",");
                        return next();
                    }
                }());
            }
            advance("}", brace);
            return brace;
        }());
    }
    if (next_token.id === "[") {
        return (function json_array() {
            const bracket = next_token;
            const elements = [];
            bracket.expression = elements;
            advance("[");
            if (next_token.id !== "]") {
                (function next() {
                    elements.push(json_value());
                    if (next_token.id === ",") {
                        advance(",");
                        return next();
                    }
                }());
            }
            advance("]", bracket);
            return bracket;
        }());
    }
    if (
        next_token.id === "true"
        || next_token.id === "false"
        || next_token.id === "null"
    ) {
        advance();
        return token;
    }
    if (next_token.id === "(number)") {
        if (!rx_JSON_number.test(next_token.value)) {
            warn("unexpected_a");
        }
        advance();
        return token;
    }
    if (next_token.id === "(string)") {
        if (next_token.quote !== "\"") {
            warn("unexpected_a", next_token, next_token.quote);
        }
        advance();
        return token;
    }
    if (next_token.id === "-") {
        negative = next_token;
        negative.arity = "unary";
        advance("-");
        advance("(number)");
        if (!rx_JSON_number.test(token.value)) {
            warn("unexpected_a", token);
        }
        negative.expression = token;
        return negative;
    }
    stop("unexpected_a");
}

// Now we parse JavaScript.

function enroll(name, role, readonly) {

// Enroll a name into the current block context. The role can be exception,
// function, label, parameter, or variable. We look for variable redefinition
// because it causes confusion.

    const id = name.id;

// Reserved words may not be enrolled.

    if (syntax[id] !== undefined && id !== "_") {
        warn("reserved_a", name);
    } else {

// Has the name been enrolled in this context?

        let earlier = blockage.context[id];
        if (earlier) {
            warn(
                "redefinition_a_b",
                name,
                name.id,
                earlier.line + fudge
            );

// Has the name been enrolled in an outer context?

        } else {
            block_stack.every(function (value) {
                const item = value.context[id];
                if (item !== undefined) {
                    earlier = item;
                }
                return earlier === undefined;
            });
            if (earlier) {
                if (id === "_") {
                    if (earlier.role === "variable") {
                        warn("unexpected_a", name);
                    }
                } else {
                    if (
                        (
                            role !== "exception"
                            || earlier.role !== "exception"
                        )
                        && role !== "parameter"
                        && role !== "function"
                    ) {
                        warn(
                            "redefinition_a_b",
                            name,
                            name.id,
                            earlier.line + fudge
                        );
                    }
                }
            }

// Enroll it.

            blockage.context[id] = name;
            name.dead = true;
            name.function = functionage;
            name.init = false;
            name.role = role;
            name.scope = blockage;
            name.used = 0;
            name.writable = !readonly;
        }
    }
}

function expression(rbp, initial) {

// This is the heart of the Pratt parser. I retained Pratt's nomenclature.
// They are elements of the parsing method called Top Down Operator Precedence.

// nud     Null denotation
// led     Left denotation
// lbp     Left binding power
// rbp     Right binding power

// It processes a nud (variable, constant, prefix operator). It will then
// process leds (infix operators) until the bind powers cause it to stop. It
// returns the expression's parse tree.

    let left;
    let the_symbol;

// Statements will have already advanced, so advance now only if the token is
// not the first of a statement,

    if (!initial) {
        advance();
    }
    the_symbol = syntax[token.id];
    if (the_symbol !== undefined && the_symbol.nud !== undefined) {
        left = the_symbol.nud();
    } else if (token.identifier) {
        left = token;
        left.arity = "variable";
    } else {
        return stop("unexpected_a", token);
    }
    (function right() {
        the_symbol = syntax[next_token.id];
        if (
            the_symbol !== undefined
            && the_symbol.led !== undefined
            && rbp < the_symbol.lbp
        ) {
            advance();
            left = the_symbol.led(left);
            return right();
        }
    }());
    return left;
}

function condition() {

// Parse the condition part of a do, if, while.

    const the_paren = next_token;
    let the_value;
    the_paren.free = true;
    advance("(");
    the_value = expression(0);
    advance(")");
    if (the_value.wrapped === true) {
        warn("unexpected_a", the_paren);
    }
    if (anticondition[the_value.id] === true) {
        warn("unexpected_a", the_value);
    }
    return the_value;
}

function is_weird(thing) {
    return (
        thing.id === "(regexp)"
        || thing.id === "{"
        || thing.id === "=>"
        || thing.id === "function"
        || (thing.id === "[" && thing.arity === "unary")
    );
}

function are_similar(a, b) {
    if (a === b) {
        return true;
    }
    if (Array.isArray(a)) {
        return (
            Array.isArray(b)
            && a.length === b.length
            && a.every(function (value, index) {
                return are_similar(value, b[index]);
            })
        );
    }
    if (Array.isArray(b)) {
        return false;
    }
    if (a.id === "(number)" && b.id === "(number)") {
        return a.value === b.value;
    }
    let a_string;
    let b_string;
    if (a.id === "(string)") {
        a_string = a.value;
    } else if (a.id === "`" && a.constant) {
        a_string = a.value[0].value;
    }
    if (b.id === "(string)") {
        b_string = b.value;
    } else if (b.id === "`" && b.constant) {
        b_string = b.value[0].value;
    }
    if (typeof a_string === "string") {
        return a_string === b_string;
    }
    if (is_weird(a) || is_weird(b)) {
        return false;
    }
    if (a.arity === b.arity && a.id === b.id) {
        if (a.id === "." || a.id === "?.") {
            return (
                are_similar(a.expression, b.expression)
                && are_similar(a.name, b.name)
            );
        }
        if (a.arity === "unary") {
            return are_similar(a.expression, b.expression);
        }
        if (a.arity === "binary") {
            return (
                a.id !== "("
                && are_similar(a.expression[0], b.expression[0])
                && are_similar(a.expression[1], b.expression[1])
            );
        }
        if (a.arity === "ternary") {
            return (
                are_similar(a.expression[0], b.expression[0])
                && are_similar(a.expression[1], b.expression[1])
                && are_similar(a.expression[2], b.expression[2])
            );
        }
        if (a.arity === "function" && a.arity === "regexp") {
            return false;
        }
        return true;
    }
    return false;
}

function semicolon() {

// Try to match a semicolon.

    if (next_token.id === ";") {
        advance(";");
    } else {
        warn_at(
            "expected_a_b",
            token.line,
            token.thru,
            ";",
            artifact(next_token)
        );
    }
    anon = "anonymous";
}

function statement() {

// Parse a statement. Any statement may have a label, but only two statements
// have use for one. A statement can be one of the standard statements, or
// an assignment expression, or an invocation expression.

    let first;
    let the_label;
    let the_statement;
    let the_symbol;
    advance();
    if (token.identifier && next_token.id === ":") {
        the_label = token;
        if (the_label.id === "_") {
            warn("unexpected_a", the_label);
        }
        advance(":");
        if (next_token.id === "do" || next_token.id === "while") {
            enroll(the_label, "label", true);
            the_label.init = true;
            the_label.dead = false;
            the_statement = statement();
            the_label.dead = true;
            the_statement.label = the_label;
            the_statement.statement = true;
            return the_statement;
        }
        advance();
        warn("unexpected_label_a", the_label);
    }

// Parse the statement.

    first = token;
    first.statement = true;
    the_symbol = syntax[first.id];
    if (
        the_symbol === undefined
        || the_symbol.fud === undefined
        || (token.id === "import" && next_token.id === "(")
    ) {

// It is an expression statement.

        the_statement = expression(0, true);
        if (the_statement.wrapped && the_statement.id !== "(") {
            warn("unexpected_a", first);
        }
        if (
            the_statement.id === "("
            && the_statement.expression[0].id === "import"
        ) {

// Modules should not be imported for their side effects.

            warn("unexpected_a");
        }
        semicolon();
    } else {
        the_statement = the_symbol.fud();
    }
    return the_statement;
}

function statements() {

// Parse a list of statements. Give a warning if an unreachable statement
// follows a disruptive statement.

    const array = [];
    (function next(disrupt) {
        if (
            next_token.id !== "}"
            && next_token.id !== "else"
            && next_token.id !== "(end)"
        ) {
            let a_statement = statement();
            array.push(a_statement);
            if (disrupt) {
                warn("unreachable_a", a_statement);
            }
            return next(a_statement.disrupt);
        }
    }(false));
    return array;
}

function not_top_level(thing) {

// Some features should not be at the outermost level.

    if (functionage === global) {
        warn("unexpected_at_top_level_a", thing);
    }
}

function top_level_only(the_thing) {

// Some features must be at the most outermost level.

    if (blockage !== global) {
        warn("misplaced_a", the_thing);
    }
}

function block(special) {

// Parse a block, a sequence of statements wrapped in braces.
//  special "body"      The block is a function body.
//          "_"         No warning on an empty block.
//          "naked"     No advance.
//          undefined   An ordinary block.

    let stmts;
    let the_block;
    if (special !== "naked") {
        advance("{");
    }
    the_block = token;
    the_block.arity = "statement";
    the_block.body = special === "body";
    the_block.context = empty();
    block_stack.unshift(blockage);
    blockage = the_block;
    blocks.push(the_block);

// Top level function bodies may include the "use strict" pragma.

    if (
        special === "body"
        && stack.length === 1
        && next_token.value === "use strict"
    ) {
        next_token.statement = true;
        advance("(string)");
        advance(";");
    }
    stmts = statements();
    the_block.block = stmts;
    if (stmts.length === 0) {
        if (!option.devel && special !== "_") {
            warn("empty_block", the_block);
        }
        the_block.disrupt = false;
    } else {
        the_block.disrupt = stmts[stmts.length - 1].disrupt;
    }
    blockage = block_stack.shift();
    advance("}");
    return the_block;
}

function mutation_check(the_thing) {

// The only expressions that may be assigned to are
//      e.b
//      e[b]
//      v
//      [destructure]
//      {destructure}

    if (
        the_thing.arity !== "variable"
        && the_thing.id !== "."
        && the_thing.id !== "["
        && the_thing.id !== "{"
    ) {
        warn("bad_assignment_a", the_thing);
        return false;
    }
    return true;
}

function left_check(left, right, chained = false) {

// Warn if the left is not one of these:
//      e.b
//      e?.b
//      e[b]
//      e()
//      ?:
//      identifier

    const id = left.id;
    if (
        !left.identifier
        && (
            left.arity !== "ternary"
            || (
                !left_check(left.expression[1])
                && !left_check(left.expression[2])
            )
        )
        && (
            left.arity !== "binary"
            || (
                id !== "."
                && (id !== "?." || chained)
                && id !== "("
                && id !== "["
            )
        )
    ) {
        warn("unexpected_a", right);
        return false;
    }
    return true;
}

// These functions are used to specify the grammar of our language:

function symbol(id, bp) {

// Make a symbol if it does not already exist in the language's syntax.

    let the_symbol = syntax[id];
    if (the_symbol === undefined) {
        the_symbol = empty();
        the_symbol.id = id;
        the_symbol.lbp = bp || 0;
        syntax[id] = the_symbol;
    }
    return the_symbol;
}

function assignment(id) {

// Make an assignment operator. The one true assignment is different because
// its left side, when it is a variable, is not treated as an expression.
// That case is special because that is when a variable gets initialized. The
// other assignment operators can modify, but they can not initialize.

    const the_symbol = symbol(id, 20);
    the_symbol.led = function (left) {
        const the_token = token;
        let right;
        the_token.arity = "assignment";
        right = expression(20 - 1);
        if (id === "=" && left.arity === "variable") {
            the_token.names = left;
            the_token.expression = right;
        } else {
            the_token.expression = [left, right];
        }
        if (
            right.arity === "assignment"
            || right.arity === "pre"
            || right.arity === "post"
        ) {
            warn("unexpected_a", right);
        }
        mutation_check(left);
        return the_token;
    };
    return the_symbol;
}

function constant(id, type, value) {

// Make a constant symbol.

    const the_symbol = symbol(id);
    the_symbol.constant = true;
    the_symbol.nud = (
        typeof value === "function"
        ? value
        : function () {
            token.constant = true;
            if (value !== undefined) {
                token.value = value;
            }
            return token;
        }
    );
    the_symbol.type = type;
    the_symbol.value = value;
    return the_symbol;
}

function infix(id, bp, f) {

// Make an infix operator.

    const the_symbol = symbol(id, bp);
    the_symbol.led = function (left) {
        const the_token = token;
        the_token.arity = "binary";
        if (f !== undefined) {
            return f(left);
        }
        the_token.expression = [left, expression(bp)];
        return the_token;
    };
    return the_symbol;
}

function infixr(id, bp) {

// Make a right associative infix operator.

    const the_symbol = symbol(id, bp);
    the_symbol.led = function (left) {
        const the_token = token;
        the_token.arity = "binary";
        the_token.expression = [left, expression(bp - 1)];
        return the_token;
    };
    return the_symbol;
}

function post(id) {

// Make one of the post operators.

    const the_symbol = symbol(id, 150);
    the_symbol.led = function (left) {
        token.expression = left;
        token.arity = "post";
        mutation_check(token.expression);
        return token;
    };
    return the_symbol;
}

function pre(id) {

// Make one of the pre operators.

    const the_symbol = symbol(id);
    the_symbol.nud = function () {
        const the_token = token;
        the_token.arity = "pre";
        the_token.expression = expression(150);
        mutation_check(the_token.expression);
        return the_token;
    };
    return the_symbol;
}

function prefix(id, f) {

// Make a prefix operator.

    const the_symbol = symbol(id);
    the_symbol.nud = function () {
        const the_token = token;
        the_token.arity = "unary";
        if (typeof f === "function") {
            return f();
        }
        the_token.expression = expression(150);
        return the_token;
    };
    return the_symbol;
}

function stmt(id, f) {

// Make a statement.

    const the_symbol = symbol(id);
    the_symbol.fud = function () {
        token.arity = "statement";
        return f();
    };
    return the_symbol;
}

function ternary(id1, id2) {

// Make a ternary operator.

    const the_symbol = symbol(id1, 30);
    the_symbol.led = function (left) {
        const the_token = token;
        const second = expression(20);
        advance(id2);
        token.arity = "ternary";
        the_token.arity = "ternary";
        the_token.expression = [left, second, expression(10)];
        return the_token;
    };
    return the_symbol;
}

// Begin defining the language.

syntax = empty();

symbol("}");
symbol(")");
symbol("]");
symbol(",");
symbol(";");
symbol(":");
symbol("*/");
symbol("await");
symbol("case");
symbol("catch");
symbol("class");
symbol("default");
symbol("else");
symbol("enum");
symbol("finally");
symbol("implements");
symbol("interface");
symbol("package");
symbol("private");
symbol("protected");
symbol("public");
symbol("static");
symbol("super");
symbol("switch");
symbol("void");
symbol("yield");

constant("(number)", "number");
constant("(regexp)", "regexp");
constant("(string)", "string");
constant("arguments", "object", function () {
    warn("unexpected_a", token);
    return token;
});
constant("eval", "function", function () {
    if (!option.eval) {
        warn("unexpected_a", token);
    } else if (next_token.id !== "(") {
        warn("expected_a_before_b", next_token, "(", artifact());
    }
    return token;
});
constant("false", "boolean", false);
constant("Function", "function", function () {
    if (!option.eval) {
        warn("unexpected_a", token);
    } else if (next_token.id !== "(") {
        warn("expected_a_before_b", next_token, "(", artifact());
    }
    return token;
});
constant("import", "function", function () {

// The dynamic import function resembles a constant, but its use is far more
// restricted.

    if (next_token.id !== "(" && next_token.id !== ".") {
        warn("unexpected_a", next_token);
    }
    return token;
});
constant("_", "undefined", function () {
    warn("unexpected_a", token);
    return token;
});
constant("Infinity", "number", Infinity);
constant("isFinite", "function", function () {
    warn("expected_a_b", token, "Number.isFinite", "isFinite");
    return token;
});
constant("isNaN", "function", function () {
    warn("number_isNaN", token);
    return token;
});
constant("NaN", "number", NaN);
constant("null", "null", function () {
    const previous_token = tokens[tokens.indexOf(token) - 1];
    if (
        !option.null
        && previous_token !== undefined
        && (
            previous_token.id !== "("
            || previous_token.expression[0].id !== "."
            || previous_token.expression[0].expression.id !== "Object"
            || previous_token.expression[0].name.id !== "create"
        )
    ) {
        warn("unexpected_a", token);
    }
    return token;
});
constant("this", "object", function () {
    if (!option.this) {
        warn("unexpected_a", token);
    }
    return token;
});
constant("true", "boolean", true);
constant("undefined", "undefined");

assignment("=");
assignment("+=");
assignment("-=");
assignment("*=");
assignment("/=");
assignment("%=");
assignment("&=");
assignment("|=");
assignment("^=");
assignment("<<=");
assignment(">>=");
assignment(">>>=");

infix("??", 35);
infix("||", 40);
infix("&&", 50);
infix("|", 70);
infix("^", 80);
infix("&", 90);
infix("==", 100);
infix("===", 100);
infix("!=", 100);
infix("!==", 100);
infix("<", 110);
infix(">", 110);
infix("<=", 110);
infix(">=", 110);
infix("in", 110);
infix("instanceof", 110);
infix("<<", 120);
infix(">>", 120);
infix(">>>", 120);
infix("+", 130);
infix("-", 130);
infix("*", 140);
infix("/", 140);
infix("%", 140);
infixr("**", 150);
infix("(", 160, function (left) {
    const the_paren = token;
    let the_argument;
    if (left.id !== "function") {
        left_check(left, the_paren);
    }
    if (functionage.arity === "statement" && left.identifier) {
        functionage.name.calls[left.id] = left;
    }
    the_paren.expression = [left];
    if (next_token.id !== ")") {
        (function next() {
            let ellipsis;
            if (next_token.id === "...") {
                ellipsis = true;
                advance("...");
            }
            the_argument = expression(10);
            if (ellipsis) {
                the_argument.ellipsis = true;
            }
            the_paren.expression.push(the_argument);
            if (next_token.id === ",") {
                advance(",");
                return next();
            }
        }());
    }
    advance(")", the_paren);
    if (the_paren.expression.length === 2) {
        the_paren.free = true;
        if (the_argument.wrapped === true) {
            warn("unexpected_a", the_paren);
        }
        if (the_argument.id === "(" || the_argument.id === "?") {
            the_argument.wrapped = true;
        }
    } else {
        the_paren.free = false;
    }
    return the_paren;
});
infix(".", 170, function (left) {
    const the_token = token;
    const name = next_token;
    if (
        (
            left.id !== "(string)"
            || (name.id !== "indexOf" && name.id !== "repeat")
        )
        && (
            left.id !== "["
            || (
                name.id !== "concat"
                && name.id !== "forEach"
                && name.id !== "join"
                && name.id !== "map"
                && name.id !== "reduce"
            )
        )
        && (left.id !== "+" || name.id !== "slice")
        && (
            left.id !== "(regexp)"
            || (name.id !== "exec" && name.id !== "test")
        )
    ) {
        left_check(left, the_token);
    }
    if (!name.identifier) {
        stop("expected_identifier_a");
    }
    advance();
    survey(name);

// The property name is not an expression.

    the_token.name = name;
    the_token.expression = left;
    return the_token;
});
infix("?.", 170, function (left) {
    const the_token = token;
    const name = next_token;
    left_check(left, the_token, true);
    if (!name.identifier) {
        stop("expected_identifier_a");
    }
    advance();
    survey(name);
    the_token.name = name;
    the_token.expression = left;
    return the_token;
});
infix("[", 170, function (left) {
    const the_token = token;
    const the_subscript = expression(0);
    if (the_subscript.id === "(string)" || the_subscript.id === "`") {
        const name = survey(the_subscript);
        if (rx_identifier.test(name)) {
            warn("subscript_a", the_subscript, name);
        }
    }
    left_check(left, the_token);
    the_token.expression = [left, the_subscript];
    advance("]");
    return the_token;
});
infix("=>", 170, function (left) {
    return stop("wrap_parameter", left);
});

function do_tick() {
    const the_tick = token;
    the_tick.value = [];
    the_tick.expression = [];
    if (next_token.id !== "`") {
        (function part() {
            advance("(string)");
            the_tick.value.push(token);
            if (next_token.id === "${") {
                advance("${");
                the_tick.expression.push(expression(0));
                advance("}");
                return part();
            }
        }());
    }
    advance("`");
    return the_tick;
}

infix("`", 160, function (left) {
    const the_tick = do_tick();
    left_check(left, the_tick);
    the_tick.expression = [left].concat(the_tick.expression);
    return the_tick;
});

post("++");
post("--");
pre("++");
pre("--");

prefix("+");
prefix("-");
prefix("~");
prefix("!");
prefix("!!");
prefix("[", function () {
    const the_token = token;
    the_token.expression = [];
    if (next_token.id !== "]") {
        (function next() {
            let element;
            let ellipsis = false;
            if (next_token.id === "...") {
                ellipsis = true;
                advance("...");
            }
            element = expression(10);
            if (ellipsis) {
                element.ellipsis = true;
            }
            the_token.expression.push(element);
            if (next_token.id === ",") {
                advance(",");
                return next();
            }
        }());
    }
    advance("]");
    return the_token;
});
prefix("/=", function () {
    stop("expected_a_b", token, "/\\=", "/=");
});
prefix("=>", function () {
    return stop("expected_a_before_b", token, "()", "=>");
});
prefix("new", function () {
    const the_new = token;
    const right = expression(160);
    if (next_token.id !== "(") {
        warn("expected_a_before_b", next_token, "()", artifact(next_token));
    }
    the_new.expression = right;
    return the_new;
});
prefix("typeof");
prefix("void", function () {
    const the_void = token;
    warn("unexpected_a", the_void);
    the_void.expression = expression(0);
    return the_void;
});

function default_expression() {
    const the_default = expression(150);
    if (the_default.id === "undefined") {
        warn("unexpected_a", the_default, the_default.id);
    }
    return the_default;
}

function parameter_list() {
    const list = [];
    let optional;
    if (next_token.id !== ")" && next_token.id !== "(end)") {
        (function parameter() {
            let ellipsis = false;
            let param;
            if (next_token.id === "{") {
                if (optional !== undefined) {
                    warn(
                        "required_a_optional_b",
                        next_token,
                        next_token.id,
                        optional.id
                    );
                }
                param = next_token;
                param.names = [];
                advance("{");
                (function subparameter() {
                    let subparam = next_token;
                    if (!subparam.identifier) {
                        return stop("expected_identifier_a");
                    }
                    survey(subparam);
                    advance();
                    if (next_token.id === "=") {
                        advance("=");
                        subparam.expression = default_expression();
                        param.open = true;
                    }
                    param.names.push(subparam);
                    if (next_token.id === ",") {
                        advance(",");
                        return subparameter();
                    }
                }());
                list.push(param);
                advance("}");
                if (next_token.id === ",") {
                    advance(",");
                    return parameter();
                }
            } else if (next_token.id === "[") {
                if (optional !== undefined) {
                    warn(
                        "required_a_optional_b",
                        next_token,
                        next_token.id,
                        optional.id
                    );
                }
                param = next_token;
                param.names = [];
                advance("[");
                (function subparameter() {
                    const subparam = next_token;
                    if (!subparam.identifier) {
                        return stop("expected_identifier_a");
                    }
                    advance();
                    param.names.push(subparam);
                    if (next_token.id === "=") {
                        advance("=");
                        subparam.expression = default_expression();
                        param.open = true;
                    }
                    if (next_token.id === ",") {
                        advance(",");
                        return subparameter();
                    }
                }());
                list.push(param);
                advance("]");
                if (next_token.id === ",") {
                    advance(",");
                    return parameter();
                }
            } else {
                if (next_token.id === "...") {
                    ellipsis = true;
                    advance("...");
                    if (optional !== undefined) {
                        warn(
                            "required_a_optional_b",
                            next_token,
                            next_token.id,
                            optional.id
                        );
                    }
                }
                if (!next_token.identifier) {
                    return stop("expected_identifier_a");
                }
                param = next_token;
                list.push(param);
                advance();
                if (ellipsis) {
                    param.ellipsis = true;
                } else {
                    if (next_token.id === "=") {
                        optional = param;
                        advance("=");
                        param.expression = default_expression();
                    } else {
                        if (optional !== undefined) {
                            warn(
                                "required_a_optional_b",
                                param,
                                param.id,
                                optional.id
                            );
                        }
                    }
                    if (next_token.id === ",") {
                        advance(",");
                        return parameter();
                    }
                }
            }
        }());
    }
    advance(")");
    return list;
}

function do_function(the_function) {
    let name;
    if (the_function === undefined) {
        the_function = token;

// A function statement must have a name that will be in the parent's scope.

        if (the_function.arity === "statement") {
            if (!next_token.identifier) {
                return stop("expected_identifier_a", next_token);
            }
            name = next_token;
            enroll(name, "variable", true);
            the_function.name = name;
            name.init = true;
            name.calls = empty();
            advance();
        } else if (name === undefined) {

// A function expression may have an optional name.

            if (next_token.identifier) {
                name = next_token;
                the_function.name = name;
                advance();
            } else {
                the_function.name = anon;
            }
        }
    } else {
        name = the_function.name;
    }
    the_function.level = functionage.level + 1;
    if (mega_mode) {
        warn("unexpected_a", the_function);
    }

// Don't make functions in loops. It is inefficient, and it can lead to scoping
// errors.

    if (functionage.loop > 0) {
        warn("function_in_loop", the_function);
    }

// Give the function properties for storing its names and for observing the
// depth of loops.

    the_function.context = empty();
    the_function.finally = 0;
    the_function.loop = 0;
    the_function.try = 0;

// Push the current context and establish a new one.

    block_stack.unshift(blockage);
    blockage = the_function;
    blocks.push(the_function);
    stack.unshift(functionage);
    functionage = the_function;
    if (the_function.arity !== "statement" && typeof name === "object") {
        enroll(name, "function", true);
        name.dead = false;
        name.init = true;
        name.used = 1;
    }

// Parse the parameter list.

    advance("(");
    token.free = false;
    token.arity = "function";
    functionage.parameters = parameter_list();
    functionage.parameters.forEach(function enroll_parameter(name) {
        if (name.identifier) {
            enroll(name, "parameter", false);
        } else {
            name.names.forEach(enroll_parameter);
        }
    });

// The function's body is a block.

    the_function.block = block("body");
    if (
        the_function.arity === "statement"
        && next_token.line === token.line
    ) {
        return stop("unexpected_a", next_token);
    }
    if (
        next_token.id === "."
        || next_token.id === "?."
        || next_token.id === "["
    ) {
        warn("unexpected_a");
    }

// Restore the previous context.

    functionage = stack.shift();
    blockage = block_stack.shift();
    return the_function;
}

prefix("function", do_function);

function fart(parameters) {
    advance("=>");
    const the_fart = token;
    the_fart.arity = "binary";
    the_fart.name = "=>";
    the_fart.level = functionage.level + 1;
    if (functionage.loop > 0) {
        warn("function_in_loop", the_fart);
    }
    the_fart.context = empty();
    the_fart.finally = 0;
    the_fart.loop = 0;
    the_fart.try = 0;
    block_stack.unshift(blockage);
    blockage = the_fart;
    blocks.push(the_fart);
    stack.unshift(functionage);
    functionage = the_fart;
    the_fart.parameters = parameters;
    the_fart.parameters.forEach(function (name) {
        enroll(name, "parameter", true);
    });
    if (next_token.id === "{") {
        warn("expected_a_b", the_fart, "function", "=>");
        the_fart.block = block("body");
    } else {
        the_fart.expression = expression(0);
    }
    functionage = stack.shift();
    blockage = block_stack.shift();
    return the_fart;
}

prefix("(", function () {
    const the_paren = token;
    let the_value;
    const cadet = lookahead().id;

// We can distinguish between a parameter list for => and a wrapped expression
// with one token of lookahead.

    if (
        next_token.id === ")"
        || next_token.id === "..."
        || (next_token.identifier && (cadet === "," || cadet === "="))
    ) {
        the_paren.free = false;
        return fart(parameter_list());
    }
    the_paren.free = true;
    the_value = expression(0);
    if (the_value.wrapped === true) {
        warn("unexpected_a", the_paren);
    }
    the_value.wrapped = true;
    advance(")", the_paren);
    if (next_token.id === "=>") {
        if (the_value.arity !== "variable") {
            if (the_value.id === "{" || the_value.id === "[") {
                warn("expected_a_before_b", the_paren, "function", "(");
                return stop("expected_a_b", next_token, "{", "=>");
            }
            return stop("expected_identifier_a", the_value);
        }
        the_paren.expression = [the_value];
        return fart(the_paren.expression);
    }
    return the_value;
});
prefix("`", do_tick);
prefix("{", function () {
    const the_brace = token;
    const seen = empty();
    the_brace.expression = [];
    if (next_token.id !== "}") {
        (function member() {
            let extra;
            let full;
            let id;
            let name = next_token;
            let value;
            advance();
            if (
                (name.id === "get" || name.id === "set")
                && next_token.identifier
            ) {
                if (!option.getset) {
                    warn("unexpected_a", name);
                }
                extra = name.id;
                full = extra + " " + next_token.id;
                name = next_token;
                advance();
                id = survey(name);
                if (seen[full] === true || seen[id] === true) {
                    warn("duplicate_a", name);
                }
                seen[id] = false;
                seen[full] = true;
            } else {
                id = survey(name);
                if (typeof seen[id] === "boolean") {
                    warn("duplicate_a", name);
                }
                seen[id] = true;
            }
            if (name.identifier) {
                if (next_token.id === "}" || next_token.id === ",") {
                    if (typeof extra === "string") {
                        advance("(");
                    }
                    value = expression(Infinity, true);
                } else if (next_token.id === "(") {
                    value = do_function({
                        arity: "unary",
                        from: name.from,
                        id: "function",
                        line: name.line,
                        name: (
                            typeof extra === "string"
                            ? extra
                            : id
                        ),
                        thru: name.from
                    });
                } else {
                    if (typeof extra === "string") {
                        advance("(");
                    }
                    let the_colon = next_token;
                    advance(":");
                    value = expression(0);
                    if (value.id === name.id && value.id !== "function") {
                        warn("unexpected_a", the_colon, ": " + name.id);
                    }
                }
                value.label = name;
                if (typeof extra === "string") {
                    value.extra = extra;
                }
                the_brace.expression.push(value);
            } else {
                advance(":");
                value = expression(0);
                value.label = name;
                the_brace.expression.push(value);
            }
            if (next_token.id === ",") {
                advance(",");
                return member();
            }
        }());
    }
    advance("}");
    return the_brace;
});

stmt(";", function () {
    warn("unexpected_a", token);
    return token;
});
stmt("{", function () {
    warn("naked_block", token);
    return block("naked");
});
stmt("break", function () {
    const the_break = token;
    let the_label;
    if (functionage.loop < 1 || functionage.finally > 0) {
        warn("unexpected_a", the_break);
    }
    the_break.disrupt = true;
    if (next_token.identifier && token.line === next_token.line) {
        block_stack.every(function (the_block) {
            const a_label = the_block.context[next_token.id];
            if (a_label !== undefined && a_label.role === "label") {
                the_label = a_label;
            }
            return the_label === undefined && the_block.id === "{";
        });
        if (the_label === undefined) {
            warn("not_label_a");
        } else if (the_label.dead) {
            warn("out_of_scope_a");
        } else {
            the_label.used += 1;
        }
        the_break.label = next_token;
        advance();
    }
    advance(";");
    return the_break;
});

function do_var() {
    const the_statement = token;
    const is_const = the_statement.id === "const";
    the_statement.names = [];
    (function next() {
        if (next_token.id === "{") {
            const the_brace = next_token;
            advance("{");
            (function pair() {
                if (!next_token.identifier) {
                    return stop("expected_identifier_a", next_token);
                }
                const name = next_token;
                survey(name);
                advance();
                the_statement.names.push(name);
                enroll(name, "variable", is_const);
                name.init = true;
                if (next_token.id === "=") {
                    advance("=");
                    name.expression = default_expression();
                    the_brace.open = true;
                }
                if (next_token.id === ",") {
                    advance(",");
                    return pair();
                }
            }());
            advance("}");
            advance("=");
            the_statement.expression = expression(0);
        } else if (next_token.id === "[") {
            const the_bracket = next_token;
            advance("[");
            (function element() {
                let ellipsis;
                if (next_token.id === "...") {
                    ellipsis = true;
                    advance("...");
                }
                if (!next_token.identifier) {
                    return stop("expected_identifier_a", next_token);
                }
                const name = next_token;
                advance();
                the_statement.names.push(name);
                enroll(name, "variable", is_const);
                name.init = true;
                if (ellipsis) {
                    name.ellipsis = true;
                } else {
                    if (next_token.id === "=") {
                        advance("=");
                        name.expression = default_expression();
                        the_bracket.open = true;
                    }
                    if (next_token.id === ",") {
                        advance(",");
                        return element();
                    }
                }
            }());
            advance("]");
            advance("=");
            the_statement.expression = expression(0);
        } else if (next_token.identifier) {
            const name = next_token;
            advance();
            if (name.id === "_") {
                warn("unexpected_a", name);
            }
            enroll(name, "variable", is_const);
            if (next_token.id === "=" || is_const) {
                advance("=");
                name.init = true;
                name.expression = expression(0);
            }
            the_statement.names.push(name);
        } else {
            return stop("expected_identifier_a", next_token);
        }
    }());
    semicolon();
    return the_statement;
}

stmt("const", do_var);
stmt("continue", function () {
    const the_continue = token;
    if (functionage.loop < 1 || functionage.finally > 0) {
        warn("unexpected_a", the_continue);
    }
    not_top_level(the_continue);
    the_continue.disrupt = true;
    warn("unexpected_a", the_continue);
    advance(";");
    return the_continue;
});
stmt("debugger", function () {
    const the_debug = token;
    if (!option.devel) {
        warn("unexpected_a", the_debug);
    }
    semicolon();
    return the_debug;
});
stmt("delete", function () {
    const the_token = token;
    const the_value = expression(0);
    if (
        (the_value.id !== "." && the_value.id !== "[")
        || the_value.arity !== "binary"
    ) {
        stop("expected_a_b", the_value, ".", artifact(the_value));
    }
    the_token.expression = the_value;
    semicolon();
    return the_token;
});
stmt("do", function () {
    const the_do = token;
    not_top_level(the_do);
    functionage.loop += 1;
    the_do.block = block();
    advance("while");
    the_do.expression = condition();
    semicolon();
    if (the_do.block.disrupt === true) {
        warn("weird_loop", the_do);
    }
    functionage.loop -= 1;
    return the_do;
});
stmt("export", function () {
    const the_export = token;
    let the_id;
    let the_name;
    let the_thing;

    function export_id() {
        if (!next_token.identifier) {
            stop("expected_identifier_a");
        }
        the_id = next_token.id;
        the_name = global.context[the_id];
        if (the_name === undefined) {
            warn("unexpected_a");
        } else {
            the_name.used += 1;
            if (exports[the_id] !== undefined) {
                warn("duplicate_a");
            }
            exports[the_id] = the_name;
        }
        advance();
        the_export.expression.push(the_thing);
    }

    the_export.expression = [];
    if (next_token.id === "default") {
        if (exports.default !== undefined) {
            warn("duplicate_a");
        }
        advance("default");
        the_thing = expression(0);
        if (
            the_thing.id === "("
            && the_thing.expression[0].id === "."
            && the_thing.expression[0].expression.id === "Object"
            && the_thing.expression[0].name.id === "freeze"
        ) {
            semicolon();
        } else {
            warn("freeze_exports", the_thing);
            if (next_token.id === ";") {
                semicolon();
            }
        }
        exports.default = the_thing;
        the_export.expression.push(the_thing);
    } else {
        if (next_token.id === "function") {
            warn("freeze_exports");
            the_thing = statement();
            the_name = the_thing.name;
            the_id = the_name.id;
            the_name.used += 1;
            if (exports[the_id] !== undefined) {
                warn("duplicate_a", the_name);
            }
            exports[the_id] = the_thing;
            the_export.expression.push(the_thing);
            the_thing.statement = false;
            the_thing.arity = "unary";
        } else if (
            next_token.id === "let"
            || next_token.id === "const"
        ) {
            warn("unexpected_a", next_token);
            statement();
        } else if (next_token.id === "{") {
            advance("{");
            (function loop() {
                export_id();
                if (next_token.id === ",") {
                    advance(",");
                    return loop();
                }
            }());
            advance("}");
            semicolon();
        } else {
            stop("unexpected_a");
        }
    }
    module_mode = true;
    return the_export;
});
stmt("for", function () {
    stop("unexpected_a", token);
});
stmt("function", do_function);
stmt("if", function () {
    let the_else;
    const the_if = token;
    the_if.expression = condition();
    the_if.block = block();
    if (next_token.id === "else") {
        advance("else");
        the_else = token;
        the_if.else = (
            next_token.id === "if"
            ? statement()
            : block()
        );
        if (the_if.block.disrupt === true) {
            if (the_if.else.disrupt === true) {
                the_if.disrupt = true;
            } else {
                warn("unexpected_a", the_else);
            }
        }
    }
    return the_if;
});
stmt("import", function () {
    const the_import = token;
    let name;
    if (typeof module_mode === "object") {
        warn("unexpected_directive_a", module_mode, module_mode.directive);
    }
    module_mode = true;
    if (next_token.identifier) {
        name = next_token;
        advance();
        if (name.id === "_") {
            warn("unexpected_a", name);
        }
        enroll(name, "variable", true);
        the_import.name = name;
    } else {
        const names = [];
        advance("{");
        if (next_token.id !== "}") {
            while (true) {
                if (!next_token.identifier) {
                    stop("expected_identifier_a");
                }
                name = next_token;
                advance();
                if (name.id === "_") {
                    warn("unexpected_a", name);
                }
                enroll(name, "variable", true);
                names.push(name);
                if (next_token.id !== ",") {
                    break;
                }
                advance(",");
            }
        }
        advance("}");
        the_import.name = names;
    }
    advance("from");
    advance("(string)");
    the_import.import = token;
    if (!rx_module.test(token.value)) {
        warn("bad_module_name_a", token);
    }
    froms.push(token.value);
    semicolon();
    return the_import;
});
stmt("let", do_var);
stmt("return", function () {
    const the_return = token;
    not_top_level(the_return);
    if (functionage.finally > 0) {
        warn("unexpected_a", the_return);
    }
    the_return.disrupt = true;
    if (next_token.id !== ";" && the_return.line === next_token.line) {
        the_return.expression = expression(10);
    }
    advance(";");
    return the_return;
});
stmt("switch", function () {
    stop("unexpected_a", token);
});
stmt("throw", function () {
    const the_throw = token;
    the_throw.disrupt = true;
    the_throw.expression = expression(10);
    semicolon();
    if (functionage.try > 0) {
        warn("unexpected_a", the_throw);
    }
    return the_throw;
});
stmt("try", function () {
    let the_catch;
    let the_disrupt;
    const the_try = token;
    if (functionage.try > 0) {
        warn("unexpected_a", the_try);
    }
    functionage.try += 1;
    the_try.block = block();
    the_disrupt = the_try.block.disrupt;
    if (next_token.id === "catch") {
        let ignored = "_";
        the_catch = next_token;
        the_try.catch = the_catch;
        advance("catch");
        if (next_token.id === "(") {
            advance("(");
            if (!next_token.identifier) {
                return stop("expected_identifier_a", next_token);
            }
            if (next_token.id !== "_") {
                ignored = undefined;
                the_catch.name = next_token;
                enroll(next_token, "exception", true);
            }
            advance();
            advance(")");
        }
        the_catch.block = block(ignored);
        if (the_catch.block.disrupt !== true) {
            the_disrupt = false;
        }
    } else {
        warn(
            "expected_a_before_b",
            next_token,
            "catch",
            artifact(next_token)
        );
    }
    if (next_token.id === "finally") {
        functionage.finally += 1;
        advance("finally");
        the_try.else = block();
        the_disrupt = the_try.else.disrupt;
        functionage.finally -= 1;
    }
    the_try.disrupt = the_disrupt;
    functionage.try -= 1;
    return the_try;
});
stmt("var", function () {
    stop("unexpected_var", token);
});
stmt("while", function () {
    const the_while = token;
    not_top_level(the_while);
    functionage.loop += 1;
    the_while.expression = condition();
    the_while.block = block();
    if (the_while.block.disrupt === true) {
        warn("weird_loop", the_while);
    }
    functionage.loop -= 1;
    return the_while;
});
stmt("with", function () {
    stop("unexpected_a", token);
});

ternary("?", ":");

// Ambulation of the parse tree.

function action(when) {

// Produce a function that will register task functions that will be called as
// the tree is traversed.

    return function (arity, id, task) {
        let a_set = when[arity];
        let i_set;

// The id parameter is optional. If excluded, the task will be applied to all
// ids.

        if (typeof id !== "string") {
            task = id;
            id = "(all)";
        }

// If this arity has no registrations yet, then create a set object to hold
// them.

        if (a_set === undefined) {
            a_set = empty();
            when[arity] = a_set;
        }

// If this id has no registrations yet, then create a set array to hold them.

        i_set = a_set[id];
        if (i_set === undefined) {
            i_set = [];
            a_set[id] = i_set;
        }

// Register the task with the arity and the id.

        i_set.push(task);
    };
}

function amble(when) {

// Produce a function that will act on the tasks registered by an action
// function while walking the tree.

    return function (the_token) {

// Given a task set that was built by an action function, run all of the
// relevant tasks on the token.

        let a_set = when[the_token.arity];
        let i_set;

// If there are tasks associated with the token's arity...

        if (a_set !== undefined) {

// If there are tasks associated with the token's id...

            i_set = a_set[the_token.id];
            if (i_set !== undefined) {
                i_set.forEach(function (task) {
                    return task(the_token);
                });
            }

// If there are tasks for all ids.

            i_set = a_set["(all)"];
            if (i_set !== undefined) {
                i_set.forEach(function (task) {
                    return task(the_token);
                });
            }
        }
    };
}

const posts = empty();
const pres = empty();
const preaction = action(pres);
const postaction = action(posts);
const preamble = amble(pres);
const postamble = amble(posts);

function walk_expression(thing) {
    if (thing) {
        if (Array.isArray(thing)) {
            thing.forEach(walk_expression);
        } else {
            preamble(thing);
            walk_expression(thing.expression);
            if (thing.id === "function") {
                walk_statement(thing.block);
            }
            if (thing.arity === "pre" || thing.arity === "post") {
                warn("unexpected_a", thing);
            } else if (
                thing.arity === "statement"
                || thing.arity === "assignment"
            ) {
                warn("unexpected_statement_a", thing);
            }
            postamble(thing);
        }
    }
}

function walk_statement(thing) {
    if (thing) {
        if (Array.isArray(thing)) {
            thing.forEach(walk_statement);
        } else {
            preamble(thing);
            walk_expression(thing.expression);
            if (thing.arity === "binary") {
                if (thing.id !== "(") {
                    warn("unexpected_expression_a", thing);
                }
            } else if (
                thing.arity !== "statement"
                && thing.arity !== "assignment"
                && thing.id !== "import"
            ) {
                warn("unexpected_expression_a", thing);
            }
            walk_statement(thing.block);
            walk_statement(thing.else);
            postamble(thing);
        }
    }
}

function lookup(thing) {
    if (thing.arity === "variable") {

// Look up the variable in the current context.

        let the_variable = blockage.context[thing.id];

// If it isn't local, search all the other contexts. If there are name
// collisions, take the most recent.

        if (the_variable === undefined) {
            let closure = false;
            block_stack.every(function (the_block) {
                const a_variable = the_block.context[thing.id];
                if (
                    a_variable !== undefined
                    && a_variable.role !== "label"
                ) {
                    the_variable = a_variable;
                    return false;
                }
                if (the_block.id === "function") {
                    closure = true;
                }
                return true;
            });

// If it isn't in any of those either, perhaps it is a predefined global.
// If so, add it to the global context.

            if (the_variable === undefined) {
                if (declared_globals[thing.id] === undefined) {
                    warn("undeclared_a", thing);
                    return;
                }
                the_variable = {
                    dead: false,
                    function: global,
                    id: thing.id,
                    init: true,
                    role: "variable",
                    scope: global,
                    used: 0,
                    writable: false
                };
                global.context[thing.id] = the_variable;
            }
            if (closure) {
                the_variable.closure = true;
            }
            blockage.context[thing.id] = the_variable;
        } else if (the_variable.role === "label") {
            warn("label_a", thing);
        }
        if (
            the_variable.dead
            && stack.concat(functionage).every(function (the_function) {
                return (
                    the_function.name === undefined
                    || the_variable.calls === undefined
                    || the_variable.calls[the_function.name.id] === undefined
                    || the_variable.function !== the_function.name.function
                );
            })
        ) {
            warn("out_of_scope_a", thing);
        }
        return the_variable;
    }
}

function subactivate(name) {
    walk_expression(name.expression);
    name.init = true;
    name.dead = false;
    blockage.live.push(name);
}

function preaction_function(thing) {
    if (thing.arity === "statement" && blockage.body !== true) {
        warn("unexpected_a", thing);
    }
    block_stack.unshift(blockage);
    blockage = thing;
    stack.unshift(functionage);
    functionage = thing;
    thing.live = [];
    if (typeof thing.name === "object") {
        thing.name.dead = false;
        thing.name.init = true;
    }
    if (thing.extra === "get") {
        if (thing.parameters.length !== 0) {
            warn("bad_get", thing);
        }
    } else if (thing.extra === "set") {
        if (thing.parameters.length !== 1) {
            warn("bad_set", thing);
        }
    }
    thing.parameters.forEach(function (name) {
        walk_expression(name.expression);
        if (name.id === "{" || name.id === "[") {
            name.names.forEach(subactivate);
        } else {
            name.dead = false;
            name.init = true;
        }
    });
}

function bitwise_check(thing) {
    if (!option.bitwise && bitwiseop[thing.id] === true) {
        warn("unexpected_a", thing);
    }
    if (
        thing.id !== "("
        && thing.id !== "&&"
        && thing.id !== "||"
        && thing.id !== "="
        && Array.isArray(thing.expression)
        && thing.expression.length === 2
        && (
            relationop[thing.expression[0].id] === true
            || relationop[thing.expression[1].id] === true
        )
    ) {
        warn("unexpected_a", thing);
    }
}

function pop_block() {
    blockage.live.forEach(function (name) {
        name.dead = true;
    });
    delete blockage.live;
    blockage = block_stack.shift();
}

function activate(name) {
    name.dead = false;
    if (name.expression !== undefined) {
        walk_expression(name.expression);
        name.init = true;
    }
    blockage.live.push(name);
}

function action_var(thing) {
    thing.names.forEach(activate);
}

preaction("assignment", bitwise_check);
preaction("binary", bitwise_check);
preaction("binary", function (thing) {
    if (relationop[thing.id] === true) {
        const left = thing.expression[0];
        const right = thing.expression[1];
        if (left.id === "NaN" || right.id === "NaN") {
            warn("number_isNaN", thing);
        } else if (left.id === "typeof") {
            if (right.id !== "(string)") {
                if (right.id !== "typeof") {
                    warn("expected_string_a", right);
                }
            } else {
                const value = right.value;
                if (value === "null" || value === "undefined") {
                    warn("unexpected_typeof_a", right, value);
                } else if (
                    value !== "boolean"
                    && value !== "function"
                    && value !== "number"
                    && value !== "object"
                    && value !== "string"
                    && value !== "symbol"
                ) {
                    warn("expected_type_string_a", right, value);
                }
            }
        }
    }
});
preaction("binary", "==", function (thing) {
    warn("expected_a_b", thing, "===", "==");
});
preaction("binary", "!=", function (thing) {
    warn("expected_a_b", thing, "!==", "!=");
});
preaction("binary", "=>", preaction_function);
preaction("binary", "||", function (thing) {
    thing.expression.forEach(function (thang) {
        if (thang.id === "&&" && !thang.wrapped) {
            warn("and", thang);
        }
    });
});
preaction("binary", "[", function (thing) {
    thing.expression[1].snug = true;
});
preaction("binary", "in", function (thing) {
    warn("infix_in", thing);
});
preaction("binary", "instanceof", function (thing) {
    warn("unexpected_a", thing);
});
preaction("binary", ".", function (thing) {
    if (thing.expression.new) {
        thing.new = true;
    }
});
preaction("statement", "{", function (thing) {
    block_stack.unshift(blockage);
    blockage = thing;
    thing.live = [];
});
preaction("statement", "function", preaction_function);
preaction("unary", "[", function (thing) {
    if (thing.expression.length === 1) {
        thing.expression[0].snug = true;
    }
});
preaction("unary", "`", function (thing) {
    thing.expression.forEach(function (expression) {
        expression.snug = true;
    });
});
preaction("unary", "~", bitwise_check);
preaction("unary", "function", preaction_function);
preaction("variable", function (thing) {
    if (thing.id !== "import") {
        const the_variable = lookup(thing);
        if (the_variable !== undefined) {
            thing.variable = the_variable;

// Referencing an outer function does not count as use.

            if (stack.concat(functionage).every(function (the_function) {
                return the_function.name !== the_variable;
            })) {
                the_variable.used += 1;
            }
        }
    }
});

function init_variable(name) {
    const the_variable = lookup(name);
    if (the_variable !== undefined) {
        if (the_variable.writable) {
            the_variable.init = true;
            return;
        }
    }
    warn("bad_assignment_a", name);
}

postaction("assignment", "+=", function (thing) {
    let right = thing.expression[1];
    if (right.constant) {
        if (
            right.value === ""
            || (right.id === "(number)" && right.value === "0")
            || right.id === "(boolean)"
            || right.id === "null"
            || right.id === "undefined"
            || Number.isNaN(right.value)
        ) {
            warn("unexpected_a", right);
        }
    }
});
postaction("assignment", function (thing) {

// Assignment using = sets the init property of a variable. No other assignment
// operator can do this. A = token keeps that variable (or array of variables
// in case of destructuring) in its name property.

    const lvalue = thing.expression[0];
    if (thing.id === "=") {
        if (thing.names !== undefined) {
            if (Array.isArray(thing.names)) {
                thing.names.forEach(init_variable);
            } else {
                init_variable(thing.names);
            }
        } else {
            if (lvalue.id === "[" || lvalue.id === "{") {
                lvalue.expression.forEach(function (thing) {
                    if (thing.variable) {
                        thing.variable.init = true;
                    }
                });
            } else if (
                lvalue.id === "."
                && thing.expression[1].id === "undefined"
            ) {
                warn(
                    "expected_a_b",
                    lvalue.expression,
                    "delete",
                    "undefined"
                );
            }
        }
    } else {
        if (lvalue.arity === "variable") {
            if (!lvalue.variable || lvalue.variable.writable !== true) {
                warn("bad_assignment_a", lvalue);
            }
        }
        const right = syntax[thing.expression[1].id];
        if (
            right !== undefined
            && (
                right.id === "function"
                || right.id === "=>"
                || (
                    right.constant
                    && right.id !== "(number)"
                    && (right.id !== "(string)" || thing.id !== "+=")
                )
            )
        ) {
            warn("unexpected_a", thing.expression[1]);
        }
    }
});

function postaction_function(thing) {
    delete functionage.finally;
    delete functionage.loop;
    delete functionage.try;
    functionage = stack.shift();
    if (thing.wrapped) {
        warn("unexpected_parens", thing);
    }
    return pop_block();
}

postaction("binary", function (thing) {
    if (thing.id === "." || thing.id === "?.") {
        if (thing.expression.id === "RegExp") {
            warn("weird_expression_a", thing);
        }
        if (thing.expression.id === "import" && thing.name.id !== "meta") {
            warn("unexpected_a", thing.name);
        }
        if (
            (thing.expression.id === "." || thing.expression.id === "?.")
            && thing.expression.name.id === "meta"
            && thing.expression.expression.id === "import"
            && (
                thing.name.id !== "resolve"
                && thing.name.id !== "url"
                && thing.name.id !== "main"
            )
        ) {
            warn("bad_import_meta_a", thing.name);
        }
    }
    if (Array.isArray(thing.expression)) {
        const [left, right] = thing.expression;
        if (relationop[thing.id]) {
            if (
                is_weird(left)
                || is_weird(right)
                || are_similar(left, right)
                || (left.constant === true && right.constant === true)
                || (left.constant === true && right.id === "!")
                || (left.id === "!" && right.constant === true)
            ) {
                warn("weird_relation_a", thing);
            }
        }
        if (thing.id === "+") {
            if (left.value === "") {
                warn("expected_a_b", thing, "String(...)", "\"\" +");
            } else if (right.value === "") {
                warn("expected_a_b", thing, "String(...)", "+ \"\"");
            }
        } else if (thing.id === "[") {
            if (left.id === "globalThis") {
                warn("weird_expression_a", thing, "globalThis[...]");
            }
            if (
                left.id === "."
                && left.name.id === "meta"
                && left.expression.id === "import"
            ) {
                warn("weird_expression_a", thing, "import.meta[...]");
            }
        } else if (thing.id !== "=>" && thing.id !== "(") {
            if (
                (thing.id === "+" || thing.id === "-")
                && right.id === thing.id
                && right.arity === "unary"
                && !right.wrapped
            ) {
                warn("wrap_unary", right);
            }
            if (left.constant === true && right.constant === true) {
                thing.constant = true;
            }
        }
    }
});
postaction("binary", "&&", function (thing) {
    if (
        is_weird(thing.expression[0])
        || are_similar(thing.expression[0], thing.expression[1])
        || thing.expression[0].constant === true
        || thing.expression[1].constant === true
    ) {
        warn("weird_condition_a", thing);
    }
});
postaction("binary", "||", function (thing) {
    if (
        is_weird(thing.expression[0])
        || are_similar(thing.expression[0], thing.expression[1])
        || thing.expression[0].constant === true
    ) {
        warn("weird_condition_a", thing);
    }
});
postaction("binary", "=>", postaction_function);
postaction("binary", "(", function (thing) {
    let left = thing.expression[0];
    let the_new;
    let arg;
    if (left.id === "new") {
        the_new = left;
        left = left.expression;
    }
    if (
        left.id === "import" || (
            left.id === "."
            && left.name.id === "resolve"
            && left.expression.id === "."
            && left.expression.name.id === "meta"
            && left.expression.expression.id === "import"
        )
    ) {

// This is a dynamic import expression, like import() or import.meta.resolve().
// Both functions take a single parameter, which must be a string literal.

        arg = thing.expression;
        if (arg.length < 2) {
            warn_at("expected_string_a", thing.line, thing.thru, "");
        } else {
            if (arg.length > 2) {
                warn("unexpected_a", arg[2]);
            } else if (arg[1].id !== "(string)") {
                warn("expected_type_string_a", arg[1]);
            } else if (!rx_module.test(arg[1].value)) {
                warn("bad_module_name_a", arg[1]);
            }
            froms.push(arg[1].value);
        }
    }
    if (left.id === "function") {
        if (!thing.wrapped) {
            warn("wrap_immediate", thing);
        }
    } else if (left.identifier) {
        if (the_new !== undefined) {
            if (
                left.id[0] > "Z"
                || left.id === "Boolean"
                || left.id === "Number"
                || left.id === "String"
                || left.id === "Symbol"
            ) {
                warn("unexpected_a", the_new);
            } else if (left.id === "Function") {
                if (!option.eval) {
                    warn("unexpected_a", left, "new Function");
                }
            } else if (left.id === "Array") {
                arg = thing.expression;
                if (arg.length !== 2 || arg[1].id === "(string)") {
                    warn("expected_a_b", left, "[]", "new Array");
                }
            } else if (left.id === "Object") {
                warn(
                    "expected_a_b",
                    left,
                    "Object.create(null)",
                    "new Object"
                );
            }
        } else {
            if (
                left.id[0] >= "A"
                && left.id[0] <= "Z"
                && left.id !== "Boolean"
                && left.id !== "Number"
                && left.id !== "String"
                && left.id !== "Symbol"
            ) {
                warn(
                    "expected_a_before_b",
                    left,
                    "new",
                    artifact(left)
                );
            }
        }
    } else if (left.id === ".") {
        let cack = the_new !== undefined;
        if (left.expression.id === "Date" && left.name.id === "UTC") {
            cack = !cack;
        }
        if (rx_initial_cap.test(left.name.id) !== cack) {
            if (the_new !== undefined) {
                warn("unexpected_a", the_new);
            } else {
                warn(
                    "expected_a_before_b",
                    left.expression,
                    "new",
                    left.name.id
                );
            }
        }
        if (left.name.id === "getTime") {
            const paren = left.expression;
            if (paren.id === "(") {
                const array = paren.expression;
                if (array.length === 1) {
                    const new_date = array[0];
                    if (
                        new_date.id === "new"
                        && new_date.expression.id === "Date"
                    ) {
                        warn(
                            "expected_a_b",
                            new_date,
                            "Date.now()",
                            "new Date().getTime()"
                        );
                    }
                }
            }
        }
    }
});
postaction("binary", "[", function (thing) {
    if (thing.expression[0].id === "RegExp") {
        warn("weird_expression_a", thing);
    }
    if (is_weird(thing.expression[1])) {
        warn("weird_expression_a", thing.expression[1]);
    }
});
postaction("statement", "{", pop_block);
postaction("statement", "const", action_var);
postaction("statement", "export", top_level_only);
postaction("statement", "function", postaction_function);
postaction("statement", "import", function (the_thing) {
    const name = the_thing.name;
    if (name) {
        if (Array.isArray(name)) {
            name.forEach(function (name) {
                name.dead = false;
                name.init = true;
                blockage.live.push(name);
            });
        } else {
            name.dead = false;
            name.init = true;
            blockage.live.push(name);
        }
        return top_level_only(the_thing);
    }
});
postaction("statement", "let", action_var);
postaction("statement", "try", function (thing) {
    if (thing.catch !== undefined) {
        const the_name = thing.catch.name;
        const the_variable = (
            the_name !== undefined
            ? blockage.context[the_name.id]
            : undefined
        );
        if (the_variable !== undefined) {
            the_variable.dead = false;
            the_variable.init = true;
        }
        walk_statement(thing.catch.block);
        if (the_variable !== undefined) {
            the_variable.dead = true;
        }
    }
});
postaction("ternary", function (thing) {
    if (thing.wrapped !== true && thing.snug !== true) {
        warn("use_open", thing);
    } else if (
        is_weird(thing.expression[0])
        || thing.expression[0].constant === true
        || are_similar(thing.expression[1], thing.expression[2])
    ) {
        warn("unexpected_a", thing);
    } else if (are_similar(thing.expression[0], thing.expression[1])) {
        warn("expected_a_b", thing, "||", "?");
    } else if (are_similar(thing.expression[0], thing.expression[2])) {
        warn("expected_a_b", thing, "&&", "?");
    } else if (
        thing.expression[1].id === "true"
        && thing.expression[2].id === "false"
    ) {
        warn("expected_a_b", thing, "Boolean(...)", "?");
    } else if (
        thing.expression[1].id === "false"
        && thing.expression[2].id === "true"
    ) {
        warn("expected_a_b", thing, "!", "?");
    } else if (
        thing.expression[0].wrapped !== true
        && (
            thing.expression[0].id === "||"
            || thing.expression[0].id === "&&"
        )
    ) {
        warn("wrap_condition", thing.expression[0]);
    }
});
postaction("unary", function (thing) {
    if (thing.id === "`") {
        if (thing.expression.every(function (thing) {
            return thing.constant;
        })) {
            thing.constant = true;
        }
    } else if (thing.id === "!") {
        if (thing.expression.constant === true) {
            warn("unexpected_a", thing);
        }
    } else if (thing.id === "!!") {
        warn("expected_a_b", thing, "Boolean(...)", "!!");
    } else if (
        thing.id !== "["
        && thing.id !== "{"
        && thing.id !== "function"
        && thing.id !== "new"
    ) {
        if (thing.expression.constant === true) {
            thing.constant = true;
        }
    }
});
postaction("unary", "function", postaction_function);
postaction("unary", "+", function (thing) {
    warn("expected_a_b", thing, "Number(...)", "+");
});

function delve(the_block) {
    Object.keys(the_block.context).forEach(function (id) {
        if (id !== "_") {
            const name = the_block.context[id];
            if (name.scope === the_block) {
                if (
                    name.used === 0
                    && (
                        name.role !== "function"
                        || name.function.arity !== "unary"
                    )
                ) {
                    warn("unused_a", name);
                } else if (!name.init) {
                    warn("uninitialized_a", name);
                }
            }
        }
    });
}

function uninitialized_and_unused() {

// Delve into the scopes looking for variables that were not initialized
// or used. If the file imports or exports, then its global object is also
// delved.

    if (
        module_mode === true
        || option.node
        || option.deno
        || option.bun
        || option.tjs
    ) {
        delve(global);
    }
    blocks.forEach(delve);
}

// Go through the token list, looking at usage of whitespace.

function whitage() {
    let closer = "(end)";
    let free = false;
    let left = global;
    let margin = 0;
    let nr_comments_skipped = 0;
    let open = true;
    let opening = true;
    let right;

    function pop() {
        const previous = stack.shift();
        closer = previous.closer;
        free = previous.free;
        margin = previous.margin;
        open = previous.open;
        opening = previous.opening;
    }

    function push() {
        stack.unshift({
            closer,
            free,
            margin,
            open,
            opening
        });
    }

    function expected_at(at) {
        warn(
            "expected_a_at_b_c",
            right,
            artifact(right),
            fudge + at,
            artifact_column(right)
        );
    }

    function at_margin(fit) {
        const at = margin + fit;
        if (right.from !== at) {
            return expected_at(at);
        }
    }

    function no_space_only() {
        if (
            left.id !== "(global)"
            && left.nr + 1 === right.nr
            && (
                left.line !== right.line
                || left.thru !== right.from
            )
        ) {
            warn(
                "unexpected_space_a_b",
                right,
                artifact(left),
                artifact(right)
            );
        }
    }

    function no_space() {
        if (left.line === right.line) {
            if (left.thru !== right.from && nr_comments_skipped === 0) {
                warn(
                    "unexpected_space_a_b",
                    right,
                    artifact(left),
                    artifact(right)
                );
            }
        } else {
            if (open) {
                const at = (
                    free
                    ? margin
                    : margin + 8
                );
                if (right.from < at) {
                    expected_at(at);
                }
            } else {
                if (right.from !== margin + 8) {
                    expected_at(margin + 8);
                }
            }
        }
    }

    function one_space_only() {
        if (left.line !== right.line || left.thru + 1 !== right.from) {
            warn(
                "expected_space_a_b",
                right,
                artifact(left),
                artifact(right)
            );
        }
    }

    function one_space() {
        if (left.line === right.line || !open) {
            if (left.thru + 1 !== right.from && nr_comments_skipped === 0) {
                warn(
                    "expected_space_a_b",
                    right,
                    artifact(left),
                    artifact(right)
                );
            }
        } else {
            if (right.from !== margin) {
                expected_at(margin);
            }
        }
    }

    stack = [];
    tokens.forEach(function (the_token) {
        right = the_token;
        if (right.id === "(comment)" || right.id === "(end)") {
            nr_comments_skipped += 1;
        } else {

// If left is an opener and right is not the closer, then push the previous
// state. If the token following the opener is on the next line, then this is
// an open form. If the tokens are on the same line, then it is a closed form.
// Open form is more readable, with each item (statement, argument, parameter,
// etc) starting on its own line. Closed form is more compact. Statement blocks
// are always in open form.

            const new_closer = opener[left.id];
            if (typeof new_closer === "string") {
                if (new_closer !== right.id) {
                    opening = left.open || (left.line !== right.line);
                    push();
                    closer = new_closer;
                    if (opening) {
                        free = closer === ")" && left.free;
                        open = true;
                        margin += 4;
                        if (right.role === "label") {
                            if (right.from !== 0) {
                                expected_at(0);
                            }
                        } else {
                            at_margin(0);
                        }
                    } else {
                        if (right.statement || right.role === "label") {
                            warn(
                                "expected_line_break_a_b",
                                right,
                                artifact(left),
                                artifact(right)
                            );
                        }
                        free = false;
                        open = false;
                        no_space_only();
                    }
                } else {

// If left and right are opener and closer, then the placement of right depends
// on the openness. Illegal pairs (like '{]') have already been detected.

                    if (left.line === right.line) {
                        no_space();
                    } else {
                        at_margin(0);
                    }
                }
            } else {
                if (right.statement === true) {
                    if (left.id === "else") {
                        one_space_only();
                    } else {
                        at_margin(0);
                        open = false;
                    }

// If right is a closer, then pop the previous state.

                } else if (right.id === closer) {
                    pop();
                    if (opening && right.id !== ";") {
                        at_margin(0);
                    } else {
                        no_space_only();
                    }
                } else {

// Left is not an opener, and right is not a closer.
// The nature of left and right will determine the space between them.

// If left is ',' or ';' or right is a statement then if open,
// right must go at the margin, or if closed, a space between.

                    if (right.role === "label") {
                        if (right.from !== 0) {
                            expected_at(0);
                        }
                    } else if (left.id === ",") {
                        if (!open || (
                            (free || closer === "]")
                            && left.line === right.line
                        )) {
                            one_space();
                        } else {
                            at_margin(0);
                        }

// If right is a ternary operator, line it up on the margin.

                    } else if (right.arity === "ternary") {
                        if (right.id === "?") {
                            if (open) {
                                at_margin(0);
                            } else {
                                warn("use_open", right);
                            }
                        }
                    } else if (
                        right.arity === "binary"
                        && right.id === "("
                        && free
                    ) {
                        no_space();
                    } else if (
                        left.id === "."
                        || left.id === "?."
                        || left.id === "..."
                        || right.id === ","
                        || right.id === ";"
                        || right.id === ":"
                        || (
                            right.arity === "binary"
                            && (right.id === "(" || right.id === "[")
                        )
                        || (
                            right.arity === "function"
                            && left.id !== "function"
                        )
                    ) {
                        no_space_only();
                    } else if (right.id === "." || right.id === "?.") {
                        no_space_only();
                    } else if (left.id === ";") {
                        if (open) {
                            at_margin(0);
                        }
                    } else if (
                        left.arity === "ternary"
                        || left.id === "case"
                        || left.id === "catch"
                        || left.id === "else"
                        || left.id === "finally"
                        || left.id === "while"
                        || right.id === "catch"
                        || right.id === "else"
                        || right.id === "finally"
                        || (right.id === "while" && !right.statement)
                        || (left.id === ")" && right.id === "{")
                    ) {
                        one_space_only();
                    } else if (

// There is a space between left and right.

                        spaceop[left.id] === true
                        || spaceop[right.id] === true
                        || (
                            left.arity === "binary"
                            && (left.id === "+" || left.id === "-")
                        )
                        || (
                            right.arity === "binary"
                            && (right.id === "+" || right.id === "-")
                        )
                        || left.id === "function"
                        || left.id === ":"
                        || (
                            (
                                left.identifier
                                || left.id === "(string)"
                                || left.id === "(number)"
                            )
                            && (
                                right.identifier
                                || right.id === "(string)"
                                || right.id === "(number)"
                            )
                        )
                        || (left.arity === "statement" && right.id !== ";")
                    ) {
                        one_space();
                    } else if (left.arity === "unary" && left.id !== "`") {
                        no_space_only();
                    }
                }
            }
            nr_comments_skipped = 0;
            delete left.calls;
            delete left.dead;
            delete left.free;
            delete left.init;
            delete left.open;
            delete left.used;
            left = right;
        }
    });
}

// The jslint function itself.

export default Object.freeze(function jslint(
    source = "",
    option_object = empty(),
    global_array = []
) {
    try {
        warnings = [];
        option = Object.assign(empty(), option_object);
        anon = "anonymous";
        block_stack = [];
        blocks = [];
        declared_globals = empty();
        directive_mode = true;
        directives = [];
        early_stop = true;
        exports = empty();
        froms = [];
        fudge = (
            option.fudge
            ? 1
            : 0
        );
        global = {
            id: "(global)",
            body: true,
            context: empty(),
            from: 0,
            level: 0,
            line: 0,
            live: [],
            loop: 0,
            thru: 0
        };
        blockage = global;
        functionage = global;
        json_mode = false;
        mega_mode = false;
        module_mode = false;
        next_token = global;
        property = empty();
        shebang = false;
        stack = [];
        tenure = undefined;
        token = global;
        token_nr = 0;
        populate(language, declared_globals, false);
        populate(global_array, declared_globals, false);
        Object.keys(option).forEach(function (name) {
            if (option[name] === true) {
                const allowed = allowed_option[name];
                if (Array.isArray(allowed)) {
                    populate(allowed, declared_globals, false);
                }
            }
        });
        tokenize(source);
        advance();
        if (json_mode) {
            tree = json_value();
            advance("(end)");
        } else {

// Because browsers encourage combining of script files, the first token might
// be a semicolon to defend against a missing semicolon in the preceding file.

            if (option.browser) {
                if (next_token.id === ";") {
                    advance(";");
                }
            } else {

// If we are not in a browser, then the file form of strict pragma may be used.

                if (next_token.value === "use strict") {
                    advance("(string)");
                    advance(";");
                }
            }
            tree = statements();
            advance("(end)");
            blockage = global;
            functionage = global;
            walk_statement(tree);
            if (warnings.length === 0) {
                uninitialized_and_unused();
                if (!option.white) {
                    whitage();
                }
            }
        }
        if (!option.browser) {
            directives.forEach(function (comment) {
                if (comment.directive === "global") {
                    warn("missing_browser", comment);
                }
            });
        }
        early_stop = false;
    } catch (exception) {
        if (exception.name !== "JSLintError") {
            warnings.push(exception);
        }
    }
    return {
        directives,
        edition: "2025-05-28",
        exports,
        froms,
        global,
        id: "(JSLint)",
        json: json_mode,
        lines,
        module: module_mode === true,
        ok: warnings.length === 0 && !early_stop,
        option,
        property,
        shebang: (
            shebang
            ? lines[0]
            : undefined
        ),
        stop: early_stop,
        tokens,
        tree,
        warnings: warnings.sort(function (a, b) {
            return a.line - b.line || a.column - b.column;
        })
    };
});
