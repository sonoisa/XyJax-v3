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


import {AbstractMmlNode, TEXCLASS} from "../../mathjax/js/core/MmlTree/MmlNode.js";
import {MML} from "../../mathjax/js/core/MmlTree/MML.js";


export class AST {};


class BaseXyMmlNode extends AbstractMmlNode {
	constructor(mmlFactory, textMmls) {
		super(mmlFactory, {}, textMmls);
		this.textMmls = textMmls;
		this.texClass = TEXCLASS.ORD;
	}
}

BaseXyMmlNode.defaults = AbstractMmlNode.defaults;


AST.xypic = class AST_xypic extends BaseXyMmlNode {
	constructor(mmlFactory, command, textMmls) {
		super(mmlFactory, textMmls);
		this.cmd = command;
	}

	get kind() {
		return "xypic";
	}

	toString() { return this.kind + "(" + this.cmd + ")"; }
};

AST.xypic.defaults = BaseXyMmlNode.defaults;
MML[AST.xypic.prototype.kind] = AST.xypic;


AST.xypic.newdir = class AST_xypic_newdir extends BaseXyMmlNode {
	constructor(mmlFactory, command, textMmls) {
		super(mmlFactory, textMmls);
		this.cmd = command;
	}

	get kind() {
		return "xypic-newdir";
	}

	toString() { return this.kind + "(" + this.cmd + ")"; }
};

AST.xypic.newdir.defaults = BaseXyMmlNode.defaults;
MML[AST.xypic.newdir.prototype.kind] = AST.xypic.newdir;


AST.xypic.includegraphics = class AST_xypic_includegraphics extends BaseXyMmlNode {
	constructor(mmlFactory, command, textMmls) {
		super(mmlFactory, textMmls);
		this.cmd = command;
	}

	get kind() {
		return "xypic-includegraphics";
	}

	toString() { return this.kind + "(" + this.cmd + ")"; }
};

AST.xypic.includegraphics.defaults = BaseXyMmlNode.defaults;
MML[AST.xypic.includegraphics.prototype.kind] = AST.xypic.includegraphics;


// <pos-decor> ::= <pos> <decor>
AST.PosDecor = class AST_PosDecor {
	constructor(pos, decor) {
		this.pos = pos;
		this.decor = decor;
	}
	toString() {
		return this.pos.toString() + " " + this.decor;
	}
};

// <pos>
AST.Pos = class AST_Pos {};
// <pos> ::= <coord> <pos2>*
AST.Pos.Coord = class AST_Pos_Coord {
	constructor(coord, pos2s) {
		this.coord = coord;
		this.pos2s = pos2s;
	}
	toString() {
		return this.coord.toString() + " " + this.pos2s.mkString(" ");
	}
};
// <pos2> ::= '+' <coord>
AST.Pos.Plus = class AST_Pos_Plus {
	constructor(coord) {
		this.coord = coord;
	}
	toString() {
		return "+(" + this.coord + ")";
	}
};
// <pos2> ::= '-' <coord>
AST.Pos.Minus = class AST_Pos_Minus {
	constructor(coord) {
		this.coord = coord;
	}
	toString() {
		return "-(" + this.coord + ")";
	}
};
// <pos2> ::= '!' <coord>
AST.Pos.Skew = class AST_Pos_Skew {
	constructor(coord) {
		this.coord = coord;
	}
	toString() {
		return "!(" + this.coord + ")";
	}
};
// <pos2> ::= '.' <coord>
AST.Pos.Cover = class AST_Pos_Cover {
	constructor(coord) {
		this.coord = coord;
	}
	toString() {
		return ".(" + this.coord + ")";
	}
};
// <pos2> ::= ',' <coord>
AST.Pos.Then = class AST_Pos_Then {
	constructor(coord) {
		this.coord = coord;
	}
	toString() {
		return ",(" + this.coord + ")";
	}
};
// <pos2> ::= ';' <coord>
AST.Pos.SwapPAndC = class AST_Pos_SwapPAndC {
	constructor(coord) {
		this.coord = coord;
	}
	toString() {
		return ";(" + this.coord + ")";
	}
};
// <pos2> ::= ':' <coord>
AST.Pos.SetBase = class AST_Pos_SetBase {
	constructor(coord) {
		this.coord = coord;
	}
	toString() {
		return ":(" + this.coord + ")";
	}
};
// <pos2> ::= '::' <coord>
AST.Pos.SetYBase = class AST_Pos_SetYBase {
	constructor(coord) {
		this.coord = coord;
	}
	toString() {
		return "::(" + this.coord + ")";
	}
};
// <pos2> ::= '**' <object>
AST.Pos.ConnectObject = class AST_Pos_ConnectObject {
	constructor(object) {
		this.object = object;
	}
	toString() {
		return "**(" + this.object + ")";
	}
};
// <pos2> ::= '*' <object>
AST.Pos.DropObject = class AST_Pos_DropObject {
	constructor(object) {
		this.object = object;
	}
	toString() {
		return "*(" + this.object + ")";
	}
};
// <pos2> ::= '?' <place>
AST.Pos.Place = class AST_Pos_Place {
	constructor(place) {
		this.place = place;
	}
	toString() {
		return "?(" + this.place + ")";
	}
};
// <pos2> ::= '@+' <coord>
AST.Pos.PushCoord = class AST_Pos_PushCoord {
	constructor(coord) {
		this.coord = coord;
	}
	toString() {
		return "@+(" + this.coord + ")";
	}
};
// <pos2> ::= '@-' <coord>
AST.Pos.EvalCoordThenPop = class AST_Pos_EvalCoordThenPop {
	constructor(coord) {
		this.coord = coord;
	}
	toString() {
		return "@-(" + this.coord + ")";
	}
};
// <pos2> ::= '@=' <coord>
AST.Pos.LoadStack = class AST_Pos_LoadStack {
	constructor(coord) {
		this.coord = coord;
	}
	toString() {
		return "@=(" + this.coord + ")";
	}
};
// <pos2> ::= '@@' <coord>
AST.Pos.DoCoord = class AST_Pos_DoCoord {
	constructor(coord) {
		this.coord = coord;
	}
	toString() {
		return "@@(" + this.coord + ")";
	}
};
// <pos2> ::= '@i'
AST.Pos.InitStack = class AST_Pos_InitStack {
	constructor() {
	}
	toString() {
		return "@i";
	}
};
// <pos2> ::= '@('
AST.Pos.EnterFrame = class AST_Pos_EnterFrame {
	constructor() {
	}
	toString() {
		return "@(";
	}
};
// <pos2> ::= '@)'
AST.Pos.LeaveFrame = class AST_Pos_LeaveFrame {
	constructor() {
	}
	toString() {
		return "@)";
	}
};
// <pos2> ::= '=' '"' <id> '"'
AST.Pos.SavePos = class AST_Pos_SavePos {
	constructor(id) {
		this.id = id;
	}
	toString() {
		return '="' + this.id + '"';
	}
};
// <pos2> ::= '=' <coord> '"' <id> '"'
AST.Pos.SaveMacro = class AST_Pos_SaveMacro {
	constructor(macro, id) {
		this.macro = macro;
		this.id = id;
	}
	toString() {
		return "=(" + this.macro + ' "' + this.id + '")';
	}
};
// <pos2> ::= '=:' '"' <id> '"'
AST.Pos.SaveBase = class AST_Pos_SaveBase {
	constructor(id) {
		this.id = id;
	}
	toString() {
		return '=:"' + this.id + '"';
	}
};
// <pos2> ::= '=@' '"' <id> '"'
AST.Pos.SaveStack = class AST_Pos_SaveStack {
	constructor(id) {
		this.id = id;
	}
	toString() {
		return '=@"' + this.id + '"';
	}
};

// <coord> 
AST.Coord = class AST_Coord {};
// <coord> ::= <vector>
AST.Coord.Vector = class AST_Coord_Vector {
	constructor(vector) {
		this.vector = vector;
	}
	toString() {
		return this.vector.toString();
	}
};
// <coord> ::= <empty> | 'c'
AST.Coord.C = class AST_Coord_C {
	toString() {
		return "c";
	}
};
// <coord> ::= 'p'
AST.Coord.P = class AST_Coord_P {
	toString() {
		return "p";
	}
};
// <coord> ::= 'x'
AST.Coord.X = class AST_Coord_X {
	toString() {
		return "x";
	}
};
// <coord> ::= 'y'
AST.Coord.Y = class AST_Coord_Y {
	toString() {
		return "y";
	}
};
// <coord> ::= '"' <id> '"'
AST.Coord.Id = class AST_Coord_Id {
	constructor(id) {
		this.id = id;
	}
	toString() {
		return '"' + this.id + '"';
	}
};
// <coord> ::= '{' <pos> <decor> '}'
AST.Coord.Group = class AST_Coord_Group {
	constructor(posDecor) {
		this.posDecor = posDecor;
	}
	toString() {
		return '{' + this.posDecor + '}';
	}
};
// <coord> ::= 's' <digit>
// <coord> ::= 's' '{' <nonnegative-number> '}'
AST.Coord.StackPosition = class AST_Coord_StackPosition {
	constructor(number) {
		this.number = number;
	}
	toString() {
		return 's{' + this.number + '}';
	}
};

