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


import TexError from "../../mathjax/js/input/tex/TexError.js";

import {XypicConstants} from "../util/XypicConstants.js";
import {xypicGlobalContext} from "../core/xypicGlobalContext.js";
import {XypicUtil} from "../util/XypicUtil.js";
import {List} from "../fp/List.js";
import {Range} from "../fp/Range.js";
import {DrawingContext} from "./DrawingContext.js";
import {Frame} from "./Frames.js";
import {Shape} from "./Shapes.js";


export class Env {
	constructor() {
		var onemm = xypicGlobalContext.measure.length2em("1mm");
		this.origin = {x:0, y:0};
		this.xBase = {x:onemm, y:0};
		this.yBase = {x:0, y:onemm};
		this.savedPosition = {};
		this.stateStack = List.empty;
		this.stackFrames = List.empty;
		this.stack = List.empty;
		this.angle = 0; // radian
		this.lastCurve = LastCurve.none;
		this.p = this.c = Env.originPosition;
		this.shouldCapturePos = false;
		this.capturedPositions = List.empty;
		this.objectmargin = xypicGlobalContext.measure.objectmargin;
		this.objectheight = xypicGlobalContext.measure.objectheight;
		this.objectwidth = xypicGlobalContext.measure.objectwidth;
		this.labelmargin = xypicGlobalContext.measure.labelmargin;
	}

	duplicate() {
		var newEnv = new Env();
		Env.copyFields(this, newEnv);
		return newEnv;
	}

	saveState() {
		var currentState = this.duplicate();
		this.stateStack = this.stateStack.prepend(currentState);
	}

	restoreState() {
		if (!this.stateStack.isEmpty) {
			var savedState = this.stateStack.head;
			this.stateStack = this.stateStack.tail;
			Env.copyFields(savedState, this);
		}
	}

	absVector(x, y) {
		var ax = this.origin.x + x * this.xBase.x + y * this.yBase.x;
		var ay = this.origin.y + x * this.xBase.y + y * this.yBase.y;
		return {x:ax, y:ay};
	}

	inverseAbsVector(ax, ay) {
		var bxx = this.xBase.x;
		var bxy = this.xBase.y;
		var byx = this.yBase.x;
		var byy = this.yBase.y;
		var det = bxx * byy - bxy * byx;
		var dx = ax - this.origin.x;
		var dy = ay - this.origin.y
		var x = (byy * dx - byx * dy) / det;
		var y = (-bxy * dx + bxx * dy) / det;
		return {x:x, y:y};
	}

	setOrigin(x, y) {
		this.origin = {x:x, y:y};
	}

	setXBase(x, y) {
		this.xBase = {x:x, y:y};
	}

	setYBase(x, y) {
		this.yBase = {x:x, y:y};
	}

	swapPAndC() {
		var t = this.p;
		this.p = this.c;
		this.c = t;
	}

	enterStackFrame() {
		this.stackFrames = this.stackFrames.prepend(this.stack);
		this.initStack();
	}

	leaveStackFrame() {
		if (!this.stackFrames.isEmpty) {
			this.stack = this.stackFrames.head;
			this.stackFrames = this.stackFrames.tail;
		} else {
			this.initStack();
		} 
	}

	savePos(id, pos) {
		this.savedPosition[id] = pos;
	}

	startCapturePositions() {
		this.shouldCapturePos = true;
		this.capturedPositions = List.empty;
	}

	endCapturePositions() {
		this.shouldCapturePos = false;
		var positions = this.capturedPositions;
		this.capturedPositions = List.empty;
		return positions;
	}

	capturePosition(pos) {
		if (this.shouldCapturePos && pos !== undefined) {
			this.capturedPositions = this.capturedPositions.prepend(pos);
		}
	}

	pushPos(pos) {
		if (pos !== undefined) {
			this.stack = this.stack.prepend(pos);
		}
	}

	popPos() {
		if (this.stack.isEmpty) {
			throw new TexError("ExecutionError", "cannot pop from the empty stack");
		} else {
			var pos = this.stack.head;
			this.stack = this.stack.tail;
			return pos;
		}
	}

	initStack() {
		this.stack = List.empty;
	}

	setStack(positions) {
		this.stack = positions;
	}

	stackAt(number) {
		return this.stack.at(number);
	}

	lookupPos(id, errorMessage) {
		var pos = this.savedPosition[id];
		if (pos === undefined) {
			if (errorMessage !== undefined) {
				throw new TexError("ExecutionError", errorMessage);
			} else {
				throw new TexError("ExecutionError", '<pos> "' + id + '" not defined.');
			}
		} else {
			return pos;
		}
	}

	toString() {
		var savedPositionDesc = "";
		for (var id in this.savedPosition) {
			if (this.savedPosition.hasOwnProperty(id)) {
				if (savedPositionDesc.length > 0) {
					savedPositionDesc += ", "
				}
				savedPositionDesc += id.toString()+":"+this.savedPosition[id];
			}
		}
		return "Env\n  p:"+this.p+"\n  c:"+this.c+"\n  angle:"+this.angle+"\n  lastCurve:"+this.lastCurve+"\n  savedPosition:{"+savedPositionDesc+"}\n  origin:{x:"+this.origin.x+", y:"+this.origin.y+"}\n  xBase:{x:"+this.xBase.x+", y:"+this.xBase.y+"}\n  yBase:{x:"+this.yBase.x+", y:"+this.yBase.y+"}\n  stackFrames:"+this.stackFrames+"\n  stack:"+this.stack+"\n  shouldCapturePos:"+this.shouldCapturePos+"\n  capturedPositions:"+this.capturedPositions;
	}

	static copyFields(from, to) {
		for (var attr in from) {
			if (from.hasOwnProperty(attr)) {
				to[attr] = from[attr];
			}
		}
		to.savedPosition = {};
		for (var id in from.savedPosition) {
			if (from.savedPosition.hasOwnProperty(id)) {
				to.savedPosition[id] = from.savedPosition[id];
			}
		}
	}
}

Env.originPosition = new Frame.Point(0, 0);


export class Curve {
	constructor() {
	}

	velocity(t) {
		var dx = this.dpx(t);
		var dy = this.dpy(t);
		return Math.sqrt(dx*dx+dy*dy);
	}
	
	length(t) {
		if (t < 0 || t > 1) {
			throw new TexError("ExecutionError", "illegal cubic Bezier parameter t:"+t);
		}
		this.buildLengthArray();
		
		var n = XypicConstants.lengthResolution;
		var tn = t*n;
		var f = Math.floor(tn);
		var c = Math.ceil(tn);
		if (f === c) {
			return this.lengthArray[f];
		}
		var sf = this.lengthArray[f];
		var sc = this.lengthArray[c];
		return sf + (sc-sf)/(c-f)*(tn-f);  // linear interpolation 
	}
	
	tOfLength(s) {
		this.buildLengthArray();
		
		var a = this.lengthArray;
		if (s < a[0]) {
			return 0;
		} else if (s > a[a.length - 1]) {
			return 1;
		}
		
		var m, al, ah;
		var l = 0;
		var r = a.length-2;
		while (l <= r) {
			m = (l + r) >> 1;
			al = a[m];
			ah = a[m+1];
			if (s >= al && s <= ah) {
				break;
			}
			if (s < al) {
				r = m-1;
			} else {
				l = m+1;
			}
		}
		
		var n = XypicConstants.lengthResolution;
		if (al === ah) {
			return m/n;
		}
		var t = (m + (s-al)/(ah-al))/n;
		return t;
	}
	
	tOfShavedStart(frame) {
		if (frame.isPoint()) {
			return 0; // trivial
		}
		
		var ts = this.tOfIntersections(frame);
		if (ts.length == 0) {
			return undefined; // No solution.
		}
		return Math.min.apply(Math, ts);
	}
	
	tOfShavedEnd(frame) {
		if (frame.isPoint()) {
			return 1; // trivial
		}
		
		var ts = this.tOfIntersections(frame);
		if (ts.length == 0) {
			return undefined; // No solution.
		}
		return Math.max.apply(Math, ts);
	}
	
	shaveStart(frame) {
		if (frame.isPoint()) {
			return this; // trivial
		}
		
		var ts = this.tOfIntersections(frame);
		if (ts.length == 0) {
			return undefined; // No solution.
		}
		var t = Math.min.apply(Math, ts);
		return this.divide(t)[1];
	}
	
	shaveEnd(frame) {
		if (frame.isPoint()) {
			return this; // trivial
		}
		
		var ts = this.tOfIntersections(frame);
		if (ts.length == 0) {
			return undefined; // No solution.
		}
		var t = Math.max.apply(Math, ts);
		return this.divide(t)[0];
	}
	
	buildLengthArray() {
		if (this.lengthArray !== undefined) {
			return;
		}
		
		var n = XypicConstants.lengthResolution;
		// lengthArray[i]: \int_0^{t_{2i}} v(t) dt with Simpson's rule, (i=0, 1, \cdots, n)
		// where, t_k=k h, h=1/(2n): step length.
		var lengthArray = new Array(n+1);
		
		var sum = 0;
		var h = 1/2/n;
		var i = 0;
		var delta = h/3;
		lengthArray[0] = 0;
		sum = this.velocity(0) + 4*this.velocity(h);
		var lastv = this.velocity(2*h);
		lengthArray[1] = delta*(sum + lastv);
		for (i = 2; i <= n; i++) {
			sum += 2*lastv + 4*this.velocity((2*i-1)*h);
			lastv = this.velocity(2*i*h);
			lengthArray[i] = delta*(sum + lastv);
		}
		this.lengthArray = lengthArray;
	}
	
	drawParallelCurve(svg, vshift) {
		var i, n = this.countOfSegments() * XypicConstants.interpolationResolution;
		var ts = new Array(n+1);
		var x1s = new Array(n+1);
		var y1s = new Array(n+1);
		var x2s = new Array(n+1);
		var y2s = new Array(n+1);
		var hpi = Math.PI/2;
		var d = vshift;
		var t, angle, p, x, y, dc, ds;
		for (i = 0; i <= n; i++) {
			t = i/n;
			ts[i] = t;  // TODO: 高速化。ts[i+1]-ts[i]が定数の場合に特化した作りにする。
			angle = this.angle(t);
			p = this.position(t);
			x = p.x;
			y = p.y;
			dc = d*Math.cos(angle+hpi);
			ds = d*Math.sin(angle+hpi);
			x1s[i] = x+dc;
			y1s[i] = y+ds;
			x2s[i] = x-dc;
			y2s[i] = y-ds;
		}
		Curve.CubicBeziers.interpolation(ts, x1s, y1s).drawPrimitive(svg, "none");
		Curve.CubicBeziers.interpolation(ts, x2s, y2s).drawPrimitive(svg, "none");
	}
	
	drawParallelDottedCurve(svg, spacing, vshift) {
		var px = 1/xypicGlobalContext.measure.em, hpx = px/2;
		var sp = px + spacing;
		var len = this.length(1);
		var n = Math.floor((len-px)/sp);
		var d = vshift;
		if (n >= 0) {
			var i, hpi = Math.PI/2;
			var s = this.startPosition(), e = this.endPosition();
			for (i = 0; i <= n; i++) {
				var s = hpx + i*sp;
				// TODO: 高速化。毎回二分探索せず、端から線形探索・適用するようにする。
				var t = this.tOfLength(s);
				var angle = this.angle(t);
				var p = this.position(t);
				var x = p.x, y = p.y
				var dc = d*Math.cos(angle+hpi), ds = d*Math.sin(angle+hpi);
				svg.createSVGElement("circle", {
					cx:xypicGlobalContext.measure.em2px(x+dc), cy:-xypicGlobalContext.measure.em2px(y+ds), r:0.12,
					fill: "currentColor"
				});
				svg.createSVGElement("circle", {
					cx:xypicGlobalContext.measure.em2px(x-dc), cy:-xypicGlobalContext.measure.em2px(y-ds), r:0.12,
					fill: "currentColor"
				});
			}
		}
	}
	
	drawParallelDashedCurve(svg, dash, vshift) {
		var len = this.length(1);
		var n = Math.floor((len-dash)/(2*dash)), m = 2*n+1;
		var hshift = (len-dash)/2-n*dash;
		var i;
		var ts = new Array(n+1);
		var x1s = new Array(n+1);
		var y1s = new Array(n+1);
		var x2s = new Array(n+1);
		var y2s = new Array(n+1);
		var hpi = Math.PI/2;
		var d = vshift;
		var t, angle, p, x, y, dc, ds;
		for (i = 0; i <= m; i++) {
			// TODO: 高速化。毎回二分探索せず、端から線形探索・適用するようにする。
			t = this.tOfLength(hshift + i*dash);
			ts[i] = t;
			angle = this.angle(t);
			p = this.position(t);
			x = p.x;
			y = p.y;
			dc = d*Math.cos(angle+hpi);
			ds = d*Math.sin(angle+hpi);
			x1s[i] = x+dc;
			y1s[i] = y+ds;
			x2s[i] = x-dc;
			y2s[i] = y-ds;
		}
		Curve.CubicBeziers.interpolation(ts, x1s, y1s).drawSkipped(svg);
		Curve.CubicBeziers.interpolation(ts, x2s, y2s).drawSkipped(svg);
	}
	
