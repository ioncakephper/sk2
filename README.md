# sk2

Generate sidebar file and topic files for Docusaurus-powered documentation site.

## Install

To use the `sk2` CLI, you have to install the `sk2` package globally.

```bash
npm i -g sk2
```

Check `sk2` CLI is available:

```bash
sk2 -V # ask sk2 version
1.0.0  # or any other version confirms that sk2 responds
```

## Usage

```bash
sk2 [options] [command]
```

If you specify no command, the `build` command is executed.

```txt
Options:
  -V, --version                 output the version number
  -h, --help                    display help for command

Commands:
  build [options] [outline...]  generate sidebar and topic files from outline file(s).
  help [command]                display help for command
```


### Commands

#### `build`

generate sidebar and topic files from outline file(s).

`sk2 build [options] [outline...]`

**`Arguments`**
- **`outline:`** filename(s) with sidebar outlines (default: "sk2-outline")

**`Options`**

- **`-s, --sidebar <sidebarFilename>:`** path and name of sidebar file to generate (default: "./sidebar.js")
- **`-d, --docs <docsPath>:`** path to Docusaurus project docs root folder (default: "./docs")
- **`--outlineExtension <extension>:`** outline file default extension (default: ".yaml")
- **`--autoFolder`** create a folder for every category
- **`--autoOverview`** create an overview page for every category
- **`--templatePath <path>:`** path to templates for sidebars, topic, and headings.
- **`--topicExtension <extension>:`** topic file extension (default: ".md")
- **`--verbose`** provide progress messages.

## Outline element properties

| Name | Type | Default | Description |
|------|------|---------|-------------|
| `brief` | `string` | null | Short topic description to appear as the first paragraph in topic document. |
| `description` | `string` | null | Description to appear in HTML page description meta tag |
| `folder` | `string` | null | Path of topic relative to `docs` folder in Docusaurus. Separate folders with forward slash `/`. Spaces in a folder are converted to `_`. |
| `headings` | `Array<string | SidebarCategory>` | `[]` | Headings of current topic. Add subheadings in the items element of a heading item. |
| `id` | `string` | null | Topic identifier to override the one built from label. Spaces in id are converted to `_`. |
| `items` | `Array<string | SidebarCategory>` | `[]` | Items of current sidebar topic. A topic with non-empty items is a sidebar category |
| `label` | `string` | | Appears in sidebar as topic identifier |
| `slug` | `string` | null | Used as an alternative topic filename. |
| `title` | `string` | null | Appears as topic title instead of topic label. |


## Examples

### Example 1: Use default options and outline filename

```bash
cd my-work-folder
sk2
```

* the `build` command is invoked
* it looks for the `sk2-outline.yaml` in the current folder (my-work=folder)
* generates the `sidebars.js` file in the current folder, and topic files in the `docs` subfolder.
* topic files have the `.md` extension