// coordinate for xymatrix
// <coord> ::= '[' ('"'<prefix>'"')? <number> ',' <number> ']'
AST.Coord.DeltaRowColumn = class AST_Coord_DeltaRowColumn {
	/**
	 * @param {String} prefix name of the xymatrix
	 * @param {Number} dr rows below
	 * @param {Number} dc columns right
	 */
	constructor(prefix, dr, dc) {
		this.prefix = prefix;
		this.dr = dr;
		this.dc = dc;
	}
	toString() {
		return '[' + (this.prefix === ''? '' : '"' + this.prefix + '"') + this.dr + "," + this.dc + "]";
	}
};
// coordinate for xymatrix
// <coord> ::= '[' ('"'<prefix>'"')? ( 'l' | 'r' | 'u' | 'd' )* ']'
AST.Coord.Hops = class AST_Coord_Hops {
	/**
	 * @param {String} prefix name of the xymatrix
	 * @param {List[String]} hops hops
	 */
	constructor(prefix, hops) {
		this.prefix = prefix;
		this.hops = hops;
	}
	toString() {
		return '[' + (this.prefix === ''? '' : '"' + this.prefix + '"') + this.hops.mkString("") + "]";
	}
};
// coordinate for xymatrix
// <coord> ::= '[' ('"'<prefix>'"')? ( 'l' | 'r' | 'u' | 'd' )+ <place> ']'
AST.Coord.HopsWithPlace = class AST_Coord_HopsWithPlace {
	/**
	 * @param {String} prefix name of the xymatrix
	 * @param {List[String]} hops hops
	 * @param {AST.Pos.Place} place place
	 */
	constructor(prefix, hops, place) {
		this.prefix = prefix;
		this.hops = hops;
		this.place = place;
	}
	toString() {
		return '[' + (this.prefix === ''? '' : '"' + this.prefix + '"') + this.hops.mkString("") + this.place + "]";
	}
};

// <vector>
AST.Vector = class AST_Vector {};
// <vector> ::= '(' <factor> ',' <factor> ')'
AST.Vector.InCurBase = class AST_Vector_InCurBase {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
	toString() {
		return "(" + this.x + ", " + this.y + ")";
	}
};
// <vector> ::= '<' <dimen> ',' <dimen> '>'
// <vector> ::= '<' <dimen> '>'
AST.Vector.Abs = class AST_Vector_Abs {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}
	toString() {
		return "<" + this.x + ", " + this.y + ">";
	}
};
// <vector> ::= 'a' '(' <number> ')'
AST.Vector.Angle = class AST_Vector_Angle {
	constructor(degree) {
		this.degree = degree;
	}
	toString() {
		return "a(" + this.degree + ")";
	}
};
// <vector> ::= '/' <direction> <dimen> '/'
AST.Vector.Dir = class AST_Vector_Dir {
	constructor(dir, dimen) {
		this.dir = dir;
		this.dimen = dimen;
	}
	toString() {
		return "/" + this.dir + " " + this.dimen + "/";
	}
};
// <vector> ::= <corner>
//          |   <corner> '(' <factor> ')'
AST.Vector.Corner = class AST_Vector_Corner {
	constructor(corner, factor) {
		this.corner = corner;
		this.factor = factor;
	}
	toString() {
		return this.corner.toString() + "(" + this.factor + ")";
	}
};

// <corner> ::= 'L' | 'R' | 'D' | 'U'
//          | 'CL' | 'CR' | 'CD' | 'CU'
//          | 'LD' | 'RD' | 'LU' | 'RU'
//          | 'E' | 'P'
//          | 'A'
AST.Corner = class AST_Corner {};
AST.Corner.L = class AST_Corner_L {
	toString() { return "L"; }
};
AST.Corner.R = class AST_Corner_R {
	toString() { return "R"; }
};
AST.Corner.D = class AST_Corner_D {
	toString() { return "D"; }
};
AST.Corner.U = class AST_Corner_U {
	toString() { return "U"; }
};
AST.Corner.CL = class AST_Corner_CL {
	toString() { return "CL"; }
};
AST.Corner.CR = class AST_Corner_CR {
	toString() { return "CR"; }
};
AST.Corner.CD = class AST_Corner_CD {
	toString() { return "CD"; }
};
AST.Corner.CU = class AST_Corner_CU {
	toString() { return "CU"; }
};
AST.Corner.LD = class AST_Corner_LD {
	toString() { return "LD"; }
};
AST.Corner.RD = class AST_Corner_RD {
	toString() { return "RD"; }
};
AST.Corner.LU = class AST_Corner_LU {
	toString() { return "LU"; }
};
AST.Corner.RU = class AST_Corner_RU {
	toString() { return "RU"; }
};
AST.Corner.NearestEdgePoint = class AST_Corner_NearestEdgePoint {
	toString() { return "E"; }
};
AST.Corner.PropEdgePoint = class AST_Corner_PropEdgePoint {
	toString() { return "P"; }
};
AST.Corner.Axis = class AST_Corner_Axis {
	toString() { return "A"; }
};

// <place> ::= '<' <place>
// <place> ::= '>' <place>
// <place> ::= '(' <factor> ')' <place>
// <place> ::= '!' '{' <pos> '}' <slide>
// <place> ::= <slide>
AST.Place = class AST_Place {
	constructor(shaveP, shaveC, factor, slide) {
		this.shaveP = shaveP;
		this.shaveC = shaveC;
		this.factor = factor;
		this.slide = slide;
	}
	compound(that) {
		return new AST.Place(
			this.shaveP + that.shaveP,
			this.shaveC + that.shaveC,
			that.factor === undefined? this.factor : that.factor,
			that.slide);
	}
	toString() {
		var desc = "";
		for (var l = 0; l < this.shaveP; l++) {
			desc += "<";
		}
		for (var r = 0; r < this.shaveC; r++) {
			desc += ">";
		}
		if (this.factor !== undefined) {
			desc += "(" + this.factor + ")";
		}
		this.slide.dimen.foreach(function (d) {
			desc += "/" + d + "/";
		});
		return desc;
	}
};
AST.Place.Factor = class AST_Place_Factor {
	constructor(factor) {
		this.factor = factor;
	}
	get isIntercept() {
		return false;
	}
	toString() {
		return this.factor.toString();
	}
};
AST.Place.Intercept = class AST_Place_Intercept {
	constructor(pos) {
		this.pos = pos;
	}
	get isIntercept() {
		return true;
	}
	toString() {
		return "!{" + this.pos + "}";
	}
};

// <slide> ::= <empty>
// <slide> ::= '/' <dimen> '/'
AST.Slide = class AST_Slide {
	constructor(dimen) {
		this.dimen = dimen;
	}
	toString() {
		return this.dimen.getOrElse("");
	}
};


// <object> ::= <modifier>* <objectbox>
AST.Object = class AST_Object {
	constructor(modifiers, object) {
		this.modifiers = modifiers;
		this.object = object;
	}

	dirVariant() { return this.object.dirVariant(); }

	dirMain() { return this.object.dirMain(); }

	isDir() { return this.object.isDir(); }

	toString() {
		return this.modifiers.mkString() + this.object.toString();
	}
};

// <objectbox>
AST.ObjectBox = class AST_ObjectBox {
	constructor() {
	}

	get isEmpty() {
		return false;
	}

	dirVariant() { return undefined; }

	dirMain() { return undefined; }

	isDir() { return false; }
};
// <objectbox> ::= '{' <text> '}'
// <objectbox> ::= <TeX box> '{' <text> '}'
AST.ObjectBox.Text = class AST_ObjectBox_Text extends AST.ObjectBox {
	constructor(math) {
		super();
		this.math = math;
	}
	toString() { return "{" + this.math.toString() + "}"; }
};
AST.ObjectBox.Empty = class AST_ObjectBox_Empty extends AST.ObjectBox {
	constructor() {
		super();
	}

	get isEmpty() {
		return true;
	}

	toString() { return "{}"; }
};

// <objectbox> ::= 'xymatrix' <xymatrix>
AST.ObjectBox.Xymatrix = class AST_ObjectBox_Xymatrix extends AST.ObjectBox {
	/**
	 * @param {AST.Command.Xymatrix} xymatrix xymatrix
	 */
	constructor(xymatrix) {
		super();
		this.xymatrix = xymatrix;
	}
	toString() { return this.xymatrix.toString(); }
};

// <objectbox> ::= '\txt' <width> <style> '{' <text> '}'
AST.ObjectBox.Txt = class AST_ObjectBox_Txt extends AST.ObjectBox {
	constructor(width, textObject) {
		super();
		this.width = width;
		this.textObject = textObject;
	}
	toString() { return "\\txt" + this.width + "{" + this.textObject.toString() + "}"; }
};
AST.ObjectBox.Txt.Width = class AST_ObjectBox_Txt_Width extends AST.ObjectBox {
	constructor() {
		super();
	}
};
AST.ObjectBox.Txt.Width.Vector = class AST_ObjectBox_Txt_Width_Vector extends AST.ObjectBox {
	constructor(vector) {
		super();
		this.vector = vector;
	}
	toString() { return this.vector.toString(); }
};
AST.ObjectBox.Txt.Width.Default = class AST_ObjectBox_Txt_Width_Default extends AST.ObjectBox {
	constructor() {
		super();
	}
	toString() { return ""; }
};

// <objectbox> ::= '\object' <object>
AST.ObjectBox.WrapUpObject = class AST_ObjectBox_WrapUpObject extends AST.ObjectBox {
	constructor(object) {
		super();
		this.object = object;
	}
	toString() { return "\\object" + this.object.toString(); }
};

// <objectbox> ::= '\composite' '{' <composite_object> '}'
// <composite_object> ::= <object> ( '*' <object> )*
AST.ObjectBox.CompositeObject = class AST_ObjectBox_CompositeObject extends AST.ObjectBox {
	constructor(objects) {
		super();
		this.objects = objects;
	}
	toString() { return "\\composite{" + this.objects.mkString(" * ") + "}"; }
};

// <objectbox> ::= '\xybox' '{' <pos> <decor> '}'
AST.ObjectBox.Xybox = class AST_ObjectBox_Xybox extends AST.ObjectBox {
	constructor(posDecor) {
		super();
		this.posDecor = posDecor;
	}
	toString() { return "\\xybox{" + this.posDecor.toString() + "}"; }
};