	drawSquigCurve(svg, variant) {
		var thickness = xypicGlobalContext.measure.length2em("0.15em");
		var len = this.length(1);
		var wave = 4*thickness;
		var amp = thickness;
		if (len >= wave) {
			var n = Math.floor(len/wave);
			var shiftLen = (len-n*wave)/2;
			
			var s, t, p, angle, nx, ny, hpi = Math.PI/2, d1, d2, d3;
			switch (variant) {
				case "3":
					s = shiftLen;
					t = this.tOfLength(s);
					p = this.position(t);
					angle = this.angle(t);
					nx = amp*Math.cos(angle+hpi);
					ny = amp*Math.sin(angle+hpi);
					d1 = "M"+xypicGlobalContext.measure.em2px(p.x+nx)+","+xypicGlobalContext.measure.em2px(-p.y-ny);
					d2 = "M"+xypicGlobalContext.measure.em2px(p.x)+","+xypicGlobalContext.measure.em2px(-p.y);
					d3 = "M"+xypicGlobalContext.measure.em2px(p.x-nx)+","+xypicGlobalContext.measure.em2px(-p.y+ny);
					
					for (var i = 0; i < n; i++) {
						s = shiftLen + wave*i + thickness;
						t = this.tOfLength(s);
						p = this.position(t);
						angle = this.angle(t);
						nx = amp*Math.cos(angle+hpi);
						ny = amp*Math.sin(angle+hpi);
						d1 += " Q"+xypicGlobalContext.measure.em2px(p.x+2*nx)+","+xypicGlobalContext.measure.em2px(-p.y-2*ny);
						d2 += " Q"+xypicGlobalContext.measure.em2px(p.x+nx)+","+xypicGlobalContext.measure.em2px(-p.y-ny);
						d3 += " Q"+xypicGlobalContext.measure.em2px(p.x)+","+xypicGlobalContext.measure.em2px(-p.y);
						
						s = shiftLen + wave*i + 2*thickness;
						t = this.tOfLength(s);
						p = this.position(t);
						angle = this.angle(t);
						nx = amp*Math.cos(angle+hpi);
						ny = amp*Math.sin(angle+hpi);
						d1 += " "+xypicGlobalContext.measure.em2px(p.x+nx)+","+xypicGlobalContext.measure.em2px(-p.y-ny);
						d2 += " "+xypicGlobalContext.measure.em2px(p.x)+","+xypicGlobalContext.measure.em2px(-p.y);
						d3 += " "+xypicGlobalContext.measure.em2px(p.x-nx)+","+xypicGlobalContext.measure.em2px(-p.y+ny);
						
						s = shiftLen + wave*i + 3*thickness;
						t = this.tOfLength(s);
						p = this.position(t);
						angle = this.angle(t);
						nx = amp*Math.cos(angle+hpi);
						ny = amp*Math.sin(angle+hpi);
						d1 += " Q"+xypicGlobalContext.measure.em2px(p.x)+","+xypicGlobalContext.measure.em2px(-p.y);
						d2 += " Q"+xypicGlobalContext.measure.em2px(p.x-nx)+","+xypicGlobalContext.measure.em2px(-p.y+ny);
						d3 += " "+xypicGlobalContext.measure.em2px(p.x-2*nx)+","+xypicGlobalContext.measure.em2px(-p.y+2*ny);
						
						s = shiftLen + wave*(i+1);
						t = this.tOfLength(s);
						p = this.position(t);
						angle = this.angle(t);
						nx = amp*Math.cos(angle+hpi);
						ny = amp*Math.sin(angle+hpi);
						d1 += " "+xypicGlobalContext.measure.em2px(p.x+nx)+","+xypicGlobalContext.measure.em2px(-p.y-ny);
						d2 += " "+xypicGlobalContext.measure.em2px(p.x)+","+xypicGlobalContext.measure.em2px(-p.y);
						d3 += " "+xypicGlobalContext.measure.em2px(p.x-nx)+","+xypicGlobalContext.measure.em2px(-p.y+ny);
					}
					svg.createSVGElement("path", {"d":d1});
					svg.createSVGElement("path", {"d":d2});
					svg.createSVGElement("path", {"d":d3});
					break;
					
				case "2":
					s = shiftLen;
					t = this.tOfLength(s);
					p = this.position(t);
					angle = this.angle(t);
					nx = amp*Math.cos(angle+hpi)/2;
					ny = amp*Math.sin(angle+hpi)/2;
					d1 = "M"+xypicGlobalContext.measure.em2px(p.x+nx)+","+xypicGlobalContext.measure.em2px(-p.y-ny);
					d2 = "M"+xypicGlobalContext.measure.em2px(p.x-nx)+","+xypicGlobalContext.measure.em2px(-p.y+ny);
					
					for (var i = 0; i < n; i++) {
						s = shiftLen + wave*i + thickness;
						t = this.tOfLength(s);
						p = this.position(t);
						angle = this.angle(t);
						nx = amp*Math.cos(angle+hpi)/2;
						ny = amp*Math.sin(angle+hpi)/2;
						d1 += " Q"+xypicGlobalContext.measure.em2px(p.x+3*nx)+","+xypicGlobalContext.measure.em2px(-p.y-3*ny);
						d2 += " Q"+xypicGlobalContext.measure.em2px(p.x+nx)+","+xypicGlobalContext.measure.em2px(-p.y-ny);
						
						s = shiftLen + wave*i + 2*thickness;
						t = this.tOfLength(s);
						p = this.position(t);
						angle = this.angle(t);
						nx = amp*Math.cos(angle+hpi)/2;
						ny = amp*Math.sin(angle+hpi)/2;
						d1 += " "+xypicGlobalContext.measure.em2px(p.x+nx)+","+xypicGlobalContext.measure.em2px(-p.y-ny);
						d2 += " "+xypicGlobalContext.measure.em2px(p.x-nx)+","+xypicGlobalContext.measure.em2px(-p.y+ny);
						
						s = shiftLen + wave*i + 3*thickness;
						t = this.tOfLength(s);
						p = this.position(t);
						angle = this.angle(t);
						nx = amp*Math.cos(angle+hpi)/2;
						ny = amp*Math.sin(angle+hpi)/2;
						d1 += " Q"+xypicGlobalContext.measure.em2px(p.x-nx)+","+xypicGlobalContext.measure.em2px(-p.y+ny);
						d2 += " Q"+xypicGlobalContext.measure.em2px(p.x-3*nx)+","+xypicGlobalContext.measure.em2px(-p.y+3*ny);
						
						s = shiftLen + wave*(i+1);
						t = this.tOfLength(s);
						p = this.position(t);
						angle = this.angle(t);
						nx = amp*Math.cos(angle+hpi)/2;
						ny = amp*Math.sin(angle+hpi)/2;
						d1 += " "+xypicGlobalContext.measure.em2px(p.x+nx)+","+xypicGlobalContext.measure.em2px(-p.y-ny);
						d2 += " "+xypicGlobalContext.measure.em2px(p.x-nx)+","+xypicGlobalContext.measure.em2px(-p.y+ny);
					}
					svg.createSVGElement("path", {"d":d1});
					svg.createSVGElement("path", {"d":d2});
					break;
					
				default:
					s = shiftLen;
					t = this.tOfLength(s);
					p = this.position(t);
					d1 = "M"+xypicGlobalContext.measure.em2px(p.x)+","+xypicGlobalContext.measure.em2px(-p.y);
					
					for (var i = 0; i < n; i++) {
						s = shiftLen + wave*i + thickness;
						t = this.tOfLength(s);
						p = this.position(t);
						angle = this.angle(t);
						nx = amp*Math.cos(angle+hpi);
						ny = amp*Math.sin(angle+hpi);
						d1 += " Q"+xypicGlobalContext.measure.em2px(p.x+nx)+","+xypicGlobalContext.measure.em2px(-p.y-ny);
						
						s = shiftLen + wave*i + 2*thickness;
						t = this.tOfLength(s);
						p = this.position(t);
						d1 += " "+xypicGlobalContext.measure.em2px(p.x)+","+xypicGlobalContext.measure.em2px(-p.y);
						
						s = shiftLen + wave*i + 3*thickness;
						t = this.tOfLength(s);
						p = this.position(t);
						angle = this.angle(t);
						nx = amp*Math.cos(angle+hpi);
						ny = amp*Math.sin(angle+hpi);
						d1 += " Q"+xypicGlobalContext.measure.em2px(p.x-nx)+","+xypicGlobalContext.measure.em2px(-p.y+ny);
						
						s = shiftLen + wave*(i+1);
						t = this.tOfLength(s);
						p = this.position(t);
						d1 += " "+xypicGlobalContext.measure.em2px(p.x)+","+xypicGlobalContext.measure.em2px(-p.y);
					}
					svg.createSVGElement("path", {"d":d1});
			}
		}
	}
	
	drawDashSquigCurve(svg, variant) {
		var thickness = xypicGlobalContext.measure.thickness;
		var len = this.length(1);
		var wave = 4*thickness;
		var amp = thickness;
		if (len >= wave) {
			var n = Math.floor((len-wave)/2/wave);
			var shiftLen = (len-wave)/2-n*wave;
			
			var s, t, p, angle, nx, ny, hpi = Math.PI/2, d1, d2, d3;
			switch (variant) {
				case "3":
					d1 = d2 = d3 = "";
					for (var i = 0; i <= n; i++) {
						s = shiftLen + wave*i*2;
						t = this.tOfLength(s);
						p = this.position(t);
						angle = this.angle(t);
						nx = amp*Math.cos(angle+hpi);
						ny = amp*Math.sin(angle+hpi);
						d1 += " M"+xypicGlobalContext.measure.em2px(p.x+nx)+","+xypicGlobalContext.measure.em2px(-p.y-ny);
						d2 += " M"+xypicGlobalContext.measure.em2px(p.x)+","+xypicGlobalContext.measure.em2px(-p.y);
						d3 += " M"+xypicGlobalContext.measure.em2px(p.x-nx)+","+xypicGlobalContext.measure.em2px(-p.y+ny);
						
						s = shiftLen + wave*i*2 + thickness;
						t = this.tOfLength(s);
						p = this.position(t);
						angle = this.angle(t);
						nx = amp*Math.cos(angle+hpi);
						ny = amp*Math.sin(angle+hpi);
						d1 += " Q"+xypicGlobalContext.measure.em2px(p.x+2*nx)+","+xypicGlobalContext.measure.em2px(-p.y-2*ny);
						d2 += " Q"+xypicGlobalContext.measure.em2px(p.x+nx)+","+xypicGlobalContext.measure.em2px(-p.y-ny);
						d3 += " Q"+xypicGlobalContext.measure.em2px(p.x)+","+xypicGlobalContext.measure.em2px(-p.y);
						
						s = shiftLen + wave*i*2 + 2*thickness;
						t = this.tOfLength(s);
						p = this.position(t);
						angle = this.angle(t);
						nx = amp*Math.cos(angle+hpi);
						ny = amp*Math.sin(angle+hpi);
						d1 += " "+xypicGlobalContext.measure.em2px(p.x+nx)+","+xypicGlobalContext.measure.em2px(-p.y-ny);
						d2 += " "+xypicGlobalContext.measure.em2px(p.x)+","+xypicGlobalContext.measure.em2px(-p.y);
						d3 += " "+xypicGlobalContext.measure.em2px(p.x-nx)+","+xypicGlobalContext.measure.em2px(-p.y+ny);
						
						s = shiftLen + wave*i*2 + 3*thickness;
						t = this.tOfLength(s);
						p = this.position(t);
						angle = this.angle(t);
						nx = amp*Math.cos(angle+hpi);
						ny = amp*Math.sin(angle+hpi);
						d1 += " Q"+xypicGlobalContext.measure.em2px(p.x)+","+xypicGlobalContext.measure.em2px(-p.y);
						d2 += " Q"+xypicGlobalContext.measure.em2px(p.x-nx)+","+xypicGlobalContext.measure.em2px(-p.y+ny);
						d3 += " "+xypicGlobalContext.measure.em2px(p.x-2*nx)+","+xypicGlobalContext.measure.em2px(-p.y+2*ny);
						
						s = shiftLen + wave*(i*2+1);
						t = this.tOfLength(s);
						p = this.position(t);
						angle = this.angle(t);
						nx = amp*Math.cos(angle+hpi);
						ny = amp*Math.sin(angle+hpi);
						d1 += " "+xypicGlobalContext.measure.em2px(p.x+nx)+","+xypicGlobalContext.measure.em2px(-p.y-ny);
						d2 += " "+xypicGlobalContext.measure.em2px(p.x)+","+xypicGlobalContext.measure.em2px(-p.y);
						d3 += " "+xypicGlobalContext.measure.em2px(p.x-nx)+","+xypicGlobalContext.measure.em2px(-p.y+ny);
					}
					svg.createSVGElement("path", {"d":d1});
					svg.createSVGElement("path", {"d":d2});
					svg.createSVGElement("path", {"d":d3});
					break;
					
				case "2":
					d1 = d2 = "";
					for (var i = 0; i <= n; i++) {
						s = shiftLen + wave*i*2;
						t = this.tOfLength(s);
						p = this.position(t);
						angle = this.angle(t);
						nx = amp*Math.cos(angle+hpi)/2;
						ny = amp*Math.sin(angle+hpi)/2;
						d1 += " M"+xypicGlobalContext.measure.em2px(p.x+nx)+","+xypicGlobalContext.measure.em2px(-p.y-ny);
						d2 += " M"+xypicGlobalContext.measure.em2px(p.x-nx)+","+xypicGlobalContext.measure.em2px(-p.y+ny);
						
						s = shiftLen + wave*i*2 + thickness;
						t = this.tOfLength(s);
						p = this.position(t);
						angle = this.angle(t);
						nx = amp*Math.cos(angle+hpi)/2;
						ny = amp*Math.sin(angle+hpi)/2;
						d1 += " Q"+xypicGlobalContext.measure.em2px(p.x+3*nx)+","+xypicGlobalContext.measure.em2px(-p.y-3*ny);
						d2 += " Q"+xypicGlobalContext.measure.em2px(p.x+nx)+","+xypicGlobalContext.measure.em2px(-p.y-ny);
						
						s = shiftLen + wave*i*2 + 2*thickness;
						t = this.tOfLength(s);
						p = this.position(t);
						angle = this.angle(t);
						nx = amp*Math.cos(angle+hpi)/2;
						ny = amp*Math.sin(angle+hpi)/2;
						d1 += " "+xypicGlobalContext.measure.em2px(p.x+nx)+","+xypicGlobalContext.measure.em2px(-p.y-ny);
						d2 += " "+xypicGlobalContext.measure.em2px(p.x-nx)+","+xypicGlobalContext.measure.em2px(-p.y+ny);
						
						s = shiftLen + wave*i*2 + 3*thickness;
						t = this.tOfLength(s);
						p = this.position(t);
						angle = this.angle(t);
						nx = amp*Math.cos(angle+hpi)/2;
						ny = amp*Math.sin(angle+hpi)/2;
						d1 += " Q"+xypicGlobalContext.measure.em2px(p.x-nx)+","+xypicGlobalContext.measure.em2px(-p.y+ny);
						d2 += " Q"+xypicGlobalContext.measure.em2px(p.x-3*nx)+","+xypicGlobalContext.measure.em2px(-p.y+3*ny);
						
						s = shiftLen + wave*(i*2+1);
						t = this.tOfLength(s);
						p = this.position(t);
						angle = this.angle(t);
						nx = amp*Math.cos(angle+hpi)/2;
						ny = amp*Math.sin(angle+hpi)/2;
						d1 += " "+xypicGlobalContext.measure.em2px(p.x+nx)+","+xypicGlobalContext.measure.em2px(-p.y-ny);
						d2 += " "+xypicGlobalContext.measure.em2px(p.x-nx)+","+xypicGlobalContext.measure.em2px(-p.y+ny);
					}
					svg.createSVGElement("path", {"d":d1});
					svg.createSVGElement("path", {"d":d2});
					break;
					
				default:
					d1 = "";
					for (var i = 0; i <= n; i++) {
						s = shiftLen + wave*i*2;
						t = this.tOfLength(s);
						p = this.position(t);
						d1 += " M"+xypicGlobalContext.measure.em2px(p.x)+","+xypicGlobalContext.measure.em2px(-p.y);
						
						s = shiftLen + wave*i*2 + thickness;
						t = this.tOfLength(s);
						p = this.position(t);
						angle = this.angle(t);
						nx = amp*Math.cos(angle+hpi);
						ny = amp*Math.sin(angle+hpi);
						d1 += " Q"+xypicGlobalContext.measure.em2px(p.x+nx)+","+xypicGlobalContext.measure.em2px(-p.y-ny);
						
						s = shiftLen + wave*i*2 + 2*thickness;
						t = this.tOfLength(s);
						p = this.position(t);
						d1 += " "+xypicGlobalContext.measure.em2px(p.x)+","+xypicGlobalContext.measure.em2px(-p.y);
						
						s = shiftLen + wave*i*2 + 3*thickness;
						t = this.tOfLength(s);
						p = this.position(t);
						angle = this.angle(t);
						nx = amp*Math.cos(angle+hpi);
						ny = amp*Math.sin(angle+hpi);
						d1 += " Q"+xypicGlobalContext.measure.em2px(p.x-nx)+","+xypicGlobalContext.measure.em2px(-p.y+ny);
						
						s = shiftLen + wave*(i*2+1);
						t = this.tOfLength(s);
						p = this.position(t);
						d1 += " "+xypicGlobalContext.measure.em2px(p.x)+","+xypicGlobalContext.measure.em2px(-p.y);
					}
					svg.createSVGElement("path", {"d":d1});
			}
		}
	}
	
	drawCurve(svg, objectForDrop, objectForConnect, holeRanges) {
		if (holeRanges.isEmpty) {
			this._drawCurve(svg, objectForDrop, objectForConnect);
		} else {
			var clippingRanges = new Range(0, 1).differenceRanges(holeRanges);
			var self = this;
			clippingRanges.foreach(function (range) {
				self.slice(range.start, range.end)._drawCurve(svg, objectForDrop, objectForConnect);
			});
		}
	}
	
