import './preload.js';
import '../../src/core/XypicConfiguration.js';


import {CreateCHTMLWrapper} from '../../src/output/CHTMLWrappers.js';
// import {CreateSVGWrapper} from '../../src/output/SVGWrappers.js';

//
//  Check to see which output jax are loaded, and
//    set up callbacks for if the other is loaded via the menu
//    so that we can set up the wrappers for them.
//
const {Loader} = MathJax._.components.loader;
if (Loader) {
  if (!MathJax._.output.chtml.Wrapper.CHTMLWrapper) {
    Loader.ready('output/chtml').then(() => {
      const chtml = MathJax._.output.chtml
      CreateCHTMLWrapper(chtml.Wrapper.CHTMLWrapper, chtml.Wrappers_ts.CHTMLWrappers);
    });
  }
//   if (!MathJax._.output.svg.Wrapper.SVGWrapper) {
//     Loader.ready('output/svg').then(() => {
//       const svg = MathJax._.output.svg;
//       CreateSVGWrapper(svg.Wrapper.SVGWrapper, svg.Wrappers_ts.SVGWrappers);
//     }).catch(err => console.log('Caught', err));
//   }
}