// <objectbox> ::= '\cir' <radius> '{' <cir> '}'
// <cir_radius> ::= <vector>
//          | <empty>
// <cir> ::= <diag> <orient> <diag>
//       | <empty>
AST.ObjectBox.Cir = class AST_ObjectBox_Cir extends AST.ObjectBox {
	constructor(radius, cir) {
		super();
		this.radius = radius;
		this.cir = cir;
	}
	toString() {
		return "\\cir"+this.radius+"{"+this.cir+"}";
	}
};
AST.ObjectBox.Cir.Radius = class AST_ObjectBox_Cir_Radius {};
AST.ObjectBox.Cir.Radius.Vector = class AST_ObjectBox_Cir_Radius_Vector {
	constructor(vector) {
		this.vector = vector;
	}
	toString() { return this.vector.toString(); }
};
AST.ObjectBox.Cir.Radius.Default = class AST_ObjectBox_Cir_Radius_Default {
	toString() { return ""; }
};
AST.ObjectBox.Cir.Cir = class AST_ObjectBox_Cir_Cir {};
AST.ObjectBox.Cir.Cir.Segment = class AST_ObjectBox_Cir_Cir_Segment {
	constructor(startDiag, orient, endDiag) {
		this.startDiag = startDiag;
		this.orient = orient;
		this.endDiag = endDiag;
	}
	toString() { return this.startDiag.toString()+this.orient+this.endDiag; }
};
AST.ObjectBox.Cir.Cir.Full = class AST_ObjectBox_Cir_Cir_Full {
	toString() { return ""; }
};

// <objectbox> ::= '\dir' <variant> '{' <main> '}'
// <variant> ::= '^' | '_' | '0' | '1' | '2' | '3' | <empty>
// <main> ::= ('-' | '.' | '~' | '>' | '<' | '(' | ')' | '`' | "'" | '|' | '*' | '+' | 'x' | '/' | 'o' | '=' | ':' | /[a-zA-Z@ ]/)*
AST.ObjectBox.Dir = class AST_ObjectBox_Dir extends AST.ObjectBox {
	constructor(variant, main) {
		super();
		this.variant = variant;
		this.main = main;
	}

	dirVariant() { return this.variant; }

	dirMain() { return this.main; }

	isDir() { return true; }

	toString() { return "\\dir" + this.variant + "{" + this.main + "}"; }
};

// <objectbox> ::= '\crv' <curve-modifier> '{' <curve-object> <curve-poslist> '}'
AST.ObjectBox.Curve = class AST_ObjectBox_Curve extends AST.ObjectBox {
	constructor(modifiers, objects, poslist) {
		super();
		this.modifiers = modifiers;
		this.objects = objects;
		this.poslist = poslist;
	}

	dirVariant() { return ""; }

	dirMain() { return "-"; }

	isDir() { return false; }

	toString() { return "\\curve"+this.modifiers.mkString("")+"{"+this.objects.mkString(" ")+" "+this.poslist.mkString("&")+"}"; }
};
// <curve-modifier> ::= ( '~' <curve-option> )*
// <curve-option> ::= 'p' | 'P' | 'l' | 'L' | 'c' | 'C'
//                |   'pc' | 'pC' | 'Pc' | 'PC'
//                |   'lc' | 'lC' | 'Lc' | 'LC'
//                |   'cC'
AST.ObjectBox.Curve.Modifier = class AST_ObjectBox_Curve_Modifier {};
AST.ObjectBox.Curve.Modifier.p = class AST_ObjectBox_Curve_Modifier_p {
	toString() { return "~p"; }
};
AST.ObjectBox.Curve.Modifier.P = class AST_ObjectBox_Curve_Modifier_P {
	toString() { return "~P"; }
};
AST.ObjectBox.Curve.Modifier.l = class AST_ObjectBox_Curve_Modifier_l {
	toString() { return "~l"; }
};
AST.ObjectBox.Curve.Modifier.L = class AST_ObjectBox_Curve_Modifier_L {
	toString() { return "~L"; }
};
AST.ObjectBox.Curve.Modifier.c = class AST_ObjectBox_Curve_Modifier_c {
	toString() { return "~c"; }
};
AST.ObjectBox.Curve.Modifier.C = class AST_ObjectBox_Curve_Modifier_C {
	toString() { return "~C"; }
};
AST.ObjectBox.Curve.Modifier.pc = class AST_ObjectBox_Curve_Modifier_pc {
	toString() { return "~pc"; }
};
AST.ObjectBox.Curve.Modifier.pC = class AST_ObjectBox_Curve_Modifier_pC {
	toString() { return "~pC"; }
};
AST.ObjectBox.Curve.Modifier.Pc = class AST_ObjectBox_Curve_Modifier_Pc {
	toString() { return "~Pc"; }
};
AST.ObjectBox.Curve.Modifier.PC = class AST_ObjectBox_Curve_Modifier_PC {
	toString() { return "~PC"; }
};
AST.ObjectBox.Curve.Modifier.lc = class AST_ObjectBox_Curve_Modifier_lc {
	toString() { return "~lc"; }
};
AST.ObjectBox.Curve.Modifier.lC = class AST_ObjectBox_Curve_Modifier_lC {
	toString() { return "~lC"; }
};
AST.ObjectBox.Curve.Modifier.Lc = class AST_ObjectBox_Curve_Modifier_Lc {
	toString() { return "~Lc"; }
};
AST.ObjectBox.Curve.Modifier.LC = class AST_ObjectBox_Curve_Modifier_LC {
	toString() { return "~LC"; }
};
AST.ObjectBox.Curve.Modifier.cC = class AST_ObjectBox_Curve_Modifier_cC {
	toString() { return "~cC"; }
};
// <curve-object> ::= <empty>
//                |   '~*' <object> <curve-object>
//                |   '~**' <object> <curve-object>
AST.ObjectBox.Curve.Object = class AST_ObjectBox_Curve_Object {};
AST.ObjectBox.Curve.Object.Drop = class AST_ObjectBox_Curve_Object_Drop {
	constructor(object) {
		this.object = object;
	}
	toString() { return "~*" + this.object; }
};
AST.ObjectBox.Curve.Object.Connect = class AST_ObjectBox_Curve_Object_Connect {
	constructor(object) {
		this.object = object;
	}
	toString() { return "~**" + this.object; }
};
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
AST.ObjectBox.Curve.PosList = class AST_ObjectBox_Curve_PosList {};
AST.ObjectBox.Curve.PosList.CurPos = class AST_ObjectBox_Curve_PosList_CurPos {
	toString() { return ""; }
};
AST.ObjectBox.Curve.PosList.Pos = class AST_ObjectBox_Curve_PosList_Pos {
	constructor(pos) {
		this.pos = pos;
	}
	toString() { return this.pos.toString(); }
};
AST.ObjectBox.Curve.PosList.AddStack = class AST_ObjectBox_Curve_PosList_AddStack {
	toString() { return "~@"; }
};

// <modifier>
AST.Modifier = class AST_Modifier {
};
// <modifier> ::= '!' <vector>
AST.Modifier.Vector = class AST_Modifier_Vector extends AST.Modifier {
	constructor(vector) {
		super();
		this.vector = vector;
	}
	toString() { return "!" + this.vector; }
};
// <modifier> ::= '!'
AST.Modifier.RestoreOriginalRefPoint = class AST_Modifier_RestoreOriginalRefPoint extends AST.Modifier {
	constructor() {
		super();
	}
	toString() { return "!"; }
};
// <modifier> ::= <add-op> <size>
// <add-op> ::= '+' | '-' | '=' | '+=' | '-='
// <size> ::= <vector> | <empty>
AST.Modifier.AddOp = class AST_Modifier_AddOp extends AST.Modifier {
	constructor(op, size) {
		super();
		this.op = op;
		this.size = size;
	}
	toString() { return this.op.toString() + " " + this.size; }
};
AST.Modifier.AddOp.Grow = class AST_Modifier_AddOp_Grow {
	toString() { return '+'; }
};
AST.Modifier.AddOp.Shrink = class AST_Modifier_AddOp_Shrink {
	toString() { return '-'; }
};
AST.Modifier.AddOp.Set = class AST_Modifier_AddOp_Set {
	toString() { return '='; }
};
AST.Modifier.AddOp.GrowTo = class AST_Modifier_AddOp_GrowTo {
	toString() { return '+='; }
};
AST.Modifier.AddOp.ShrinkTo = class AST_Modifier_AddOp_ShrinkTo {
	toString() { return '-='; }
};
AST.Modifier.AddOp.VactorSize = class AST_Modifier_AddOp_VactorSize {
	constructor(vector) {
		this.vector = vector;
	}

	get isDefault() {
		return false;
	}

	toString() { return this.vector.toString(); }
};
AST.Modifier.AddOp.DefaultSize = class AST_Modifier_AddOp_DefaultSize {
	constructor() {
	}

	get isDefault() {
		return true;
	}

	toString() { return ""; }
};

// <modifier> ::= '[' <shape> ']'
// <shape> ::= '.' 
//          | <frame_shape>
//          | <alphabets>
//          | '=' <alphabets>
//          | <empty>
// <alphabets> ::= /[a-zA-Z]+/
AST.Modifier.Shape = class AST_Modifier_Shape {};
AST.Modifier.Shape.Point = class AST_Modifier_Shape_Point extends AST.Modifier {
	constructor() {
		super();
	}
	toString() { return "[.]"; }
};
AST.Modifier.Shape.Rect = class AST_Modifier_Shape_Rect extends AST.Modifier {
	constructor() {
		super();
	}
	toString() { return "[]"; }
};
AST.Modifier.Shape.Alphabets = class AST_Modifier_Shape_Alphabets extends AST.Modifier {
	constructor(alphabets) {
		super();
		this.alphabets = alphabets;
	}
	toString() { return "[" + this.alphabets + "]"; }
};
AST.Modifier.Shape.DefineShape = class AST_Modifier_Shape_DefineShape extends AST.Modifier {
	constructor(shape) {
		super();
		this.shape = shape;
	}
	toString() { return "[" + this.shape + "]"; }
};
// 以下はxypic.ModifierRepositoryに格納されるもの
AST.Modifier.Shape.Circle = class AST_Modifier_Shape_Circle extends AST.Modifier {
	constructor() {
		super();
	}
	toString() { return "[o]"; }
};
AST.Modifier.Shape.L = class AST_Modifier_Shape_L extends AST.Modifier {
	constructor() {
		super();
	}
	toString() { return "[l]"; }
};
AST.Modifier.Shape.R = class AST_Modifier_Shape_R extends AST.Modifier {
	constructor() {
		super();
	}
	toString() { return "[r]"; }
};
AST.Modifier.Shape.U = class AST_Modifier_Shape_U extends AST.Modifier {
	constructor() {
		super();
	}
	toString() { return "[u]"; }
};
AST.Modifier.Shape.D = class AST_Modifier_Shape_D extends AST.Modifier {
	constructor() {
		super();
	}
	toString() { return "[d]"; }
};
AST.Modifier.Shape.C = class AST_Modifier_Shape_C extends AST.Modifier {
	constructor() {
		super();
	}
	toString() { return "[c]"; }
};
AST.Modifier.Shape.ChangeColor = class AST_Modifier_Shape_ChangeColor extends AST.Modifier {
	constructor(colorName) {
		super();
		this.colorName = colorName;
	}
	toString() { return "[" + this.colorName + "]"; }
};
// ユーザ定義されたshape
AST.Modifier.Shape.CompositeModifiers = class AST_Modifier_Shape_CompositeModifiers extends AST.Modifier {
	/**
	 * @param {List[AST.Modifier.Shape.*]} modifiers ユーザ定義されたmodifierのリスト
	 */
	constructor(modifiers) {
		super();
		this.modifiers = modifiers;
	}
	toString() { return this.modifiers.mkString(""); }
};