	_drawCurve(svg, objectForDrop, objectForConnect) {
		var thickness = xypicGlobalContext.measure.length2em("0.15em");
		var vshift;
		if (objectForConnect !== undefined) {
			var main = objectForConnect.dirMain();
			var variant = objectForConnect.dirVariant();
			switch (main) {
				case "=":
					main = "-";
					variant = "2";
					break;
				case "==":
					main = "--";
					variant = "2";
					break;
				case ':':
				case '::':
					main = ".";
					variant = "2";
					break;
			}
			
			switch (main) {
				case '':
					// draw nothing.
					break;
					
				case '-':
					switch (variant) {
						case "2":
							vshift = thickness/2;
							this.drawParallelCurve(svg, vshift);
							break;
						case "3":
							vshift = thickness;
							this.drawParallelCurve(svg, vshift);
							this.drawPrimitive(svg, "none");
							break;
						default:
							vshift = 0;
							this.drawPrimitive(svg, "none");
					}
					break;
					
				case '.':
				case '..':
					switch (variant) {
						case "2":
							vshift = thickness/2;
							this.drawParallelDottedCurve(svg, thickness, vshift)
							break;
							
						case "3":
							vshift = thickness;
							this.drawParallelDottedCurve(svg, thickness, vshift)
							this.drawPrimitive(svg, xypicGlobalContext.measure.dottedDasharray);
							break;
							
						default:
							vshift = 0;
							this.drawPrimitive(svg, xypicGlobalContext.measure.dottedDasharray);
							break;
					}
					break;
					
				case '--':
					var dash = 3 * thickness;
					var len = this.length(1);
					if (len >= dash) {
						switch (variant) {
							case "2":
								vshift = thickness / 2;
								this.drawParallelDashedCurve(svg, dash, vshift);
								break;
								
							case "3":
								vshift = thickness;
								this.drawParallelDashedCurve(svg, dash, vshift);
								var shiftLen = (len - dash) / 2 - Math.floor((len - dash) / 2 / dash) * dash;
								var shiftT = this.tOfLength(shiftLen);
								var shifted = this.divide(shiftT)[1];
								shifted.drawPrimitive(svg, xypicGlobalContext.measure.em2px(dash) + " " + xypicGlobalContext.measure.em2px(dash))
								break;
								
							default:
								vshift = 0;
								var shiftLen = (len - dash) / 2 - Math.floor((len - dash) / 2 / dash) * dash;
								var shiftT = this.tOfLength(shiftLen);
								var shifted = this.divide(shiftT)[1];
								shifted.drawPrimitive(svg, xypicGlobalContext.measure.em2px(dash) + " " + xypicGlobalContext.measure.em2px(dash));
						}
					}
					break;
					
				case '~':
					this.drawSquigCurve(svg, variant);
					switch (variant) {
						case "2":
							vshift = 1.5 * thickness;
							break;
						case "3":
							vshift = 2 * thickness;
							break;
						default:
							vshift = 0
					}
					break;
					
				case '~~':
					this.drawDashSquigCurve(svg, variant);
					switch (variant) {
						case "2":
							vshift = 1.5 * thickness;
							break;
						case "3":
							vshift = 2 * thickness;
							break;
						default:
							vshift = 0
					}
					break;
					
				default:
					// TODO: ~* と ~** の順序を考慮する。
					var dummyEnv = new Env();
					dummyEnv.c = Env.originPosition;
					var dummyContext = new DrawingContext(Shape.none, dummyEnv);
					var conBBox = objectForConnect.boundingBox(dummyContext);
					if (conBBox == undefined) {
						return;
					}
					
					var cl = conBBox.l;
					var conLen = cl + conBBox.r;
					
					var dropLen, dl;
					if (objectForDrop !== undefined) {
						var dropBBox = objectForDrop.boundingBox(dummyContext);
						if (dropBBox !== undefined) {
							dl = dropBBox.l;
							dropLen = dl + dropBBox.r;
						}
					} else {
						dropLen = 0;
					}
					
					var compositeLen = conLen + dropLen;
					if (compositeLen == 0) {
						compositeLen = xypicGlobalContext.measure.strokeWidth;
					}
					
					var len = this.length(1);
					var n = Math.floor(len / compositeLen);
					if (n == 0) {
						return;
					}
					
					var shiftLen = (len - n * compositeLen) / 2;
					
					var dummyContext = new DrawingContext(Shape.none, dummyEnv);
					var s, t;
					for (var i = 0; i < n; i++) {
						s = shiftLen + i * compositeLen;
						if (objectForDrop !== undefined) {
							t = this.tOfLength(s + dl);
							dummyEnv.c = this.position(t);
							dummyEnv.angle = this.angle(t);
							objectForDrop.toDropShape(dummyContext).draw(svg);
						}
						t = this.tOfLength(s + dropLen + cl);
						dummyEnv.c = this.position(t);
						dummyEnv.angle = this.angle(t);
						var bbox = objectForConnect.toDropShape(dummyContext).draw(svg);
					}
			}
		} else {
			var dummyEnv = new Env();
			dummyEnv.c = Env.originPosition;
			var dummyContext = new DrawingContext(Shape.none, dummyEnv);
			var object = objectForDrop;
			var objectBBox = object.boundingBox(dummyContext);
			if (objectBBox === undefined) {
				return;
			}
			var objectWidth = objectBBox.l + objectBBox.r;
			var objectLen = objectWidth;
			if (objectLen == 0) {
				objectLen = xypicGlobalContext.measure.strokeWidth;
			}
			
			var len = this.length(1);
			var n = Math.floor(len / objectLen);
			if (n == 0) {
				return;
			}
			
			var shiftLen = (len - n * objectLen + objectLen - objectWidth) / 2 + objectBBox.l;
			var dummyContext = new DrawingContext(Shape.none, dummyEnv);
			for (var i = 0; i < n; i++) {
				var s = shiftLen + i * objectLen;
				var t = this.tOfLength(s);
				dummyEnv.c = this.position(t);
				dummyEnv.angle = 0;
				object.toDropShape(dummyContext).draw(svg);
			}
		}
	}
	
	toShape(context, objectForDrop, objectForConnect) {
		var env = context.env;
		var thickness = xypicGlobalContext.measure.length2em("0.15em");
		var shape = Shape.none;
		var vshift;
		if (objectForConnect !== undefined) {
			var main = objectForConnect.dirMain();
			var variant = objectForConnect.dirVariant();
			switch (main) {
				case "=":
					main = "-";
					variant = "2";
					break;
				case "==":
					main = "--";
					variant = "2";
					break;
				case ':':
				case '::':
					main = ".";
					variant = "2";
					break;
			}
			
			switch (main) {
				case '':
					vshift = 0;
					break;
					
				case '-':
				case '.':
				case '..':
					switch (variant) {
						case "2":
							vshift = thickness / 2;
							break;
							
						case "3":
							vshift = thickness;
							break;
							
						default:
							vshift = 0;
							break;
					}
					break;
					
				case '--':
					var dash = 3 * thickness;
					var len = this.length(1);
					if (len >= dash) {
						switch (variant) {
							case "2":
								vshift = thickness / 2;
								break;
								
							case "3":
								vshift = thickness;
								break;
								
							default:
								vshift = 0;
						}
					}
					break;
					
				case '~':
				case '~~':
					switch (variant) {
						case "2":
							vshift = 1.5 * thickness;
							break;
						case "3":
							vshift = 2 * thickness;
							break;
						default:
							vshift = 0
					}
					break;
					
				default:
					// TODO: ~* と ~** の順序を考慮する。
					var conBBox = objectForConnect.boundingBox(context);
					if (conBBox == undefined) {
						env.angle = 0;
						env.lastCurve = LastCurve.none;
						return Shape.none;
					}
					vshift = Math.max(conBBox.u, conBBox.d);
					
					var cl = conBBox.l;
					var conLen = cl + conBBox.r;
					
					var dropLen, dl;
					if (objectForDrop !== undefined) {
						var dropBBox = objectForDrop.boundingBox(context);
						if (dropBBox !== undefined) {
							dl = dropBBox.l;
							dropLen = dl + dropBBox.r;
							vshift = Math.max(vshift, dropBBox.u, dropBBox.d);
						}
					} else {
						dropLen = 0;
					}
					
					var compositeLen = conLen + dropLen;
					if (compositeLen == 0) {
						compositeLen = xypicGlobalContext.measure.strokeWidth;
					}
					
					var len = this.length(1);
					var n = Math.floor(len / compositeLen);
					if (n == 0) {
						env.angle = 0;
						env.lastCurve = LastCurve.none;
						return Shape.none;
					}
					
					shape = new Shape.CurveShape(this, objectForDrop, objectForConnect, this.boundingBox(vshift));
					context.appendShapeToFront(shape);
					return shape;
			}
			if (vshift === undefined) {
				return Shape.none;
			} else {
				shape = new Shape.CurveShape(this, objectForDrop, objectForConnect, this.boundingBox(vshift));
				context.appendShapeToFront(shape);
				return shape;
			}
		} else if (objectForDrop !== undefined) {
			var object = objectForDrop;
			var objectBBox = object.boundingBox(context);
			if (objectBBox == undefined) {
				env.angle = 0;
				env.lastCurve = LastCurve.none;
				return Shape.none;
			}
			
			var objectWidth = objectBBox.l + objectBBox.r;
			var objectLen = objectWidth;
			if (objectLen == 0) {
				objectLen = xypicGlobalContext.measure.strokeWidth;
			}
			
			var len = this.length(1);
			var n = Math.floor(len / objectLen);
			if (n == 0) {
				env.angle = 0;
				env.lastCurve = LastCurve.none;
				return Shape.none;
			}
			
			vshift = Math.max(objectBBox.u, objectBBox.d);
			shape = new Shape.CurveShape(this, objectForDrop, objectForConnect, this.boundingBox(vshift));
			context.appendShapeToFront(shape);
			return shape;
		}
		return shape;
	}

	static sign(x) { return x > 0 ? 1 : (x === 0 ? 0 : -1); }
	
	static solutionsOfCubicEq(a3, a2, a1, a0) {
		// find solutions t in [0, 1]
		if (a3 === 0) {
			return Curve.solutionsOfQuadEq(a2, a1, a0);
		}
		var b2 = a2/3/a3, b1 = a1/a3, b0 = a0/a3;
		var p = b2*b2-b1/3, q = -b0/2+b1*b2/2-b2*b2*b2;
		var d = q*q-p*p*p;
		if (d === 0) {
			var s = Math.pow(q, 1/3);
			var t0 = 2*s-b2, t1 = -s-b2;
			return Curve.filterByIn0to1([t0, t1]);
		} else if (d > 0) {
			var u = q+Curve.sign(q)*Math.sqrt(d);
			var r = Curve.sign(u)*Math.pow(Math.abs(u), 1/3);
			var s = p/r;
			var t = r+s-b2;
			return Curve.filterByIn0to1([t]);
		} else {
			var r = 2*Math.sqrt(p);
			var s = Math.acos(2*q/p/r);
			var t0 = r*Math.cos(s/3)-b2;
			var t1 = r*Math.cos((s+2*Math.PI)/3)-b2;
			var t2 = r*Math.cos((s+4*Math.PI)/3)-b2;
			return Curve.filterByIn0to1([t0, t1, t2]);
		}
	}
	
	static solutionsOfQuadEq(a2, a1, a0) {
		// find solutions t in [0, 1]
		if (a2 === 0) {
			return Curve.solutionsOfLinearEq(a1, a0);
		} else {
			var d = a1 * a1 - 4 * a0 * a2;
			if (d >= 0) {
				var s = Math.sqrt(d);
				var tp = (-a1 + s) / 2 / a2;
				var tm = (-a1 - s) / 2 / a2;
				return Curve.filterByIn0to1([tp, tm]);
			} else {
				return [];
			}
		}
	}
	
	static solutionsOfLinearEq(a1, a0) {
		// find solution t in [0, 1]
		if (a1 === 0) {
			return (a0 === 0? 0 : []);
		}
		return Curve.filterByIn0to1([-a0 / a1]);
	}
	
	static filterByIn0to1(ts) {
		var filterdTs = [];
		for (var i = 0; i < ts.length; i++) {
			var t = ts[i];
			if (t >= 0 && t <= 1) {
				filterdTs.push(t);
			}
		}
		return filterdTs;
	}
};


Curve.QuadBezier = class Curve_QuadBezier extends Curve {
	constructor(cp0, cp1, cp2) {
		super();
		this.cp0 = cp0;
		this.cp1 = cp1;
		this.cp2 = cp2;
		
		var a0x = cp0.x;
		var a1x = 2*(cp1.x - cp0.x);
		var a2x = cp2.x - 2*cp1.x + cp0.x;
		this.px = function(t) { return a0x + t*a1x + t*t*a2x; }
		this.dpx = function(t) { return a1x + 2*t*a2x; }
		
		var a0y = cp0.y;
		var a1y = 2*(cp1.y - cp0.y);
		var a2y = cp2.y - 2*cp1.y + cp0.y;
		this.py = function(t) { return a0y + t*a1y + t*t*a2y; }
		this.dpy = function(t) { return a1y + 2*t*a2y; }
	}
	
	startPosition() {
		return this.cp0;
	}
	
	endPosition() {
		return this.cp2;
	}
	
	position(t) {
		return new Frame.Point(this.px(t), this.py(t));
	}
	
	derivative(t) {
		return new Frame.Point(this.dpx(t), this.dpy(t));
	}
	
	angle(t) {
		return Math.atan2(this.dpy(t), this.dpx(t));
	}
	
	boundingBox(vshift) {
		var maxMinX = this.maxMin(this.cp0.x, this.cp1.x, this.cp2.x, vshift);
		var maxMinY = this.maxMin(this.cp0.y, this.cp1.y, this.cp2.y, vshift);
		if (vshift === 0) {
			return new Frame.Rect(this.cp0.x, this.cp0.y, {
				l:this.cp0.x-maxMinX.min, r:maxMinX.max-this.cp0.x,
				u:maxMinY.max-this.cp0.y, d:this.cp0.y-maxMinY.min
			});
		} else {
			var hpi = Math.PI/2;
			var sx = this.cp0.x;
			var sy = this.cp0.y;
			var ex = this.cp2.x;
			var ey = this.cp2.y;
			var a0 = this.angle(0)+hpi;
			var a1 = this.angle(1)+hpi;
			var vc0 = vshift*Math.cos(a0), vs0 = vshift*Math.sin(a0);
			var vc1 = vshift*Math.cos(a1), vs1 = vshift*Math.sin(a1);
			var minX = Math.min(maxMinX.min, sx+vc0, sx-vc0, ex+vc1, ex-vc1);
			var maxX = Math.max(maxMinX.max, sx+vc0, sx-vc0, ex+vc1, ex-vc1);
			var minY = Math.min(maxMinY.min, sy+vs0, sy-vs0, ey+vs1, ey-vs1);
			var maxY = Math.max(maxMinY.max, sy+vs0, sy-vs0, ey+vs1, ey-vs1);
			return new Frame.Rect(sx, sy, {
				l:sx-minX, r:maxX-sx, u:maxY-sy, d:sy-minY
			});
		}
	}
	
	maxMin(x0, x1, x2, vshift) {
		var max, min;
		if (x0 > x2) {
			max = x0;
			min = x2;
		} else {
			max = x2;
			min = x0;
		}
		
		var roundEp = XypicUtil.roundEpsilon;
		
		var a0 = roundEp(x0);
		var a1 = roundEp(x1 - x0);
		var a2 = roundEp(x2 - 2*x1 + x0);
		var p = function(t) { return a0 + 2*t*a1 + t*t*a2 }
		
		var x, t;
		if (a2 != 0) {
			t = -a1/a2;
			if (t > 0 && t < 1) {
				x = p(t);
				max = Math.max(max, x + vshift, x - vshift);
				min = Math.min(min, x + vshift, x - vshift);
			}
		}
		return {min:min, max:max};
	}
	
	divide(t) {
		if (t < 0 || t > 1) {
			throw new TexError("ExecutionError", "illegal quadratic Bezier parameter t:"+t);
		}
		
		var x0 = this.cp0.x;
		var x1 = this.cp1.x;
		var x2 = this.cp2.x;
		
		var y0 = this.cp0.y;
		var y1 = this.cp1.y;
		var y2 = this.cp2.y;
		
		var tx = this.px(t);
		var ty = this.py(t);
		
		var p0 = this.cp0;
		var p1 = new Frame.Point(x0+t*(x1-x0), y0+t*(y1-y0));
		var p2 = new Frame.Point(tx, ty);
		
		var q0 = p2;
		var q1 = new Frame.Point(x1+t*(x2-x1), y1+t*(y2-y1));
		var q2 = this.cp2;
		
		return [
			new Curve.QuadBezier(p0, p1, p2),
			new Curve.QuadBezier(q0, q1, q2)
		]
	}
	
	slice(t0, t1) {
		if (t0 >= t1) {
			return undefined;
		}
		
		if (t0 < 0) {
			t0 = 0;
		} 
		if (t1 > 1) {
			t1 = 1;
		}
		
		if (t0 === 0 && t1 === 1) {
			return this;
		}
		
		var x0 = this.cp0.x;
		var x1 = this.cp1.x;
		var x2 = this.cp2.x;
		
		var y0 = this.cp0.y;
		var y1 = this.cp1.y;
		var y2 = this.cp2.y;
		
		var q0x = this.px(t0);
		var q0y = this.py(t0);
		var q1x = x1 + t0 * (x2 - x1);
		var q1y = y1 + t0 * (y2 - y1);
		
		var p0 = new Frame.Point(q0x, q0y);
		var p1 = new Frame.Point(q0x + t1 * (q1x - q0x), q0y + t1 * (q1y - q0y));
		var p2 = new Frame.Point(this.px(t1), this.py(t1));
		
		return new Curve.QuadBezier(p0, p1, p2);
	}
	
	tOfIntersections(frame) {
		if (frame.isPoint()) {
			return []; // CAUTION: Point does not intersect with any curves.
		}
		
		if (frame.isRect()) {
			// find starting edge point
			var rx = frame.x + frame.r;
			var lx = frame.x - frame.l;
			var uy = frame.y + frame.u;
			var dy = frame.y - frame.d;
			
			var roundEp = XypicUtil.roundEpsilon;
			
			var x0 = this.cp0.x;
			var x1 = this.cp1.x;
			var x2 = this.cp2.x;
			
			var a0x = roundEp(x0);
			var a1x = roundEp(2*(x1 - x0));
			var a2x = roundEp(x2 - 2*x1 + x0);
			var px = function(t) { return a0x + t*a1x + t*t*a2x; }
			
			var y0 = this.cp0.y;
			var y1 = this.cp1.y;
			var y2 = this.cp2.y;
			
			var a0y = roundEp(y0);
			var a1y = roundEp(2*(y1 - y0));
			var a2y = roundEp(y2 - 2*y1 + y0);
			var py = function(t) { return a0y + t*a1y + t*t*a2y; }
			
			var ts = [];
			
			var tsCandidate;
			tsCandidate = Curve.solutionsOfQuadEq(a2x, a1x, a0x - rx);
			tsCandidate = tsCandidate.concat(Curve.solutionsOfQuadEq(a2x, a1x, a0x - lx));
			for (var i = 0; i < tsCandidate.length; i++) {
				var t = tsCandidate[i];
				var y = py(t);
				if (y >= dy && y <= uy) {
					ts.push(t);
				}
			}
			tsCandidate = Curve.solutionsOfQuadEq(a2y, a1y, a0y - uy);
			tsCandidate = tsCandidate.concat(Curve.solutionsOfQuadEq(a2y, a1y, a0y - dy));
			for (var i = 0; i < tsCandidate.length; i++) {
				var t = tsCandidate[i];
				var x = px(t);
				if (x >= lx && x <= rx) {
					ts.push(t);
				}
			}
			
			return ts;
		} else if (frame.isCircle()) {
			var pi = Math.PI;
			var x = frame.x;
			var y = frame.y;
			var l = frame.l;
			var r = frame.r;
			var u = frame.u;
			var d = frame.d;
			var cx = x + (r - l) / 2;
			var cy = y + (u - d) / 2;
			var rx = (l + r) / 2;
			var ry = (u + d) / 2;
			
			var delta = pi / 180; // overlapping
			var arc0 = new CurveSegment.Arc(cx, cy, rx, ry, -pi - delta, -pi / 2 + delta);
			var arc1 = new CurveSegment.Arc(cx, cy, rx, ry, -pi / 2 - delta, 0 + delta);
			var arc2 = new CurveSegment.Arc(cx, cy, rx, ry, 0 - delta, pi / 2 + delta);
			var arc3 = new CurveSegment.Arc(cx, cy, rx, ry, pi / 2 - delta, pi + delta);
			
			var bezier = new CurveSegment.QuadBezier(this, 0, 1);
			
			var intersec = [];
			intersec = intersec.concat(CurveSegment.findIntersections(arc0, bezier));
			intersec = intersec.concat(CurveSegment.findIntersections(arc1, bezier));
			intersec = intersec.concat(CurveSegment.findIntersections(arc2, bezier));
			intersec = intersec.concat(CurveSegment.findIntersections(arc3, bezier));
			
			var ts = [];
			for (var i = 0; i < intersec.length; i++) { 
				var t = (intersec[i][1].min + intersec[i][1].max) / 2;
				ts.push(t);
			}
			return ts;
		}
	}
	
	countOfSegments() { return 1; }
	
	drawPrimitive(svg, dasharray) {
		var cp0 = this.cp0, cp1 = this.cp1, cp2 = this.cp2;
		svg.createSVGElement("path", {
			"d":"M"+xypicGlobalContext.measure.em2px(cp0.x)+","+xypicGlobalContext.measure.em2px(-cp0.y)+
				" Q"+xypicGlobalContext.measure.em2px(cp1.x)+","+xypicGlobalContext.measure.em2px(-cp1.y)+
				" "+xypicGlobalContext.measure.em2px(cp2.x)+","+xypicGlobalContext.measure.em2px(-cp2.y),
			"stroke-dasharray":dasharray
		});
	}
	
	toString() {
		return "QuadBezier("+this.cp0.x+", "+this.cp0.y+")-("+this.cp1.x+", "+this.cp1.y+")-("+this.cp2.x+", "+this.cp2.y+")"
	}
};


