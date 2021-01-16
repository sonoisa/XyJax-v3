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
import {Option} from "./Option.js";
import {Pair} from "./Pair.js";
import {Matcher, MatchError} from "./Match.js";

/************ OffsetPosition **************/
class OffsetPosition {
	constructor(source, offset) {
		// assert(source.length >= offset)
		this.source = source;
		if (offset === undefined) {
			this.offset = 0;
		} else {
			this.offset = offset;
		} 
		this._index = null;
		this._line = null;
	}

	index() {
		if (this._index !== null) {
			return this._index;
		}
		this._index = [];
		this._index.push(0);
		var i = 0;
		while (i < this.source.length) {
			if (this.source.charAt(i) === '\n') {
				this._index.push(i + 1);
			}
			i += 1;
		}
		this._index.push(this.source.length);
		return this._index;
	}

	line() {
		var lo, hi, mid;
		if (this._line !== null) {
			return this._line;
		}
		lo = 0;
		hi = this.index().length - 1;
		while (lo + 1 < hi) {
			mid = (hi + lo) >> 1;
			if (this.offset < this.index()[mid]) {
				hi = mid;
			} else {
				lo = mid;
			}
		}
		this._line = lo + 1;
		return this._line;
	}

	column() {
		return this.offset - this.index()[this.line() - 1] + 1;
	}

	lineContents() {
		var i, l;
		i = this.index();
		l = this.line();
		return this.source.substring(i[l - 1], i[l]);
	}

	toString() {
		return this.line().toString() + '.' + this.column();
	}

	longString() {
		var desc, i;
		desc = this.lineContents() + '\n';
		i = 0;
		while (i < this.column()) {
			if (this.lineContents().charAt(i) === '\t') {
				desc += '\t';
			} else {
				desc += ' ';
			}
			i += 1;
		}
		desc += '^';
		return desc;
	}

	isLessThan(that) {
		if (that instanceof OffsetPosition) {
			return this.offset < that.offset;
		} else {
			return (
				this.line() < that.line() || 
				(this.line() === that.line() && this.column() < that.column())
			);
		}
	} 
}


/************ StringReader **************/
export class StringReader {
	constructor(source, offset, context) {
		this.source = source;
		this.offset = offset;
		this.context = context;
	}

	first() {
		if (this.offset < this.source.length) {
			return this.source.charAt(this.offset);
		} else {
			return StringReader.EofCh;
		}
	}

	rest() {
		if (this.offset < this.source.length) {
			return new StringReader(this.source, this.offset + 1, this.context);
		} else {
			return this;
		}
	}

	pos() {
		return new OffsetPosition(this.source, this.offset);
	}

	atEnd() {
		return this.offset >= this.source.length;
	}

	drop(n) {
		var r, count;
		r = this;
		count = n;
		while (count > 0) {
			r = r.rest();
			count -= 1;
		}
		return r;
	}
}

StringReader.EofCh = '\x03';


/************ Parsers **************/
export class Parsers {
	static parse(p, input) {
		return p.apply(input);
	}

	static parseAll(p, input) {
		return p.andl(function () {
			return Parsers.eos();
		}).apply(input);
	}

	static parseString(p, str) {
		var input = new StringReader(str, 0, { lastNoSuccess: undefined });
		return Parsers.parse(p, input);
	}

	static parseAllString(p, str) {
		var input = new StringReader(str, 0, { lastNoSuccess: undefined });
		return Parsers.parseAll(p, input);
	}

	static _handleWhiteSpace(input) {
		var whiteSpaceRegex = input.context.whiteSpaceRegex;
		var source = input.source;
		var offset = input.offset;
		var m = whiteSpaceRegex.exec(source.substring(offset, source.length));
		if (m !== null) {
			return offset + m[0].length;
		} else {
			return offset;
		}
	}

	static literal(str) {
		return new Parser(function (input) {
			var source, offset, start, i, j, found;
			source = input.source;
			offset = input.offset;
			start = Parsers._handleWhiteSpace(input);
			i = 0;
			j = start;
			while (i < str.length && j < source.length && 
					str.charAt(i) === source.charAt(j)) {
				i += 1;
				j += 1;
			}
			if (i === str.length) {
				return new Success(str, input.drop(j - offset));
			} else {
				if (start === source.length) {
					found = "end of source";
				} else {
					found = "`" + source.charAt(start) + "'";
				}
				return new Failure(
					"`" + str + "' expected but " + found + " found",
					input.drop(start - offset)
				);
			}
		});
	}

