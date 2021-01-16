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


export class Option {}

class Some extends Option {
	constructor(value) {
		super();
		this.get = value;
	}

	get isEmpty() {
		return false;
	}

	get isDefined() {
		return true;
	}

	getOrElse(ignore) {
		return this.get;
	}

	flatMap(k) {
		return k(this.get);
	}

	map(f) {
		return new Some(f(this.get));
	}

	foreach(f) {
		f(this.get);
	}

	toString() {
		return "Some(" + this.get + ")";
	}

	static unapply(x) {
		return new Some(x.get);
	}
}

class None extends Option {
	constructor() {
		super();
	}

	get isEmpty() {
		return true;
	}

	get isDefined() {
		return false;
	}

	getOrElse(value) {
		return value; 
	}

	flatMap(k) {
		return this;
	}

	foreach(f) {}

	map(k) {
		return this; 
	}

	toString() {
		return "None"; 
	}

	static unapply(x) {
		return new Some(x);
	}
}

Option.Some = Some;
Option.None = None;
Option.empty = new None();
