const webpack = require('webpack');
const PACKAGE = require('../webpack.common.js');

const package = PACKAGE(
  'xypic',                               // the package to build
  '../../src',                           // location of our js files
  [                                      // packages to link to
    'components/src/input/tex-base/lib',
    'components/src/core/lib',
    'components/src/output/chtml/lib',
    'components/src/output/svg/lib'
  ],
  __dirname,                             // our directory
	"../../build/"                         // where to put the packaged component
);

//
// Babel-load all .js files and process class properties
//
package.module.rules[0].test = /\.js$/;
package.module.rules[0].exclude = /node_modules/;
package.module.rules[0].use.options.plugins = [["@babel/plugin-proposal-class-properties", {loose: true}]];

// for DEBUGGING
// package["devtool"] = "inline-source-map";  // for DEBUGGING

module.exports = package;
