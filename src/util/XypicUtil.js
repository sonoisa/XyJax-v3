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


import {XypicConstants} from "./XypicConstants.js";


export const XypicUtil = {
	extProd: function (v1, v2) {
		return [v1[1]*v2[2]-v1[2]*v2[1], v1[2]*v2[0]-v1[0]*v2[2], v1[0]*v2[1]-v1[1]*v2[0]];
	},

	sign: function (x) {
		return (x < 0? -1 : (x > 0? 1 : 0));
	},

	sign2: function (x) {
		return (x < 0? -1 : 1);
	},

	roundEpsilon: function (x) {
		if (Math.abs(x) < XypicConstants.machinePrecision) {
			return 0;
		} else {
			return x;
		}
	},

	memoize: function (object, funcName) {
		var func = object[funcName];
		var memo = function () {
			var value = func.call(this);
			var constFunc = function () {
				return value;
			}

			constFunc.reset = reset;
			object[funcName] = constFunc;
			return value;
		}

		var reset = function () {
			object[funcName] = memo;
		}
		memo.reset = reset;
		reset();
	},

	round2: function (x) {
		return Math.round(x * 100) / 100;
	}
}
