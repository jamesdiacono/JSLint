// report.js
// 2025-05-13
// Copyright (c) 2015 Douglas Crockford  (www.JSLint.com)

// Generate JSLint HTML reports.

/*property
    column, context, edition, error, exports, forEach, freeze, froms, fudge,
    global, isArray, join, json, keys, length, line, lines, message, module,
    option, property, push, replace, sort, stop, warnings
*/

const rx_amp = /&/g;
const rx_gt = />/g;
const rx_lt = /</g;

function entityify(string) {

// Replace & < > with less destructive entities.

    return String(
        string
    ).replace(
        rx_amp,
        "&amp;"
    ).replace(
        rx_lt,
        "&lt;"
    ).replace(
        rx_gt,
        "&gt;"
    );
}

export default Object.freeze({
    error(data) {

// Produce the HTML Error Report.

// <cite><address>LINE_NUMBER</address>MESSAGE</cite>
// <samp>EVIDENCE</samp>

        let fudge = Number(Boolean(data.option.fudge));
        let output = [];
        if (data.stop) {
            output.push("<center>JSLint was unable to finish.</center>");
        }
        data.warnings.forEach(function (warning) {
            output.push(
                "<cite><address>",
                entityify(warning.line + fudge),
                ".",
                entityify(warning.column + fudge),
                "</address>",
                entityify(warning.message),
                "</cite><samp>",
                entityify(data.lines[warning.line] || ""),
                "</samp>"
            );
        });
        return output.join("");
    },

    module(data) {

// Produce the HTML Module Report.

        let mode = (
            data.module
            ? "module"
            : "global"
        );
        let output = [];

        if (data.json) {
            return (
                data.warnings.length === 0
                ? "<center>JSON: good.</center>"
                : "<center>JSON: bad.</center>"
            );
        }

        function detail(title, array) {
            if (Array.isArray(array) && array.length > 0) {
                output.push(
                    "<dt>",
                    entityify(title),
                    "</dt><dd>",
                    array.join(", "),
                    "</dd>"
                );
            }
        }

        let global = Object.keys(data.global.context).sort();
        let froms = data.froms.sort();
        let exports = Object.keys(data.exports).sort();
        if (global.length + froms.length + exports.length > 0) {
            output.push("<dl>");
            detail(mode, global);
            detail("import from", froms);
            detail("export", exports);
            output.push("</dl>");
        } else {
            output.push(
                "<center>",
                "There are no imports, exports, or global variables.",
                "</center>"
            );
        }
        output.push(
            "<center>JSLint edition ",
            entityify(data.edition),
            "</center>"
        );
        return output.join("");
    },

    property(data) {

// Produce the /*property*/ directive.

        let not_first = false;
        let output = ["/*property"];
        let length = 1111;
        let properties = Object.keys(data.property);

        if (properties.length > 0) {
            properties.sort().forEach(function (key) {
                if (not_first) {
                    output.push(",");
                    length += 2;
                }
                not_first = true;
                if (length + key.length >= 80) {
                    length = 4;
                    output.push("\n   ");
                }
                output.push(" ", key);
                length += key.length;
            });
            output.push("\n*/\n");
            return output.join("");
        }
    }
});