Curve.CubicBezier = class Curve_CubicBezier extends Curve {
	constructor(cp0, cp1, cp2, cp3) {
		super();
		this.cp0 = cp0;
		this.cp1 = cp1;
		this.cp2 = cp2;
		this.cp3 = cp3;
		
		var a0x = cp0.x;
		var a1x = 3*(cp1.x - cp0.x);
		var a2x = 3*(cp2.x - 2*cp1.x + cp0.x);
		var a3x = cp3.x - 3*cp2.x + 3*cp1.x - cp0.x;
		this.px = function(t) { return a0x + t*a1x + t*t*a2x + t*t*t*a3x; }
		this.dpx = function(t) { return a1x + 2*t*a2x + 3*t*t*a3x; }
		
		var a0y = cp0.y;
		var a1y = 3*(cp1.y - cp0.y);
		var a2y = 3*(cp2.y - 2*cp1.y + cp0.y);
		var a3y = cp3.y - 3*cp2.y + 3*cp1.y - cp0.y;
		this.py = function(t) { return a0y + t*a1y + t*t*a2y + t*t*t*a3y; }
		this.dpy = function(t) { return a1y + 2*t*a2y + 3*t*t*a3y; }
	}
	
	startPosition() {
		return this.cp0;
	}
	
	endPosition() {
		return this.cp3;
	}
	
	position(t) {
		return new Frame.Point(this.px(t), this.py(t));
	}
	
	derivative(t) {
		return new Frame.Point(this.dpx(t), this.dpy(t));
	}
	
	angle(t) {
		return Math.atan2(this.dpy(t), this.dpx(t));
	}
	
	boundingBox(vshift) {
		var maxMinX = this.maxMin(this.cp0.x, this.cp1.x, this.cp2.x, this.cp3.x, vshift);
		var maxMinY = this.maxMin(this.cp0.y, this.cp1.y, this.cp2.y, this.cp3.y, vshift);
		if (vshift === 0) {
			return new Frame.Rect(this.cp0.x, this.cp0.y, {
				l:this.cp0.x-maxMinX.min, r:maxMinX.max-this.cp0.x,
				u:maxMinY.max-this.cp0.y, d:this.cp0.y-maxMinY.min
			});
		} else {
			var hpi = Math.PI/2;
			var sx = this.cp0.x;
			var sy = this.cp0.y;
			var ex = this.cp3.x;
			var ey = this.cp3.y;
			var a0 = this.angle(0)+hpi;
			var a1 = this.angle(1)+hpi;
			var vc0 = vshift*Math.cos(a0), vs0 = vshift*Math.sin(a0);
			var vc1 = vshift*Math.cos(a1), vs1 = vshift*Math.sin(a1);
			var minX = Math.min(maxMinX.min, sx+vc0, sx-vc0, ex+vc1, ex-vc1);
			var maxX = Math.max(maxMinX.max, sx+vc0, sx-vc0, ex+vc1, ex-vc1);
			var minY = Math.min(maxMinY.min, sy+vs0, sy-vs0, ey+vs1, ey-vs1);
			var maxY = Math.max(maxMinY.max, sy+vs0, sy-vs0, ey+vs1, ey-vs1);
			return new Frame.Rect(sx, sy, {
				l:sx-minX, r:maxX-sx, u:maxY-sy, d:sy-minY
			});
		}
	}
	
	maxMin(x0, x1, x2, x3, vshift) {
		var max, min;
		if (x0 > x3) {
			max = x0;
			min = x3;
		} else {
			max = x3;
			min = x0;
		}
		
		var roundEp = XypicUtil.roundEpsilon;
		var a0 = roundEp(x0);
		var a1 = roundEp(x1 - x0);
		var a2 = roundEp(x2 - 2*x1 + x0);
		var a3 = roundEp(x3 - 3*x2 + 3*x1 - x0);
		var p = function(t) { return a0 + 3*t*a1 + 3*t*t*a2 + t*t*t*a3 }
		
		var x;
		var updateMinMax = function (t) {
			if (t > 0 && t < 1) {
				x = p(t);
				max = Math.max(max, x + vshift, x - vshift);
				min = Math.min(min, x + vshift, x - vshift);
			}
		}
		
		var t;
		if (a3 == 0) {
			if (a2 != 0) {
				t = -a1/a2/2;
				updateMinMax(t);
			}
		} else {
			var d = a2*a2 - a1*a3;
			if (d > 0) {
				t = (-a2 + Math.sqrt(d))/a3;
				updateMinMax(t);
				t = (-a2 - Math.sqrt(d))/a3;
				updateMinMax(t);
			} else if (d == 0) {
				t = -a2/a3;
				updateMinMax(t);
			}
		}
		return {min:min, max:max};
	}
	
	divide(t) {
		if (t < 0 || t > 1) {
			throw new TexError("ExecutionError", "illegal cubic Bezier parameter t:"+t);
		}
		
		var x0 = this.cp0.x;
		var x1 = this.cp1.x;
		var x2 = this.cp2.x;
		var x3 = this.cp3.x;
		
		var y0 = this.cp0.y;
		var y1 = this.cp1.y;
		var y2 = this.cp2.y;
		var y3 = this.cp3.y;
		
		var tx = this.px(t);
		var ty = this.py(t);
		
		var p0 = this.cp0;
		var p1 = new Frame.Point(x0+t*(x1-x0), y0+t*(y1-y0));
		var p2 = new Frame.Point(
			x0+2*t*(x1-x0)+t*t*(x2-2*x1+x0),
			y0+2*t*(y1-y0)+t*t*(y2-2*y1+y0)
		);
		var p3 = new Frame.Point(tx, ty);
		
		var q0 = p3;
		var q1 = new Frame.Point(
			x1+2*t*(x2-x1)+t*t*(x3-2*x2+x1),
			y1+2*t*(y2-y1)+t*t*(y3-2*y2+y1)
		);
		var q2 = new Frame.Point(x2+t*(x3-x2), y2+t*(y3-y2));
		var q3 = this.cp3;
		
		return [
			new Curve.CubicBezier(p0, p1, p2, p3),
			new Curve.CubicBezier(q0, q1, q2, q3)
		]
	}
	
	slice(t0, t1) {
		if (t0 >= t1) {
			return undefined;
		}
		
		if (t0 < 0) {
			t0 = 0;
		} 
		if (t1 > 1) {
			t1 = 1;
		}
		
		if (t0 === 0 && t1 === 1) {
			return this;
		}
		
		var x0 = this.cp0.x;
		var x1 = this.cp1.x;
		var x2 = this.cp2.x;
		var x3 = this.cp3.x;
		
		var y0 = this.cp0.y;
		var y1 = this.cp1.y;
		var y2 = this.cp2.y;
		var y3 = this.cp3.y;
		
		var q0x = this.px(t0);
		var q0y = this.py(t0);
		var q1x = x1 + 2 * t0 * (x2 - x1) + t0 * t0 * (x3 - 2 * x2 + x1);
		var q1y = y1 + 2 * t0 * (y2 - y1) + t0 * t0 * (y3 - 2 * y2 + y1);
		var q2x = x2 + t0 * (x3 - x2);
		var q2y = y2 + t0 * (y3 - y2);
		
		var p0 = new Frame.Point(q0x, q0y);
		var p1 = new Frame.Point(q0x + t1 * (q1x - q0x), q0y + t1 * (q1y - q0y));
		var p2 = new Frame.Point(
			q0x + 2 * t1 * (q1x - q0x) + t1 * t1 * (q2x - 2 * q1x + q0x),
			q0y + 2 * t1 * (q1y - q0y) + t1 * t1 * (q2y - 2 * q1y + q0y)
		);
		var p3 = new Frame.Point(this.px(t1), this.py(t1));
		
		return new Curve.CubicBezier(p0, p1, p2, p3);
	}
	
	tOfIntersections(frame) {
		if (frame.isPoint()) {
			return []; // CAUTION: Point does not intersect with any curves.
		}
		
		if (frame.isRect()) {
			// find starting edge point
			var rx = frame.x + frame.r;
			var lx = frame.x - frame.l;
			var uy = frame.y + frame.u;
			var dy = frame.y - frame.d;
			
			var roundEp = XypicUtil.roundEpsilon;
			
			var x0 = this.cp0.x;
			var x1 = this.cp1.x;
			var x2 = this.cp2.x;
			var x3 = this.cp3.x;
			
			var y0 = this.cp0.y;
			var y1 = this.cp1.y;
			var y2 = this.cp2.y;
			var y3 = this.cp3.y;
			
			var a0x = roundEp(x0);
			var a1x = roundEp(3*(x1 - x0));
			var a2x = roundEp(3*(x2 - 2*x1 + x0));
			var a3x = roundEp(x3 - 3*x2 + 3*x1 - x0);
			var px = function(t) { return a0x + t*a1x + t*t*a2x + t*t*t*a3x }
			
			var a0y = roundEp(y0);
			var a1y = roundEp(3*(y1 - y0));
			var a2y = roundEp(3*(y2 - 2*y1 + y0));
			var a3y = roundEp(y3 - 3*y2 + 3*y1 - y0);
			var py = function(t) { return a0y + t*a1y + t*t*a2y + t*t*t*a3y }
			
			var ts = [];
			var tsCandidate;
			tsCandidate = Curve.solutionsOfCubicEq(a3x, a2x, a1x, a0x-rx);
			tsCandidate = tsCandidate.concat(Curve.solutionsOfCubicEq(a3x, a2x, a1x, a0x-lx));
			for (var i = 0; i < tsCandidate.length; i++) {
				var t = tsCandidate[i];
				var y = py(t);
				if (y >= dy && y <= uy) {
					ts.push(t);
				}
			}
			tsCandidate = Curve.solutionsOfCubicEq(a3y, a2y, a1y, a0y-uy);
			tsCandidate = tsCandidate.concat(Curve.solutionsOfCubicEq(a3y, a2y, a1y, a0y-dy));
			for (var i = 0; i < tsCandidate.length; i++) {
				var t = tsCandidate[i];
				var x = px(t);
				if (x >= lx && x <= rx) {
					ts.push(t);
				}
			}
			
			return ts;
		} else if (frame.isCircle()) {
			var pi = Math.PI;
			var x = frame.x;
			var y = frame.y;
			var l = frame.l;
			var r = frame.r;
			var u = frame.u;
			var d = frame.d;
			var cx = x + (r - l) / 2;
			var cy = y + (u - d) / 2;
			var rx = (l + r) / 2;
			var ry = (u + d) / 2;
			
			var delta = pi / 180; // overlapping
			var arc0 = new CurveSegment.Arc(cx, cy, rx, ry, -pi - delta, -pi / 2 + delta);
			var arc1 = new CurveSegment.Arc(cx, cy, rx, ry, -pi / 2 - delta, 0 + delta);
			var arc2 = new CurveSegment.Arc(cx, cy, rx, ry, 0 - delta, pi / 2 + delta);
			var arc3 = new CurveSegment.Arc(cx, cy, rx, ry, pi / 2 - delta, pi + delta);
			
			var bezier = new CurveSegment.CubicBezier(this, 0, 1);
			
			var intersec = [];
			intersec = intersec.concat(CurveSegment.findIntersections(arc0, bezier));
			intersec = intersec.concat(CurveSegment.findIntersections(arc1, bezier));
			intersec = intersec.concat(CurveSegment.findIntersections(arc2, bezier));
			intersec = intersec.concat(CurveSegment.findIntersections(arc3, bezier));
			
			var ts = [];
			for (var i = 0; i < intersec.length; i++) { 
				var t = (intersec[i][1].min + intersec[i][1].max) / 2;
				ts.push(t);
			}
			return ts;
		}
	}
	
	countOfSegments() { return 1; }
	
	drawPrimitive(svg, dasharray) {
		var cp0 = this.cp0, cp1 = this.cp1, cp2 = this.cp2, cp3 = this.cp3;
		svg.createSVGElement("path", {
			"d":"M"+xypicGlobalContext.measure.em2px(cp0.x)+","+xypicGlobalContext.measure.em2px(-cp0.y)+
				" C"+xypicGlobalContext.measure.em2px(cp1.x)+","+xypicGlobalContext.measure.em2px(-cp1.y)+
				" "+xypicGlobalContext.measure.em2px(cp2.x)+","+xypicGlobalContext.measure.em2px(-cp2.y)+
				" "+xypicGlobalContext.measure.em2px(cp3.x)+","+xypicGlobalContext.measure.em2px(-cp3.y),
			"stroke-dasharray":dasharray
		});
	}
	
	toString() {
		return "CubicBezier("+this.cp0.x+", "+this.cp0.y+")-("+this.cp1.x+", "+this.cp1.y+")-("+this.cp2.x+", "+this.cp2.y+")-("+this.cp3.x+", "+this.cp3.y+")"
	}
};


