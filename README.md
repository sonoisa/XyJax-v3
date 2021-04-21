# XyJax v3

-- Xy-pic extension for **MathJax version 3** --

**CAUTION**:
THE CURRENT VERSION IS IN ALPHA-QUALITY.
DEPENDING ON YOUR MathJax SETTINGS, IT MAY CRASH.
IT IS NOT YET RECOMMENDED FOR USE IN PRODUCTION.

---

XyJax is an almost Xy-pic compatible extension for **MathJax version 3**.

This extension enables you to draw various graphs and diagrams.

See https://sonoisa.github.io/xyjax-v3/xyjax-v3.html for more details. And origins

- MathJax: https://www.mathjax.org/
- Xy-pic: https://www.tug.org/applications/Xy-pic/

This software is under development.

## Installation instructions

**UNDER CONSTRUCTION**

(ref. test/sample-xyjax-v3.html)

1. Download build/xypic.js. The rest of the files are not necessary for use.

2. In your html, configure it to load the xypic.js you downloaded.

```
<script>
  MathJax = {
    loader: {
      load: ['[custom]/xypic.js'],
      paths: {custom: '.'}  // specify the path where xypic.js is located.
                            // This example assumes that xypic.js is in the same place as html.
    },
    tex: {
      packages: {'[+]': ['xypic']}
    }
  };
</script>
<script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml-full.js"></script>
```

## Present Limitation

- Supported MathJax version:
  - 3.1.2
- Supported Renderer:

  - CHTML
  - (SVG does not work now. But I have a plan to support it.)

- Accessibility does not work.
  **CAUTION**: If Accessibility or Collapsible Math is enabled, XyJax/MathJax will crash.

## For Developpers

**UNDER CONSTRUCTION**

### How to build xypic.js for production

```
$ git clone https://github.com/sonoisa/XyJax-v3 XyJax-v3
$ cd XyJax-v3
$ npm install
$ npm run clean
$ npm run build
```

### Hot to build MathJax and xypic.js for debugging

```
$ git clone https://github.com/sonoisa/XyJax-v3 XyJax-v3
$ cd XyJax-v3
$ npm install
# npm run build_mathjax_for_debug
$ npm run clean
$ npm run build
```

## For server-side rendering via node.js

Copy `build/xypic.js` to your npm project, and create a `mathjax.js` in the same directory containing:

```js
import { readFileSync, writeFileSync } from 'fs';
import { argv } from 'yargs';

import * as mathjax from 'mathjax-full';

mathjax
  .init({
    options: {
      typesetError: (_, math, err) => console.log(math.math + ': ' + err),
    },
    loader: {
      paths: { mathjax: 'mathjax-full/es5', custom: '.' },
      require: require,
      load: ['input/tex-full', 'output/chtml', '[custom]/xypic'],
    },
    tex: {
      packages: { '[+]': ['xypic'] },
    },
    chtml: {
      fontURL: 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/output/chtml/fonts/woff-v2',
    },
  })
  .then((MathJax) =>
    argv._.forEach((r) => {
      // Read in the HTML file
      const html = (MathJax.startup.document = MathJax.startup.getDocument(readFileSync(r, 'utf8')));

      // xypic has used the adaptor
      const adaptor = MathJax.startup.adaptor;

      // Clear the font cache
      html.outputJax.font.clearCache();

      // Typeset the document, with the render hooks that xypic has put in place
      html.clear().rerender();

      // Output the resulting HTML in-place
      writeFileSync(r, adaptor.doctype(html.document) + adaptor.outerHTML(adaptor.root(html.document)));
    })
  )
  .catch((err) => console.log(err));
```

Run `npm install mathjax-full yargs` in your node project, and finally run `node -r esm mathjax.js index.html` to replace your HTML file with a version with all the math pre-rendered.
