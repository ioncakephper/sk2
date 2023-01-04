const format = require("format");
const { green } = require("colors");

/**
 * Logs a message to the console if the verbose flag is set.
 * @param {string} filename - the filename to log.
 * @param {object} [options] - the options object.
 * @returns None
 */
 function logDocumentFile(filename, options) {
    let text = format(`Generated topic file: %s.`, `${green(filename)}`);
    logVerbose(text, options);
}

/**
 * Logs a message to the console if the verbose flag is set.
 * @param {string} filename - the filename to log
 * @param {object} options - the options object
 * @returns None
 */
function logSidebarsFile(filename, options) {
    let text = format(`Generated sidebars file: %s`, `${green(filename)}`);
    logVerbose(text, options);
}

/**
 * Logs the output if the verbose option is set.
 * @param {string} output - the output to log.
 * @param {object} options - the options object.
 * @returns None
 */
function logVerbose(output, options) {
    if (options.verbose) {
        console.log(output);
    }
}

module.exports = {
    logDocumentFile,
    logSidebarsFile,
    logVerbose
}