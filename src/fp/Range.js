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


import {List} from "./List.js";


export class Range {
	constructor(start, end) {
		if (start > end) {
			this.start = end;
			this.end = start;
		} else {
			this.start = start;
			this.end = end;
		}
	}

	/**
	 * returns difference ranges between this range and a given range: this range \ a given range.
	 */
	difference(range) {
		var diff = List.empty;
		var a0 = this.start;
		var a1 = this.end;
		var b0 = range.start;
		var b1 = range.end;
		if (a1 <= b0) {
			// a0 < a1 <= b0 < b1
			diff = diff.prepend(this);
		} else if (b1 <= a0) {
			// b0 < b1 <= a0 < a1
			diff = diff.prepend(this);
		} else if (a0 < b0) {
			if (a1 <= b1) {
				// a0 < b0 <= a1 <= b1
				diff = diff.prepend(new Range(a0, b0));
			} else {
				// a0 < b0 < b1 < a1
				diff = diff.prepend(new Range(a0, b0));
				diff = diff.prepend(new Range(b1, a1));
			}
		} else /* if (b0 <= a0) */ {
			if (b1 < a1) {
				// b0 <= a0 <= b1 < a1
				diff = diff.prepend(new Range(b1, a1));
			} /* else {
				// b0 <= a0 < a1 <= b1
			} */
		}
		return diff;
	}

	differenceRanges(ranges) {
		var result = List.empty.prepend(this);
		ranges.foreach(function (range) {
			result = result.flatMap(function (remaining) {
				return remaining.difference(range);
			});
		});
		return result;
	}

	toString() {
		return "[" + this.start + ", " + this.end + "]";
	}
}