// <frame_shape> ::= 'F' <frame_main> ( ':' ( <frame_radius_vector> | <color_name> ))*
AST.Modifier.Shape.Frame = class AST_Modifier_Shape_Frame extends AST.Modifier {
	constructor(main, options) {
		super();
		this.main = main;
		this.options = options;
	}
	toString() {
		return "[F" + this.main + this.options.mkString("") + "]";
	}
};
AST.Modifier.Shape.Frame.Radius = class AST_Modifier_Shape_Frame_Radius {
	constructor(vector) {
		this.vector = vector;
	}
	toString() {
		return ":" + this.vector;
	}
};
// <color_name> ::= /[a-zA-Z][a-zA-Z0-9]*/
AST.Modifier.Shape.Frame.Color = class AST_Modifier_Shape_Frame_Color {
	constructor(colorName) {
		this.colorName = colorName;
	}
	toString() {
		return ":" + this.colorName;
	}
};

// <modifier> ::= 'i'
AST.Modifier.Invisible = class AST_Modifier_Invisible extends AST.Modifier {
	constructor() {
		super();
	}
	toString() { return "i"; }
};

// <modifier> ::= 'h'
AST.Modifier.Hidden = class AST_Modifier_Hidden extends AST.Modifier {
	constructor() {
		super();
	}
	toString() { return "h"; }
};

// <modifier> ::= <nonempty-direction>
AST.Modifier.Direction = class AST_Modifier_Direction extends AST.Modifier {
	constructor(direction) {
		super();
		this.direction = direction;
	}
	toString() { return this.direction.toString(); }
};

// <direction>
AST.Direction = class AST_Direction {};
// <direction> ::= <direction0> <direction1>*
AST.Direction.Compound = class AST_Direction_Compound {
	constructor(dir, rots) {
		this.dir = dir;
		this.rots = rots;
	}
	toString() {
		return this.dir.toString() + this.rots.mkString();
	}
};
// <direction0> ::= <diag>
AST.Direction.Diag = class AST_Direction_Diag {
	constructor(diag) {
		this.diag = diag;
	}
	toString() { return this.diag.toString(); }
};
// <direction0> ::= 'v' <vector>
AST.Direction.Vector = class AST_Direction_Vector {
	constructor(vector) {
		this.vector = vector;
	}
	toString() { return "v" + this.vector.toString(); }
};
// <direction0> ::= 'q' '{' <pos> <decor> '}'
AST.Direction.ConstructVector = class AST_Direction_ConstructVector {
	constructor(posDecor) {
		this.posDecor = posDecor;
	}
	toString() { return "q{" + this.posDecor.toString() + "}"; }
};
// <direction1> ::= ':' <vector>
AST.Direction.RotVector = class AST_Direction_RotVector {
	constructor(vector) {
		this.vector = vector;
	}
	toString() { return ":" + this.vector.toString(); }
};
// <direction1> ::= '_'
AST.Direction.RotAntiCW = class AST_Direction_RotAntiCW {
	toString() { return "_"; }
};
// <direction1> ::= '^'
AST.Direction.RotCW = class AST_Direction_RotCW {
	toString() { return "^"; }
};

// <diag>
AST.Diag = class AST_Diag {};
// <diag> ::= <empty>
AST.Diag.Default = class AST_Diag_Default {
	toString() { return ""; }
};
// <diag> ::= 'l' | 'r' | 'd' | 'u' | 'ld' | 'rd' | 'lu' | 'ru'
AST.Diag.Angle = class AST_Diag_Angle {
	toString() { return this.symbol; }
};
AST.Diag.LD = class AST_Diag_LD extends AST.Diag.Angle {
	constructor() {
		super();
	}

	get symbol() {
		return 'ld';
	}

	get ang() {
		return -3*Math.PI/4;
	}

	turn(orient) {
		return (orient === "^"? new AST.Diag.RD() : new AST.Diag.LU());
	}
};
AST.Diag.RD = class AST_Diag_RD extends AST.Diag.Angle {
	constructor() {
		super();
	}

	get symbol() {
		return 'rd';
	}

	get ang() {
		return -Math.PI/4;
	}

	turn(orient) {
		return (orient === "^"? new AST.Diag.RU() : new AST.Diag.LD());
	}
};
AST.Diag.LU = class AST_Diag_LU extends AST.Diag.Angle {
	constructor() {
		super();
	}

	get symbol() {
		return 'lu';
	}

	get ang() {
		return 3*Math.PI/4;
	}

	turn(orient) {
		return (orient === "^"? new AST.Diag.LD() : new AST.Diag.RU());
	}
};
AST.Diag.RU = class AST_Diag_RU extends AST.Diag.Angle {
	constructor() {
		super();
	}

	get symbol() {
		return 'ru';
	}

	get ang() {
		return Math.PI/4;
	}

	turn(orient) {
		return (orient === "^"? new AST.Diag.LU() : new AST.Diag.RD());
	}
};
AST.Diag.L = class AST_Diag_L extends AST.Diag.Angle {
	constructor() {
		super();
	}

	get symbol() {
		return 'l';
	}

	get ang() {
		return Math.PI;
	}

	turn(orient) {
		return (orient === "^"? new AST.Diag.D() : new AST.Diag.U());
	}
};
AST.Diag.R = class AST_Diag_R extends AST.Diag.Angle {
	constructor() {
		super();
	}

	get symbol() {
		return 'r';
	}

	get ang() {
		return 0;
	}

	turn(orient) {
		return (orient === "^"? new AST.Diag.U() : new AST.Diag.D());
	}
};
AST.Diag.D = class AST_Diag_D extends AST.Diag.Angle {
	constructor() {
		super();
	}

	get symbol() {
		return 'd';
	}

	get ang() {
		return -Math.PI/2;
	}

	turn(orient) {
		return (orient === "^"? new AST.Diag.R() : new AST.Diag.L());
	}
};
AST.Diag.U = class AST_Diag_U extends AST.Diag.Angle {
	constructor() {
		super();
	}

	get symbol() {
		return 'u';
	}

	get ang() {
		return Math.PI/2;
	}

	turn(orient) {
		return (orient === "^"? new AST.Diag.L() : new AST.Diag.R());
	}
};

// <objectbox> ::= '\frm' <frame_radius> '{' <frame_main> '}'
// <frame_radius> ::= <frame_radius_vector>
//          | <empty>
// <frame_main> ::= ( '-' | '=' | '.' | ',' | 'o' | 'e' | '*' )*
//          | ( '_' | '^' )? ( '\{' | '\}' | '(' | ')' )
// <frame_radius_vector> ::= '<' <dimen> ',' <dimen> '>'
//          |   '<' <dimen> '>'
AST.ObjectBox.Frame = class AST_ObjectBox_Frame extends AST.ObjectBox {
	constructor(radius, main) {
		super();
		this.radius = radius;
		this.main = main;
	}
	toString() {
		return "\\frm"+this.radius+"{"+this.main+"}";
	}
};
AST.ObjectBox.Frame.Radius = class AST_ObjectBox_Frame_Radius {};
AST.ObjectBox.Frame.Radius.Vector = class AST_ObjectBox_Frame_Radius_Vector {
	constructor(vector) {
		this.vector = vector;
	}
	toString() { return this.vector.toString(); }
};
AST.ObjectBox.Frame.Radius.Default = class AST_ObjectBox_Frame_Radius_Default {
	toString() { return ""; }
};

// <decor> ::= <command>*
AST.Decor = class AST_Decor {
	constructor(commands) {
		this.commands = commands;
	}
	toString() {
		return this.commands.mkString(" ");
	}
};

