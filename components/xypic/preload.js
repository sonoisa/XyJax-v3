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

import {MathJax, combineDefaults} from 'mathjax-full/js/components/global.js';

//
//  Make sure all output directories are available, even if one or more isn't loaded
//
combineDefaults(MathJax._, 'output', {
  common: {
    Wrapper: {}
  },
  chtml: {
    Wrapper: {},
    Wrappers_ts: {}
  },
  svg: {
    Wrapper: {},
    Wrappers_ts: {}
  }
});