Curve.CubicBeziers = class Curve_CubicBeziers extends Curve {
	constructor(cbs) {
		super();
		this.cbs = cbs;
		var n = this.cbs.length;
		this.delegate = (n == 0?
			function (t, succ, fail) {
				return fail;
			} : function (t, succ, fail) {
				var tn = t * n;
				var i = Math.floor(tn);
				if (i < 0) { i = 0; }
				if (i >= n) { i = n - 1; }
				var s = tn - i;
				var cb = cbs[i];
				return succ(cb, s);
			}
		);
	}
	
	startPosition() {
		return this.cbs[0].cp0;
	}
	
	endPosition() {
		return this.cbs[this.cbs.length - 1].cp3;
	}
	
	position(t) {
		return this.delegate(t, function (cb, s) { return cb.position(s) }, undefined);
	}
	
	derivative(t) {
		return this.delegate(t, function (cb, s) { return cb.derivative(s) }, undefined);
	}
	
	angle(t) {
		return this.delegate(t, function (cb, s) { return cb.angle(s) }, 0);
	}
	
	velocity(t) {
		var n = this.cbs.length;
		return this.delegate(t, function (cb, s) { return n * cb.velocity(s) }, 0);
	}
	
	boundingBox(vshift) {
		if (this.cbs.length == 0) {
			return undefined;
		}
		var bbox = this.cbs[0].boundingBox(vshift);
		var i, n = this.cbs.length;
		for (i = 1; i < n; i++) {
			bbox = bbox.combineRect(this.cbs[i].boundingBox(vshift))
		}
		return bbox;
	}
	
	tOfIntersections(frame) {
		var ts = [];
		var i = 0, n = this.cbs.length;
		for (i = 0; i < n; i++) {
			var cb = this.cbs[i];
			var unnormalizedTs = cb.tOfIntersections(frame);
			for (var j = 0; j < unnormalizedTs.length; j++) {
				ts.push((unnormalizedTs[j] + i) / n);
			}
		}
		return ts;
	}
	
	divide(t) {
		if (t < 0 || t > 1) {
			throw new TexError("ExecutionError", "illegal cubic Bezier parameter t:"+t);
		} else if (t === 0) {
			return [new Curve.CubicBeziers([]), this];
		} else if (t === 1) {
			return [this, new Curve.CubicBeziers([])];
		}
		
		var n = this.cbs.length;
		var tn = t * n;
		var i = Math.floor(tn);
		if (i === n) {
			i = n - 1;
		}
		var s = tn - i;
		var divS = this.cbs.slice(0, i);
		var divE = this.cbs.slice(i + 1);
		var cb = this.cbs[i];
		var divB = cb.divide(s);
		divS.push(divB[0]);
		divE.unshift(divB[1]);
		return [new Curve.CubicBeziers(divS), new Curve.CubicBeziers(divE)];
	}
	
	slice(t0, t1) {
		if (t0 >= t1) {
			return undefined;
		}
		
		if (t0 < 0) {
			t0 = 0;
		} 
		if (t1 > 1) {
			t1 = 1;
		}
		
		if (t0 === 0 && t1 === 1) {
			return this;
		}
		
		var n = this.cbs.length;
		var tn0 = t0 * n;
		var tn1 = t1 * n;
		var i0 = Math.floor(tn0);
		var i1 = Math.floor(tn1);
		if (i0 === n) {
			i0 = n - 1;
		}
		if (i1 === n) {
			i1 = n - 1;
		}
		var s0 = tn0 - i0;
		var s1 = tn1 - i1;
		var subBeziers;
		if (i0 === i1) {
			subBeziers = [this.cbs[i0].slice(s0, s1)];
		} else {
			subBeziers = this.cbs.slice(i0 + 1, i1);
			subBeziers.push(this.cbs[i1].slice(0, s1));
			subBeziers.unshift(this.cbs[i0].slice(s0, 1));
		}
		return new Curve.CubicBeziers(subBeziers);
	}
	
	countOfSegments() { return this.cbs.length; }
	
	drawPrimitive(svg, dasharray) {
		var n = this.cbs.length;
		var cbs = this.cbs;
		var cb = cbs[0];
		var cp0 = cb.cp0, cp1 = cb.cp1, cp2 = cb.cp2, cp3 = cb.cp3;
		var d = ("M"+xypicGlobalContext.measure.em2px(cp0.x)+","+xypicGlobalContext.measure.em2px(-cp0.y)+
				" C"+xypicGlobalContext.measure.em2px(cp1.x)+","+xypicGlobalContext.measure.em2px(-cp1.y)+
				" "+xypicGlobalContext.measure.em2px(cp2.x)+","+xypicGlobalContext.measure.em2px(-cp2.y)+
				" "+xypicGlobalContext.measure.em2px(cp3.x)+","+xypicGlobalContext.measure.em2px(-cp3.y));
		for (var i = 1; i < n; i++) {
			cb = cbs[i];
			cp2 = cb.cp2, cp3 = cb.cp3;
			d += " S"+xypicGlobalContext.measure.em2px(cp2.x)+","+xypicGlobalContext.measure.em2px(-cp2.y)+" "+xypicGlobalContext.measure.em2px(cp3.x)+","+xypicGlobalContext.measure.em2px(-cp3.y);
		}
		svg.createSVGElement("path", {"d":d, "stroke-dasharray":dasharray});
	}
	
	drawSkipped(svg) {
		var n = this.cbs.length;
		var cbs = this.cbs;
		var d = "";
		for (var i = 0; i < n; i+=2) {
			var cb = cbs[i];
			var cp0 = cb.cp0, cp1 = cb.cp1, cp2 = cb.cp2, cp3 = cb.cp3;
			d += ("M"+xypicGlobalContext.measure.em2px(cp0.x)+","+xypicGlobalContext.measure.em2px(-cp0.y)+
					" C"+xypicGlobalContext.measure.em2px(cp1.x)+","+xypicGlobalContext.measure.em2px(-cp1.y)+
					" "+xypicGlobalContext.measure.em2px(cp2.x)+","+xypicGlobalContext.measure.em2px(-cp2.y)+
					" "+xypicGlobalContext.measure.em2px(cp3.x)+","+xypicGlobalContext.measure.em2px(-cp3.y));
		}
		svg.createSVGElement("path", {"d":d});
	}

	static interpolation(ts, xs, ys) {
		var x12 = Curve.CubicBeziers.cubicSplineInterpolation(ts, xs);
		var x1 = x12[0];
		var x2 = x12[1];
		
		var y12 = Curve.CubicBeziers.cubicSplineInterpolation(ts, ys);
		var y1 = y12[0];
		var y2 = y12[1];
		
		var i, n = ts.length;
		var beziers = new Array(n-1);
		for (i = 0; i < n-1; i++) {
			beziers[i] = new Curve.CubicBezier(
				new Frame.Point(xs[i], ys[i]),
				new Frame.Point(x1[i], y1[i]),
				new Frame.Point(x2[i], y2[i]),
				new Frame.Point(xs[i+1], ys[i+1])
			)
		}
		return new Curve.CubicBeziers(beziers);
	}
	
	static cubicSplineInterpolation(ts, xs) {
		var n = ts.length-1;
		var hs = new Array(n);
		var i;
		for (i = 0; i < n; i++) {
			hs[i] = ts[i+1] - ts[i];
		}
		var as = new Array(n);
		for (i = 1; i < n; i++) {
			as[i] = 3*(xs[i+1] - xs[i])/hs[i] - 3*(xs[i] - xs[i-1])/hs[i-1];
		}
		var ls = new Array(n+1);
		var ms = new Array(n+1);
		var zs = new Array(n+1);
		ls[0] = 1;
		ms[0] = 0;
		zs[0] = 0;
		for (i = 1; i < n; i++) {
			ls[i] = 2*(ts[i+1] - ts[i-1]) - hs[i-1]*ms[i-1];
			ms[i] = hs[i]/ls[i];
			zs[i] = (as[i] - hs[i-1]*zs[i-1])/ls[i];
		}
		ls[n] = 1;
		zs[n] = 0;
		var bs = new Array(n);
		var cs = new Array(n+1);
		cs[n] = 0;
		for (i = n-1; i >= 0; i--) {
			var h = hs[i], c1 = cs[i+1], c0 = h*h*zs[i] - ms[i]*c1;
			cs[i] = c0;
			bs[i] = (xs[i+1] - xs[i]) - (c1 + 2*c0)/3;
		}
		var p1s = new Array(n);
		var p2s = new Array(n);
		for (i = 0; i < n; i++) {
			var a = xs[i], b = bs[i], c = cs[i];
			p1s[i] = a + b/3;
			p2s[i] = a + (2*b + c)/3;
		}
		return [p1s, p2s];
	}
};


// Curve.CubicBeziers factory class
Curve.CubicBSpline = class Curve_CubicBSpline {
	constructor(s, intCps, e) {
		if (intCps.length < 1) {
			throw new TexError("ExecutionError", "the number of internal control points of cubic B-spline must be greater than or equal to 1");
		}
		
		var controlPoints = [];
		controlPoints.push(s);
		for (var i = 0, l = intCps.length; i < l; i++) {
			controlPoints.push(intCps[i]);
		}
		controlPoints.push(e);
		this.cps = controlPoints;
		
		var n = this.cps.length - 1;
		var cps = function (i) {
			if (i < 0) {
				return controlPoints[0];
			} else if (i > n) {
				return controlPoints[n];
			} else {
				return controlPoints[i];
			}
		}
		var N = function (t) {
			var s = Math.abs(t);
			if (s <= 1) {
				return (3*s*s*s - 6*s*s + 4)/6;
			} else if (s <= 2) {
				return -(s-2)*(s-2)*(s-2)/6;
			} else {
				return 0;
			}
		}
		this.px = function (t) {
			var s = (n+2)*t-1;
			var minj = Math.ceil(s-2);
			var maxj = Math.floor(s+2);
			var p = 0;
			for (var j = minj; j <= maxj; j++) {
				p += N(s-j)*cps(j).x;
			}
			return p;
		}
		this.py = function (t) {
			var s = (n+2)*t-1;
			var minj = Math.ceil(s-2);
			var maxj = Math.floor(s+2);
			var p = 0;
			for (var j = minj; j <= maxj; j++) {
				p += N(s-j)*cps(j).y;
			}
			return p;
		}
		var dN = function (t) {
			var u = (t>0? 1 : (t<0? -1 : 0));
			var s = Math.abs(t);
			if (s <= 1) {
				return u*(3*s*s - 4*s)/2;
			} else if (s <= 2) {
				return -u*(s-2)*(s-2)/2;
			} else {
				return 0;
			}
		}
		this.dpx = function (t) {
			var s = (n+2)*t-1;
			var minj = Math.ceil(s-2);
			var maxj = Math.floor(s+2);
			var p = 0;
			for (var j = minj; j <= maxj; j++) {
				p += dN(s-j)*cps(j).x;
			}
			return p;
		}
		this.dpy = function (t) {
			var s = (n+2)*t-1;
			var minj = Math.ceil(s-2);
			var maxj = Math.floor(s+2);
			var p = 0;
			for (var j = minj; j <= maxj; j++) {
				p += dN(s-j)*cps(j).y;
			}
			return p;
		}
	}
	
	position(t) {
		return new Frame.Point(this.px(t), this.py(t));
	}
	
	angle(t) {
		return Math.atan2(this.dpy(t), this.dpx(t));
	}
	
	toCubicBeziers() {
		var cbs = [];
		var cps = this.cps;
		
		var cp0 = cps[0];
		var cp1 = cps[1];
		var cp2 = cps[2];
		var p0x = cp0.x;
		var p0y = cp0.y;
		var p1x = p0x+(cp1.x-p0x)/3;
		var p1y = p0y+(cp1.y-p0y)/3;
		var p2x = p0x+(cp1.x-p0x)*2/3;
		var p2y = p0y+(cp1.y-p0y)*2/3;
		var n1x = cp1.x+(cp2.x-cp1.x)/3;
		var n1y = cp1.y+(cp2.y-cp1.y)/3;
		var p3x = (p2x+n1x)/2;
		var p3y = (p2y+n1y)/2;
		var p0 = cp0;
		var p1 = new Frame.Point(p1x, p1y);
		var p2 = new Frame.Point(p2x, p2y);
		var p3 = new Frame.Point(p3x, p3y);
		var cb = new Curve.CubicBezier(p0, p1, p2, p3);
		cbs.push(cb);
		
		var len = this.cps.length - 1;
		for (var i=2; i < len; i++) {
			cp0 = cp1;
			cp1 = cp2;
			cp2 = cps[i+1];
			p0x = p3x;
			p0y = p3y;
			p1x = 2*p3x - p2x;
			p1y = 2*p3y - p2y;
			p2x = cp0.x+(cp1.x-cp0.x)*2/3;
			p2y = cp0.y+(cp1.y-cp0.y)*2/3;
			n1x = cp1.x+(cp2.x-cp1.x)/3;
			n1y = cp1.y+(cp2.y-cp1.y)/3;
			p3x = (p2x+n1x)/2;
			p3y = (p2y+n1y)/2;
			p0 = p3;
			p1 = new Frame.Point(p1x, p1y);
			p2 = new Frame.Point(p2x, p2y);
			p3 = new Frame.Point(p3x, p3y);
			cb = new Curve.CubicBezier(p0, p1, p2, p3);
			cbs.push(cb);
		}
		
		cp0 = cp1;
		cp1 = cp2;
		p0x = p3x;
		p0y = p3y;
		p1x = 2*p3x - p2x;
		p1y = 2*p3y - p2y;
		p2x = cp0.x+(cp1.x-cp0.x)*2/3;
		p2y = cp0.y+(cp1.y-cp0.y)*2/3;
		p3x = cp1.x;
		p3y = cp1.y;
		p0 = p3;
		p1 = new Frame.Point(p1x, p1y);
		p2 = new Frame.Point(p2x, p2y);
		p3 = new Frame.Point(p3x, p3y);
		cb = new Curve.CubicBezier(p0, p1, p2, p3);
		cbs.push(cb);
		
		return cbs;
	}
	
	countOfSegments() { return this.cps.length - 1; }
};