	static regex(rx /* must start with ^ */) {
		if (rx.toString().substring(0, 2) !== "/^") {
			throw ("regex must start with `^' but " + rx);
		}
		return new Parser(function (input) {
			var source, offset, m, found;
			source = input.source;
			offset = input.offset;
			m = rx.exec(source.substring(offset, source.length));
			if (m !== null) {
				return new Success(m[0], input.drop(m[0].length));
			} else {
				if (offset === source.length) {
					found = "end of source";
				} else {
					found = "`" + source.charAt(offset) + "'";
				}
				return new Failure(
					"string matching regex " + rx + " expected but " + found + " found",
					input
				);
			}
		});
	}

	static regexLiteral(rx /* must start with ^ */) {
		if (rx.toString().substring(0, 2) !== "/^") {
			throw ("regex must start with `^' but " + rx);
		}
		return new Parser(function (input) {
			var source, offset, start, m, found;
			source = input.source;
			offset = input.offset;
			start = Parsers._handleWhiteSpace(input);
			m = rx.exec(source.substring(start, source.length));
			if (m !== null) {
				return new Success(m[0], input.drop(start + m[0].length - offset));
			} else {
				if (start === source.length) {
					found = "end of source";
				} else {
					found = "`" + source.charAt(start) + "'";
				}
				return new Failure(
					"string matching regex " + rx + " expected but " + found + " found",
					input.drop(start - offset)
				);
			}
		});
	}

	static eos() {
		return new Parser(function (input) {
			var source, offset, start;
			source = input.source;
			offset = input.offset;
			start = Parsers._handleWhiteSpace(input);
			if (source.length === start) {
				return new Success("", input);
			} else {
				return new Failure("end of source expected but `" + 
					source.charAt(start) + "' found", input);
			}
		});
	}

	static commit(/*lazy*/ p) {
		return new Parser(function (input) {
			var res = p()(input);
			return (new Matcher()
				.Case(Success, function (x) { return res; })
				.Case(ParseError, function (x) { return res; })
				.Case(Failure, function (x) {
					return new ParseError(x[0], x[1]);
				}).match(res)
			);
		});
	}

	//elem: function (kind, p)
	static elem(e) {
		return Parsers.accept(e).named('"' + e + '"');
	}

	static accept(e) {
		return Parsers.acceptIf(
			function (x) { return x === e; },
			function (x) { return "`" + e + "' expected but `" + x + "' found"; }
		);
	}

	static acceptIf(p, err) {
		return new Parser(function (input) {
			if (p(input.first())) {
				return new Success(input.first(), input.rest());
			} else {
				return new Failure(err(input.first()), input);
			}
		});
	}

	//acceptMatch(expected, f)
	//acceptSeq(es)
	static failure(msg) {
		return new Parser(function (input) {
			return new Failure(msg, input);
		});
	}

	static err(msg) {
		return new Parser(function (input) {
			return new ParseError(msg, input);
		});
	}

	static success(v) {
		return new Parser(function (input) {
			return new Success(v, input);
		});
	}

	static log(/*lazy*/ p, name) {
		return new Parser(function (input) {
			console.log("trying " + name + " at " + input);
			var r = p().apply(input);
			console.log(name + " --> " + r);
			return r;
		});
	}

	static rep(/*lazy*/ p) {
		var s = Parsers.success(List.empty);
		return Parsers.rep1(p).or(function () { return s; });
	}

	static rep1(/*lazy*/ p) {
		return new Parser(function (input) {
			var elems, i, p0, res;
			elems = [];
			i = input;
			p0 = p();
			res = p0.apply(input);
			if (res instanceof Success) {
				while (res instanceof Success) {
					elems.push(res.result);
					i = res.next;
					res = p0.apply(i);
				}
				return new Success(List.fromArray(elems), i);
			} else {
				return res;
			}
		});
	}

	//rep1: function (/*lazy*/ first, /*lazy*/ p)
	static repN(num, /*lazy*/ p) {
		if (num === 0) {
			return Parsers.success(FP.List.empty);
		}
		return new Parser(function (input) {
			var elems, i, p0, res;
			elems = [];
			i = input;
			p0 = p();
			res = p0.apply(i);
			while (res instanceof Success) {
				elems.push(res.result);
				i = res.next;
				if (num === elems.length) {
					return new Success(List.fromArray(elems), i);
				}
				res = p0.apply(i);
			}
			return res; // NoSuccess
		});
	}

	static repsep(/*lazy*/ p, /*lazy*/ q) {
		var s = Parsers.success(List.empty);
		return Parsers.rep1sep(p, q).or(function () { return s; });
	}

	static rep1sep(/*lazy*/ p, /*lazy*/ q) {
		return p().and(Parsers.rep(q().andr(p))).to(function (res) {
			return new List.Cons(res.head, res.tail);
		});
	}

//	chainl1: function (/*lazy*/ p, /*lazy*/ q) {
//		return this.chainl1(p, p, q)
//	},
	static chainl1(/*lazy*/ first, /*lazy*/ p, /*lazy*/ q) {
		return first().and(Parsers.rep(q().and(p))).to(function (res) {
			return res.tail.foldLeft(res.head, function (a, fb) { return fb.head(a, fb.tail); });
		});
	}

