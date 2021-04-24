# XyJax v3
 -- Xy-pic extension for **MathJax version 3** --

**CAUTION**:  
THE CURRENT VERSION IS IN ALPHA-QUALITY.  
DEPENDING ON YOUR MathJax SETTINGS, IT MAY CRASH.  
IT IS NOT YET RECOMMENDED FOR USE IN PRODUCTION.

----
XyJax is an almost Xy-pic compatible extension for **MathJax version 3**.

This extension enables you to draw various graphs and diagrams.

See https://sonoisa.github.io/xyjax-v3/xyjax-v3.html for more details. And origins

- MathJax: https://www.mathjax.org/
- Xy-pic: https://www.tug.org/applications/Xy-pic/

This software is under development.


## Installation instructions

### Using XyJax-v3 from a CDN

(ref. test/sample-xyjax-v3-CDN.html)

1. In your html, configure it to load the xypic.js.
```
<script>
  MathJax = {
    loader: {
      load: ['[custom]/xypic.js'],
      paths: {custom: 'https://cdn.jsdelivr.net/gh/sonoisa/XyJax-v3@0.2.0/build/'}
    },
    tex: {
      packages: {'[+]': ['xypic']}
    }
  };
</script>
<script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3.1.4/es5/tex-chtml-full.js"></script>
<!-- <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3.1.4/es5/tex-svg-full.js"></script> -->
```


### Hosting your own copy of XyJax-v3

(ref. test/sample-xyjax-v3-chtml.html and test/sample-xyjax-v3-svg.html)

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
<script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3.1.4/es5/tex-chtml-full.js"></script>
<!-- <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3.1.4/es5/tex-svg-full.js"></script> -->
```


## Present Limitation

- Supported MathJax version:
    - 3.1.4+
- Supported Renderer:
    - CHTML
    - SVG
    - Switching between these renderers is currently not supported.

- Accessibility does not work.  
**CAUTION**: If Accessibility or Collapsible Math is enabled, XyJax/MathJax will crash.


## For Developers

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
