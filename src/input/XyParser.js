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


import {List} from "../fp/List.js"
import {Option} from "../fp/Option.js"
import {Parsers} from "../fp/Parsers.js"
import {AST} from "./XyNodes.js"


var fun = Parsers.fun;
var elem = Parsers.elem;
var felem = function (x) { return fun(Parsers.elem(x)); }
var lit = Parsers.literal;
var regex = Parsers.regex;
var regexLit = Parsers.regexLiteral;
var flit = function (x) { return fun(Parsers.literal(x)); }
var seq = Parsers.seq;
var or = Parsers.or;
var rep = function (x) { return Parsers.lazyParser(x)().rep(); }
var rep1 = function (x) { return Parsers.lazyParser(x)().rep1(); }
var opt = function (x) { return Parsers.lazyParser(x)().opt(); }
var not = function (x) { return Parsers.not(Parsers.lazyParser(x)); }
var success = Parsers.success;
var memo = function (parser) {
	return function () {
		var m = parser.memo;
		if (m === undefined) {
			m = parser.memo = parser();
		}
		return m;
	}
}

var p = new Parsers();

var grammar = {
	// <pos-decor>
	xy: memo(function () {
		return p.posDecor().to(function (pd) {
			return pd;
		});
	}),
	
	// \xyboxの後の
	// '{' <pos-decor> '}'
	xybox: memo(function () {
		return lit("{").andr(p.posDecor).andl(flit("}")).to(function (pd) {
			return pd;
		});
	}),
	
	// \xymatrixの後の
	// <xymatrix>
	xymatrixbox: memo(function () {
		return p.xymatrix().to(function (m) {
			return new AST.PosDecor(new AST.Pos.Coord(new AST.Coord.C(), List.empty), new AST.Decor(List.empty.append(m)));
		});
	}),
	
	// <pos-decor> ::= <pos> <decor>
	posDecor: memo(function () {
		return seq(p.pos, p.decor).to(function (pd) {
			return new AST.PosDecor(pd.head, pd.tail);
		});
	}),
	
	// <pos> ::= <coord> <pos2>*
	pos: memo(function () {
		return seq(p.coord, rep(p.pos2)).to(function (cps) {
			return new AST.Pos.Coord(cps.head, cps.tail);
		});
	}),
	
	// <nonemptyPos> ::= <coord> <pos2>*
	nonemptyPos: memo(function () {
		return or(
			seq(p.nonemptyCoord, rep(p.pos2)),
			seq(p.coord, rep1(p.pos2))
		).to(function (cps) {
			return new AST.Pos.Coord(cps.head, cps.tail);
		});
	}),
	
	// <pos2> ::= '+' <coord>
	//        |   '-' <coord>
	//        |   '!' <coord>
	//        |   '.' <coord>
	//        |   ',' <coord>
	//        |   ';' <coord>
	//        |   '::' <coord>
	//        |   ':' <coord>
	//        |   '**' <object>
	//        |   '*' <object>
	//        |   '?' <place>
	//        |   '@+' <corrd>
	//        |   '@-' <corrd>
	//        |   '@=' <corrd>
	//        |   '@@' <corrd>
	//        |   '@i'
	//        |   '@('
	//        |   '@)'
	//        |   '=:' '"' <id> '"'
	//        |   '=@' '"' <id> '"'
	//        |   '=' '"' <id> '"'
	//        |   '=' <nonemptyCoord> '"' <id> '"'
	//        |   <xyimport>
	pos2: memo(function () {
		return or(
			lit('+').andr(p.coord).to(function (c) { return new AST.Pos.Plus(c); }),
			lit('-').andr(p.coord).to(function (c) { return new AST.Pos.Minus(c); }),
			lit('!').andr(p.coord).to(function (c) { return new AST.Pos.Skew(c); }),
			lit('.').andr(p.coord).to(function (c) { return new AST.Pos.Cover(c); }),
			lit(',').andr(p.coord).to(function (c) { return new AST.Pos.Then(c); }),
			lit(';').andr(p.coord).to(function (c) { return new AST.Pos.SwapPAndC(c); }),
			lit('::').andr(p.coord).to(function (c) { return new AST.Pos.SetYBase(c); }),
			lit(':').andr(p.coord).to(function (c) { return new AST.Pos.SetBase(c); }),
			lit('**').andr(p.object).to(function (o) { return new AST.Pos.ConnectObject(o); }),
			lit('*').andr(p.object).to(function (o) { return new AST.Pos.DropObject(o); }),
			lit('?').andr(p.place).to(function (o) { return new AST.Pos.Place(o); }),
			lit('@+').andr(p.coord).to(function (c) { return new AST.Pos.PushCoord(c); }),
			lit('@-').andr(p.coord).to(function (c) { return new AST.Pos.EvalCoordThenPop(c); }),
			lit('@=').andr(p.coord).to(function (c) { return new AST.Pos.LoadStack(c); }),
			lit('@@').andr(p.coord).to(function (c) { return new AST.Pos.DoCoord(c); }),
			lit('@i').to(function () { return new AST.Pos.InitStack(); }),
			lit('@(').to(function () { return new AST.Pos.EnterFrame(); }),
			lit('@)').to(function () { return new AST.Pos.LeaveFrame(); }),
			lit('=:').andr(flit('"')).andr(p.id).andl(felem('"')).to(function (id) { return new AST.Pos.SaveBase(id); }),
			lit('=@').andr(flit('"')).andr(p.id).andl(felem('"')).to(function (id) { return new AST.Pos.SaveStack(id); }),
			lit('=').andr(flit('"')).andr(p.id).andl(felem('"')).to(function (id) { return new AST.Pos.SavePos(id); }),
			lit('=').andr(p.nonemptyCoord).andl(flit('"')).and(p.id).andl(felem('"')).to(function (mid) { return new AST.Pos.SaveMacro(mid.head, mid.tail); }),
			p.xyimport
		);
	}),
	
	// <coord> ::= <nonemptyCoord> | <empty>
	coord: memo(function () {
		return or(
			p.nonemptyCoord,
			success('empty').to(function () { return new AST.Coord.C(); })
		);
	}),
	
	// <nonemptyCoord> ::= 'c' | 'p' | 'x' | 'y'
	//                 |   <vector>
	//                 |   '"' <id> '"'
	//                 |   '{' <pos> <decor> '}'
	//                 |   's' <digit>
	//                 |   's' '{' <nonnegative-number> '}'
	//                 |   '[' ('"'<prefix>'"')? <number> ',' <number> ']'
	//                 |   '[' ('"'<prefix>'"')? ( 'l' | 'r' | 'u' | 'd' )* ']'
	//                 |   '[' ('"'<prefix>'"')? ( 'l' | 'r' | 'u' | 'd' )+ <place> ']'
	nonemptyCoord: memo(function () {
		return or(
			lit('c').to(function () { return new AST.Coord.C(); }), 
			lit('p').to(function () { return new AST.Coord.P(); }), 
			lit('x').to(function () { return new AST.Coord.X(); }), 
			lit('y').to(function () { return new AST.Coord.Y(); }),
			p.vector().to(function (v) { return new AST.Coord.Vector(v); }), 
			lit('"').andr(p.id).andl(felem('"')).to(function (id) { return new AST.Coord.Id(id) }),
			lit('{').andr(p.posDecor).andl(flit('}')).to(function (pd) { return new AST.Coord.Group(pd) }),
			lit('s').andr(fun(regexLit(/^\d/))).to(function (n) {
				return new AST.Coord.StackPosition(parseInt(n));
			}),
			lit('s').andr(flit('{')).and(p.nonnegativeNumber).andl(flit('}')).to(function (n) {
				return new AST.Coord.StackPosition(n);
			}),
			lit('[').andr(fun(
				opt(lit('"').andr(p.id).andl(felem('"'))).to(function (id) { return id.getOrElse(""); }) )
			).and(p.number).andl(flit(",")).and(p.number).andl(flit("]")).to(function (prc) {
				return new AST.Coord.DeltaRowColumn(prc.head.head, prc.head.tail, prc.tail);
			}),
			lit('[').andr(fun(
				opt(lit('"').andr(p.id).andl(felem('"'))).to(function (id) { return id.getOrElse(""); }) )
			).and(fun(rep(regex(/^[lrud]/)))).andl(flit("]")).to(function (ph) {
				return new AST.Coord.Hops(ph.head, ph.tail);
			}),
			lit('[').andr(fun(
				opt(lit('"').andr(p.id).andl(felem('"'))).to(function (id) { return id.getOrElse(""); }) )
			).and(fun(rep1(regex(/^[lrud]/)))).and(p.place).andl(flit("]")).to(function (php) {
				return new AST.Coord.DeltaRowColumn(php.head.head, php.head.tail, new AST.Pos.Place(php.tail));
			})
		);
	}),
	
	// <vector> ::= '(' <factor> ',' <factor> ')'
	//          |   '<' <dimen> ',' <dimen> '>'
	//          |   '<' <dimen> '>'
	//          |   'a' '(' <number> ')'
	//          |   '/' <direction> <loose-dimen> '/'
	//          |   0
	//          |   <corner>
	//          |   <corner> '(' <factor> ')'
	vector: memo(function () {
		return or(
			lit('(').andr(p.factor).andl(flit(',')).and(p.factor).andl(flit(')')).to(
				function (xy) {
					return new AST.Vector.InCurBase(xy.head, xy.tail);
				}
			),
			lit('<').andr(p.dimen).andl(flit(',')).and(p.dimen).andl(flit('>')).to(
				function (xy) {
					return new AST.Vector.Abs(xy.head, xy.tail);
				}
			),
			lit('<').andr(p.dimen).andl(flit('>')).to(
				function (x) {
					return new AST.Vector.Abs(x, x);
				}
			),
			lit('a').andr(flit('(')).andr(p.number).andl(flit(')')).to(
				function (d) {
					return new AST.Vector.Angle(d);
				}
			),
			lit('/').andr(p.direction).and(p.looseDimen).andl(flit('/')).to(
				function (dd) {
					return new AST.Vector.Dir(dd.head, dd.tail);
				}
			),
			lit('0').to(function (x) { return new AST.Vector.Abs("0mm", "0mm"); }),
			function () { return p.corner().and(fun(Parsers.opt(
				fun(lit('(').andr(p.factor).andl(flit(')')))).to(function (f) {
					return f.getOrElse(1);
				}))).to(function (cf) {
					return new AST.Vector.Corner(cf.head, cf.tail);
				})
			}
		);
	}),
	
	// <corner> ::= 'L' | 'R' | 'D' | 'U'
	//          | 'CL' | 'CR' | 'CD' | 'CU' | 'LC' | 'RC' | 'DC' | 'UC'
	//          | 'LD' | 'RD' | 'LU' | 'RU' | 'DL' | 'DR' | 'UL' | 'UR'
	//          | 'E' | 'P'
	//          | 'A'
	corner: memo(function () {
		return or(
			regexLit(/^(CL|LC)/).to(function () { return new AST.Corner.CL(); }),
			regexLit(/^(CR|RC)/).to(function () { return new AST.Corner.CR(); }),
			regexLit(/^(CD|DC)/).to(function () { return new AST.Corner.CD(); }),
			regexLit(/^(CU|UC)/).to(function () { return new AST.Corner.CU(); }),
			regexLit(/^(LD|DL)/).to(function () { return new AST.Corner.LD(); }),
			regexLit(/^(RD|DR)/).to(function () { return new AST.Corner.RD(); }),
			regexLit(/^(LU|UL)/).to(function () { return new AST.Corner.LU(); }),
			regexLit(/^(RU|UR)/).to(function () { return new AST.Corner.RU(); }),
			lit('L').to(function () { return new AST.Corner.L(); }),
			lit('R').to(function () { return new AST.Corner.R(); }),
			lit('D').to(function () { return new AST.Corner.D(); }),
			lit('U').to(function () { return new AST.Corner.U(); }),
			lit('E').to(function () { return new AST.Corner.NearestEdgePoint(); }),
			lit('P').to(function () { return new AST.Corner.PropEdgePoint(); }),
			lit('A').to(function () { return new AST.Corner.Axis(); })
		);
	}),
	
	// <place> ::= '<' <place>
	//         | '>' <place>
	//         | '(' <factor> ')' <place>
	//         | '!' '{' <pos> '}' <slide>
	//         | <slide>
	place: memo(function () {
		return or(
			lit('<').andr(p.place).to(function (pl) {
				return new AST.Place(1, 0, undefined, undefined).compound(pl);
			}), 
			lit('>').andr(p.place).to(function (pl) {
				return new AST.Place(0, 1, undefined, undefined).compound(pl);
			}), 
			lit('(').andr(p.factor).andl(flit(')')).and(p.place).to(function (pl) {
				return new AST.Place(0, 0, new AST.Place.Factor(pl.head), undefined).compound(pl.tail);
			}), 
			lit('!').andr(flit('{')).andr(p.pos).andl(flit('}')).and(p.slide).to(function (ps) {
				return new AST.Place(0, 0, new AST.Place.Intercept(ps.head), ps.tail);
			}),
			function () { return p.slide().to(function (s) {
				return new AST.Place(0, 0, undefined, s);
			}) }
		);
	}),
	
	// <slide> ::= '/' <dimen> '/'
	//         | <empty>
	slide: memo(function () {
		return or(
			lit('/').andr(p.dimen).andl(flit('/')).to(function (d) {
				return new AST.Slide(new Option.Some(d));
			}),
			success("no slide").to(function () {
				return new AST.Slide(Option.empty);
			})
		);
	}),
	
	// <factor>
	factor: memo(fun(regexLit(/^[+\-]?(\d+(\.\d*)?|\d*\.\d+)/).to(
		function (v) { return parseFloat(v); })
	)),
	
	// <number>
	number: memo(fun(regexLit(/^[+\-]?\d+/).to(
		function (n) { return parseInt(n); })
	)),
	
	// <nonnegative-number>
	nonnegativeNumber: memo(fun(regexLit(/^\d+/).to(
		function (n) { return parseInt(n); })
	)),
	
	unit: memo(fun(regexLit(/^(em|ex|px|pt|pc|in|cm|mm|mu)/).to(function (d) {
			return d
	}))),
	
	// <dimen> ::= <factor> ( 'em' | 'ex' | 'px' | 'pt' | 'pc' | 'in' | 'cm' | 'mm' | 'mu' )
	dimen: memo(function () {
		return p.factor().and(p.unit).to(function (x) {
			return x.head.toString() + x.tail;
		})
	}),
	
	// <loose-dimen> ::= <loose-factor> ( 'em' | 'ex' | 'px' | 'pt' | 'pc' | 'in' | 'cm' | 'mm' | 'mu' )
	looseDimen: memo(function () {
		return p.looseFactor().and(p.unit).to(function (x) {
			return x.head.toString() + x.tail;
		})
	}),
	
	// <loose-factor>
	// makeshift against /^ 3.5mm/ converted to /^ 3 .5mm/ by MathJax.InputJax.TeX.prefilterMath()
	looseFactor: memo(fun(or(
		regexLit(/^(\d \d*(\.\d*))/).to(function (v) {
			return parseFloat(v.replace(/ /, ""));
		}),
		regexLit(/^[+\-]?(\d+(\.\d*)?|\d*\.\d+)/).to(function (v) {
			return parseFloat(v);
		})
	))),
	
	// <id>
	id: memo(fun(regex(/^[^"]+/))), // "
	
	// <object> ::= <modifier>* <objectbox>
	object: memo(function () {
		return or(
			rep(p.modifier).and(p.objectbox).to(function (mso) {
				return new AST.Object(mso.head, mso.tail);
			})
		);
	}),
	
	// <objectbox> ::= '{' <text> '}'
	//          | '@' <dir>
	//          | '\dir' <dir>
	//          | '\cir' <cir_radius> '{' <cir> '}'
	//          | '\frm' <frame_radius> '{' <frame_main> '}'
	//          | '\object' <object>
	//          | '\composite' '{' <composite_object> '}'
	//          | '\xybox' '{' <pos> <decor> '}'
	//          | '\xymatrix' <xymatrix>
	//          | <curve>
	//          | <TeX box> '{' <text> '}'
	objectbox: memo(function () {
		return or(
			p.mathText,
			lit("@").andr(p.dir),
			lit("\\dir").andr(p.dir),
			lit("\\cir").andr(p.cirRadius).andl(flit("{")).and(p.cir).andl(flit("}")).to(function (rc) {
				return new AST.ObjectBox.Cir(rc.head, rc.tail);
			}),
			lit("\\frm").andr(p.frameRadius).andl(flit("{")).and(p.frameMain).andl(flit("}")).to(function (rm) {
				return new AST.ObjectBox.Frame(rm.head, rm.tail);
			}),
			lit("\\object").andr(p.object).to(function (o) {
				return new AST.ObjectBox.WrapUpObject(o);
			}),
			lit("\\composite").and(flit("{")).andr(p.compositeObject).andl(flit("}")).to(function (os) {
				return new AST.ObjectBox.CompositeObject(os);
			}),
			lit("\\xybox").and(flit("{")).andr(p.posDecor).andl(flit("}")).to(function (pd) {
				return new AST.ObjectBox.Xybox(pd);
			}),
			lit("\\xymatrix").andr(p.xymatrix).to(function (m) {
				return new AST.ObjectBox.Xymatrix(m);
			}),
			p.txt,
			p.curve,
			regex(/^(\\[a-zA-Z@][a-zA-Z0-9@]+)/).andl(flit("{")).and(p.text).andl(flit("}")).and(p.textNodeCreator).to(function (btc) {
				var bt = btc.head;
				var createTextNode = btc.tail;
				return p.toMath(bt.head + "{" + bt.tail + "}", createTextNode);
			})
		);
	}),
	
	// <composite_object> ::= <object> ( '*' <object> )*
	compositeObject: memo(function () {
		return p.object().and(fun(rep(lit("*").andr(p.object)))).to(function (oos) {
			return oos.tail.prepend(oos.head);
		});
	}),
	
	// <math-text> ::= '{' <text> '}'
	mathText: memo(function () {
		return lit("{").andr(p.text).andl(felem("}")).and(p.textNodeCreator).to(function (tc) {
			var text = tc.head;
			var createTextNode = tc.tail;
			return p.toMath("\\hbox{$\\objectstyle{" + text + "}$}", createTextNode);
		});
	}),
	toMath: function (math, createTextNode) {
		var mml = createTextNode(math);
		return new AST.ObjectBox.Text(mml);
	},
	textNodeCreator: memo(function() {
		return new Parsers.Parser(function (input) {
			return new Parsers.Success(input.context.createTextNode, input);
		});
	}),
	
	// <text> ::= /[^{}\\%]*/ (( '\{' | '\}' | '\%' | '\\' | '{' <text> '}' | /%[^\r\n]*(\r\n|\r|\n)?/ ) /[^{}\\%]*/ )*
	text: memo(function () {
		return regex(/^[^{}\\%]*/).and(function () {
			return (
				or(
					regex(/^(\\\{|\\\}|\\%|\\)/).to(function (x) {
						return x;
					}),
					elem("{").andr(p.text).andl(felem("}")).to(function (x) {
						return "{" + x + "}";
					}),
					regex(/^%[^\r\n]*(\r\n|\r|\n)?/).to(function (x) {
						return ' '; // ignore comments
					})
				).and(fun(regex(/^[^{}\\%]*/)))).rep().to(function (xs) {
					var res = "";
					xs.foreach(function (x) {
						res += x.head + x.tail;
					});
					return res;
			})
		}).to(function (x) {
			return x.head + x.tail
		});
	}),
	
	txt: memo(function () {
		return lit("\\txt").andr(p.txtWidth).and(fun(regex(/^(\\[a-zA-Z@][a-zA-Z0-9@]+)?/))).andl(flit("{")).and(p.text).andl(flit("}")).and(p.textNodeCreator).to(function (wstc) {
				var wst = wstc.head;
				var createTextNode = wstc.tail;
				var width = wst.head.head;
				var style = wst.head.tail;
				var text = wst.tail;
				var math;
				var lines = text.split("\\\\");
				if (lines.length <= 1) {
					math = style + "{\\hbox{" + text + "}}";
				} else {
					math = "\\hbox{$\\begin{array}{c}\n";
					for (var i = 0; i < lines.length; i++) {
						math += style + "{\\hbox{" + lines[i].replace(/(^[\r\n\s]+)|([\r\n\s]+$)/g, "") + "}}";
						if (i != lines.length - 1) {
							math += "\\\\\n";
						}
					}
					math += "\\end{array}$}";
				}
				return new AST.ObjectBox.Txt(width, p.toMath(math, createTextNode));
			});
	}),
	
	// <txt_width> ::= '<' <dimen> '>'
	//          | <empty>
	txtWidth: memo(function () {
		return or(
			lit('<').andr(p.dimen).andl(flit('>')).to(
				function (x) {
					return new AST.Vector.Abs(x, x);
				}
			).to(function (v) {
				return new AST.ObjectBox.Txt.Width.Vector(v);
			}),
			success("default").to(function () {
				return new AST.ObjectBox.Txt.Width.Default();
			})
		);
	}),
	
	// <dir> ::= <variant> '{' <main> '}'
	// <variant> ::= '^' | '_' | '0' | '1' | '2' | '3' | <empty>
	dir: memo(function () {
		return regexLit(/^[\^_0123]/).opt().andl(flit('{')).and(p.dirMain).andl(flit('}')).to(function (vm) {
			return new AST.ObjectBox.Dir(vm.head.getOrElse(""), vm.tail);
		})
	}),
	
	// <main> ::= ('-' | '.' | '~' | '>' | '<' | '(' | ')' | '`' | "'" | '|' | '*' | '+' | 'x' | '/' | 'o' | '=' | ':' | /[a-zA-Z@ ]/)*
	dirMain: memo(function () {
		return regex(/^(-|\.|~|>|<|\(|\)|`|'|\||\*|\+|x|\/|o|=|:|[a-zA-Z@ ])+/ /*'*/).opt().to(function (m) {
			return m.getOrElse("");
		})
	}),
	
	// <cir_radius> ::= <vector>
	//          | <empty>
	cirRadius: memo(function () {
		return or(
			p.vector().to(function (v) {
				return new AST.ObjectBox.Cir.Radius.Vector(v);
			}),
			success("default").to(function () {
				return new AST.ObjectBox.Cir.Radius.Default();
			})
		);
	}),
	
	// <frame_radius> ::= <frame_radius_vector>
	//          | <empty>
	frameRadius: memo(function () {
		return or(
			p.frameRadiusVector().to(function (v) {
				return new AST.ObjectBox.Frame.Radius.Vector(v);
			}),
			success("default").to(function () {
				return new AST.ObjectBox.Frame.Radius.Default();
			})
		);
	}),

	// <frame_radius_vector> ::= '<' <dimen> ',' <dimen> '>'
	//          |   '<' <dimen> '>'
	frameRadiusVector: memo(function () {
		return or(
			lit('<').andr(p.dimen).andl(flit(',')).and(p.dimen).andl(flit('>')).to(
				function (xy) {
					return new AST.Vector.Abs(xy.head, xy.tail);
				}
			),
			lit('<').andr(p.dimen).andl(flit('>')).to(
				function (x) {
					return new AST.Vector.Abs(x, x);
				}
			)
		);
	}),
	
	// <frame_main> ::= ( '-' | '=' | '.' | ',' | 'o' | 'e' | '*' )*
	//          | ( '_' | '^' )? ( '\{' | '\}' | '(' | ')' )
	frameMain: memo(function () {
		return regex(/^(((_|\^)?(\\\{|\\\}|\(|\)))|[\-=oe,\.\*]*)/);
	}),
	
	// <cir> ::= <diag> <orient> <diag>
	//       | <empty>
	cir: memo(function () {
		return or(
			p.nonemptyCir,
			success("full").to(function () {
				return new AST.ObjectBox.Cir.Cir.Full();
			})
		);
	}),
	nonemptyCir: memo(function () {
		return p.diag().and(fun(regexLit(/^[_\^]/))).and(p.diag).to(function (dod) {
			return new AST.ObjectBox.Cir.Cir.Segment(dod.head.head, dod.head.tail, dod.tail);
		});
	}),
	
	// <curve> ::= '\crv' <curve-modifier> '{' <curve-object> <curve-poslist> '}'
	curve: memo(function () {
		return lit("\\crv").andr(p.curveModifier).andl(flit("{")).and(p.curveObject).and(p.curvePoslist).andl(flit("}")).to(function (mop) {
			return new AST.ObjectBox.Curve(mop.head.head, mop.head.tail, mop.tail);
		});
	}),
	
	// <curve-modifier> ::= ( '~' <curve-option> )*
	curveModifier: memo(function () {
		return rep(fun(lit("~").andr(p.curveOption)));
	}),
	
	// <curve-option> ::= 'p' | 'P' | 'l' | 'L' | 'c' | 'C'
	//                |   'pc' | 'pC' | 'Pc' | 'PC'
	//                |   'lc' | 'lC' | 'Lc' | 'LC'
	//                |   'cC'
	curveOption: memo(function () {
		return or(
			lit("p").to(function () { return new AST.ObjectBox.Curve.Modifier.p(); }),
			lit("P").to(function () { return new AST.ObjectBox.Curve.Modifier.P(); }),
			lit("l").to(function () { return new AST.ObjectBox.Curve.Modifier.l(); }),
			lit("L").to(function () { return new AST.ObjectBox.Curve.Modifier.L(); }),
			lit("c").to(function () { return new AST.ObjectBox.Curve.Modifier.c(); }),
			lit("C").to(function () { return new AST.ObjectBox.Curve.Modifier.C(); }),
			lit("pc").to(function () { return new AST.ObjectBox.Curve.Modifier.pc(); }),
			lit("pC").to(function () { return new AST.ObjectBox.Curve.Modifier.pC(); }),
			lit("Pc").to(function () { return new AST.ObjectBox.Curve.Modifier.Pc(); }),
			lit("PC").to(function () { return new AST.ObjectBox.Curve.Modifier.PC(); }),
			lit("lc").to(function () { return new AST.ObjectBox.Curve.Modifier.lc(); }),
			lit("lC").to(function () { return new AST.ObjectBox.Curve.Modifier.lC(); }),
			lit("Lc").to(function () { return new AST.ObjectBox.Curve.Modifier.Lc(); }),
			lit("LC").to(function () { return new AST.ObjectBox.Curve.Modifier.LC(); }),
			lit("cC").to(function () { return new AST.ObjectBox.Curve.Modifier.cC(); })
		);
	}),
	
	// <curve-object> ::= <empty>
	//                |   '~*' <object> <curve-object>
	//                |   '~**' <object> <curve-object>
	curveObject: memo(function () {
		return rep(or(
			lit("~*").andr(p.object).to(function (obj) {
				return new AST.ObjectBox.Curve.Object.Drop(obj);
			}),
			lit("~**").andr(p.object).to(function (obj) {
				return new AST.ObjectBox.Curve.Object.Connect(obj);
			})
		));
	}),
	
	// <curve-poslist> ::= <empty> ^^ Empty List
	//           |   '&' <curve-poslist2> ^^ (c, <poslist>)
	//           |   <nonemptyPos> ^^ (<nonemptyPos>, Nil)
	//           |   <nonemptyPos> '&' <curve-poslist2> ^^ (<nonemptyPos>, <poslist>)
	//           |   '~@' ^^ (~@, Nil)
	//           |   '~@' '&' <curve-poslist2> ^^ (~@, <poslist>)
	// <curve-poslist2> ::= <empty> ^^ (c, Nil)
	//           |   '&' <curve-poslist2> ^^ (c, <poslist>)
	//           |   <nonemptyPos> ^^ (<nonemptyPos>, Nil)
	//           |   <nonemptyPos> '&' <curve-poslist2> ^^ (<nonemptyPos>, <poslist>)
	//           |   '~@' ^^ (~@, Nil)
	//           |   '~@' '&' <curve-poslist2> ^^ (~@, <poslist>)
	curvePoslist: memo(function () {
		return or(
			lit("&").andr(p.curvePoslist2).to(function (ps) {
				return ps.prepend(new AST.ObjectBox.Curve.PosList.CurPos());
			}),
			lit("~@").andr(flit("&")).andr(p.curvePoslist2).to(function (ps) {
				return ps.prepend(new AST.ObjectBox.Curve.PosList.AddStack());
			}),
			lit("~@").to(function () {
				return List.empty.prepend(new AST.ObjectBox.Curve.PosList.AddStack());
			}),
			p.pos().andl(flit("&")).and(p.curvePoslist2).to(function (pps) {
				return pps.tail.prepend(new AST.ObjectBox.Curve.PosList.Pos(pps.head));
			}),
			p.nonemptyPos().to(function (p) {
				return List.empty.prepend(new AST.ObjectBox.Curve.PosList.Pos(p));
			}),
			success("empty").to(function () {
				return List.empty;
			})
		);
	}),
	curvePoslist2: memo(function () {
		return or(
			lit("&").andr(p.curvePoslist2).to(function (ps) {
				return ps.prepend(new AST.ObjectBox.Curve.PosList.CurPos());
			}),
			lit("~@").andr(flit("&")).andr(p.curvePoslist2).to(function (ps) {
				return ps.prepend(new AST.ObjectBox.Curve.PosList.AddStack());
			}),
			lit("~@").to(function () {
				return List.empty.prepend(new AST.ObjectBox.Curve.PosList.AddStack());
			}),
			p.nonemptyPos().andl(flit("&")).and(p.curvePoslist2).to(function (pps) {
				return pps.tail.prepend(new AST.ObjectBox.Curve.PosList.Pos(pps.head));
			}),
			p.nonemptyPos().to(function (p) {
				return List.empty.prepend(new AST.ObjectBox.Curve.PosList.Pos(p));
			}),
			success("empty").to(function () {
				return List.empty.prepend(new AST.ObjectBox.Curve.PosList.CurPos());
			})
		);
	}),
	
	// <modifier> ::= '!' <vector>
	//            |   '[' <shape> ']'
	//            |   'i'
	//            |   'h'
	//            |   <add-op> <size>
	//            |   <nonemptyDirection>
	modifier: memo(function () {
		return or(
			lit("!").andr(p.vector).to(function (v) {
				return new AST.Modifier.Vector(v);
			}),
			lit("!").to(function (v) {
				return new AST.Modifier.RestoreOriginalRefPoint();
			}),
			lit("[").andr(p.shape).andl(flit("]")).to(function (s) {
				return s;
			}),
			lit("i").to(function (v) {
				return new AST.Modifier.Invisible();
			}),
			lit("h").to(function (v) {
				return new AST.Modifier.Hidden();
			}),
			p.addOp().and(p.size).to(function (os) {
				return new AST.Modifier.AddOp(os.head, os.tail);
			}),
			p.nonemptyDirection().to(function (d) {
				return new AST.Modifier.Direction(d);
			})
		);
	}),
	
	// <add-op> ::= '+' | '-' | '=' | '+=' | '-='
	addOp: memo(function () {
		return or(
			lit("+=").to(function () { return new AST.Modifier.AddOp.GrowTo(); }),
			lit("-=").to(function () { return new AST.Modifier.AddOp.ShrinkTo(); }),
			lit("+").to(function () { return new AST.Modifier.AddOp.Grow(); }),
			lit("-").to(function () { return new AST.Modifier.AddOp.Shrink(); }),
			lit("=").to(function () { return new AST.Modifier.AddOp.Set(); })
		);
	}),
	
	// <size> ::= <vector> | <empty>
	size: memo(function () {
		return or(
			function () { return p.vector().to(function (v) {
				return new AST.Modifier.AddOp.VactorSize(v);
			}) },
			success("default size").to(function () {
				return new AST.Modifier.AddOp.DefaultSize();
			})
		);
	}),
	
	// <shape> ::= '.' 
	//          | <frame_shape>
	//          | <alphabets>
	//          | '=' <alphabets>
	//          | <empty>
	shape: memo(function () {
		return or(
			lit(".").to(function () { return new AST.Modifier.Shape.Point(); }),
			p.frameShape,
			p.alphabets().to(function (name) {
				return new AST.Modifier.Shape.Alphabets(name);
			}),
			lit("=").andr(p.alphabets).to(function (name) {
				return new AST.Modifier.Shape.DefineShape(name);
			}),
			success("rect").to(function () { return new AST.Modifier.Shape.Rect(); })
		);
	}),
	
	// <frame_shape> ::= 'F' <frame_main> ( ':' ( <frame_radius_vector> | <color_name> ))*
	frameShape: memo(function () {
		return lit("F").andr(p.frameMain).and(fun(
			rep(lit(":").andr(fun(
				or(
					p.frameRadiusVector().to(function (v) {
						return new AST.Modifier.Shape.Frame.Radius(v);
					}),
					p.colorName().to(function (c) {
							return new AST.Modifier.Shape.Frame.Color(c);
					})
				)
			)))
		)).to(function (mo) {
			var main = mo.head;
			if (main === "") {
				main = "-";
			}
			return new AST.Modifier.Shape.Frame(main, mo.tail);
		});
	}),
	
	// <alphabets> ::= /[a-zA-Z]+/
	alphabets: memo(function () {
		return regex(/^([a-zA-Z]+)/);
	}),
	
	// <color_name> ::= /[a-zA-Z][a-zA-Z0-9]*/
	colorName: memo(function () {
		return regex(/^([a-zA-Z][a-zA-Z0-9]*)/);
	}),
	
	// <direction> ::= <direction0> <direction1>*
	// <direction0> ::= <direction2>
	//              |   <diag>
	// <direction1> | ':' <vector>
	//              | '_'
	//              | '^'
	// <direction2> ::= 'v' <vector>
	//              |   'q' '{' <pos> <decor> '}'
	direction: memo(function () {
		return seq(p.direction0, rep(p.direction1)).to(function (drs){
			return new AST.Direction.Compound(drs.head, drs.tail);
		});
	}),
	direction0: memo(function () {
		return or(
			p.direction2,
			p.diag().to(function (d) {
				return new AST.Direction.Diag(d);
			})
		);
	}),
	direction1: memo(function () {
		return or(
			lit(':').andr(p.vector).to(function (v) {
				return new AST.Direction.RotVector(v);
			}),
			lit('_').to(function (x) {
				return new AST.Direction.RotAntiCW();
			}),
			lit('^').to(function (x) {
				return new AST.Direction.RotCW();
			})
		);
	}),
	direction2: memo(function () {
		return or(
			lit('v').andr(p.vector).to(function (v) {
				return new AST.Direction.Vector(v);
			}),
			lit('q').andr(flit('{')).andr(p.posDecor).andl(flit('}')).to(function (pd) {
				return new AST.Direction.ConstructVector(pd);
			})
		);
	}),
	
	// <nonempty-direction> ::= <nonempty-direction0> <direction1>*
	//                      |   <direction0> <direction1>+
	// <nonempty-direction0> ::= <nonempty-diag>
	//                       |   <direction2>
	nonemptyDirection: memo(function () {
		return or(
			seq(p.nonemptyDirection0, rep(p.direction1)),
			seq(p.direction0, rep1(p.direction1))
		).to(function (drs){
			return new AST.Direction.Compound(drs.head, drs.tail);
		});
	}),
	nonemptyDirection0: memo(function () {
		return or(
			p.direction2,
			p.nonemptyDiag().to(function (d) {
				return new AST.Direction.Diag(d);
			})
		);
	}),
	
	// <diag> ::= <nonempty-diag> | <empty>
	// <nonempty-diag> ::= 'l' | 'r' | 'd' | 'u' | 'ld' | 'rd' | 'lu' | 'ru'
	diag: memo(function () {
		return or(
			p.nonemptyDiag,
			success("empty").to(function (x) {
				return new AST.Diag.Default();
			})
		);
	}),
	nonemptyDiag: memo(function () {
		return or(
			regexLit(/^(ld|dl)/).to(function (x) { return new AST.Diag.LD(); }),
			regexLit(/^(rd|dr)/).to(function (x) { return new AST.Diag.RD(); }),
			regexLit(/^(lu|ul)/).to(function (x) { return new AST.Diag.LU(); }),
			regexLit(/^(ru|ur)/).to(function (x) { return new AST.Diag.RU(); }),
			lit('l').to(function (x) { return new AST.Diag.L(); }),
			lit('r').to(function (x) { return new AST.Diag.R(); }),
			lit('d').to(function (x) { return new AST.Diag.D(); }),
			lit('u').to(function (x) { return new AST.Diag.U(); })
		);
	}),
	
	// <decor> ::= <command>*
	decor: memo(function () {
		return p.command().rep().to(function (cs) {
			return new AST.Decor(cs);
		})
	}),
	
	// <command> ::= '\ar' ( <arrow_form> )* <path>
	//           |   '\xymatrix' <xymatrix>
	//           |   '\PATH' <path>
	//           |   '\afterPATH' '{' <decor> '}' <path>
	//           |   '\save' <pos>
	//           |   '\restore'
	//           |   '\POS' <pos>
	//           |   '\afterPOS' '{' <decor> '}' <pos>
	//           |   '\drop' <object>
	//           |   '\connect' <object>
	//           |   '\relax'
	//           |   '\xyignore' '{' <pos> <decor> '}'
	//           |   <twocell command>
	command: memo(function () {
		return or(
			lit("\\ar").andr(fun(rep(p.arrowForm))).and(p.path).to(function (fsp) {
				return new AST.Command.Ar(fsp.head, fsp.tail);
			}),
			lit("\\xymatrix").andr(p.xymatrix),
			lit("\\PATH").andr(p.path).to(function (path) {
				return new AST.Command.Path(path);
			}),
			lit("\\afterPATH").andr(flit('{')).andr(p.decor).andl(flit('}')).and(p.path).to(function (dp) {
				return new AST.Command.AfterPath(dp.head, dp.tail);
			}),
			lit("\\save").andr(p.pos).to(function (pos) {
				return new AST.Command.Save(pos);
			}),
			lit("\\restore").to(function () {
				return new AST.Command.Restore();
			}),
			lit("\\POS").andr(p.pos).to(function (pos) {
				return new AST.Command.Pos(pos);
			}),
			lit("\\afterPOS").andr(flit('{')).andr(p.decor).andl(flit('}')).and(p.pos).to(function (dp) {
				return new AST.Command.AfterPos(dp.head, dp.tail);
			}),
			lit("\\drop").andr(p.object).to(function (obj) {
				return new AST.Command.Drop(obj);
			}),
			lit("\\connect").andr(p.object).to(function (obj) {
				return new AST.Command.Connect(obj);
			}),
			lit("\\relax").to(function () {
				return new AST.Command.Relax();
			}),
			lit("\\xyignore").andr(flit('{')).andr(p.pos).and(p.decor).andl(flit('}')).to(function (pd) {
				return new AST.Command.Ignore(pd.head, pd.tail);
			}),
			lit("\\xyshowAST").andr(flit('{')).andr(p.pos).and(p.decor).andl(flit('}')).to(function (pd) {
				return new AST.Command.ShowAST(pd.head, pd.tail);
			}),
			p.twocellCommand
		);
	}),
	
	// <arrow_form> ::= '@' <conchar>
	//              |   '@' '!'
	//              |   '@' '/' <direction> ( <loose-dimen> )? '/'
	//              |   '@' '(' <direction> ',' <direction> ')'
	//              |   '@' '`' '{' <curve-poslist> '}'
	//              |   '@' '[' <shape> ']'
	//              |   '@' '*' '{' ( <modifier> )* '}'
	//              |   '@' '<' <dimen> '>'
	//              |   '|' <anchor> <it>
	//              |   '^' <anchor> <it>
	//              |   '_' <anchor> <it>
	//              |   '@' '?'
	//              |   '@' <variant> ( <tip_conn_tip> )?
	// <conchar> ::= /[\-\.~=:]/
	// <variant> ::= /[\^_0123]/ | <empty>
	arrowForm: memo(function () {
		return or(
			lit("@").andr(fun(regex(/^([\-\.~=:])/))).to(function (c) {
				return new AST.Command.Ar.Form.ChangeStem(c);
			}),
			lit("@").andr(flit("!")).to(function (c) {
				return new AST.Command.Ar.Form.DashArrowStem();
			}),
			lit("@").andr(flit("/")).andr(p.direction).and(fun(opt(p.looseDimen))).andl(flit("/")).to(function (dd) {
				return new AST.Command.Ar.Form.CurveArrow(dd.head, dd.tail.getOrElse(".5pc"));
			}),
			lit("@").andr(flit("(")).andr(p.direction).andl(flit(",")).and(p.direction).andl(flit(")")).to(function (dd) {
				return new AST.Command.Ar.Form.CurveFitToDirection(dd.head, dd.tail);
			}),
			lit("@").andr(flit("`")).andr(p.coord).to(function (c) {
				return new AST.Command.Ar.Form.CurveWithControlPoints(c);
			}),
			lit("@").andr(flit("[")).andr(p.shape).andl(flit("]")).to(function (s) {
				return new AST.Command.Ar.Form.AddShape(s);
			}),
			lit("@").andr(flit("*")).andr(flit("{")).andr(fun(rep(p.modifier))).andl(flit("}")).to(function (ms) {
				return new AST.Command.Ar.Form.AddModifiers(ms);
			}),
			lit("@").andr(flit("<")).andr(p.dimen).andl(flit(">")).to(function (d) {
				return new AST.Command.Ar.Form.Slide(d);
			}),
			lit("|").andr(p.anchor).and(p.it).to(function (ai) {
				return new AST.Command.Ar.Form.LabelAt(ai.head, ai.tail);
			}),
			lit("^").andr(p.anchor).and(p.it).to(function (ai) {
				return new AST.Command.Ar.Form.LabelAbove(ai.head, ai.tail);
			}),
			lit("_").andr(p.anchor).and(p.it).to(function (ai) {
				return new AST.Command.Ar.Form.LabelBelow(ai.head, ai.tail);
			}),
			lit("@").andr(flit("?")).to(function () {
				return new AST.Command.Ar.Form.ReverseAboveAndBelow();
			}),
			lit("@").andr(fun(regex(/^([\^_0123])/).opt())).and(fun(opt(p.tipConnTip))).to(function (vtct) {
				var variant = vtct.head.getOrElse("");
				if (vtct.tail.isDefined) {
					var tct = vtct.tail.get;
					return new AST.Command.Ar.Form.BuildArrow(variant, tct.tail, tct.stem, tct.head);
				} else {
					return new AST.Command.Ar.Form.ChangeVariant(variant);
				}
			})
		);
	}),
	
	// <tip_conn_tip> ::= '{' <nonempty_tip>? <nonempty_conn>? <nonempty_tip>? '}'
	tipConnTip: memo(function () {
		return lit("{").andr(fun(opt(p.nonemptyTip))).and(fun(opt(p.nonemptyConn))).and(fun(opt(p.nonemptyTip))).andl(flit("}")).to(function (pcp) {
			var maybeTail = pcp.head.head;
			var maybeStem = pcp.head.tail;
			var maybeHead = pcp.tail;
			
			var emptyTip = new AST.Command.Ar.Form.Tip.Tipchars("");
			var tail, stem, head;
			if (!maybeStem.isDefined && !maybeHead.isDefined) {
				if (!maybeTail.isDefined) {
					tail = emptyTip;
					stem = new AST.Command.Ar.Form.Conn.Connchars("");
					head = emptyTip;
				} else {
					tail = emptyTip;
					stem = new AST.Command.Ar.Form.Conn.Connchars("-");
					head = maybeTail.getOrElse(emptyTip);
				}
			} else {
				tail = maybeTail.getOrElse(emptyTip);
				stem = maybeStem.getOrElse(new AST.Command.Ar.Form.Conn.Connchars(""));
				head = maybeHead.getOrElse(emptyTip);
			}
			return {
				tail:tail,
				stem:stem,
				head:head
			};
		});
	}),
	
	// <nonempty_tip> ::= /[<>()|'`+/a-zA-Z ]+/
	//         | <arrow_dir>
	// <arrow_dir> ::= '*' <object>
	//               | <dir>
	nonemptyTip: memo(function () {
		return or(
			regex(/^([<>()|'`+\/a-zA-Z ]+)/).to(function (cs) {
				return new AST.Command.Ar.Form.Tip.Tipchars(cs);
			}),
			lit("*").andr(p.object).to(function (o) {
				return new AST.Command.Ar.Form.Tip.Object(o);
			}),
			p.dir().to(function (d) {
				return new AST.Command.Ar.Form.Tip.Dir(d);
			})
		);
	}),
	
	// <nonempty_conn> ::= /[\-\.~=:]+/
	//          | <arrow_dir>
	nonemptyConn: memo(function () {
		return or(
			regex(/^([\-\.~=:]+)/).to(function (cs) {
				return new AST.Command.Ar.Form.Conn.Connchars(cs);
			}),
			lit("*").andr(p.object).to(function (o) {
				return new AST.Command.Ar.Form.Conn.Object(o);
			}),
			p.dir().to(function (d) {
				return new AST.Command.Ar.Form.Conn.Dir(d);
			})
		);
	}),
	
	// <path> ::= <path2>(Nil)
	path: memo(function () {
		return p.path2(List.empty /* initial failure continuation */).to(function (ps) {
			return new AST.Command.Path.Path(ps);
		})
	}),
	
	// <path2>(fc) ::= '~' <action> '{' <pos> <decor> '}' <path2>(fc)
	//             |   '~' <which> '{' <labels> '}' <path2>(fc)
	//             |   "'" <segment> <path2>(fc)
	//             |   '`' <turn> <segment> <path2>(fc)
	//             |   '~' '{' <path2 as fc'> '}' <path2>(fc')
	//             |   <segment>
	//             |   <empty>
	// <action> ::= '=' | '/'
	// <which> ::= '<' | '>' | '+'
	path2: function (fc) {
		var q = memo(function () { return p.path2(fc) });
		return or(
			p.path3().and(q).to(function (ep) {
				return ep.tail.prepend(ep.head);
			}),
			seq('~', '{', q, '}').to(function (newFc) {
				return newFc.head.tail;
			}).into(function (newFc) {
				return p.path2(newFc);
			}),
			p.segment().to(function (s) {
				return List.empty.prepend(new AST.Command.Path.LastSegment(s));
			}),
			success(fc).to(function (fc) {
				return fc;
			})
		);
	},
	path3: memo(function () {
		return or(
			seq('~', '=', '{', p.posDecor, '}').to(function (pd) {
				return new AST.Command.Path.SetBeforeAction(pd.head.tail);
			}),
			seq('~', '/', '{', p.posDecor, '}').to(function (pd) {
				return new AST.Command.Path.SetAfterAction(pd.head.tail);
			}),
			seq('~', '<', '{', p.labels, '}').to(function (ls) {
				return new AST.Command.Path.AddLabelNextSegmentOnly(ls.head.tail);
			}),
			seq('~', '>', '{', p.labels, '}').to(function (ls) {
				return new AST.Command.Path.AddLabelLastSegmentOnly(ls.head.tail);
			}),
			seq('~', '+', '{', p.labels, '}').to(function (ls) {
				return new AST.Command.Path.AddLabelEverySegment(ls.head.tail);
			}),
			seq("'", p.segment).to(function (s) {
				return new AST.Command.Path.StraightSegment(s.tail);
			}),
			seq('`', p.turn, p.segment).to(function (ts) {
				return new AST.Command.Path.TurningSegment(ts.head.tail, ts.tail);
			})
		);
	}),
	
	// <turn> ::= <diag> <turn-radius>
	//        |   <cir> <turnradius>
	turn: memo(function () {
		return or(
			p.nonemptyCir().and(p.turnRadius).to(function (cr) {
				return new AST.Command.Path.Turn.Cir(cr.head, cr.tail);
			}),
			p.diag().and(p.turnRadius).to(function (dr) {
				return new AST.Command.Path.Turn.Diag(dr.head, dr.tail);
			})
		);
	}),
	
	// <turn-radius> ::= <empty> | '/' <dimen>
	turnRadius: memo(function () {
		return or(
			lit('/').andr(p.dimen).to(function (d) {
				return new AST.Command.Path.TurnRadius.Dimen(d);
			}),
			success("default").to(function () {
				return new AST.Command.Path.TurnRadius.Default();
			})
		);
	}),
	
	// <segment> ::= <nonempty-pos> <slide> <labels>
	segment: memo(function () {
		return p.nonemptyPos().and(p.pathSlide).and(p.labels).to(function (psl) {
			return new AST.Command.Path.Segment(psl.head.head, psl.head.tail, psl.tail);
		});
	}),
	
	// <slide> ::= '<' <dimen> '>'
	//         | <empty>
	pathSlide: memo(function () {
		return or(
			lit('<').andr(p.dimen).andl(flit('>')).to(function (d) {
				return new AST.Slide(new Option.Some(d));
			}),
			success("no slide").to(function () {
				return new AST.Slide(Option.empty);
			})
		);
	}),
	
	// <labels> ::= <label>*
	labels: memo(function () {
		return p.label().rep().to(function (ls) {
			return new AST.Command.Path.Labels(ls);
		});
	}),
	
	// <label> ::= '^' <anchor> <it> <alias>?
	// <label> ::= '_' <anchor> <it> <alias>?
	// <label> ::= '|' <anchor> <it> <alias>?
	label: memo(function () {
		return or(
			seq('^', p.anchor, p.it, p.alias).to(function (aia) {
				return new AST.Command.Path.Label.Above(new AST.Pos.Place(aia.head.head.tail), aia.head.tail, aia.tail);
			}),
			seq('_', p.anchor, p.it, p.alias).to(function (aia) {
				return new AST.Command.Path.Label.Below(new AST.Pos.Place(aia.head.head.tail), aia.head.tail, aia.tail);
			}),
			seq('|', p.anchor, p.it, p.alias).to(function (aia) {
				return new AST.Command.Path.Label.At(new AST.Pos.Place(aia.head.head.tail), aia.head.tail, aia.tail);
			})
		);
	}),
	
	// <anchor> ::= '-' <anchor> | <place>
	anchor: memo(function () {
		return or(
			lit('-').andr(p.anchor).to(function (a) {
				return new AST.Place(1, 1, new AST.Place.Factor(0.5), undefined).compound(a);
			}),
			p.place
		);
	}),
	
	// <it> ::= ( '[' <shape> ']' )* <it2>
	it: memo(function () {
		return rep(lit('[').andr(p.shape).andl(flit(']')).to(function (s) {
			return s;
		})).and(p.it2).to(function (si) {
			return new AST.Object(si.head.concat(si.tail.modifiers), si.tail.object);
		});
	}),
	
	// <it2> ::= <digit> | <letter>
	//       |   '{' <text> '}'
	//       |   '\' <letters>
	//       |   '*' <object>
	//       |   '@' <dir>
	it2: memo(function () {
		return or(
			regexLit(/^[0-9a-zA-Z]/).and(p.textNodeCreator).to(function (cc) {
				var c = cc.head;
				var createTextNode = cc.tail;
				return new AST.Object(List.empty, p.toMath("\\labelstyle " + c, createTextNode));
			}),
			regexLit(/^(\\[a-zA-Z][a-zA-Z0-9]*)/).and(p.textNodeCreator).to(function (cc) {
				var c = cc.head;
				var createTextNode = cc.tail;
				return new AST.Object(List.empty, p.toMath("\\labelstyle " + c, createTextNode));
			}),
			lit("{").andr(p.text).andl(felem("}")).and(p.textNodeCreator).to(function (tc) {
				var t = tc.head;
				var createTextNode = tc.tail;
				return new AST.Object(List.empty, p.toMath("\\labelstyle " + t, createTextNode));
			}),
			lit('*').andr(p.object),
			lit('@').andr(p.dir).to(function (dir) {
				return new AST.Object(List.empty, dir);
			})
		);
	}),
	
	// <alias> ::= '=' '"' <id> '"'
	alias: memo(function () {
		return seq('=', '"', p.id, '"').opt().to(function (optId) {
			return optId.map(function (id) { return id.head.tail; });
		});
	}),
	
	// <xymatrix> ::= <setup> '{' <rows> '}'
	xymatrix: memo(function () {
		return p.setup().andl(flit("{")).and(p.rows).andl(flit("}")).to(function (sr) {
			return new AST.Command.Xymatrix(sr.head, sr.tail);
		})
	}),
	
	// <setup> ::= <switch>*
	// <switch> ::= '"' <prefix> '"'
	//          |   '@' <rcchar> <add op> <dimen>
	//          |   '@' '!' <rcchar> '0'
	//          |   '@' '!' <rcchar> '=' <dimen>
	//          |   '@' '!' <rcchar>
	//          |   '@' ( 'M' | 'W' | 'H' ) <add op> <dimen>
	//          |   '@' '1'
	//          |   '@' 'L' <add op> <dimen>
	//          |   '@' <nonemptyDirection>
	//          |   '@' '*' '[' <shape> ']'
	//          |   '@' '*' <add op> <size>
	// <rcchar> ::= 'R' | 'C' | <empty>
	// <mwhlchar> ::= 'M' | 'W' | 'H' | 'L'
	setup: memo(function () {
		return rep(fun(or(
			lit('"').andr(fun(regex(/^[^"]+/))).andl(felem('"')).to(function (p) {
				return new AST.Command.Xymatrix.Setup.Prefix(p);
			}),
			lit("@!").andr(fun(regex(/^[RC]/).opt().to(function (c) {
				return c.getOrElse("");
			}))).and(fun(
				or(
					elem("0").to(function() { return "0em"; }),
					elem("=").andr(p.dimen)
				)
			)).to(function (cd) {
				var dimen = cd.tail;
				switch (cd.head) {
					case "R": return new AST.Command.Xymatrix.Setup.PretendEntrySize.Height(dimen);
					case "C": return new AST.Command.Xymatrix.Setup.PretendEntrySize.Width(dimen);
					default: return new AST.Command.Xymatrix.Setup.PretendEntrySize.HeightAndWidth(dimen);
				}
			}),
			lit("@!").andr(fun(
				or(
					elem("R").to(function () { return new AST.Command.Xymatrix.Setup.FixGrid.Row(); }),
					elem("C").to(function () { return new AST.Command.Xymatrix.Setup.FixGrid.Column(); })
				).opt().to(function (rc) {
					return rc.getOrElse(new AST.Command.Xymatrix.Setup.FixGrid.RowAndColumn());
				})
			)),
			lit("@").andr(fun(regex(/^[MWHL]/))).and(p.addOp).and(p.dimen).to(function (cod) {
				var addop = cod.head.tail;
				var dimen = cod.tail;
				switch (cod.head.head) {
					case "M": return new AST.Command.Xymatrix.Setup.AdjustEntrySize.Margin(addop, dimen);
					case "W": return new AST.Command.Xymatrix.Setup.AdjustEntrySize.Width(addop, dimen);
					case "H": return new AST.Command.Xymatrix.Setup.AdjustEntrySize.Height(addop, dimen);
					case "L": return new AST.Command.Xymatrix.Setup.AdjustLabelSep(addop, dimen);
				}
			}),
			lit("@").andr(p.nonemptyDirection).to(function (d) {
				return new AST.Command.Xymatrix.Setup.SetOrientation(d);
			}),
			lit("@*[").andr(p.shape).andl(flit("]")).to(function (s) {
				return new AST.Command.Xymatrix.Setup.AddModifier(s);
			}),
			lit("@*").andr(p.addOp).and(p.size).to(function (os) {
				return new AST.Command.Xymatrix.Setup.AddModifier(new AST.Modifier.AddOp(os.head, os.tail));
			}),
			lit("@").andr(fun(regex(/^[RC]/).opt().to(function (c) {
				return c.getOrElse("");
			}))).and(p.addOp).and(p.dimen).to(function (cod) {
				var addop = cod.head.tail;
				var dimen = cod.tail;
				switch (cod.head.head) {
					case "R": return new AST.Command.Xymatrix.Setup.ChangeSpacing.Row(addop, dimen);
					case "C": return new AST.Command.Xymatrix.Setup.ChangeSpacing.Column(addop, dimen);
					default: return new AST.Command.Xymatrix.Setup.ChangeSpacing.RowAndColumn(addop, dimen);
				}
			}),
			lit("@1").to(function () {
				return new AST.Command.Xymatrix.Setup.AdjustEntrySize.Margin(new AST.Modifier.AddOp.Set(), "1pc");
			})
		)));
	}),
	
	// <rows> ::= <row> ( '\\' <row> )*
	rows: memo(function () {
		return p.row().and(fun(rep(lit("\\\\").andr(p.row)))).to(function (rrs) {
			var rows = rrs.tail.prepend(rrs.head);
			if (!rows.isEmpty) {
				var lastRow = rows.at(rows.length() - 1);
				if (lastRow.entries.length() === 1 && lastRow.entries.at(0).isEmpty) {
					rows = rows.reverse().tail.reverse();
				}
			}
			return rows;
		})
	}),
	
	// <row> ::= <entry> ( '&' <entry> )*
	row: memo(function () {
		return p.entry().and(fun(rep(lit("&").andr(p.entry)))).to(function (ees) {
			return new AST.Command.Xymatrix.Row(ees.tail.prepend(ees.head));
		})
	}),
	
	// <entry> ::= '*' <object> <pos> <decor>
	//         |   <entry modifier>* <loose objectbox> <decor>
	entry: memo(function () {
		return or(
			lit("*").andr(p.object).and(p.pos).and(p.decor).to(function (opd) {
				var obj = opd.head.head;
				var pos = opd.head.tail;
				var decor = opd.tail;
				return new AST.Command.Xymatrix.Entry.ObjectEntry(obj, pos, decor);
			}),
			p.entryModifier().rep().and(p.looseObjectbox).and(p.decor).to(function (mopd) {
				var modifiers = mopd.head.head.foldLeft(List.empty, function (tmpMs, ms) {
					return ms.concat(tmpMs);
				});
				var isEmpty = mopd.head.tail.isEmpty;
				var objbox = mopd.head.tail.object;
				var decor = mopd.tail;
				if (isEmpty && modifiers.isEmpty) {
					return new AST.Command.Xymatrix.Entry.EmptyEntry(decor);
				}
				return new AST.Command.Xymatrix.Entry.SimpleEntry(modifiers, objbox, decor);
			})
		);
	}),
	
	// <entry modifier> ::= '**' '[' <shape> ']' | '**' '{' <modifier>* '}'
	entryModifier: memo(function () {
		return or(
			lit("**").andr(flit("[")).andr(p.shape).andl(flit("]")).to(function (s) {
				return List.empty.append(s);
			}),
			lit("**").andr(flit("{")).andr(fun(rep(p.modifier))).andl(flit("}"))
		);
	}),
	
	// <loose objectbox> ::= <objectbox>
	//                   |   /[^\\{}%&]+/* ( ( '\' not( '\' | <decor command names> ) ( '{' | '}' | '%' | '&' ) | '{' <text> '}' | /%[^\r\n]*(\r\n|\r|\n)?/ ) /[^\\{}%&]+/* )*
	// <decor command names> ::= 'ar' | 'xymatrix' | 'PATH' | 'afterPATH'
	//                       |   'save' | 'restore' | 'POS' | 'afterPOS' | 'drop' | 'connect' | 'xyignore'
	looseObjectbox: memo(function () {
		return or(
			p.objectbox().to(function (o) { return {
				isEmpty:false, object:o
			} }),
			regex(/^[^\\{}%&]+/).opt().to(function (rs) { return rs.getOrElse(""); }).and(fun(
				rep(
					or(
						elem("{").andr(p.text).andl(felem("}")).to(function (t) { return "{" + t + "}"; }),
						elem("\\").andr(fun(
							not(regex(/^(\\|ar|xymatrix|PATH|afterPATH|save|restore|POS|afterPOS|drop|connect|xyignore|([lrud]+(twocell|uppertwocell|lowertwocell|compositemap))|xtwocell|xuppertwocell|xlowertwocell|xcompositemap)/))
						)).andr(fun(
							regex(/^[{}%&]/).opt().to(function (c) { return c.getOrElse(""); })
						)).to(function (t) {
							return "\\" + t;
						}),
						regex(/^%[^\r\n]*(\r\n|\r|\n)?/).to(function (x) {
							return ' '; // ignore comments
						})
					).and(fun(
						regex(/^[^\\{}%&]+/).opt().to(function (cs) { return cs.getOrElse(""); })
					)).to(function (tt) {
						return tt.head + tt.tail;
					})
				).to(function (cs) { return cs.mkString("") })
			)).and(p.textNodeCreator).to(function (ttc) {
				var tt = ttc.head;
				var createTextNode = ttc.tail;

				var text = tt.head + tt.tail;
				var isEmpty = (text.trim().length === 0);
				var object = p.toMath("\\hbox{$\\objectstyle{" + text + "}$}", createTextNode);
				return {
					isEmpty:isEmpty, object:object
				};
			})
		)
	}),
	
	// <command> ::= <twocell> <twocell switch>* <twocell arrow>
	twocellCommand: memo(function () {
		return p.twocell().and(fun(rep(p.twocellSwitch))).and(p.twocellArrow).to(function (tsa) {
			return new AST.Command.Twocell(tsa.head.head, tsa.head.tail, tsa.tail);
		});
	}),
	
	// <twocell> ::= '\' /[lrud]+/ 'twocell'
	//           |   '\' /[lrud]+/ 'uppertwocell'
	//           |   '\' /[lrud]+/ 'lowertwocell'
	//           |   '\' /[lrud]+/ 'compositemap'
	//           |   '\xtwocell' '[' /[lrud]+/ ']' '{' <text> '}'
	//           |   '\xuppertwocell' '[' /[lrud]+/ ']' '{' <text> '}'
	//           |   '\xlowertwocell' '[' /[lrud]+/ ']' '{' <text> '}'
	//           |   '\xcompositemap' '[' /[lrud]+/ ']' '{' <text> '}'
	twocell: memo(function () {
		return or(
			regexLit(/^\\[lrud]+twocell/).to(function (h) {
				var hops = h.substring(1, h.length - "twocell".length);
				return new AST.Command.Twocell.Twocell(hops, Option.empty);
			}),
			regexLit(/^\\[lrud]+uppertwocell/).to(function (h) {
				var hops = h.substring(1, h.length - "uppertwocell".length);
				return new AST.Command.Twocell.UpperTwocell(hops, Option.empty);
			}),
			regexLit(/^\\[lrud]+lowertwocell/).to(function (h) {
				var hops = h.substring(1, h.length - "lowertwocell".length);
				return new AST.Command.Twocell.LowerTwocell(hops, Option.empty);
			}),
			regexLit(/^\\[lrud]+compositemap/).to(function (h) {
				var hops = h.substring(1, h.length - "compositemap".length);
				return new AST.Command.Twocell.CompositeMap(hops, Option.empty);
			}),
			or(
				lit("\\xtwocell").to(function () { return AST.Command.Twocell.Twocell; }),
				lit("\\xuppertwocell").to(function () { return AST.Command.Twocell.UpperTwocell; }),
				lit("\\xlowertwocell").to(function () { return AST.Command.Twocell.LowerTwocell; }),
				lit("\\xcompositemap").to(function () { return AST.Command.Twocell.CompositeMap; })
			).andl(flit("[")).and(fun(regex(/^[lrud]+/))).andl(flit("]")).andl(flit("{")).and(p.text).andl(flit("}")).and(p.textNodeCreator).to(function (chtc) {
				var cht = chtc.head;
				var createTextNode = chtc.tail;
				var textObject = new AST.Object(List.empty, p.toMath("\\labelstyle " + cht.tail, createTextNode));
				return new cht.head.head(cht.head.tail, new Option.Some(textObject));
			})
		);
	}),
	
	// <twocell switch> ::= '^' <twocell label>
	//          |   '_' <twocell label>
	//          |   '\omit'
	//          |   '~!'
	//          |   '~' ( '`' | "'" ) '{' <object> '}'
	//          |   '~' ( '' | '^' | '_' ) '{' <object> ( '~**' <object> )? '}'
	//          |   <nudge>
	twocellSwitch: memo(function () {
		return or(
			lit("^").andr(p.twocellLabel).to(function (l) {
				return new AST.Command.Twocell.Switch.UpperLabel(l);
			}),
			lit("_").andr(p.twocellLabel).to(function (l) {
				return new AST.Command.Twocell.Switch.LowerLabel(l);
			}),
			lit("\\omit").to(function () {
				return new AST.Command.Twocell.Switch.DoNotSetCurvedArrows();
			}),
			lit("~!").to(function () {
				return new AST.Command.Twocell.Switch.PlaceModMapObject();
			}),
			regexLit(/^(~[`'])/).andl(flit("{")).and(p.object).andl(flit("}")).to(function (wo) {
				var what = wo.head.substring(1);
				return new AST.Command.Twocell.Switch.ChangeHeadTailObject(what, wo.tail);
			}),
			regexLit(/^(~[\^_]?)/).andl(flit("{")).and(p.object).and(fun(opt(lit("~**").andr(p.object)))).andl(flit("}")).to(function (wso) {
				var what = wso.head.head.substring(1);
				var spacer = wso.head.tail;
				var maybeObject = wso.tail;
				return new AST.Command.Twocell.Switch.ChangeCurveObject(what, spacer, maybeObject);
			}),
			p.nudge().to(function (n) {
				return new AST.Command.Twocell.Switch.SetCurvature(n);
			})
		);
	}),
	
	// <twocell label> ::= <digit> | <letter> | <cs>
	//                 |   '{' <nudge>? '*' <object> '}'
	//                 |   '{' <nudge>? <text> '}'
	twocellLabel: memo(function () {
		return or(
			regexLit(/^[0-9a-zA-Z]/).and(p.textNodeCreator).to(function (cc) {
				var c = cc.head;
				var createTextNode = cc.tail;
				var obj = new AST.Object(List.empty, p.toMath("\\twocellstyle " + c, createTextNode));
				return new AST.Command.Twocell.Label(Option.empty, obj);
			}),
			regexLit(/^(\\[a-zA-Z][a-zA-Z0-9]*)/).and(p.textNodeCreator).to(function (cc) {
				var c = cc.head;
				var createTextNode = cc.tail;
				var obj = new AST.Object(List.empty, p.toMath("\\twocellstyle " + c, createTextNode));
				return new AST.Command.Twocell.Label(Option.empty, obj);
			}),
			lit("{").andr(fun(opt(p.nudge))).andl(flit("*")).and(p.object).andl(flit("}")).to(function (no) {
				return new AST.Command.Twocell.Label(no.head, no.tail);
			}),
			lit("{").andr(fun(opt(p.nudge))).and(p.text).andl(felem("}")).and(p.textNodeCreator).to(function (ntc) {
				var nt = ntc.head;
				var createTextNode = ntc.tail;
				var obj = new AST.Object(List.empty, p.toMath("\\twocellstyle " + nt.tail, createTextNode));
				return new AST.Command.Twocell.Label(nt.head, obj);
			})
		);
	}),
	
	// <nudge> ::= '<' <factor> '>'
	//         |   '<\omit>'
	nudge: memo(function () {
		return or(
			lit("<\\omit>").to(function () {
				return new AST.Command.Twocell.Nudge.Omit();
			}),
			lit("<").andr(p.factor).andl(flit(">")).to(function (n) {
				return new AST.Command.Twocell.Nudge.Number(n);
			})
		);
	}),
	
	// <twocell arrow> ::= '{' <twocell tok> (<twocell label entry> '}'
	//                 |   '{' <nudge> <twocell label entry> '}'
	//                 |   '{' <twocell label entry> '}'
	//                 |   <empty>
	// <twocell tok> ::= '^' | '_' | '='
	//               |   '\omit'
	//               |   '`' | "'" | '"' | '!'
	twocellArrow: memo(function () {
		return or(
			lit("{").andr(fun(regexLit(/^([\^_=`'"!]|\\omit)/))).and(p.twocellLabelEntry).andl(flit("}")).to(function (te) {
				return new AST.Command.Twocell.Arrow.WithOrientation(te.head, te.tail);
			}),
			lit("{").andr(p.nudge).and(p.twocellLabelEntry).andl(flit("}")).to(function (te) {
				return new AST.Command.Twocell.Arrow.WithPosition(te.head, te.tail);
			}),
			lit("{").andr(p.twocellLabelEntry).andl(flit("}")).to(function (e) {
				return new AST.Command.Twocell.Arrow.WithOrientation('', e);
			}),
			success("no arrow label").andr(p.textNodeCreator).to(function (createTextNode) {
				// TODO 無駄な空描画処理をなくす。
				return new AST.Command.Twocell.Arrow.WithOrientation('', new AST.Object(List.empty, p.toMath("\\twocellstyle{}", createTextNode)));
			})
		);
	}),
	
	// <twocell label entry> ::= '*' <object>
	//                       |   <text>
	twocellLabelEntry: memo(function () {
		return or(
			lit("*").andr(p.object),
			p.text().and(p.textNodeCreator).to(function (tc) {
				var t = tc.head;
				var createTextNode = tc.tail;
				return new AST.Object(List.empty, p.toMath("\\twocellstyle " + t, createTextNode));
			})
		);
	}),
	
	// \newdirの後の
	// '{' <main> '}' '{' <composite_object> '}'
	newdir: memo(function () {
		return lit("{").andr(p.dirMain).andl(felem("}")).andl(flit("{")).and(p.compositeObject).andl(flit("}")).to(function (mc) {
			return new AST.Command.Newdir(mc.head, new AST.ObjectBox.CompositeObject(mc.tail));
		});
	}),
	
	// '\xyimport' '(' <factor> ',' <factor> ')' ( '(' <factor> ',' <factor> ')' )? '{' ( <include graphics> | <TeX command> ) '}'
	xyimport: memo(function () {
		return lit("\\xyimport").andr(flit("(")).andr(p.factor).andl(flit(",")).and(p.factor).andl(flit(")")).and(fun(
			opt(lit("(").andr(p.factor).andl(flit(",")).and(p.factor).andl(flit(")")))
		)).andl(flit("{")).and(fun(
			or(
				lit("\\includegraphics").andr(p.includegraphics),
				p.text().and(p.textNodeCreator).to(function (tc) {
					var t = tc.head;
					var createTextNode = tc.tail;
					return p.toMath("\\hbox{$\\objectstyle{" + t + "}$}", createTextNode);
				})
		))).andl(flit("}")).to(function (whog) {
			var w = whog.head.head.head;
			var h = whog.head.head.tail;
			var xOffset, yOffset;
			if (whog.head.tail.isDefined) {
				xOffset = whog.head.tail.get.head;
				yOffset = whog.head.tail.get.tail;
			} else {
				xOffset = 0;
				yOffset = 0;
			}
			var graphics = whog.tail;
			if (graphics.isIncludegraphics !== undefined) {
				return new AST.Pos.Xyimport.Graphics(w, h, xOffset, yOffset, graphics);
			} else {
				return new AST.Pos.Xyimport.TeXCommand(w, h, xOffset, yOffset, graphics);
			}
		});
	}),
	
	// \includegraphicsの後の
	// '*'? '[' ( <includegraphics attr list> )? ']' '{' <file path> '}'
	includegraphics: memo(function () {
		return lit("[").andr(fun(opt(p.includegraphicsAttrList))).andl(flit("]")).andl(flit("{")).and(fun(regexLit(/^[^\s{}]+/))).andl(flit("}")).to(function (af) {
			var attrList = af.head.getOrElse(List.empty);
			var file = af.tail;
			return new AST.Command.Includegraphics(false, attrList, file);
		});
	}),
	
	// <includegraphics attr list> := <includegraphics attr key val> ( ',' <includegraphics attr key val> )*
	includegraphicsAttrList: memo(function () {
		return p.includegraphicsAttr().and(fun(rep(lit(",").andr(p.includegraphicsAttr)))).to(function (aas) {
			return aas.tail.prepend(aas.head);
		});
	}),
	
	// <includegraphics attr key val> := 'width' '=' <dimen>
	//                                |  'height' '=' <dimen>
	includegraphicsAttr: memo(function () {
		return or(
			lit("width").andr(flit("=")).andr(p.dimen).to(function (d) {
				return new AST.Command.Includegraphics.Attr.Width(d);
			}),
			lit("height").andr(flit("=")).andr(p.dimen).to(function (d) {
				return new AST.Command.Includegraphics.Attr.Height(d);
			})
		);
	})
	
};

for (var nonterm in grammar) {
	p[nonterm] = grammar[nonterm];
}

export const XyParser = p;