AST.Command = class AST_Command {};
// <command> ::= '\save' <pos>
AST.Command.Save = class AST_Command_Save {
	constructor(pos) {
		this.pos = pos;
	}
	toString() {
		return "\\save " + this.pos;
	}
};
// <command> ::= '\restore'
AST.Command.Restore = class AST_Command_Restore {
	toString() {
		return "\\restore";
	}
};
// <command> ::= '\POS' <pos>
AST.Command.Pos = class AST_Command_Pos {
	constructor(pos) {
		this.pos = pos;
	}
	toString() {
		return "\\POS " + this.pos;
	}
};
// <command> ::= '\afterPOS' '{' <decor> '}' <pos>
AST.Command.AfterPos = class AST_Command_AfterPos {
	constructor(decor, pos) {
		this.decor = decor;
		this.pos = pos;
	}
	toString() {
		return "\\afterPOS{" + this.decor + "} " + this.pos;
	}
};
// <command> ::= '\drop' <object>
AST.Command.Drop = class AST_Command_Drop {
	constructor(object) {
		this.object = object;
	}
	toString() {
		return "\\drop " + this.object;
	}
};
// <command> ::= '\connect' <object>
AST.Command.Connect = class AST_Command_Connect {
	constructor(object) {
		this.object = object;
	}
	toString() {
		return "\\connect " + this.object;
	}
};
// <command> ::= '\relax'
AST.Command.Relax = class AST_Command_Relax {
	toString() {
		return "\\relax";
	}
};
// <command> ::= '\xyignore' '{' <pos> <decor> '}'
AST.Command.Ignore = class AST_Command_Ignore {
	constructor(pos, decor) {
		this.pos = pos;
		this.decor = decor;
	}
	toString() {
		return "\\ignore{" + this.pos + " " + this.decor + "}";
	}
};
// <command> ::= '\xyshowAST' '{' <pos> <decor> '}'
AST.Command.ShowAST = class AST_Command_ShowAST {
	constructor(pos, decor) {
		this.pos = pos;
		this.decor = decor;
	}
	toString() {
		return "\\xyshowAST{" + this.pos + " " + this.decor + "}";
	}
};

// <command> ::= '\PATH' <path>
AST.Command.Path = class AST_Command_Path {
	constructor(path) {
		this.path = path;
	}
	toString() {
		return "\\PATH " + this.path;
	}
};
// <command> ::= '\afterPATH' '{' <decor> '}' <path>
AST.Command.AfterPath = class AST_Command_AfterPath {
	constructor(decor, path) {
		this.decor = decor;
		this.path = path;
	}
	toString() {
		return "\\afterPATH{" + this.decor + "} " + this.path;
	}
};

// <path> ::= <path2>(Nil)
AST.Command.Path.Path = class AST_Command_Path_Path {
	constructor(pathElements) {
		this.pathElements = pathElements;
	}
	toString() {
		return this.pathElements.mkString("[", ", ", "]");
	}
};
// <path2> ::= '~' <action> '{' <pos> <decor> '}' <path2>(fc)
// <action> ::= '=' | '/'
AST.Command.Path.SetBeforeAction = class AST_Command_Path_SetBeforeAction {
	constructor(posDecor) {
		this.posDecor = posDecor;
	}
	toString() {
		return "~={" + this.posDecor + "}";
	}
};
AST.Command.Path.SetAfterAction = class AST_Command_Path_SetAfterAction {
	constructor(posDecor) {
		this.posDecor = posDecor;
	}
	toString() {
		return "~/{" + this.posDecor + "}";
	}
};
// <path2> ::= '~' <which> '{' <labels> '}' <path2>(fc)
// <which> ::= '<' | '>' | '+'
AST.Command.Path.AddLabelNextSegmentOnly = class AST_Command_Path_AddLabelNextSegmentOnly {
	constructor(labels) {
		this.labels = labels;
	}
	toString() {
		return "~<{" + this.labels + "}";
	}
};
AST.Command.Path.AddLabelLastSegmentOnly = class AST_Command_Path_AddLabelLastSegmentOnly {
	constructor(labels) {
		this.labels = labels;
	}
	toString() {
		return "~>{" + this.labels + "}";
	}
};
AST.Command.Path.AddLabelEverySegment = class AST_Command_Path_AddLabelEverySegment {
	constructor(labels) {
		this.labels = labels;
	}
	toString() {
		return "~+{" + this.labels + "}";
	}
};
// <path2> ::= "'" <segment> <path2>(fc)
AST.Command.Path.StraightSegment = class AST_Command_Path_StraightSegment {
	constructor(segment) {
		this.segment = segment;
	}
	toString() {
		return "'" + this.segment;
	}
};
// <path2> ::= '`' <turn> <segment> <path2>(fc)
AST.Command.Path.TurningSegment = class AST_Command_Path_TurningSegment {
	constructor(turn, segment) {
		this.turn = turn;
		this.segment = segment;
	}
	toString() {
		return "`" + this.turn + " " + this.segment;
	}
};
// <path2> ::= <segment>
AST.Command.Path.LastSegment = class AST_Command_Path_LastSegment {
	constructor(segment) {
		this.segment = segment;
	}
	toString() {
		return this.segment.toString();
	}
};

// <turn> ::= <diag> <turn-radius>
AST.Command.Path.Turn = class AST_Command_Path_Turn {};
AST.Command.Path.Turn.Diag = class AST_Command_Path_Turn_Diag {
	constructor(diag, radius) {
		this.diag = diag;
		this.radius = radius;
	}
	toString() {
		return this.diag.toString() + " " + this.radius;
	}
};
// <turn> ::= <cir> <turnradius>
AST.Command.Path.Turn.Cir = class AST_Command_Path_Turn_Cir {
	constructor(cir, radius) {
		this.cir = cir;
		this.radius = radius;
	}
	toString() {
		return this.cir.toString() + " " + this.radius;
	}
};
// <turn-radius> ::= <empty> | '/' <dimen>
AST.Command.Path.TurnRadius = class AST_Command_Path_TurnRadius {};
AST.Command.Path.TurnRadius.Default = class AST_Command_Path_TurnRadius_Default {
	toString() {
		return "";
	}
};
AST.Command.Path.TurnRadius.Dimen = class AST_Command_Path_TurnRadius_Dimen {
	constructor(dimen) {
		this.dimen = dimen;
	}
	toString() {
		return "/" + this.dimen;
	}
};

// <segment> ::= <nonempty-pos> <slide> <labels>
AST.Command.Path.Segment = class AST_Command_Path_Segment {
	constructor(pos, slide, labels) {
		this.pos = pos;
		this.slide = slide;
		this.labels = labels;
	}
	toString() {
		return this.pos.toString() + " " + this.slide + " " + this.labels;
	}
};

// <labels> ::= <label>*
AST.Command.Path.Labels = class AST_Command_Path_Labels {
	constructor(labels) {
		this.labels = labels;
	}
	toString() {
		return this.labels.mkString(" ");
	}
};
// <label> ::= '^' <anchor> <it> <alias>?
// <anchor> ::= '-' | <place>
// <it> ::= ( '[' <shape> ']' )* <it2>
// <it2> ::= <digit> | <letter>
//       |   '{' <text> '}'
//       |   '*' <object>
//       |   '@' <dir>
AST.Command.Path.Label = class AST_Command_Path_Label {
	constructor(anchor, it, aliasOption) {
		this.anchor = anchor;
		this.it = it;
		this.aliasOption = aliasOption;
	}
};
AST.Command.Path.Label.Above = class AST_Command_Path_Label_Above extends AST.Command.Path.Label {
	constructor(anchor, it, aliasOption) {
		super(anchor, it, aliasOption);
	}
	toString() {
		return "^(" + this.anchor + " " + this.it + " " + this.aliasOption + ")";
	}
};
// <label> ::= '_' <anchor> <it> <alias>?
AST.Command.Path.Label.Below = class AST_Command_Path_Label_Below extends AST.Command.Path.Label {
	constructor(anchor, it, aliasOption) {
		super(anchor, it, aliasOption);
	}
	toString() {
		return "_(" + this.anchor + " " + this.it + " " + this.aliasOption + ")";
	}
};
// <label> ::= '|' <anchor> <it> <alias>?
AST.Command.Path.Label.At = class AST_Command_Path_Label_At extends AST.Command.Path.Label {
	constructor(anchor, it, aliasOption) {
		super(anchor, it, aliasOption);
	}
	toString() {
		return "|(" + this.anchor + " " + this.it + " " + this.aliasOption + ")";
	}
};

// <command> ::= '\ar' ( <arrow_form> )* <path>
AST.Command.Ar = class AST_Command_Ar {
	constructor(forms, path) {
		this.forms = forms;
		this.path = path;
	}
	toString() {
		return "\\ar " + this.forms.mkString(" ") + " " + this.path;
	}
};

// <arrow_form>
AST.Command.Ar.Form = class AST_Command_Ar_Form {};
// <arrow_form> ::= '@' <variant> ( '{' <tip> ( <conn> <tip> )? '}' )?
// <variant> ::= /[^_0123]/ | <empty>
AST.Command.Ar.Form.BuildArrow = class AST_Command_Ar_Form_BuildArrow extends AST.Command.Ar.Form {
	/**
	 * @param {String} variant variant
	 * @param {AST.Command.Ar.Form.Tip.*} tailTip arrow tail
	 * @param {AST.Command.Ar.Form.Conn.*} stemConn arrow stem
	 * @param {AST.Command.Ar.Form.Tip.*} headTip arrow head
	 */
	constructor(variant, tailTip, stemConn, headTip) {
		super();
		this.variant = variant;
		this.tailTip = tailTip;
		this.stemConn = stemConn;
		this.headTip = headTip;
	}
	toString() {
		return "@" + this.variant + "{" + this.tailTip.toString() + ", " + this.stemConn.toString() + ", " + this.headTip.toString() + "}";
	}
};
// <arrow_form> ::= '@' <variant>
AST.Command.Ar.Form.ChangeVariant = class AST_Command_Ar_Form_ChangeVariant extends AST.Command.Ar.Form {
	/**
	 * @param {String} variant variant
	 */
	constructor(variant) {
		super();
		this.variant = variant;
	}
	toString() {
		return "@" + this.variant;
	}
};
// <tip> ::= /[<>()|'`+/a-zA-Z ]+/
//         | <arrow_dir>
//         | <empty>
// <arrow_dir> ::= '*' <object>
//               | <dir>
AST.Command.Ar.Form.Tip = class AST_Command_Ar_Form_Tip {};
AST.Command.Ar.Form.Tip.Tipchars = class AST_Command_Ar_Form_Tip_Tipchars {
	/**
	 * @param {String} tipchars tip characters
	 */
	constructor(tipchars) {
		this.tipchars = tipchars;
	}
	toString() {
		return this.tipchars;
	}
};
AST.Command.Ar.Form.Tip.Object = class AST_Command_Ar_Form_Tip_Object {
	/**
	 * @param {AST.Object} object object as a dir
	 */
	constructor(object) {
		this.object = object;
	}
	toString() {
		return "*" + this.object;
	}
};
AST.Command.Ar.Form.Tip.Dir = class AST_Command_Ar_Form_Tip_Dir {
	/**
	 * @param {AST.ObjectBox.Dir} dir dir
	 */
	constructor(dir) {
		this.dir = dir;
	}
	toString() {
		return this.dir;
	}
};