Curve.Line = class Curve_Line {
	constructor(s, e) {
		this.s = s;
		this.e = e;
	}
	
	position(t) {
		return new Frame.Point(
			this.s.x + t * (this.e.x - this.s.x),
			this.s.y + t * (this.e.y - this.s.y)
		);
	}
	
	slice(t0, t1) {
		if (t0 >= t1) {
			return undefined;
		}
		
		if (t0 < 0) {
			t0 = 0;
		}
		
		if (t1 > 1) {
			t1 = 1;
		}
		
		if (t0 === 0 && t1 === 1) {
			return this;
		}
		
		var s = this.s;
		var e = this.e;
		var dx = e.x - s.x;
		var dy = e.y - s.y;
		var newS = new Frame.Point(s.x + t0 * dx, s.y + t0 * dy);
		var newE = new Frame.Point(s.x + t1 * dx, s.y + t1 * dy);
		return new Curve.Line(newS, newE);
	}
	
	tOfIntersections(frame) {
		if (frame.isPoint()) {
			return []; // CAUTION: Point does not intersect with any curves.
		}
		
		var s = this.s;
		var e = this.e;
		if (frame.isRect()) {
			// find starting edge point
			var rx = frame.x + frame.r;
			var lx = frame.x - frame.l;
			var uy = frame.y + frame.u;
			var dy = frame.y - frame.d;
			
			var a0x = s.x;
			var a0y = s.y;
			var a1x = e.x - a0x;
			var a1y = e.y - a0y;
			var px = function (t) { return a0x + t * a1x; }
			var py = function (t) { return a0y + t * a1y; }
			
			var ts = [];
			var tsCandidate;
			tsCandidate = Curve.solutionsOfLinearEq(a1x, a0x - rx);
			tsCandidate = tsCandidate.concat(Curve.solutionsOfLinearEq(a1x, a0x - lx));
			for (var i = 0; i < tsCandidate.length; i++) {
				var t = tsCandidate[i];
				var y = py(t);
				if (y >= dy && y <= uy) {
					ts.push(t);
				}
			}
			tsCandidate = Curve.solutionsOfLinearEq(a1y, a0y - uy);
			tsCandidate = tsCandidate.concat(Curve.solutionsOfLinearEq(a1y, a0y - dy));
			for (var i = 0; i < tsCandidate.length; i++) {
				var t = tsCandidate[i];
				var x = px(t);
				if (x >= lx && x <= rx) {
					ts.push(t);
				}
			}
			
			return ts;
		} else if (frame.isCircle()) {
			var pi = Math.PI;
			var l = frame.l;
			var r = frame.r;
			var u = frame.u;
			var d = frame.d;
			var x0 = frame.x;
			var y0 = frame.y;
			var cx = x0 + (r - l) / 2;
			var cy = y0 + (u - d) / 2;
			var rx = (l + r) / 2;
			var ry = (u + d) / 2;
			
			var sx = s.x;
			var sy = s.y;
			var ex = e.x;
			var ey = e.y;
			
			var dx = ex - sx;
			var dy = ey - sy;
			var a0 = dy;
			var b0 = -dx;
			var c0 = dx * sy - dy * sx;
			var a = a0 * rx;
			var b = b0 * ry;
			var c = c0 * rx + (rx - ry) * b0 * cy;
			var aabb = a * a + b * b;
			var d = a * cx + b * cy + c;
			var e = -d / aabb;
			var ff = aabb * rx * rx - d * d;
			if (ff < 0) {
				return [];
			}
			var f = Math.sqrt(ff) / aabb;
			
			var xp = a * e + b * f + cx;
			var yp = b * e - a * f + cy;
			var xm = a * e - b * f + cx;
			var ym = b * e + a * f + cy;
			
			var eps = ry / rx;
			var xp0 = xp;
			var yp0 = eps * (yp - cy) + cy;
			var xm0 = xm;
			var ym0 = eps * (ym - cy) + cy;
			
			var tp, tm;
			if (Math.abs(dx) > Math.abs(dy)) {
				tp = (xp0 - sx) / dx;
				tm = (xm0 - sx) / dx;
			} else {
				tp = (yp0 - sy) / dy;
				tm = (ym0 - sy) / dy;
			}
			
			var ts = [];
			if (tp >= 0 && tp <= 1) {
				ts.push(tp);
			}
			if (tm >= 0 && tm <= 1) {
				ts.push(tm);
			}
			return ts;
		}
	}
	
	toShape(context, object, main, variant) {
		// 多重線の幅、点線・破線の幅の基準
		var env = context.env;
		var thickness = xypicGlobalContext.measure.thickness;
		var s = this.s;
		var e = this.e;
		if (s.x !== e.x || s.y !== e.y) {
			var dx = e.x - s.x;
			var dy = e.y - s.y;
			var angle = Math.atan2(dy, dx);
			var vshift;
			var shape = Shape.none;
			switch (main) {
				case "=":
					main = "-";
					variant = "2";
					break;
				case "==":
					main = "--";
					variant = "2";
					break;
				case ':':
				case '::':
					main = ".";
					variant = "2";
					break;
			}
			
			switch (main) {
				case '':
					// draw invisible line
					env.angle = angle;
					env.lastCurve = new LastCurve.Line(s, e, env.p, env.c, undefined);
					return shape;
					
				case '-':
				case '.':
				case '..':
					switch (variant) {
						case "2":
							vshift = thickness / 2;
							break;
							
						case "3":
							vshift = thickness;
							break;
							
						default:
							vshift = 0;
							break;
					}
					break;
					
				case '--':
					var dash = 3 * thickness;
					var len = Math.sqrt(dx * dx + dy * dy);
					if (len >= dash) {
						switch (variant) {
							case "2":
								vshift = thickness / 2;
								break;
								
							case "3":
								vshift = thickness;
								break;
								
							default:
								vshift = 0;
						}
					}
					break;
					
				case '~':
				case '~~':
					switch (variant) {
						case "2":
							vshift = 1.5 * thickness;
							break;
						case "3":
							vshift = 2 * thickness;
							break;
						default:
							vshift = 0
					}
					break;
					
				default:
					// connect by arrowheads
					var arrowBBox = object.boundingBox(context);
					if (arrowBBox == undefined) {
						env.angle = 0;
						env.lastCurve = LastCurve.none;
						return Shape.none;
					}
					
					var arrowLen = arrowBBox.l + arrowBBox.r;
					if (arrowLen == 0) {
						arrowLen = xypicGlobalContext.measure.strokeWidth;
					}
					
					var len = Math.sqrt(dx * dx + dy * dy);
					var n = Math.floor(len / arrowLen);
					if (n == 0) {
						env.angle = 0;
						env.lastCurve = LastCurve.none;
						return Shape.none;
					}
					
					vshift = Math.max(arrowBBox.u, arrowBBox.d);
			}
			
			if (vshift !== undefined) {
				var bbox = this.boundingBox(vshift);
				shape = new Shape.LineShape(this, object, main, variant, bbox);
				context.appendShapeToFront(shape);
				
				env.angle = angle;
				env.lastCurve = new LastCurve.Line(s, e, env.p, env.c, shape);
				return shape;
			}
		}
		
		env.angle = 0;
		env.lastCurve = LastCurve.none;
		return Shape.none;
	}
	
	boundingBox(vshift) {
		var s = this.s;
		var e = this.e;
		var dx = e.x - s.x;
		var dy = e.y - s.y;
		var angle = Math.atan2(dy, dx);
		var cx = vshift * Math.cos(angle + Math.PI/2);
		var cy = vshift * Math.sin(angle + Math.PI/2);
		return new Frame.Rect(s.x, s.y, {
			l:s.x-Math.min(s.x+cx, s.x-cx, e.x+cx, e.x-cx),
			r:Math.max(s.x+cx, s.x-cx, e.x+cx, e.x-cx)-s.x,
			u:Math.max(s.y+cy, s.y-cy, e.y+cy, e.y-cy)-s.y,
			d:s.y-Math.min(s.y+cy, s.y-cy, e.y+cy, e.y-cy)
		});
	}
	
	drawLine(svg, object, main, variant, holeRanges) {
		if (holeRanges.isEmpty) {
			this._drawLine(svg, object, main, variant);
		} else {
			var clippingRanges = new Range(0, 1).differenceRanges(holeRanges);
			var self = this;
			clippingRanges.foreach(function (range) {
				self.slice(range.start, range.end)._drawLine(svg, object, main, variant);
			});
		}
	}
	
	_drawLine(svg, object, main, variant) {
		// 多重線の幅、点線・破線の幅の基準
		var t = xypicGlobalContext.measure.thickness;
		var s = this.s;
		var e = this.e;
		if (s.x !== e.x || s.y !== e.y) {
			var dx = e.x - s.x;
			var dy = e.y - s.y;
			var angle = Math.atan2(dy, dx);
			var shift = { x:0, y:0 };
			
			switch (main) {
				case '':
					// draw nothing
					break;
				case '-':
					this.drawStraightLine(svg, s, e, shift, angle, t, variant, "");
					break;
				case '=':
					this.drawStraightLine(svg, s, e, shift, angle, t, "2", "");
					break;
				case '.':
				case '..':
					this.drawStraightLine(svg, s, e, shift, angle, t, variant, xypicGlobalContext.measure.dottedDasharray);
					break;
				case ':':
				case '::':
					this.drawStraightLine(svg, s, e, shift, angle, t, "2", xypicGlobalContext.measure.dottedDasharray);
					break;
				case '--':
				case '==':
					var len = Math.sqrt(dx * dx + dy * dy);
					var dash = 3 * t;
					if (len >= dash) {
						var shiftLen = (len - dash) / 2 - Math.floor((len - dash) / 2 / dash) * dash;
						shift = { x:shiftLen * Math.cos(angle), y:shiftLen * Math.sin(angle) };
						this.drawStraightLine(svg, s, e, shift, angle, t, (main === "=="? "2" : variant), xypicGlobalContext.measure.em2px(dash) + " " + xypicGlobalContext.measure.em2px(dash));
					}
					break;
				case '~':
					var len = Math.sqrt(dx * dx + dy * dy);
					var wave = 4 * t;
					if (len >= wave) {
						var n = Math.floor(len / wave);
						var shiftLen = (len - n * wave) / 2;
						shift = { x:shiftLen * Math.cos(angle), y:shiftLen * Math.sin(angle) };
						var cx = t * Math.cos(angle + Math.PI / 2);
						var cy = t * Math.sin(angle + Math.PI / 2);
						var tx = t * Math.cos(angle);
						var ty = t * Math.sin(angle);
						var sx = s.x + shift.x;
						var sy = -s.y - shift.y;
						var d = "M" + xypicGlobalContext.measure.em2px(sx) + "," + xypicGlobalContext.measure.em2px(sy) +
							" Q" + xypicGlobalContext.measure.em2px(sx + tx + cx) + "," + xypicGlobalContext.measure.em2px(sy - ty - cy) +
							" " + xypicGlobalContext.measure.em2px(sx + 2 * tx) + "," + xypicGlobalContext.measure.em2px(sy - 2 * ty) +
							" T" + xypicGlobalContext.measure.em2px(sx + 4 * tx) + "," + xypicGlobalContext.measure.em2px(sy - 4 * ty);
						for (var i = 1; i < n; i++) {
							d += " T" + xypicGlobalContext.measure.em2px(sx + (4 * i + 2) * tx) + "," + xypicGlobalContext.measure.em2px(sy - (4 * i + 2) * ty) +
								" T" + xypicGlobalContext.measure.em2px(sx + (4 * i + 4) * tx) + "," + xypicGlobalContext.measure.em2px(sy - (4 * i + 4) * ty);
						}
						this.drawSquigglyLineShape(svg, d, s, e, cx, cy, variant);
					}
					break;
				case '~~':
					var len = Math.sqrt(dx * dx + dy * dy);
					var wave = 4 * t;
					if (len >= wave) {
						var n = Math.floor((len - wave) / 2 / wave);
						var shiftLen = (len - wave) / 2 - n * wave;
						shift = { x:shiftLen * Math.cos(angle), y:shiftLen * Math.sin(angle) };
						var cx = t * Math.cos(angle + Math.PI / 2);
						var cy = t * Math.sin(angle + Math.PI / 2);
						var tx = t * Math.cos(angle);
						var ty = t * Math.sin(angle);
						var sx = s.x + shift.x;
						var sy = -s.y - shift.y;
						var d = "";
						for (var i = 0; i <= n; i++) {
							d += " M" + xypicGlobalContext.measure.em2px(sx + 8 * i * tx) + "," + xypicGlobalContext.measure.em2px(sy - 8 * i * ty) + 
								" Q" + xypicGlobalContext.measure.em2px(sx + (8 * i + 1) * tx + cx) + "," + xypicGlobalContext.measure.em2px(sy - (8 * i + 1) * ty - cy) + 
								" " + xypicGlobalContext.measure.em2px(sx + (8 * i + 2) * tx) + "," + xypicGlobalContext.measure.em2px(sy - (8 * i + 2) * ty) + 
								" T" + xypicGlobalContext.measure.em2px(sx + (8 * i + 4) * tx) + "," + xypicGlobalContext.measure.em2px(sy - (8 * i + 4) * ty);
						}
						this.drawSquigglyLineShape(svg, d, s, e, cx, cy, variant);
					}
					break;
					
				default:
					// connect by arrowheads
					var dummyEnv = new Env();
					dummyEnv.c = Env.originPosition;
					var dummyContext = new DrawingContext(Shape.none, dummyEnv);
					var arrowBBox = object.boundingBox(dummyContext);
					if (arrowBBox == undefined) {
						return;
					}
					
					var arrowLen = arrowBBox.l + arrowBBox.r;
					if (arrowLen == 0) {
						arrowLen = xypicGlobalContext.measure.strokeWidth;
					}
					
					var len = Math.sqrt(dx * dx + dy * dy);
					var n = Math.floor(len / arrowLen);
					if (n == 0) {
						return;
					}
					
					var shiftLen = (len - n * arrowLen) / 2;
					var cos = Math.cos(angle), sin = Math.sin(angle);
					var ac = arrowLen * cos, as = arrowLen * sin;
					var startX = s.x + (shiftLen + arrowBBox.l) * cos;
					var startY = s.y + (shiftLen + arrowBBox.l) * sin;
					
					var dummyContext = new DrawingContext(Shape.none, dummyEnv);
					for (var i = 0; i < n; i++) {
						dummyEnv.c = new Frame.Point(startX + i * ac, startY + i * as);
						dummyEnv.angle = angle;
						object.toDropShape(dummyContext).draw(svg);
					}
			}
		}
	}
	
	drawStraightLine(svg, s, e, shift, angle, t, variant, dasharray) {
		if (variant === "3") {
			var cx = t*Math.cos(angle+Math.PI/2);
			var cy = t*Math.sin(angle+Math.PI/2);
			svg.createSVGElement("line", {
				x1:xypicGlobalContext.measure.em2px(s.x+shift.x), y1:-xypicGlobalContext.measure.em2px(s.y+shift.y),
				x2:xypicGlobalContext.measure.em2px(e.x), y2:-xypicGlobalContext.measure.em2px(e.y), 
				"stroke-dasharray":dasharray
			});
			svg.createSVGElement("line", {
				x1:xypicGlobalContext.measure.em2px(s.x+cx+shift.x), y1:-xypicGlobalContext.measure.em2px(s.y+cy+shift.y),
				x2:xypicGlobalContext.measure.em2px(e.x+cx), y2:-xypicGlobalContext.measure.em2px(e.y+cy), 
				"stroke-dasharray":dasharray
			});
			svg.createSVGElement("line", {
				x1:xypicGlobalContext.measure.em2px(s.x-cx+shift.x), y1:-xypicGlobalContext.measure.em2px(s.y-cy+shift.y),
				x2:xypicGlobalContext.measure.em2px(e.x-cx), y2:-xypicGlobalContext.measure.em2px(e.y-cy), 
				"stroke-dasharray":dasharray
			});
		} else if (variant === "2") {
			var cx = t*Math.cos(angle+Math.PI/2)/2;
			var cy = t*Math.sin(angle+Math.PI/2)/2;
			svg.createSVGElement("line", {
				x1:xypicGlobalContext.measure.em2px(s.x+cx+shift.x), y1:-xypicGlobalContext.measure.em2px(s.y+cy+shift.y),
				x2:xypicGlobalContext.measure.em2px(e.x+cx), y2:-xypicGlobalContext.measure.em2px(e.y+cy), 
				"stroke-dasharray":dasharray
			});
			svg.createSVGElement("line", {
				x1:xypicGlobalContext.measure.em2px(s.x-cx+shift.x), y1:-xypicGlobalContext.measure.em2px(s.y-cy+shift.y),
				x2:xypicGlobalContext.measure.em2px(e.x-cx), y2:-xypicGlobalContext.measure.em2px(e.y-cy), 
				"stroke-dasharray":dasharray
			});
		} else {
			svg.createSVGElement("line", {
				x1:xypicGlobalContext.measure.em2px(s.x+shift.x), y1:-xypicGlobalContext.measure.em2px(s.y+shift.y),
				x2:xypicGlobalContext.measure.em2px(e.x), y2:-xypicGlobalContext.measure.em2px(e.y), 
				"stroke-dasharray":dasharray
			});
		}
	}
	
	drawSquigglyLineShape(svg, d, s, e, cx, cy, variant) {
		var g1, g2;
		if (variant === "3") {
			svg.createSVGElement("path", { d:d });
			g1 = svg.createGroup(svg.transformBuilder().translate(cx, cy));
			g1.createSVGElement("path", { d:d });
			g2 = svg.createGroup(svg.transformBuilder().translate(-cx, -cy));
			g2.createSVGElement("path", { d:d });
		} else if (variant === "2") {
			g1 = svg.createGroup(svg.transformBuilder().translate(cx / 2, cy / 2));
			g1.createSVGElement("path", { d:d });
			g2 = svg.createGroup(svg.transformBuilder().translate(-cx / 2, -cy / 2));
			g2.createSVGElement("path", { d:d });
		} else {
			svg.createSVGElement("path", { d:d });
		}
	}
};


