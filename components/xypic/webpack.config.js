/*************************************************************
 *
 *  Copyright (c) 2011-2021 Isao Sonobe <sonoisa@gmail.com>
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

const webpack = require('webpack');
const PACKAGE = require('../../mathjax/components/webpack.common.js');

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
// package["devtool"] = "inline-source-map";
// package["resolve"] = { fallback: { "path": false } };

module.exports = package;
