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


export class Matcher {
	constructor() {
		this.cases = [];
	}

	Case(klass, f) {
		this.cases.push([klass, f]);
		return this;
	}

	match(x) {
		var i, count, klass, op;
		i = 0;
		count = this.cases.length;
		while (i < count) {
			klass = this.cases[i][0];
			if (x instanceof klass) {
				op = klass.unapply(x);
				if (op.isDefined) {
					return this.cases[i][1](op.get);
				}
			}
			i = i + 1;
		}
		throw new MatchError(x);
	}
}


export class MatchError {
	constructor (obj) {
		this.obj = obj;
	}

//	getMessage() {
//		if (this.obj === null) {
//			return "null"
//		} else {
//			return obj.toString() + " (of class " + obj. + ")"
//		}
//	}

	toString() {
		return "MatchError(" + this.obj + ")";
	}
}