// <conn> ::= /[\-\.~=:]+/
//          | <arrow_dir>
//          | <empty>
AST.Command.Ar.Form.Conn = class AST_Command_Ar_Form_Conn {};
AST.Command.Ar.Form.Conn.Connchars = class AST_Command_Ar_Form_Conn_Connchars {
	/**
	 * @param {String} connchars direction name
	 */
	constructor(connchars) {
		this.connchars = connchars;
	}
	toString() {
		return this.connchars;
	}
};
AST.Command.Ar.Form.Conn.Object = class AST_Command_Ar_Form_Conn_Object {
	/**
	 * @param {AST.Object} object object as a dir
	 */
	constructor(object) {
		this.object = object;
	}
	toString() {
		return "*" + this.object;
	}
};
AST.Command.Ar.Form.Conn.Dir = class AST_Command_Ar_Form_Conn_Dir {
	/**
	 * @param {AST.ObjectBox.Dir} dir dir
	 */
	constructor(dir) {
		this.dir = dir;
	}
	toString() {
		return this.dir;
	}
};

// <arrow_form> ::= '@' <conchar>
// <conchar> ::= /[\-\.~=:]/
AST.Command.Ar.Form.ChangeStem = class AST_Command_Ar_Form_ChangeStem {
	/**
	 * @param {String} connchar arrow stem name
	 */
	constructor(connchar) {
		this.connchar = connchar;
	}
	toString() {
		return "@" + this.connchar;
	}
};

// <arrow_form> ::= '@' '!'
AST.Command.Ar.Form.DashArrowStem = class AST_Command_Ar_Form_DashArrowStem {
	toString() {
		return "@!";
	}
};

// <arrow_form> ::= '@' '/' <direction> ( <loose-dimen> )? '/'
AST.Command.Ar.Form.CurveArrow = class AST_Command_Ar_Form_CurveArrow {
	/**
	 * @param {AST.Direction.*} curve direction 
	 * @param {String} dist curve distance (dimension)
	 */
	constructor(direction, dist) {
		this.direction = direction;
		this.dist = dist;
	}
	toString() {
		return "@/" + this.direction + " " + this.dist + "/";
	}
};

// <arrow_form> ::= '@' '(' <direction> ',' <direction> ')'
AST.Command.Ar.Form.CurveFitToDirection = class AST_Command_Ar_Form_CurveFitToDirection {
	/**
	 * @param {AST.Direction.*} out direction 
	 * @param {AST.Direction.*} in direction 
	 */
	constructor(outDirection, inDirection) {
		this.outDirection = outDirection;
		this.inDirection = inDirection;
	}
	toString() {
		return "@(" + this.outDirection + "," + this.inDirection + ")";
	}
};

// <arrow_form> ::= '@' '`' <coord>
AST.Command.Ar.Form.CurveWithControlPoints = class AST_Command_Ar_Form_CurveWithControlPoints {
	/**
	 * @param {AST.Coord} controlPoints
	 */
	constructor(coord) {
		this.coord = coord;
	}
	toString() {
		return "@`{" + this.coord + "}"
	}
};

// <arrow_form> ::= '@' '[' <shape> ']'
AST.Command.Ar.Form.AddShape = class AST_Command_Ar_Form_AddShape {
	/**
	 * @param {AST.Modifier.Shape.*} shape shape
	 */
	constructor(shape) {
		this.shape = shape;
	}
	toString() {
		return "@[" + this.shape + "]";
	}
};

// <arrow_form> ::= '@' '*' '{' ( <modifier> )* '}'
AST.Command.Ar.Form.AddModifiers = class AST_Command_Ar_Form_AddModifiers {
	/**
	 * @param {List[AST.Modifier.*]} modifiers modifiers
	 */
	constructor(modifiers) {
		this.modifiers = modifiers;
	}
	toString() {
		return "@*{" + this.modifiers.mkString(" ") + "}";
	}
};

// <arrow_form> ::= '@' '<' <dimen> '>'
AST.Command.Ar.Form.Slide = class AST_Command_Ar_Form_Slide {
	/**
	 * @param {String} slide dimension
	 */
	constructor(slideDimen) {
		this.slideDimen = slideDimen;
	}
	toString() {
		return "@<" + this.slideDimen + ">";
	}
};

// <arrow_form> ::= '|' <anchor> <it>
AST.Command.Ar.Form.LabelAt = class AST_Command_Ar_Form_LabelAt {
	/**
	 * @param {AST.Place} anchor label anchor
	 * @param {AST.Object} it label
	 */
	constructor(anchor, it) {
		this.anchor = anchor;
		this.it = it;
	}
	toString() {
		return "|" + this.anchor + " " + this.it;
	}
};

// <arrow_form> ::= '^' <anchor> <it>
AST.Command.Ar.Form.LabelAbove = class AST_Command_Ar_Form_LabelAbove {
	/**
	 * @param {AST.Place} anchor label anchor
	 * @param {AST.Object} it label
	 */
	constructor(anchor, it) {
		this.anchor = anchor;
		this.it = it;
	}
	toString() {
		return "^" + this.anchor + " " + this.it;
	}
};

// <arrow_form> ::= '_' <anchor> <it>
AST.Command.Ar.Form.LabelBelow = class AST_Command_Ar_Form_LabelBelow {
	/**
	 * @param {AST.Place} anchor label anchor
	 * @param {AST.Object} it label
	 */
	constructor(anchor, it) {
		this.anchor = anchor;
		this.it = it;
	}
	toString() {
		return "_" + this.anchor + " " + this.it;
	}
};

// <arrow_form> ::= '@' '?'
AST.Command.Ar.Form.ReverseAboveAndBelow = class AST_Command_Ar_Form_ReverseAboveAndBelow {
	toString() {
		return "@?";
	}
};


// <decor> ::= '\xymatrix' <xymatrix>
// <xymatrix> ::= <setup> '{' <rows> '}'
AST.Command.Xymatrix = class AST_Command_Xymatrix {
	/**
	 * @param {List[AST.Command.Xymatrix.Setup.*]} setup setup configurations
	 * @param {List[AST.Command.Xymatrix.Row]} rows rows
	 */
	constructor(setup, rows) {
		this.setup = setup;
		this.rows = rows;
	}
	toString() {
		return "\\xymatrix" + this.setup + "{\n" + this.rows.mkString("", "\\\\\n", "") + "\n}";
	}
};
// <setup> ::= <switch>*
AST.Command.Xymatrix.Setup = class AST_Command_Xymatrix_Setup {};

// <switch> ::= '"' <prefix> '"'
AST.Command.Xymatrix.Setup.Prefix = class AST_Command_Xymatrix_Setup_Prefix {
	/**
	 * @param {String} prefix name of the xymatrix
	 */
	constructor(prefix) {
		this.prefix = prefix;
	}
	toString() {
		return '"' + this.prefix + '"';
	}
};

// <switch> ::= '@' <rcchar> <add op> <dimen>
AST.Command.Xymatrix.Setup.ChangeSpacing = class AST_Command_Xymatrix_Setup_ChangeSpacing {
	/**
	 * @param {AST.Modifier.AddOp.*} addop sizing operator
	 * @param {String} dimen size
	 */
	constructor(addop, dimen) {
		this.addop = addop;
		this.dimen = dimen;
	}
};
AST.Command.Xymatrix.Setup.ChangeSpacing.Row = class AST_Command_Xymatrix_Setup_ChangeSpacing_Row extends AST.Command.Xymatrix.Setup.ChangeSpacing {
	constructor(addop, dimen) {
		super(addop, dimen);
	}
	toString() {
		return "@R" + this.addop + this.dimen;
	}
};
AST.Command.Xymatrix.Setup.ChangeSpacing.Column = class AST_Command_Xymatrix_Setup_ChangeSpacing_Column extends AST.Command.Xymatrix.Setup.ChangeSpacing {
	constructor(addop, dimen) {
		super(addop, dimen);
	}
	toString() {
		return "@C" + this.addop + this.dimen;
	}
};
AST.Command.Xymatrix.Setup.ChangeSpacing.RowAndColumn = class AST_Command_Xymatrix_Setup_ChangeSpacing_RowAndColumn extends AST.Command.Xymatrix.Setup.ChangeSpacing {
	constructor(addop, dimen) {
		super(addop, dimen);
	}
	toString() {
		return "@" + this.addop + this.dimen;
	}
};

// <switch> ::= '@' '!' <rcchar> '0'
// <switch> ::= '@' '!' <rcchar> '=' <dimen>
// <rcchar> ::= 'R' | 'C' | <empty>
AST.Command.Xymatrix.Setup.PretendEntrySize = class AST_Command_Xymatrix_Setup_PretendEntrySize {
	/**
	 * @param {String} dimen size
	 */
	constructor(dimen) {
		this.dimen = dimen;
	}
};
AST.Command.Xymatrix.Setup.PretendEntrySize.Height = class AST_Command_Xymatrix_Setup_PretendEntrySize_Height extends AST.Command.Xymatrix.Setup.PretendEntrySize {
	constructor(dimen) {
		super(dimen);
	}
	toString() {
		return "@!R=" + this.dimen;
	}
};
AST.Command.Xymatrix.Setup.PretendEntrySize.Width = class AST_Command_Xymatrix_Setup_PretendEntrySize_Width extends AST.Command.Xymatrix.Setup.PretendEntrySize {
	constructor(dimen) {
		super(dimen);
	}
	toString() {
		return "@!C=" + this.dimen;
	}
};
AST.Command.Xymatrix.Setup.PretendEntrySize.HeightAndWidth = class AST_Command_Xymatrix_Setup_PretendEntrySize_HeightAndWidth extends AST.Command.Xymatrix.Setup.PretendEntrySize {
	constructor(dimen) {
		super(dimen);
	}
	toString() {
		return "@!=" + this.dimen;
	}
};