export class CurveSegment {
	bezierFatLine(n) {
		var p0 = this.cps[0], pn = this.cps[n];
		var a, b, c, l;
		if (p0.x !== pn.x || p0.y !== pn.y) {
			a = p0.y-pn.y;
			b = pn.x-p0.x;
			l = Math.sqrt(a*a+b*b);
			a /= l;
			b /= l;
			c = (p0.x*pn.y-p0.y*pn.x)/l;
		} else {
			var angle = this.bezier.angle(this.tmin);
			a = -Math.sin(angle);
			b = Math.cos(angle);
			c = -a*this.cp0.x-b*this.cp0.y;
		}
		
		var cmin = c, cmax = c;
		for (var i = 1; i < n; i++) {
			var ci = -a*this.cps[i].x-b*this.cps[i].y;
			if (ci > cmax) {
				cmax = ci;
			} else if (ci < cmin) {
				cmin = ci;
			}
		}
		return {min:[a, b, cmin], max:[a, b, cmax]};
	}
	
	clippedLineRange(ps, lineMin, lineMax) {
		var n = ps.length - 1;
		var es = new Array(n+1);
		var extProd = XypicUtil.extProd;
		for (var i = 0; i <= n; i++) {
			es[i] = [i/n, -lineMin[0]*ps[i].x-lineMin[1]*ps[i].y-lineMin[2], 1];
		}
		
		var v;
		var vminAgainstLineMin, vmaxAgainstLineMin, t;
		if (es[0][1] < 0) {
			var allLiesBelow = true;
			for (i = 1; i <= n; i++) {
				var l0i = extProd(es[0], es[i]);
				v = -l0i[2]/l0i[0];
				if (v > 0 && v < 1 && (vminAgainstLineMin === undefined || v < vminAgainstLineMin)) {
					vminAgainstLineMin = v;
				}
				if (es[i][1] >= 0) {
					allLiesBelow = false;
				}
			}
			if (allLiesBelow) {
				// clip away everything.
				return undefined;
			}
		} else {
			vminAgainstLineMin = 0;
		}
		if (es[n][1] < 0) {
			for (i = 0; i < n; i++) {
				var lni = extProd(es[n], es[i]);
				v = -lni[2]/lni[0];
				if (v > 0 && v < 1 && (vmaxAgainstLineMin === undefined || v > vmaxAgainstLineMin)) {
					vmaxAgainstLineMin = v;
				}
			}
		} else {
			vmaxAgainstLineMin = 1;
		}
		
		for (i = 0; i <= n; i++) {
			es[i] = [i/n, lineMax[0]*ps[i].x+lineMax[1]*ps[i].y+lineMax[2], 1];
		}
		
		var vminAgainstLineMax, vmaxAgainstLineMax;
		if (es[0][1] < 0) {
			var allLiesAbove = true;
			for (i = 1; i <= n; i++) {
				var l0i = extProd(es[0], es[i]);
				v = -l0i[2]/l0i[0];
				if (v > 0 && v < 1 && (vminAgainstLineMax === undefined || v < vminAgainstLineMax)) {
					vminAgainstLineMax = v;
				}
				if (es[i][1] >= 0) {
					allLiesAbove = false;
				}
			}
			if (allLiesAbove) {
				// clip away everything.
				return undefined;
			}
		} else {
			vminAgainstLineMax = 0;
		}
		if (es[n][1] < 0) {
			for (i = 0; i < n; i++) {
				var lni = extProd(es[n], es[i]);
				v = -lni[2]/lni[0];
				if (v > 0 && v < 1 && (vmaxAgainstLineMax === undefined || v > vmaxAgainstLineMax)) {
					vmaxAgainstLineMax = v;
				}
			}
		} else {
			vmaxAgainstLineMax = 1;
		}
		
		var vmin = Math.max(vminAgainstLineMin, vminAgainstLineMax);
		var vmax = Math.min(vmaxAgainstLineMin, vmaxAgainstLineMax);
		return {min:this.tmin + vmin*(this.tmax - this.tmin), max:this.tmin + vmax*(this.tmax - this.tmin)};
	}

	static findIntersections(segment0, segment1) {
		var n = CurveSegment.maxIterations;
		var acc = CurveSegment.goalAccuracy;
		var queue = [[segment0, segment1, false]];
		var i = 0;
		var intersections = [];
		while (i < n && queue.length > 0) {
			i++;
			var head = queue.shift();
			var segment0 = head[0];
			var segment1 = head[1];
			var swapped = head[2];
			
			// segment0.drawFatLine();
			
			var fatLine = segment0.fatLine();
			var tminMax = segment1.clippedRange(fatLine.min, fatLine.max);
			if (tminMax == undefined) {
				// clip away everything
				continue;
			}
			
			var tmin = tminMax.min;
			var tmax = tminMax.max;
			var tlen = tmax - tmin;
			if (tlen < acc && segment0.paramLength() < acc) {
				// intersection found
				if (swapped) {
					intersections.push([segment1.clip(tmin, tmax).paramRange(), segment0.paramRange()]);
				} else {
					intersections.push([segment0.paramRange(), segment1.clip(tmin, tmax).paramRange()]);
				}
				continue;
			}
			if (tlen <= segment1.paramLength() * 0.8) {
				queue.push([segment1.clip(tmin, tmax), segment0, !swapped]);
			} else {
				// subdivision
				if (tlen > segment0.paramLength()) {
					var tmid = (tmax + tmin)/2;
					queue.push([segment1.clip(tmin, tmid), segment0, !swapped]);
					queue.push([segment1.clip(tmid, tmax), segment0, !swapped]);
				} else {
					var newSegment = segment1.clip(tmin, tmax);
					var range0 = segment0.paramRange();
					var mid0 = (range0.min + range0.max)/2;
					queue.push([newSegment, segment0.clip(range0.min, mid0), !swapped]);
					queue.push([newSegment, segment0.clip(mid0, range0.max), !swapped]);
				}
			}
		}
		return intersections;
	}
	
	static get maxIterations() { return 30; }
	static get goalAccuracy() { return 1e-4; }
};


CurveSegment.Line = class CurveSegment_Line extends CurveSegment {
	constructor(p0, p1, tmin, tmax) {
		super();
		this.p0 = p0;
		this.p1 = p1;
		this.tmin = tmin;
		this.tmax = tmax;
	}
	
	paramRange() { return { min: this.tmin, max: this.tmax }; }
	
	paramLength() { return this.tmax - this.tmin; }
	
	containsParam(t) { return t >= this.tmin && t <= this.tmax; }
	
	position(t) {
		return {
			x:this.p0.x + t*(this.p1.x - this.p0.x),
			y:this.p0.y + t*(this.p1.y - this.p0.y)
		};
	}
	
	fatLine() {
		var a = (this.p1.y - this.p0.y), 
			b = (this.p0.x - this.p1.x), c = this.p1.x*this.p0.y - this.p0.x*this.p1.y;
		var l = Math.sqrt(a * a + b * b);
		if (l === 0) {
			a = 1;
			b = 0;
		} else {
			a /= l;
			b /= l;
			c /= l;
		}
		return {min:[a, b, c], max:[a, b, c]};
	}
	
	clip(tmin, tmax) {
		return new CurveSegment.Line(this.p0, this.p1, tmin, tmax);
	}
	
	clippedRange(lineMin, lineMax) {
		var ps = new Array(2);
		ps[0] = this.position(this.tmin);
		ps[1] = this.position(this.tmax);
		return this.clippedLineRange(ps, lineMin, lineMax);
	}
	
	drawFatLine() {
		var fatLine = this.fatLine();
		var lmin = fatLine.min;
		var y = function (x, l) {
			return -(x*l[0] + l[2])/l[1];
		}
		var xmin = this.p0.x;
		var xmax = this.p1.x;
		xypicGlobalContext.svgForDebug.createSVGElement("line", {
			x1:xypicGlobalContext.measure.em2px(xmin), y1:-xypicGlobalContext.measure.em2px(y(xmin, lmax)),
			x2:xypicGlobalContext.measure.em2px(xmax), y2:-xypicGlobalContext.measure.em2px(y(xmax, lmax)),
			"stroke-width":xypicGlobalContext.measure.em2px(0.02 * xypicGlobalContext.measure.oneem), stroke:"red"
		});
	}
};


CurveSegment.QuadBezier = class CurveSegment_QuadBezier extends CurveSegment {
	constructor(bezier, tmin, tmax) {
		super();
		this.bezier = bezier;
		this.tmin = tmin;
		this.tmax = tmax;
		this.cp0 = bezier.position(tmin);
		this.cp1 = new Frame.Point(
			(1-tmax)*(1-tmin)*bezier.cp0.x + (tmin+tmax-2*tmin*tmax)*bezier.cp1.x + tmin*tmax*bezier.cp2.x,
			(1-tmax)*(1-tmin)*bezier.cp0.y + (tmin+tmax-2*tmin*tmax)*bezier.cp1.y + tmin*tmax*bezier.cp2.y
		);
		this.cp2 = bezier.position(tmax);
		this.cps = [this.cp0, this.cp1, this.cp2];
	}
	
	paramRange() { return { min: this.tmin, max: this.tmax }; }
	
	paramLength() { return this.tmax - this.tmin; }
	
	fatLine() { return this.bezierFatLine(2); }
	
	clip(tmin, tmax) {
		return new CurveSegment.QuadBezier(this.bezier, tmin, tmax);
	}
	
	clippedRange(lineMin, lineMax) {
		return this.clippedLineRange(this.cps, lineMin, lineMax);
	}
	
	drawFatLine() {
		var fatLine = this.fatLine();
		var lmin = fatLine.min;
		var lmax = fatLine.max;
		var y = function (x, l) {
			return -(x*l[0] + l[2])/l[1];
		}
		var xmin = this.cp0.x
		var xmax = this.cp2.x
		xypicGlobalContext.svgForDebug.createSVGElement("line", {
			x1:xypicGlobalContext.measure.em2px(xmin), y1:-xypicGlobalContext.measure.em2px(y(xmin, lmin)),
			x2:xypicGlobalContext.measure.em2px(xmax), y2:-xypicGlobalContext.measure.em2px(y(xmax, lmin)),
			"stroke-width":xypicGlobalContext.measure.em2px(0.02 * xypicGlobalContext.measure.oneem), stroke:"blue"
		});
		xypicGlobalContext.svgForDebug.createSVGElement("line", {
			x1:xypicGlobalContext.measure.em2px(xmin), y1:-xypicGlobalContext.measure.em2px(y(xmin, lmax)),
			x2:xypicGlobalContext.measure.em2px(xmax), y2:-xypicGlobalContext.measure.em2px(y(xmax, lmax)),
			"stroke-width":xypicGlobalContext.measure.em2px(0.02 * xypicGlobalContext.measure.oneem), stroke:"red"
		});
	}
};


CurveSegment.CubicBezier = class CurveSegment_CubicBezier extends CurveSegment {
	constructor(bezier, tmin, tmax) {
		super();
		this.bezier = bezier;
		this.tmin = tmin;
		this.tmax = tmax;
		this.cp0 = bezier.position(tmin);
		this.cp1 = new Frame.Point(
			(1-tmax)*(1-tmin)*(1-tmin)*bezier.cp0.x + (1-tmin)*(2*tmin+tmax-3*tmin*tmax)*bezier.cp1.x + tmin*(2*tmax+tmin-3*tmin*tmax)*bezier.cp2.x + tmin*tmin*tmax*bezier.cp3.x,
			(1-tmax)*(1-tmin)*(1-tmin)*bezier.cp0.y + (1-tmin)*(2*tmin+tmax-3*tmin*tmax)*bezier.cp1.y + tmin*(2*tmax+tmin-3*tmin*tmax)*bezier.cp2.y + tmin*tmin*tmax*bezier.cp3.y
		);
		this.cp2 = new Frame.Point(
			(1-tmin)*(1-tmax)*(1-tmax)*bezier.cp0.x + (1-tmax)*(2*tmax+tmin-3*tmin*tmax)*bezier.cp1.x + tmax*(2*tmin+tmax-3*tmin*tmax)*bezier.cp2.x + tmin*tmax*tmax*bezier.cp3.x,
			(1-tmin)*(1-tmax)*(1-tmax)*bezier.cp0.y + (1-tmax)*(2*tmax+tmin-3*tmin*tmax)*bezier.cp1.y + tmax*(2*tmin+tmax-3*tmin*tmax)*bezier.cp2.y + tmin*tmax*tmax*bezier.cp3.y
		);
		this.cp3 = bezier.position(tmax);
		this.cps = [this.cp0, this.cp1, this.cp2, this.cp3];
	}
	
	paramRange() { return { min: this.tmin, max: this.tmax }; }
	
	paramLength() { return this.tmax - this.tmin; }
	
	fatLine() { return this.bezierFatLine(3); }
	
	clip(tmin, tmax) {
		return new CurveSegment.CubicBezier(this.bezier, tmin, tmax);
	}
	
	clippedRange(lineMin, lineMax) {
		return this.clippedLineRange(this.cps, lineMin, lineMax);
	}
	
	drawFatLine() {
		var fatLine = this.fatLine();
		var lmin = fatLine.min;
		var lmax = fatLine.max;
		var y = function (x, l) {
			return -(x*l[0] + l[2])/l[1];
		}
		var xmin = this.cp0.x
		var xmax = this.cp3.x
		xypicGlobalContext.svgForDebug.createSVGElement("line", {
			x1:xypicGlobalContext.measure.em2px(xmin), y1:-xypicGlobalContext.measure.em2px(y(xmin, lmin)),
			x2:xypicGlobalContext.measure.em2px(xmax), y2:-xypicGlobalContext.measure.em2px(y(xmax, lmin)),
			"stroke-width":xypicGlobalContext.measure.em2px(0.02 * xypicGlobalContext.measure.oneem), stroke:"blue"
		});
		xypicGlobalContext.svgForDebug.createSVGElement("line", {
			x1:xypicGlobalContext.measure.em2px(xmin), y1:-xypicGlobalContext.measure.em2px(y(xmin, lmax)),
			x2:xypicGlobalContext.measure.em2px(xmax), y2:-xypicGlobalContext.measure.em2px(y(xmax, lmax)),
			"stroke-width":xypicGlobalContext.measure.em2px(0.02 * xypicGlobalContext.measure.oneem), stroke:"red"
		});
	}
};


