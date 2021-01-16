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


import {Option} from "./Option.js";


export class List {}

class Cons extends List {
	constructor(head, tail) {
		super();
		this.head = head;
		this.tail = tail;
	}

	get isEmpty() {
		return false;
	}

	at(index) {
		if (index < 0 || index >= this.length()) {
			throw Error("no such element at " + index + ". index must be lower than " + this.length() + ".");
		}
		var t = this;
		for (var i = 0; i < index; i++) {
			t = t.tail;
		}
		return t.head;
	}

	length() {
		var t = this;
		var l = 0;
		while (!t.isEmpty) {
			l++;
			t = t.tail;
		}
		return l;
	}

	prepend(element) {
		return new Cons(element, this);
	}

	append(element) {
		var result = new Cons(element, List.empty);
		this.reverse().foreach(function (e) {
			result = new Cons(e, result);
		});
		return result;
	}

	concat(that) {
		var result = that;
		this.reverse().foreach(function (e) {
			result = new Cons(e, result);
		});
		return result;
	}

	foldLeft(x0, f) {
		var r, c;
		r = f(x0, this.head);
		c = this.tail;
		while (!c.isEmpty) {
			r = f(r, c.head);
			c = c.tail;
		}
		return r;
	}

	foldRight(x0, f) {
		if (this.tail.isEmpty) {
			return f(this.head, x0);
		} else {
			return f(this.head, this.tail.foldRight(x0, f));
		}
	}

	map(f) {
		return new Cons(f(this.head), this.tail.map(f));
	}

	flatMap(k) {
		return k(this.head).concat(this.tail.flatMap(k));
	}

	foreach(f) {
		var e = this;
		while (!e.isEmpty) {
			f(e.head);
			e = e.tail;
		}
	}

	reverse() {
		var r = List.empty;
		this.foreach(function (c) {
			r = new Cons(c, r);
		});
		return r;
	}

	mkString() {
		var open, delim, close;
		switch (arguments.length) {
			case 0:
				open = delim = close = "";
				break;
			case 1:
				delim = arguments[0];
				open = close = "";
				break;
			case 2:
				open = arguments[0];
				delim = arguments[1];
				close = "";
				break;
			default:
				open = arguments[0];
				delim = arguments[1];
				close = arguments[2];
				break;
		}
		var desc, nxt;
		desc = open + this.head.toString();
		nxt = this.tail;
		while (nxt instanceof Cons) {
			desc += delim + nxt.head.toString(); 
			nxt = nxt.tail;
		}
		desc += close;
		return desc;
	}

	toString() {
		return this.mkString("[", ", ", "]");
	}

	static unapply(x) {
		return new Option.Some([x.head, x.tail]);
	}
}

List.Cons = Cons;


class Nil extends List {
	constructor() {
		super();
	}

	get isEmpty() {
		return true;
	}

	at(index) {
		throw new Error("cannot get element from an empty list.");
	}

	length() {
		return 0;
	}

	prepend(element) {
		return new Cons(element, List.empty);
	}

	append(element) {
		return new Cons(element, List.empty);
	}

	concat(that) {
		return that;
	}

	foldLeft(x0, f) {
		return x0;
	}

	foldRight(x0, f) {
		return x0;
	}

	flatMap(f) {
		return this;
	}

	map(f) {
		return this;
	}

	foreach(f) {}

	reverse() {
		return this;
	}

	mkString() {
		switch (arguments.length) {
			case 0:
			case 1:
				return "";
			case 2:
				return arguments[0]
			default:
				return arguments[0]+arguments[2];
		}
	}

	toString() {
		return '[]';
	}

	static unapply(x) {
		return new Option.Some(x);
	}
}

List.Nil = Nil;
List.empty = new Nil();
List.fromArray = function (as) {
	var list, i;
	list = List.empty;
	i = as.length - 1;
	while (i >= 0) {
		list = new Cons(as[i], list);
		i -= 1;
	}
	return list;
};