// <switch> ::= '@' '!' <rcchar>
AST.Command.Xymatrix.Setup.FixGrid = class AST_Command_Xymatrix_Setup_FixGrid {};
AST.Command.Xymatrix.Setup.FixGrid.Row = class AST_Command_Xymatrix_Setup_FixGrid_Row extends AST.Command.Xymatrix.Setup.FixGrid {
	constructor() {
		super();
	}
	toString() {
		return "@!R";
	}
};
AST.Command.Xymatrix.Setup.FixGrid.Column = class AST_Command_Xymatrix_Setup_FixGrid_Column extends AST.Command.Xymatrix.Setup.FixGrid {
	constructor() {
		super();
	}
	toString() {
		return "@!C";
	}
};
AST.Command.Xymatrix.Setup.FixGrid.RowAndColumn = class AST_Command_Xymatrix_Setup_FixGrid_RowAndColumn extends AST.Command.Xymatrix.Setup.FixGrid {
	constructor() {
		super();
	}
	toString() {
		return "@!";
	}
};

// <switch> ::= '@' ( 'M' | 'W' | 'H' ) <add op> <dimen>
// <switch> ::= '@' '1'
AST.Command.Xymatrix.Setup.AdjustEntrySize = class AST_Command_Xymatrix_Setup_AdjustEntrySize {
	/**
	 * @param {AST.Modifier.AddOp.*} addop sizing operator
	 * @param {String} dimen size
	 */
	constructor(addop, dimen) {
		this.addop = addop;
		this.dimen = dimen;
	}
};
AST.Command.Xymatrix.Setup.AdjustEntrySize.Margin = class AST_Command_Xymatrix_Setup_AdjustEntrySize_Margin extends AST.Command.Xymatrix.Setup.AdjustEntrySize {
	constructor(addop, dimen) {
		super(addop, dimen);
	}
	toString() {
		return "@M" + this.addop + this.dimen;
	}
};
AST.Command.Xymatrix.Setup.AdjustEntrySize.Width = class AST_Command_Xymatrix_Setup_AdjustEntrySize_Width extends AST.Command.Xymatrix.Setup.AdjustEntrySize {
	constructor(addop, dimen) {
		super(addop, dimen);
	}
	toString() {
		return "@W" + this.addop + this.dimen;
	}
};
AST.Command.Xymatrix.Setup.AdjustEntrySize.Height = class AST_Command_Xymatrix_Setup_AdjustEntrySize_Height extends AST.Command.Xymatrix.Setup.AdjustEntrySize {
	constructor(addop, dimen) {
		super(addop, dimen);
	}
	toString() {
		return "@H" + this.addop + this.dimen;
	}
};

// <switch> ::= '@' 'L' <add op> <dimen>
AST.Command.Xymatrix.Setup.AdjustLabelSep = class AST_Command_Xymatrix_Setup_AdjustLabelSep {
	/**
	 * @param {AST.Modifier.AddOp.*} addop sizing operator
	 * @param {String} dimen size
	 */
	constructor(addop, dimen) {
		this.addop = addop;
		this.dimen = dimen;
	}
	toString() {
		return "@L" + this.addop + this.dimen;
	}
};

// <switch> ::= '@' <nonemptyDirection>
AST.Command.Xymatrix.Setup.SetOrientation = class AST_Command_Xymatrix_Setup_SetOrientation {
	/**
	 * @param {AST.Direction} direction the orientation of the row
	 */
	constructor(direction) {
		this.direction = direction;
	}
	toString() {
		return "@" + this.direction;
	}
};

// <switch> ::= '@' '*' '[' <shape> ']'
//          |   '@' '*' <add op> <size>
AST.Command.Xymatrix.Setup.AddModifier = class AST_Command_Xymatrix_Setup_AddModifier {
	/**
	 * @param {AST.Modifier.*} shape  object shape modifier for all entries
	 */
	constructor(modifier) {
		this.modifier = modifier;
	}
	toString() {
		return "@*" + this.modifier;
	}
};

// <rows> ::= <row> ( '\\' <row> )*
// <row> ::= <entry> ( '&' <entry> )*
AST.Command.Xymatrix.Row = class AST_Command_Xymatrix_Row {
	/**
	 * @param {List[AST.Command.Xymatrix.Entry.*]} entries entries in the row
	 */
	constructor(entries) {
		this.entries = entries;
	}
	toString() {
		return this.entries.mkString(" & ");
	}
};
// <entry> ::= ( '**' '[' <shape> ']' | '**' '{' <modifier>* '}' )* <loose objectbox> <decor>
//         |   '*' <object> <pos> <decor>
// <loose objectbox> ::= <objectbox>
//                   |   /[^\\{}&]+/* ( ( '\' not( '\' | <decor command names> ) ( '{' | '}' | '&' ) | '{' <text> '}' ) /[^\\{}&]+/* )*
// <decor command names> ::= 'ar' | 'xymatrix' | 'PATH' | 'afterPATH'
//                       |   'save' | 'restore' | 'POS' | 'afterPOS' | 'drop' | 'connect' | 'xyignore'
AST.Command.Xymatrix.Entry = class AST_Command_Xymatrix_Entry {};
AST.Command.Xymatrix.Entry.SimpleEntry = class AST_Command_Xymatrix_Entry_SimpleEntry extends AST.Command.Xymatrix.Entry {
	/**
	 * @param {List[AST.Modifier.*]} modifiers object modifiers
	 * @param {AST.ObjectBox.*} objectbox entry objectbox
	 * @param {AST.Decor} decor decoration
	 */
	constructor(modifiers, objectbox, decor) {
		super();
		this.modifiers = modifiers;
		this.objectbox = objectbox;
		this.decor = decor;
	}

	get isEmpty() {
		return false;
	}

	toString() {
		return this.modifiers.mkString("**{", "", "}") + " " + this.objectbox + " " + this.decor;
	}
};
AST.Command.Xymatrix.Entry.ObjectEntry = class AST_Command_Xymatrix_Entry_ObjectEntry extends AST.Command.Xymatrix.Entry {
	/**
	 * @param {AST.Object} object entry object
	 * @param {AST.Pos.Coord} pos position (ignorable)
	 * @param {AST.Decor} decor decoration
	 */
	constructor(object, pos, decor) {
		super();
		this.object = object;
		this.pos = pos;
		this.decor = decor;
	}

	get isEmpty() {
		return false;
	}

	toString() {
		return "*" + this.object + " " + this.pos + " " + this.decor;
	}
};
AST.Command.Xymatrix.Entry.EmptyEntry = class AST_Command_Xymatrix_Entry_EmptyEntry extends AST.Command.Xymatrix.Entry {
	/**
	 * @param {AST.Decor} decor decoration
	 */
	constructor(decor) {
		super();
		this.decor = decor;
	}

	get isEmpty() {
		return true;
	}

	toString() {
		return "" + this.decor;
	}
};

// <command> ::= <twocell> <twocell switch>* <twocell arrow>
AST.Command.Twocell = class AST_Command_Twocell {
	/**
	 * @param {AST.Command.Twocell.Hops2cell} twocell 2-cell
	 * @param {List[AST.Command.Twocell.Switch.*]} switches switches
	 * @param {AST.Command.Twocell.Arrow.*} arrow
	 */
	constructor(twocell, switches, arrow) {
		this.twocell = twocell;
		this.switches = switches;
		this.arrow = arrow;
	}
	toString() {
		return this.twocell.toString() + this.switches.mkString("") + this.arrow;
	}
};
// <twocell> ::= '\' /[lrud]+/ 'twocell'
//           |   '\xtwocell' '[' /[lrud]+/ ']' '{' <text> '}'
AST.Command.Twocell.Hops2cell = class AST_Command_Twocell_Hops2cell {
	/**
	 * @param {String} hops hops
	 * @param {Option[AST.Object]} maybeDisplace displacement
	 */
	constructor(hops, maybeDisplace) {
		this.hops = hops;
		this.maybeDisplace = maybeDisplace;
	}
};
AST.Command.Twocell.Twocell = class AST_Command_Twocell_Twocell extends AST.Command.Twocell.Hops2cell {
	constructor(hops, maybeDisplace) {
		super(hops, maybeDisplace);
	}
	toString() {
		return "\\xtwocell[" + this.hops + "]" + this.maybeDisplace.getOrElse("{}");
	}
};
//           |   '\' /[lrud]+/ 'uppertwocell'
//           |   '\xuppertwocell' '[' /[lrud]+/ ']' '{' <text> '}'
AST.Command.Twocell.UpperTwocell = class AST_Command_Twocell_UpperTwocell extends AST.Command.Twocell.Hops2cell {
	constructor(hops, maybeDisplace) {
		super(hops, maybeDisplace);
	}
	toString() {
		return "\\xuppertwocell[" + this.hops + "]" + this.maybeDisplace.getOrElse("{}");
	}
};
//           |   '\' /[lrud]+/ 'lowertwocell'
//           |   '\xlowertwocell' '[' /[lrud]+/ ']' '{' <text> '}'
AST.Command.Twocell.LowerTwocell = class AST_Command_Twocell_LowerTwocell extends AST.Command.Twocell.Hops2cell {
	constructor(hops, maybeDisplace) {
		super(hops, maybeDisplace);
	}
	toString() {
		return "\\xlowertwocell[" + this.hops + "]" + this.maybeDisplace.getOrElse("{}");
	}
};
//           |   '\' /[lrud]+/ 'compositemap'
//           |   '\xcompositemap' '[' /[lrud]+/ ']' '{' <text> '}'
AST.Command.Twocell.CompositeMap = class AST_Command_Twocell_CompositeMap extends AST.Command.Twocell.Hops2cell {
	constructor(hops, maybeDisplace) {
		super(hops, maybeDisplace);
	}
	toString() {
		return "\\xcompositemap[" + this.hops + "]" + this.maybeDisplace.getOrElse("{}");
	}
};

