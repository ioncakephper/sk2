

const yaml = require('yaml')
const fs = require('fs');
const { isEmpty, isObject, isString, isArray } = require('lodash')
const path = require('path');
const { slug, setDefaultExtension, saveDocument } = require('file-easy');
const hbsr = require('hbsr');

const { logDocumentFile } = require('./utils');


/**
 * Loads the outline from the given YAML file.
 * @param {string} outlineInputFilename - the name of the YAML file to load.
 * @param {object} options - the options to pass to the YAML parser.
 * @returns {object} the outline object.
 */
function loadYamlOutline(outlineInputFilename, options) {
    let source = fs.readFileSync(outlineInputFilename, "utf-8")
    return yaml.parse(source).sidebars.map(item => {
        return normalize(item)
    });
}

/**
 * Takes in an array of sidebar items and returns a string of HTML that can be injected into the page.
 * @param {string[]} items - the array of sidebar items.
 * @param {string} [options] - the options for the sidebar.
 * @returns {string} - the string of HTML that can be injected into the page.
 */
function buildSidebarItems(items, parent, options) {
    let elements = items.map(item => {
        item = normalize(item);

        item['folder'] = path.join(getFolder(parent), getFolder(item))

        let isTopic = (item.items) ? (item.items.length === 0) : false
        if (isTopic) {
            return buildTopic(item, options)
        } else {
            if (options.autoFolder) {
                item.folder = path.join(getFolder(item), getSlug(item))
            }
            let additional = {}
            if (options.autoOverview) {
                additional = {
                link: {
                    type: 'generated-index',
                    title: getTitle(item),
                }}
                if (getDescription(item)) {
                    additional.link['description'] = getDescription(item)
                }
            }
            if (item.overview === true) {
                let id = path.join(getFolder(item), `${getSlug(item)}-overview`)
                while (/\\+/.test(id)) {
                    id = id.replace(/\\+/, '/')
                }
                additional = {
                    link: {
                        type: 'doc',
                        id: id
                    }
                }
                buildTopic({
                    label: item.label,
                    folder: getFolder(item),
                    slug: `${getSlug(item)}-overview`,
                    title: getTitle(item),
                    brief: getBrief(item)
                }, options)
            }
            return {
                ...{
                type: "category",
                label: item.label,
                items: buildSidebarItems(item.items, item, options)
                },
                ...additional,
            }
        }
    })
    return elements;
}

/**
 * Gets the title of the given item.
 * @param {object} item - the item to get the title of.
 * @returns {string} the title of the given item.
 */
function getTitle(item) {
    return item['title'] || item.label;
}

/**
 * Gets the description of an item.
 * @param {object} item - the item to get the description of.
 * @returns {string} the description of the item.
 */
function getDescription(item) {
    return item['description'] || getBrief(item) || ''
}

/**
 * Gets the brief description of the item.
 * @param {Topic | import('../bin/cli').SidebarDefinition} item - the item to get the brief description of.
 * @returns {string} the brief description of the item.
 */
function getBrief(item) {
    return item['brief']
}

/**
 * Builds a topic file for the given item.
 * @param {Item} item - The item to build a topic for.
 * @param {Options} options - The options for the build.
 * @returns {string} The path to the topic file.
 */
function buildTopic(item, options) {

    let topicFilename = path.join(getFolder(item), getSlug(item))
    saveTopic(topicFilename, item, options)

    while (/\\+/.test(topicFilename)) {
        topicFilename = topicFilename.replace(/\\+/, '/')
    }
    return topicFilename;
}

/**
 * Save the given topic to the given filename.
 * @param {string} topicFilename - The filename to save the topic to.
 * @param {SidebarDefinition} item - The topic to save.
 * @param {object} options - The options object.
 * @returns None
 */
function saveTopic(topicFilename, item, options) {
    topicFilename = path.join(options.docs, topicFilename);
    topicFilename = setDefaultExtension(topicFilename, options.topicExtension)

    let topicContent = buildTopicContent(item, options)
    saveDocument(topicFilename, topicContent);
    logDocumentFile(topicFilename, options)
}

/**
 * Describes a sidebar topic.
 * @typedef {object} Topic
 * @extends SidebarDefinition
 * @property {string} label
 * @property {string} [title=this.label]
 * @property {string} [brief=null]
 * @property {string} [description=null]
 * @property {Array<SidebarDefinition>} headings - the headings of sidebar topic.
 */

/**
 * Builds a topic from the given item.
 * @param {Topic} item - the topic to build
 * @param {Object} options - the options for the topic
 * @returns {string} the rendered topic
 */
function buildTopicContent(item, options) {

    let data = {
        ...item,
        ...{headings: buildHeadings(item.headings, 2, options)},
        ...{title: item.title || item.label}
    }
    return hbsr.render_template('topic', data, {template_path: options.templatePath})
}


/**
 * Builds headings for the given items.
 * @param {Array<Object>} items - the items to build headings for.
 * @param {number} [level=2] - the level of the headings.
 * @param {Object} [options] - the options for the headings.
 * @returns {string} the headings for the given items.
 */
function buildHeadings(items = [], level = 2, options) {

    return items.map(item => {
        item = normalize(item)
        let data = {...item, ...{
            prefix: '#'.repeat(level),
            title: item.title || item.label,
            headings: buildHeadings(item.items, level + 1, options)
        }
        }
        return hbsr.render_template('headings', data, {template_path: options.templatePath})
    }).join('\n')
}

/**
 * Returns a slug for the given item.
 * @param {string | number} item - the item to get a slug for.
 * @returns {string} the slug for the given item.
 */
function getSlug(item) {
    return slug(item.slug || item.label)
}

/**
 * Gets the autoFolder property from the given item.
 * @param {object} item - the item to get the autoFolder property from.
 * @returns {boolean} - the autoFolder property from the given item.
 */
function getAutoFolder(item) {
    return item['autoFolder'] || false;
}

/**
 * Gets the folder of the given item.
 * @param {object} item - the item to get the folder of.
 * @returns {string} the folder of the given item.
 */
function getFolder(item) {
    if (/\\/.test(item.folder)) {
        let s = item.folder;
        let regex = /[^a-zA-Z0-9\-\\]+/g;
        s = s.trim().toLowerCase().replace(regex, '-')
        s = s.replace(/^\-+/, '').replace(/\-+$/g, '')
        return s;
    }
    return path.join(slug(item.folder || ''))
}


/**
 * Normalizes the given item.
 * @param {string | object} item - the item to normalize.
 * @returns {object} - the normalized item.
 */
function normalize(item) {
    item = isString(item) ? {
        label: item
    } : item;
    if (isObject(item)) {
        let isCustomItem = isObject(item) && Object.keys(item).length === 1 && Object.keys(item)[0].toLowerCase() !== 'label'
        if (isCustomItem) {
            let k = Object.keys(item)[0];
            let v = item[k];
            if (isArray(v)) {
                return normalize({label: k, items: item[k]})
            }
            if (isObject(v)) {
                let result = normalize(k);
                for (const p in v) {
                    let regex = /^\s*\@([a-zA-Z0-9\s]+)$/;
                    if (regex.test(p)) {
                        let parts = regex.exec(p)
                        let name = parts[1]
                        result[name] = v[p]
                    }
                }
                return normalize(result)
            }

        }
        item = {
            ...{items: []},
            ...item,
        }
        item.items = item.items.map(el => {
            return normalize(el)
        })
        if (item.headings) {
            item.headings = item.headings.map(el => {
                return normalize(el)
            })
        }
    }

    return item;
}

module.exports = {
    loadYamlOutline,
    buildSidebarItems,
}