#!/usr/bin/env node

const program = require('commander')
const { saveDocument, setDefaultExtension } = require('file-easy')
const hbsr = require('hbsr')
const path = require('path')

const { logSidebarsFile } = require('../lib/utils')
const { isString } = require("lodash")
const { loadYamlOutline, buildSidebarItems } = require('../lib/yaml-outline')

let { version, description } = require('../package.json')

program
    .name('skelo')
    .description(description)
    .version(version)

program
    .command('build', { isDefault: true })
    .description('generate sidebar and topic files from outline file(s).')
    .argument("[outline...]", "filename(s) with sidebar outlines", `${program.name()}-outline`)

    .option('--autoFolder', 'create folder name for categories and subcategories.')
    .option('--autoOverview', 'create overview topic for every category.')
    .option('-d, --docs <docsPath>', 'path to Docusaurus project docs root folder', './docs')
    .option('--outlineExtension <extension>', 'outline file default extension', '.yaml')
    .option('-s, --sidebar <sidebarFilename>', 'path and name of sidebar file to generate', './sidebars.js')
    .option('--templatePath <path>', 'path to templates for sidebars, topic, and headings.', path.resolve(__dirname, '../templates'))
    .option('--topicExtension <extension>', 'topic file extension', '.md')
    .option('-v, --verbose', 'provide progress messages.')

    .action((outline, options) => {

        outline = isString(outline) ? [outline] : outline;

        let sidebars = {}

        let outputSidebars = outline.map(outlineInputFilename => {
            let fileSidebars = loadAllSidebarDefinitions(outlineInputFilename, options)
            return fileSidebars.map(fileSidebar => {
                let { label, items } = fileSidebar;
                return {
                    name: label,
                    items: buildSidebarItems(items, fileSidebar, options)
                }
            })
        })

        outputSidebars.forEach(sb => {
            sb.forEach(sbItem => {
                sidebars[sbItem.name] = sbItem.items;
            })
        })
        saveSidebarsDocument(sidebars, options);
    })

// program.parse("node bin/cli.js -d website/docs -s website/sidebars.js --verbose --autoFolder".split(/\s+/))
program.parse()

/**
 * Describe sidebar item or category.
 * @typedef {object} SidebarDefinition
 * @property {string} label - the label of topic or category in sidebar.
 * @property {Array<string|SidebarDefinition>} [items=[]] - the items inside a sidebar category.
 * @property {string} [title=null] - the title to appear as topic title, overrides label.
 * @property {string} [brief=null] - the text appearing as first paragraph under topic title.
 * @property {Array<string|SidebarDefinition>} [headings=null] - the headings of current topic.
 * @property {string} [folder=null] - the folder of topic or category relative to docs folder.
 * @property {string} [slug=null] - the slug of topic page, overrides label.
 * @property {string} [id=null] - the id of the topic page, overrides label.
 */

/**
 * Loads the sidebar definitions from the given file.
 * @param {string} outlineInputFilename - the name of the file to load the sidebar definitions from.
 * @param {OutlineOptions} options - the outline options to use.
 * @returns {Array<SidebarDefinition>} - the sidebar definitions.
 */
function loadAllSidebarDefinitions(outlineInputFilename, options) {
    outlineInputFilename = setDefaultExtension(outlineInputFilename, options.outlineExtension)

    let ext = outlineInputFilename.split('.').pop()
    isYamlOutline = ["yaml", "yml"].includes(ext.trim().toLowerCase())
    let sidebarDefinitions = isYamlOutline
        ? loadYamlOutline(outlineInputFilename, options)
        : loadMarkdownOutline(outlineInputFilename, options)

    return sidebarDefinitions;
}

/**
 * Saves the sidebars document to the given filename.
 * @param {string} filename - the name of the file to save the document to.
 * @param {SidebarOptions} options - the options for the sidebar document.
 * @returns None
 */
function saveSidebarsDocument(sidebars, options) {

    let filename = options.sidebar;
    filename = setDefaultExtension(filename, options.outlineExtension);

    let templateOptions = { template_path: options.templatePath };

    let content = hbsr.render_template('sidebars', { content: JSON.stringify(sidebars, null, 4) }, templateOptions)

    saveDocument(filename, content);
    logSidebarsFile(filename, options)
}