// <twocell switch> ::= '^' <twocell label>
AST.Command.Twocell.Switch = class AST_Command_Twocell_Switch {};
AST.Command.Twocell.Switch.UpperLabel = class AST_Command_Twocell_Switch_UpperLabel {
	/**
	 * @param {AST.Command.Twocell.Label} label label
	 */
	constructor(label) {
		this.label = label;
	}
	toString() {
		return "^" + this.label;
	}
};
//          |   '_' <twocell label>
AST.Command.Twocell.Switch.LowerLabel = class AST_Command_Twocell_Switch_LowerLabel {
	/**
	 * @param {AST.Command.Twocell.Label} label label
	 */
	constructor(label) {
		this.label = label;
	}
	toString() {
		return "_" + this.label;
	}
};
//          |   <nudge>
AST.Command.Twocell.Switch.SetCurvature = class AST_Command_Twocell_Switch_SetCurvature {
	/**
	 * @param {AST.Command.Twocell.Nudge.*} nudge
	 */
	constructor(nudge) {
		this.nudge = nudge;
	}
	toString() {
		return this.nudge.toString();
	}
};
//          |   '\omit'
AST.Command.Twocell.Switch.DoNotSetCurvedArrows = class AST_Command_Twocell_Switch_DoNotSetCurvedArrows {
	toString() {
		return "\\omit";
	}
};
//          |   '~!'
AST.Command.Twocell.Switch.PlaceModMapObject = class AST_Command_Twocell_Switch_PlaceModMapObject {
	toString() {
		return "~!";
	}
};

//          |   '~' ( '`' | "'" ) '{' <object> '}'
AST.Command.Twocell.Switch.ChangeHeadTailObject = class AST_Command_Twocell_Switch_ChangeHeadTailObject {
	/**
	 * @param {String} what
	 * @param {AST.Object} object
	 */
	constructor(what, object) {
		this.what = what;
		this.object = object;
	}
	toString() {
		return "~" + this.what + "{" + this.object + "}";
	}
};

//          |   '~' ( '' | '^' | '_' ) '{' <object> ( '~**' <object> )? '}'
AST.Command.Twocell.Switch.ChangeCurveObject = class AST_Command_Twocell_Switch_ChangeCurveObject {
	/**
	 * @param {String} what
	 * @param {AST.Object} spacer
	 * @param {AST.Object} maybeObject
	 */
	constructor(what, spacer, maybeObject) {
		this.what = what;
		this.spacer = spacer;
		this.maybeObject = maybeObject;
	}
	toString() {
		return "~" + this.what + "{" + this.spacer + (this.maybeObject.isDefined? "~**" + this.maybeObject.get : "") + "}";
	}
};

// <twocell label> ::= <digit> | <letter> | <cs>
//                 |   '{' <nudge>? '*' <object> '}'
//                 |   '{' <nudge>? <text> '}'
AST.Command.Twocell.Label = class AST_Command_Twocell_Label {
	/**
	 * @param {Option[AST.Command.Twocell.Nudge.*]} maybeNudge
	 * @param {AST.Object} labelObject
	 */
	constructor(maybeNudge, labelObject) {
		this.maybeNudge = maybeNudge;
		this.labelObject = labelObject;
	}
	toString() {
		return this.maybeNudge.toString() + this.labelObject;
	}
};

// <nudge> ::= '<' <factor> '>'
//         |   '<\omit>'
AST.Command.Twocell.Nudge = class AST_Command_Twocell_Nudge {};
AST.Command.Twocell.Nudge.Number = class AST_Command_Twocell_Nudge_Number extends AST.Command.Twocell.Nudge {
	/**
	 * @param {Number} number number
	 */
	constructor(number) {
		super();
		this.number = number;
	}
	toString() {
		return "<" + this.number + ">";
	}
};
AST.Command.Twocell.Nudge.Omit = class AST_Command_Twocell_Nudge_Omit extends AST.Command.Twocell.Nudge {
	constructor() {
		super();
	}
	toString() {
		return "<\\omit>";
	}
};

// <twocell arrow> ::= '{' <twocell tok> (<twocell label entry> '}'
//                 |   '{' <twocell label entry> '}'
//                 |   <empty>
// <twocell tok> ::= '^' | '_' | '='
//               |   '\omit'
//               |   '`' | "'" | '"' | '!'
// <twocell label entry> ::= '*' <object>
//                       |   <text>
AST.Command.Twocell.Arrow = class AST_Command_Twocell_Arrow {};
AST.Command.Twocell.Arrow.WithOrientation = class AST_Command_Twocell_Arrow_WithOrientation extends AST.Command.Twocell.Arrow {
	/**
	 * @param {String} tok
	 * @param {AST.Object} labelObject
	 */
	constructor(tok, labelObject) {
		super();
		this.tok = tok;
		this.labelObject = labelObject;
	}
	toString() {
		return "{[" + this.tok + "] " + this.labelObject + "}";
	}
};
//                 |   '{' <nudge> <twocell label entry> '}'
AST.Command.Twocell.Arrow.WithPosition = class AST_Command_Twocell_Arrow_WithPosition extends AST.Command.Twocell.Arrow {
	/**
	 * @param {AST.Command.Twocell.Nudge.*} nudge
	 * @param {AST.Object} labelObject
	 */
	constructor(nudge, labelObject) {
		super();
		this.nudge = nudge;
		this.labelObject = labelObject;
	}
	toString() {
		return "{[" + this.nudge + "] " + this.labelObject + "}";
	}
};

// '\newdir' '{' <main> '}' '{' <composite_object> '}'
AST.Command.Newdir = class AST_Command_Newdir {
	/**
	 * @param {String} dirMain
	 * @param {AST.ObjectBox.CompositeObject} compositeObject
	 */
	constructor(dirMain, compositeObject) {
		this.dirMain = dirMain;
		this.compositeObject = compositeObject;
	}
	toString() {
		return "\\newdir{" + this.dirMain + "}{" + this.compositeObject + "}";
	}
};

// '\xyimport' '(' <factor> ',' <factor> ')' ( '(' <factor> ',' <factor> ')' )? '{' <TeX command> '}'
AST.Pos.Xyimport = class AST_Pos_Xyimport {};
AST.Pos.Xyimport.TeXCommand = class AST_Pos_Xyimport_TeXCommand extends AST.Pos.Xyimport {
	/**
	 * @param {Number} width the width of the graphics in the coordinate system
	 * @param {Number} height the height of the graphics in the coordinate system
	 * @param {Number} xOffset the distance of the origin of coordinates from left corner
	 * @param {Number} yOffset the distance of the origin of coordinates from bottom corner
	 * @param {AST.Command.*} graphics object
	 */
	constructor(width, height, xOffset, yOffset, graphics) {
		super();
		this.width = width;
		this.height = height;
		this.xOffset = xOffset;
		this.yOffset = yOffset;
		this.graphics = graphics;
	}
	toString() {
		return "\\xyimport(" + this.width + ", " + this.height + ")(" + this.xOffset + ", " + this.yOffset + "){" + this.graphics + "}";
	}
};

// '\xyimport' '(' <factor> ',' <factor> ')' ( '(' <factor> ',' <factor> ')' )? '{' <include graphics> '}'
AST.Pos.Xyimport.Graphics = class AST_Pos_Xyimport_Graphics extends AST.Pos.Xyimport {
	/**
	 * @param {Number} width the width of the graphics in the coordinate system
	 * @param {Number} height the height of the graphics in the coordinate system
	 * @param {Number} xOffset the distance of the origin of coordinates from left corner
	 * @param {Number} yOffset the distance of the origin of coordinates from bottom corner
	 * @param {AST.Command.Includegraphics} graphics object
	 */
	constructor(width, height, xOffset, yOffset, graphics) {
		super();
		this.width = width;
		this.height = height;
		this.xOffset = xOffset;
		this.yOffset = yOffset;
		this.graphics = graphics;
	}
	toString() {
		return "\\xyimport(" + this.width + ", " + this.height + ")(" + this.xOffset + ", " + this.yOffset + "){" + this.graphics + "}";
	}
};

/* \includegraphics command from the graphicx package */
// '\includegraphics' '*'? '[' ( <includegraphics attr key val> ( ',' <includegraphics attr key val> )* )? ']' '{' <file path> '}'
AST.Command.Includegraphics = class AST_Command_Includegraphics {
	/**
	 * @param {boolean} isClipped whether the graphics is clipped to the size specified or not
	 * @param {List[AST.Command.Includegraphics.Attr]} attributeList attribute key-value list
	 * @param {String} filepath image file path
	 */
	constructor(isClipped, attributeList, filepath) {
		this.isClipped = isClipped;
		this.attributeList = attributeList;
		this.filepath = filepath;
	}

	get isIncludegraphics() {
		return true;
	}

	toString() {
		return "\\includegraphics" + (this.isClipped? "*" : "") + this.attributeList.mkString("[", ",", "]") + "{" + this.filepath + "}";
	}
};

// TODO: define <includegraphics attr key val>
// <includegraphics attr key val> := 'width' '=' <dimen>
//                                |  'height' '=' <dimen>
AST.Command.Includegraphics.Attr = class AST_Command_Includegraphics_Attr {};
AST.Command.Includegraphics.Attr.Width = class AST_Command_Includegraphics_Attr_Width extends AST.Command.Includegraphics.Attr {
	/**
	 * @param {String} dimen 
	 */
	constructor(dimen) {
		super();
		this.dimen = dimen;
	}
	toString() {
		return "width=" + this.dimen;
	}
};
AST.Command.Includegraphics.Attr.Height = class AST_Command_Includegraphics_Attr_Height extends AST.Command.Includegraphics.Attr {
	/**
	 * @param {String} dimen 
	 */
	constructor(dimen) {
		super();
		this.dimen = dimen;
	}
	toString() {
		return "height=" + this.dimen;
	}
};