CurveSegment.Arc = class CurveSegment_Arc extends CurveSegment {
	constructor(x, y, rx, ry, angleMin, angleMax) {
		super();
		this.x = x;
		this.y = y;
		this.rx = rx;
		this.ry = ry;
		this.angleMin = angleMin;
		this.angleMax = angleMax;
	}
	
	paramRange() { return { min: this.angleMin, max: this.angleMax }; }
	
	paramLength() { return this.angleMax - this.angleMin; }
	
	normalizeAngle(angle) {
		angle = angle % 2 * Math.PI;
		if (angle > Math.PI) {
			return angle - 2 * Math.PI;
		}
		if (angle < -Math.PI) {
			return angle + 2 * Math.PI;
		}
		return angle;
	}
	
	containsParam(angle) { return angle >= this.angleMin && angle <= this.angleMax; }
	
	fatLine() {
		var rx = this.rx;
		var ry = this.ry;
		var tp = (this.angleMax + this.angleMin) / 2;
		var tm = (this.angleMax - this.angleMin) / 2;
		var cosp = Math.cos(tp), sinp = Math.sin(tp);
		var r = Math.sqrt(rx * rx * sinp * sinp + ry * ry * cosp * cosp);
		if (r < XypicConstants.machinePrecision) {
			var Lmin = [1, 0, this.x * ry * cosp + this.y * rx * sinp + rx * ry * Math.cos(tm)];
			var Lmax = [1, 0, this.x * ry * cosp + this.y * rx * sinp + rx * ry];
		} else {
			var rrx = rx / r;
			var rry = ry / r;
			var Lmin = [-rry * cosp, -rrx * sinp, this.x * rry * cosp + this.y * rrx * sinp + rx * ry / r * Math.cos(tm)];
			var Lmax = [-rry * cosp, -rrx * sinp, this.x * rry * cosp + this.y * rrx * sinp + rx * ry / r];
		}
		return { min:Lmin, max:Lmax };
	}
	
	clip(angleMin, angleMax) {
		return new CurveSegment.Arc(this.x, this.y, this.rx, this.ry, angleMin, angleMax);
	}
	
	toCircleLine(line, x0, y0, rx, ry) {
		var a = line[0];
		var b = line[1];
		var c = line[2];
		var a2 = a * rx;
		var b2 = b * ry;
		var c2 = c * rx + (rx - ry) * b * y0;
		var l = Math.sqrt(a2 * a2 + b2 * b2);
		if (l < XypicConstants.machinePrecision) {
			a2 = 1;
			b2 = 0;
		} else {
			a2 /= l;
			b2 /= l;
			c2 /= l;
		}
		return [a2, b2, c2];
	}
	
	clippedRange(origLineMin, origLineMax) {
		var x = this.x;
		var y = this.y;
		var rx = this.rx;
		var ry = this.ry;
		
		var lineMin = this.toCircleLine(origLineMin, x, y, rx, ry);
		var lineMax = this.toCircleLine(origLineMax, x, y, rx, ry);
		var r = rx;
		
		var angleMin = this.angleMin;
		var angleMax = this.angleMax;
		var d = -(lineMin[0] * x + lineMin[1] * y + lineMin[2]);
		
		var sign = XypicUtil.sign2;
		var angles = [];
		var det = r * r - d * d;
		if (det >= 0) {
			var xp = lineMin[0] * d - lineMin[1] * Math.sqrt(r * r - d * d);
			var yp = lineMin[1] * d + lineMin[0] * Math.sqrt(r * r - d * d);
			var xm = lineMin[0] * d + lineMin[1] * Math.sqrt(r * r - d * d);
			var ym = lineMin[1] * d - lineMin[0] * Math.sqrt(r * r - d * d);
			var anglep = Math.atan2(yp, xp);
			var anglem = Math.atan2(ym, xm);
			if (this.containsParam(anglep)) {
				angles.push(anglep);
			}
			if (this.containsParam(anglem)) {
				angles.push(anglem);
			}
		}
		
		var d0 = -(lineMin[0] * (x + r * Math.cos(angleMin)) + lineMin[1] * (y + r * Math.sin(angleMin)) + lineMin[2]);
		var d1 = -(lineMin[0] * (x + r * Math.cos(angleMax)) + lineMin[1] * (y + r * Math.sin(angleMax)) + lineMin[2]);
		var angleMinAgainstLineMin, angleMaxAgainstLineMin;
		if (d0 < 0) {
			if (angles.length == 0) {
				// no intersection
				return undefined;
			}
			angleMinAgainstLineMin = Math.min.apply(Math, angles);
		} else {
			angleMinAgainstLineMin = this.angleMin;
		}
		if (d1 < 0) {
			if (angles.length == 0) {
				// no intersection
				return undefined;
			}
			angleMaxAgainstLineMin = Math.max.apply(Math, angles);
		} else {
			angleMaxAgainstLineMin = this.angleMax;
		}
		
		var d = lineMax[0] * x + lineMax[1] * y + lineMax[2];
		var angles = [];
		var det = r * r - d * d;
		if (det >= 0) {
			var xp = -lineMin[0] * d + lineMin[1] * Math.sqrt(r * r - d * d);
			var yp = -lineMin[1] * d - lineMin[0] * Math.sqrt(r * r - d * d);
			var xm = -lineMin[0] * d - lineMin[1] * Math.sqrt(r * r - d * d);
			var ym = -lineMin[1] * d + lineMin[0] * Math.sqrt(r * r - d * d);
			var anglep = Math.atan2(yp, xp);
			var anglem = Math.atan2(ym, xm);
			if (this.containsParam(anglep)) {
				angles.push(anglep);
			}
			if (this.containsParam(anglem)) {
				angles.push(anglem);
			}
		}
		
		var d0 = lineMax[0] * (x + r * Math.cos(angleMin)) + lineMax[1] * (y + r * Math.sin(angleMin)) + lineMax[2];
		var d1 = lineMax[0] * (x + r * Math.cos(angleMax)) + lineMax[1] * (y + r * Math.sin(angleMax)) + lineMax[2];
		var angleMinAgainstLineMax, angleMaxAgainstLineMax;
		if (d0 < 0) {
			if (angles.length == 0) {
				// no intersection
				return undefined;
			}
			angleMinAgainstLineMax = Math.min.apply(Math, angles);
		} else {
			angleMinAgainstLineMax = this.angleMin;
		}
		if (d1 < 0) {
			if (angles.length == 0) {
				// no intersection
				return undefined;
			}
			angleMaxAgainstLineMax = Math.max.apply(Math, angles);
		} else {
			angleMaxAgainstLineMax = this.angleMax;
		}
		
		return {
			min:Math.max(angleMinAgainstLineMin, angleMinAgainstLineMax), 
			max:Math.min(angleMaxAgainstLineMin, angleMaxAgainstLineMax)
		};
	}
	
	drawFatLine() {
		var fatLine = this.fatLine();
		var lmin = fatLine.min;
		var lmax = fatLine.max;
		var y = function (x, l) {
			return -(x * l[0] + l[2]) / l[1];
		}
		var x0 = this.x + this.r * Math.cos(this.angleMin);
		var x1 = this.x + this.r * Math.cos(this.angleMax);
		var xmin = x0;
		var xmax = x1;
		xypicGlobalContext.svgForDebug.createSVGElement("line", {
			x1:xypicGlobalContext.measure.em2px(xmin), y1:-xypicGlobalContext.measure.em2px(y(xmin, lmin)),
			x2:xypicGlobalContext.measure.em2px(xmax), y2:-xypicGlobalContext.measure.em2px(y(xmax, lmin)),
			"stroke-width":xypicGlobalContext.measure.em2px(0.02 * xypicGlobalContext.measure.oneem), stroke:"blue"
		});
		xypicGlobalContext.svgForDebug.createSVGElement("line", {
			x1:xypicGlobalContext.measure.em2px(xmin), y1:-xypicGlobalContext.measure.em2px(y(xmin, lmax)),
			x2:xypicGlobalContext.measure.em2px(xmax), y2:-xypicGlobalContext.measure.em2px(y(xmax, lmax)),
			"stroke-width":xypicGlobalContext.measure.em2px(0.02 * xypicGlobalContext.measure.oneem), stroke:"red"
		});
	}
};


export class LastCurve {};

LastCurve.None = class LastCurve_None extends LastCurve {
	constructor() {
		super();
	}

	get isDefined() { return false; }
	
	segments() { return []; }
	
	angle() { return 0; }
};

LastCurve.none = new LastCurve.None();


LastCurve.Line = class LastCurve_Line extends LastCurve {
	constructor(start, end, p, c, lineShape) {
		super();
		this.start = start;
		this.end = end;
		this.p = p;
		this.c = c;
		this.lineShape = lineShape; // line from start to end.
	}
	
	get isDefined() { return true; }
	
	position(t) {
		return new Frame.Point(
			this.p.x + t*(this.c.x - this.p.x),
			this.p.y + t*(this.c.y - this.p.y)
		);
	}
	
	derivative(t) {
		return new Frame.Point(
			this.c.x - this.p.x,
			this.c.y - this.p.y
		);
	}
	
	angle(t) {
		var dx = this.c.x - this.p.x;
		var dy = this.c.y - this.p.y;
		if (dx === 0 && dy === 0) {
			return 0;
		}
		return Math.atan2(dy, dx);
	}
	
	tOfPlace(shaveP, shaveC, factor, slideEm) {
		var start = (shaveP? this.start : this.p);
		var end = (shaveC? this.end : this.c);
		if (start.x === end.x && start.y === end.y) {
			return 0;
		} else {
			var dx = end.x - start.x;
			var dy = end.y - start.y;
			var l = Math.sqrt(dx * dx + dy * dy);
			var x, y;
			if (factor > 0.5) {
				x = end.x - (1 - factor) * dx + slideEm * dx / l;
				y = end.y - (1 - factor) * dy + slideEm * dy / l;
			} else {
				x = start.x + factor * dx + slideEm * dx / l;
				y = start.y + factor * dy + slideEm * dy / l;
			}
			var tx = this.c.x - this.p.x;
			var ty = this.c.y - this.p.y;
			if (tx === 0 && ty === 0) {
				return 0;
			}
			if (Math.abs(tx) > Math.abs(ty)) {
				return (x - this.p.x) / tx;
			} else {
				return (y - this.p.y) / ty;
			}
		}
	}
	
	sliceHole(holeFrame, t) {
		if (this.lineShape === undefined || holeFrame.isPoint()) {
			return;
		}
		var shape = this.lineShape;
		var line = shape.line;
		var intersections = line.tOfIntersections(holeFrame); // ts of the line from start to end.
		intersections.push(0);
		intersections.push(1);
		intersections.sort();
		
		var t0 = intersections[0];
		for (var i = 1; i < intersections.length; i++) {
			var t1 = intersections[i];
			var p = line.position((t1 + t0) / 2);
			if (holeFrame.contains(p)) {
				var range = new Range(t0, t1);
				shape.sliceHole(range);
			}
			t0 = t1;
		}
	}
	
	segments() {
		return [new CurveSegment.Line(this.p, this.c, 0, 1)];
	}
};


LastCurve.QuadBezier = class LastCurve_QuadBezier extends LastCurve {
	constructor(origBezier, tOfShavedStart, tOfShavedEnd, curveShape) {
		super();
		this.origBezier = origBezier; // unshaved
		this.tOfShavedStart = tOfShavedStart;
		this.tOfShavedEnd = tOfShavedEnd;
		if (!curveShape.isNone) {
			this.curveShape = curveShape;
			if (tOfShavedStart > 0) { curveShape.sliceHole(new Range(0, tOfShavedStart)); }
			if (tOfShavedEnd < 1) { curveShape.sliceHole(new Range(tOfShavedEnd, 1)); }
		}
	}
	
	get isDefined() { return true; }
	
	position(t) {
		return this.origBezier.position(t);
	}
	
	derivative(t) {
		return this.origBezier.derivative(t);
	}
	
	angle(t) {
		return this.origBezier.angle(t);
	}
	
	tOfPlace(shaveP, shaveC, factor, slide) {
		var offset;
		var normalizer;
		if (shaveP) {
			offset = this.tOfShavedStart;
			if (shaveC) {
				normalizer = this.tOfShavedEnd - this.tOfShavedStart;
			} else {
				normalizer = 1 - this.tOfShavedStart;
			}
		} else {
			offset = 0;
			if (shaveC) {
				normalizer = this.tOfShavedEnd;
			} else {
				normalizer = 1;
			}
		}
		var bezier = this.origBezier;
		var pos, angle;
		var normalizedFactor = offset + normalizer * factor;
		if (slide !== 0) {
			var fd = bezier.length(normalizedFactor);
			normalizedFactor = bezier.tOfLength(fd + slide);
		}
		return normalizedFactor;
	}
	
	sliceHole(holeFrame, t) {
		var shape = this.curveShape;
		if (shape === undefined || holeFrame.isPoint()) {
			return;
		}
		var curve = shape.curve;
		var intersections = curve.tOfIntersections(holeFrame); // ts of the curve from p to c.
		intersections.push(0);
		intersections.push(1);
		intersections.sort();
		
		var t0 = intersections[0];
		for (var i = 1; i < intersections.length; i++) {
			var t1 = intersections[i];
			if (t0 <= t && t <= t1) {
				var p = curve.position((t1 + t0) / 2);
				if (holeFrame.contains(p)) {
					var range = new Range(t0, t1);
					shape.sliceHole(range);
				}
			}
			t0 = t1;
		}
	}
	
	segments() {
		return [new CurveSegment.QuadBezier(this.origBezier, 0, 1)];
	}
};


LastCurve.CubicBezier = class LastCurve_CubicBezier extends LastCurve {
	constructor(origBezier, tOfShavedStart, tOfShavedEnd, curveShape) {
		super();
		this.origBezier = origBezier; // unshaved
		this.tOfShavedStart = tOfShavedStart;
		this.tOfShavedEnd = tOfShavedEnd;
		if (!curveShape.isNone) {
			this.curveShape = curveShape;
			if (tOfShavedStart > 0) { curveShape.sliceHole(new Range(0, tOfShavedStart)); }
			if (tOfShavedEnd < 1) { curveShape.sliceHole(new Range(tOfShavedEnd, 1)); }
		}
	}
	
	originalLine() {
		return this.originalLine;
	}
	
	get isDefined() { return true; }
	
	position(t) {
		return this.origBezier.position(t);
	}
	
	derivative(t) {
		return this.origBezier.derivative(t);
	}
	
	angle(t) {
		return this.origBezier.angle(t);
	}
	
	tOfPlace(shaveP, shaveC, factor, slide) {
		var offset;
		var normalizer;
		if (shaveP) {
			offset = this.tOfShavedStart;
			if (shaveC) {
				normalizer = this.tOfShavedEnd - this.tOfShavedStart;
			} else {
				normalizer = 1 - this.tOfShavedStart;
			}
		} else {
			offset = 0;
			if (shaveC) {
				normalizer = this.tOfShavedEnd;
			} else {
				normalizer = 1;
			}
		}
		var bezier = this.origBezier;
		var pos, angle;
		var normalizedFactor = offset + normalizer * factor;
		if (slide !== 0) {
			var fd = bezier.length(normalizedFactor);
			normalizedFactor = bezier.tOfLength(fd + slide);
		}
		return normalizedFactor;
	}
	
	sliceHole(holeFrame, t) {
		var shape = this.curveShape;
		if (shape === undefined || holeFrame.isPoint()) {
			return;
		}
		var curve = shape.curve;
		var intersections = curve.tOfIntersections(holeFrame); // ts of the curve from p to c.
		intersections.push(0);
		intersections.push(1);
		intersections.sort();
		
		var t0 = intersections[0];
		for (var i = 1; i < intersections.length; i++) {
			var t1 = intersections[i];
			if (t0 <= t && t <= t1) {
				var p = curve.position((t1 + t0) / 2);
				if (holeFrame.contains(p)) {
					var range = new Range(t0, t1);
					shape.sliceHole(range);
				}
			}
			t0 = t1;
		}
	}
	
	segments() {
		return [new CurveSegment.CubicBezier(this.origBezier, 0, 1)];
	}
};


LastCurve.CubicBSpline = class LastCurve_CubicBSpline extends LastCurve {
	constructor(s, e, origBeziers, tOfShavedStart, tOfShavedEnd, curveShape) {
		super();
		this.s = s;
		this.e = e;
		this.origBeziers = origBeziers; // unshaved
		this.tOfShavedStart = tOfShavedStart;
		this.tOfShavedEnd = tOfShavedEnd;
		if (!curveShape.isNone) {
			this.curveShape = curveShape;
			if (tOfShavedStart > 0) { curveShape.sliceHole(new Range(0, tOfShavedStart)); }
			if (tOfShavedEnd < 1) { curveShape.sliceHole(new Range(tOfShavedEnd, 1)); }
		}
	}
	
	get isDefined() { return true; }
	
	position(t) {
		return this.origBeziers.position(t);
	}
	
	derivative(t) {
		return this.origBeziers.derivative(t);
	}
	
	angle(t) {
		return this.origBeziers.angle(t);
	}
	
	tOfPlace(shaveP, shaveC, factor, slide) {
		var offset;
		var normalizer;
		if (shaveP) {
			offset = this.tOfShavedStart;
			if (shaveC) {
				normalizer = this.tOfShavedEnd - this.tOfShavedStart;
			} else {
				normalizer = 1 - this.tOfShavedStart;
			}
		} else {
			offset = 0;
			if (shaveC) {
				normalizer = this.tOfShavedEnd;
			} else {
				normalizer = 1;
			}
		}
		var beziers = this.origBeziers;
		var pos, angle;
		var normalizedFactor = offset + normalizer * factor;
		if (slide !== 0) {
			var fd = beziers.length(normalizedFactor);
			normalizedFactor = beziers.tOfLength(fd + slide);
		}
		return normalizedFactor;
	}
	
	sliceHole(holeFrame, t) {
		var shape = this.curveShape;
		if (shape === undefined || holeFrame.isPoint()) {
			return;
		}
		var curve = shape.curve;
		var intersections = curve.tOfIntersections(holeFrame); // ts of the curve from p to c.
		intersections.push(0);
		intersections.push(1);
		intersections.sort();
		
		var t0 = intersections[0];
		for (var i = 1; i < intersections.length; i++) {
			var t1 = intersections[i];
			if (t0 <= t && t <= t1) {
				var p = curve.position((t1 + t0) / 2);
				if (holeFrame.contains(p)) {
					var range = new Range(t0, t1);
					shape.sliceHole(range);
				}
			}
			t0 = t1;
		}
	}
	
	segments() {
		var segments = new Array(this.origBeziers.length);
		var n = segments.length;
		for (var i = 0; i < n; i++) {
			segments[i] = new CurveSegment.CubicBezier(this.origBezier, i/n, (i+1)/n);
		}
		return segments;
	}
};