	static chainr1(/*lazy*/ p, /*lazy*/ q, combine, first) {
		return p().and(this.rep(q().and(p))).to(function (res) {
			return new List.Cons(new Pair(combine, res.head),
				res.tail).foldRight(first, function (fa, b) { return fa.head(fa.tail, b); }
				);
		});
	}

	static opt(/*lazy*/ p) {
		return p().to(function (x) {
			return new Option.Some(x);
		}).or(function () {
			return Parsers.success(Option.empty);
		});
	}

	static not(/*lazy*/ p) {
		return new Parser(function (input) {
			var r = p().apply(input);
			if (r.successful) {
				return new Failure("Expected failure", input);
			} else {
				return new Success(Option.empty, input);
			}
		});
	}

	static guard(/*lazy*/ p) {
		return new Parser(function (input) {
			var r = p().apply(input);
			if (r.successful) {
				return new Success(r.result, input);
			} else {
				return r;
			}
		});
	}

	//positioned: function (/*lazy*/ p)
	//phrase: function (p)
	static mkList(pair) {
		return new List.Cons(pair.head, pair.tail);
	}

	static fun(x) {
		return function () { return x; };
	}

	static lazyParser(x) {
		var lit, r;
		if (x instanceof String || (typeof x) === "string") {
			lit = Parsers.literal(x);
			return function () { return lit; };
		} else if (x instanceof Function) {
			// x is deemed to be a function which has the return value as Parser. 
			return x;
		} else if (x instanceof Object) {
			if(x instanceof Parser) {
				return function () { return x; };
			} else if (x instanceof RegExp) {
				r = Parsers.regexLiteral(x);
				return function () { return r; };
			} else {
				return Parsers.err("unhandlable type");
			}
		} else {
			return Parsers.err("unhandlable type");
		}
	}

	static seq() {
		var count, parser, i;
		count = arguments.length;
		if (count === 0) {
			return Parsers.err("at least one element must be specified");
		}
		parser = Parsers.lazyParser(arguments[0])();
		i = 1;
		while (i < count) {
			parser = parser.and(Parsers.lazyParser(arguments[i]));
			i += 1;
		}
		return parser;
	}

	static or() {
		var count, parser, i;
		count = arguments.length;
		if (count === 0) {
			return Parsers.err("at least one element must be specified");
		}
		parser = Parsers.lazyParser(arguments[0])();
		i = 1;
		while (i < count) {
			parser = parser.or(Parsers.lazyParser(arguments[i]));
			i += 1;
		}
		return parser;
	}
}


/************ ParseResult **************/
class ParseResult {
	constructor() {}

	isEmpty() {
		return !this.successful;
	}

	getOrElse(/*lazy*/ defaultValue) {
		if (this.isEmpty) {
			return defaultValue();
		} else {
			return this.get();
		}
	} 
}

Parsers.ParseResult = ParseResult;


/************ Success **************/
class Success extends ParseResult {
	constructor(result, next) {
		super();
		this.result = result;
		this.next = next;
	}

	get successful() {
		return true;
	}

	map(f) {
		return new Success(f(this.result), this.next);
	}

	mapPartial(f, err) {
		try {
			return new Success(f(this.result), this.next);
		} catch (e) {
			if (e instanceof MatchError) {
				return new Failure(err(this.result), this.next);
			} else {
				throw e;
			}
		}
	}

	flatMapWithNext(f) {
		return f(this.result).apply(this.next);
	}

	append(/*lazy*/ a) {
		return this;
	}

	get() {
		return this.result;
	}

	toString() {
		return '[' + this.next.pos() + '] parsed: ' + this.result;
	}

	static unapply(x) {
		return new Option.Some([x.result, x.next]);
	}
}

Parsers.Success = Success;


/************ NoSuccess **************/
class NoSuccess extends ParseResult {
	constructor() {
		super();
	}

	get successful() {
		return false;
	}

	_setLastNoSuccess() {
		var context = this.next.context;
		if (context.lastNoSuccess === undefined || !this.next.pos().isLessThan(context.lastNoSuccess.next.pos())) {
			context.lastNoSuccess = this;
		}
	}

	map(f) {
		return this;
	}

	mapPartial(f, error) {
		return this;
	}

	flatMapWithNext(f) {
		return this;
	}

	get() {
		return Parsers.error("No result when parsing failed");
	}
}

Parsers.NoSuccess = NoSuccess;


/************ Failure **************/
class Failure extends NoSuccess {
	constructor(msg, next) {
		super();
		this.msg = msg;
		this.next = next;
		this._setLastNoSuccess();
	}

	append(/*lazy*/ a) {
		var alt = a();
		if (alt instanceof Success) {
			return alt;
		} else if (alt instanceof NoSuccess) {
			if (alt.next.pos().isLessThan(this.next.pos())) {
				return this;
			} else {
				return alt;
			}
		} else {
			throw new MatchError(alt);
		}
	}

	toString() {
		return ('[' + this.next.pos() + '] failure: ' + 
			this.msg + '\n\n' + this.next.pos().longString());
	}

	static unapply(x) {
		return new Option.Some([x.msg, x.next]);
	}
}

Parsers.Failure = Failure;


/************ Error **************/
class ParseError extends NoSuccess {
	constructor(msg, next) {
		super();
		this.msg = msg;
		this.next = next;
		this._setLastNoSuccess();
	}

	append(/*lazy*/ a) {
		return this;
	}

	toString() {
		return ('[' + this.next.pos() + '] error: ' + 
			this.msg + '\n\n' + this.next.pos().longString());
	}

	static unapply(x) {
		return new Option.Some([x.msg, x.next]);
	}
}

Parsers.ParseError = ParseError;


/************ Parser **************/
class Parser {
	constructor(f) {
		this.apply = f;
		this.name = '';
	}

	named(name) {
		this.name = name;
		return this;
	}

	toString() {
		return 'Parser (' + this.name + ')';
	}

	flatMap(f) {
		var self = this;
		return new Parser(function (input) {
			return self.apply(input).flatMapWithNext(f);
		});
	}

	map(f) {
		var self = this;
		return new Parser(function (input) {
			return self.apply(input).map(f);
		});
	}

	append(/*lazy*/ p) {
		var self = this;
		return new Parser(function (input) {
			return self.apply(input).append(function () {
				return p().apply(input);
			});
		});
	}

	and(/*lazy*/ p) {
		return this.flatMap(function (a) {
			return p().map(function (b) {
				return new Pair(a, b);
			});
		}).named('~');
	}

	andr(/*lazy*/ p) {
		return this.flatMap(function (a) {
			return p().map(function (b) {
				return b;
			});
		}).named('~>');
	}

	andl(/*lazy*/ p) {
		return this.flatMap(function (a) {
			return p().map(function (b) {
				return a;
			});
		}).named('<~');
	}

	or(/*lazy*/ q) {
		return this.append(q).named("|");
	}

	andOnce(/*lazy*/ p) {
		var self = this;
		return new OnceParser(function () {
			return self.flatMap(function (a) {
				return Parsers.commit(p).map(function (b) {
					return new Pair(a, b);
				});
			}).named('~!');
		});
	}

	longestOr(/*lazy*/ q0) {
		var self = this;
		return new Parser(function (input) {
			var res1, res2;
			res1 = self.apply(input);
			res2 = q0()(input);
			if (res1.successful) {
				if (res2.successful) {
					if (res2.next.pos().isLessThan(res1.next.pos())) {
						return res1;
					} else {
						return res2;
					}
				} else {
					return res1;
				}
			} else if (res2.successful) {
				return res2;
			} else if (res1 instanceof ParseError) {
				return res1;
			} else {
				if (res2.next.pos().isLessThan(res1.next.pos())) {
					return res1;
				} else {
					return res2;
				}
			}
		}).named("|||");
	}

	to(f) {
		return this.map(f).named(this.toString() + '^^');
	}

	ret(/*lazy*/ v) {
		var self = this;
		return new Parser(function (input) {
			return self.apply(input).map(function (x) { return v(); });
		}).named(this.toString() + "^^^");
	}

	toIfPossible(f, error) {
		if (error === undefined) {
			error = function (r) { return "Constructor function not defined at " + r; };
		}
		var self = this;
		return new Parser(function (input) {
			return self.apply(input).mapPartial(f, error);
		}).named(this.toString() + "^?");
	}

	into(fq) {
		return this.flatMap(fq);
	}

	rep() {
		var p = this;
		return Parsers.rep(function () { return p; });
	}

	chain(/*lazy*/ sep) {
		var p, lp;
		p = this;
		lp = function () { return p; };
		return Parsers.chainl1(lp, lp, sep);
	}

	rep1() {
		var p = this;
		return Parsers.rep1(function () { return p; });
	}

	opt() {
		var p = this;
		return Parsers.opt(function () { return p; });
	}
}

Parsers.Parser = Parser;


/************ OnceParser **************/
class OnceParser extends Parser {
	constructor(f) {
		super(f);
	}

	and(p) {
		var self = this;
		return new OnceParser(function () {
			return self.flatMap(function (a) {
				return Parsers.commit(p).map(function (b) {
					return Pair(a, b);
				});
			});
		}).named('~');
	}
}

Parsers.OnceParser = OnceParser;

