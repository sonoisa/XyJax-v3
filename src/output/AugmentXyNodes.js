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


 import createXypicError from "../core/XypicError.js";

import {XypicConstants} from "../util/XypicConstants.js";
import {xypicGlobalContext} from "../core/xypicGlobalContext.js";
import {XypicUtil} from "../util/XypicUtil.js";
import {List} from "../fp/List.js";
import {Option} from "../fp/Option.js";
import {AST} from "../input/XyNodes.js";
import {Shape} from "./Shapes.js";
import {Frame} from "./Frames.js";
import {Env, LastCurve, Curve, CurveSegment} from "./Curves.js";
import {DrawingContext} from "./DrawingContext.js";
import {Saving} from "./Saving.js";


// add methods to given class.
export function augment(klass, methods) {
	for (let name in methods) {
		if (!klass.prototype.hasOwnProperty(name)) {
			klass.prototype[name] = methods[name];
		} else {
			console.log("WARN", "method " + name + " is already exists in class " + klass.name);
		}
	}
}

augment(AST.PosDecor, {
	toShape: function (context) {
		this.pos.toShape(context);
		this.decor.toShape(context);
	}
});

augment(AST.Pos.Coord, {
	toShape: function (context) {
		context.env.c = this.coord.position(context);
		this.pos2s.foreach(function (p) { p.toShape(context); });
	}
});

augment(AST.Pos.Plus, {
	toShape: function (context) {
		var env = context.env;
		var pos = this.coord.position(context);
		env.c = pos.move(env.c.x + pos.x, env.c.y + pos.y);
	}
});

augment(AST.Pos.Minus, {
	toShape: function (context) {
		var env = context.env;
		var pos = this.coord.position(context);
		env.c = pos.move(env.c.x - pos.x, env.c.y - pos.y);
	}
});

augment(AST.Pos.Skew, {
	toShape: function (context) {
		var env = context.env;
		var pos = this.coord.position(context);
		var rp = new Frame.Point(pos.x + env.c.x, pos.y + env.c.y);
		env.c = rp.combineRect(env.c);
	}
});

augment(AST.Pos.Cover, {
	toShape: function (context) {
		var env = context.env;
		var pos = this.coord.position(context);
		env.c = env.c.combineRect(pos);
	}
});

augment(AST.Pos.Then, {
	toShape: function (context) {
		var env = context.env;
		env.capturePosition(env.c);
		env.c = this.coord.position(context);
	}
});

augment(AST.Pos.SwapPAndC, {
	toShape: function (context) {
		var env = context.env;
		env.swapPAndC();
		env.c = this.coord.position(context);
	}
});

augment(AST.Pos.SetBase, {
	toShape: function (context) {
		var env = context.env;
		var p = env.p;
		var x = env.c.x - p.x;
		var y = env.c.y - p.y;
		env.setOrigin(p.x, p.y);
		env.setXBase(x, y);
		env.setYBase(-y, x);
		env.c = this.coord.position(context);
	}
});

augment(AST.Pos.SetYBase, {
	toShape: function (context) {
		var env = context.env;
		env.setYBase(env.c.x - env.origin.x, env.c.y - env.origin.y);
		env.c = this.coord.position(context);
	}
});

augment(AST.Pos.ConnectObject, {
	toShape: function (context) {
		this.object.toConnectShape(context);
	}
});

augment(AST.Pos.DropObject, {
	toShape: function (context) {
		this.object.toDropShape(context);
	}
});

augment(AST.Pos.Place, {
	toShape: function (context) {
		var env = context.env;
		if (env.lastCurve.isDefined) {
			var place = this.place;
			var start, end, f, dimen;
			var shouldShaveP = (place.shaveP > 0);
			var shouldShaveC = (place.shaveC > 0);
			var jotP = (shouldShaveP? place.shaveP - 1 : 0);
			var jotC = (shouldShaveC? place.shaveC - 1 : 0);
			
			if (shouldShaveP) { f = 0; }
			if (shouldShaveC) { f = 1; }
			if (shouldShaveP == shouldShaveC) {
				f = 0.5;
			}
			if (place.factor !== undefined) {
				if (place.factor.isIntercept) {
					shouldShaveC = shouldShaveP = false;
					f = place.factor.value(context);
					if (f === undefined) {
						return;
					}
				} else {
					f = place.factor.value(context);
				}
			}
			
			dimen = xypicGlobalContext.measure.length2em(place.slide.dimen.getOrElse("0"));
			var jot = xypicGlobalContext.measure.jot;
			var slideEm = dimen + (jotP - jotC) * jot;
			var t = env.lastCurve.tOfPlace(shouldShaveP, shouldShaveC, f, slideEm);
			var pos = env.lastCurve.position(t);
			var angle = env.lastCurve.angle(t);
			env.c = pos;
			env.angle = angle;
			return t;
		}
		return undefined;
	}
});

augment(AST.Pos.PushCoord, {
	toShape: function (context) {
		var env = context.env;
		var pos = this.coord.position(context);
		env.pushPos(pos);
	}
});

augment(AST.Pos.EvalCoordThenPop, {
	toShape: function (context) {
		var env = context.env;
		env.c = this.coord.position(context);
		env.popPos();
	}
});

augment(AST.Pos.LoadStack, {
	toShape: function (context) {
		var env = context.env;
		env.startCapturePositions();
		this.coord.position(context);
		var positions = env.endCapturePositions();
		env.setStack(positions);
		env.pushPos(env.c);
	}
});

augment(AST.Pos.DoCoord, {
	toShape: function (context) {
		var env = context.env;
		var coord = this.coord;
		var pos = env.stack.reverse();
		pos.foreach(function (c) {
			env.c = c;
			coord.position(context);
		});
	}
});

augment(AST.Pos.InitStack, {
	toShape: function (context) {
		context.env.initStack();
	}
});

augment(AST.Pos.EnterFrame, {
	toShape: function (context) {
		context.env.enterStackFrame();
	}
});

augment(AST.Pos.LeaveFrame, {
	toShape: function (context) {
		context.env.leaveStackFrame();
	}
});

augment(AST.Place.Factor, {
	value: function (context) {
		return this.factor;
	}
});

augment(AST.Place.Intercept, {
	value: function (context) {
		var env = context.env;
		if (!env.lastCurve.isDefined) {
			return undefined;
		}
		
		var tmpEnv = env.duplicate();
		tmpEnv.angle = 0;
		tmpEnv.lastCurve = LastCurve.none;
		tmpEnv.p = tmpEnv.c = Env.originPosition;
		var tmpContext = new DrawingContext(Shape.none, tmpEnv);
		
		var box = this.pos.toShape(tmpContext);
		context.appendShapeToFront(tmpContext.shape);
		
		if (!tmpEnv.lastCurve.isDefined) {
			tmpEnv.lastCurve = new LastCurve.Line(tmpEnv.p, tmpEnv.c, tmpEnv.p, tmpEnv.c, undefined);
		}
		
		var intersec = [];
		var thisSegs = env.lastCurve.segments();
		var thatSegs = tmpEnv.lastCurve.segments();
		
		for (var i = 0; i < thisSegs.length; i++) {
			for (var j = 0; j < thatSegs.length; j++) {
				intersec = intersec.concat(CurveSegment.findIntersections(thisSegs[i], thatSegs[j]));
			}
		}
		
		if (intersec.length === 0) {
			// find the nearest point, if no intersection was found.
			console.log("perhaps no curve intersection.");
			
			// Levenberg-Marqardt Method
			var line0 = env.lastCurve;
			var line1 = tmpEnv.lastCurve;
			
			var n = 100; // maxIterations
			var goalAccuracy = 1e-5;
			var tau = 1e-3;
			
			var k = 0;
			var nu = 2;
			
			// TODO: 複数個の開始地点から探索し、尤もらしい解を選択する。
			var x0 = 0;
			var x1 = 0;
			
			var tx = function (x) {
				return 1 / (1 + Math.exp(-x));
			}
			var dtx = function (x) {
				var ex = Math.exp(-x);
				return ex / (1 + ex) / (1 + ex);
			}
			
			var t0 = tx(x0);
			var t1 = tx(x1);
			var dt0 = dtx(x0);
			var dt1 = dtx(x1);
			
			var dp0 = line0.derivative(t0);
			var dp1 = line1.derivative(t1);
			
			var j00 = dp0.x * dt0, j01 = -dp1.x * dt1;
			var j10 = dp0.y * dt0, j11 = -dp1.y * dt1;
			
			var a00 = j00 * j00 + j10 * j10, a01 = j00 * j01 + j10 * j11;
			var a10 = j01 * j00 + j11 * j10, a11 = j01 * j01 + j11 * j11;
			
			var p0 = line0.position(t0);
			var p1 = line1.position(t1);
			
			var f0 = p0.x - p1.x;
			var f1 = p0.y - p1.y;
			
			var g0 = j00 * f0 + j10 * f1;
			var g1 = j01 * f0 + j11 * f1;
			
			var stop = Math.sqrt(g0 * g0 + g1 * g1) < goalAccuracy;
			var mu = tau * Math.max(a00, a11);
			
			while (!stop && k < n) {
				k++;
				do {
					var am00 = a00 + mu, am01 = a01;
					var am10 = a10, am11 = a11 + mu;
					
					var det = am00 * am11 - am01 * am10;
					var d0 = (am11 * g0 - a01 * g1) / det;
					var d1 = (-am10 * g0 + a00 * g1) / det;
					
					if ((d0 * d0 + d1 * d1) < goalAccuracy * goalAccuracy * (x0 * x0 + x1 * x1)) {
						stop = true;
					} else {
						var newX0 = x0 - d0;
						var newX1 = x1 - d1;
						
						var newT0 = tx(newX0);
						var newT1 = tx(newX1);
						
						var newP0 = line0.position(newT0);
						var newP1 = line1.position(newT1);
						
						var newF0 = newP0.x - newP1.x;
						var newF1 = newP0.y - newP1.y;
						
						var rho = ((f0 * f0 + f1 * f1) - (newF0 * newF0 + newF1 * newF1)) / (d0 * (mu * d0 + g0) + d1 * (mu * d1 + g1));
						
						if (rho > 0) {
							x0 = newX0;
							x1 = newX1;
							t0 = newT0;
							t1 = newT1;
							dt0 = dtx(x0);
							dt1 = dtx(x1);
							dp0 = line0.derivative(t0);
							dp1 = line1.derivative(t1);
							j00 = dp0.x * dt0;  j01 = -dp1.x * dt1;
							j10 = dp0.y * dt0;  j11 = -dp1.y * dt1;
							a00 = j00 * j00 + j10 * j10;  a01 = j00 * j01 + j10 * j11;
							a10 = j01 * j00 + j11 * j10;  a11 = j01 * j01 + j11 * j11;
							f0 = newF0;
							f1 = newF1;
							g0 = j00 * f0 + j10 * f1;
							g1 = j01 * f0 + j11 * f1;
							stop = Math.sqrt(g0 * g0 + g1 * g1) < goalAccuracy;
							var sigma = 2 * rho - 1;
							mu = mu + Math.max(1 / 3, 1 - sigma * sigma * sigma);
							nu = 2;
						} else {
							mu = mu * nu;
							nu = 2 * nu;
						}
					}
				} while (!stop && !(rho !== undefined && rho > 0))
			}
			
			return tx(x0);
		} else {
			var t = (intersec[0][0].min + intersec[0][0].max)/2;
			for (var i = 1; i < intersec.length; i++) { 
				var ttmp = (intersec[i][0].min + intersec[i][0].max)/2;
				if (t > ttmp) { t = ttmp; }
			}
			return t;
		}
	}
});

augment(AST.Pos.SavePos, {
	toShape: function (context) {
		var env = context.env;
		env.savePos(this.id, new Saving.Position(env.c));
	}
});

augment(AST.Pos.SaveMacro, {
	toShape: function (context) {
		var env = context.env;
		env.savePos(this.id, new Saving.Macro(this.macro));
	}
});

augment(AST.Pos.SaveBase, {
	toShape: function (context) {
		var env = context.env;
		env.savePos(this.id, new Saving.Base(env.origin, env.xBase, env.yBase));
	}
});

augment(AST.Pos.SaveStack, {
	toShape: function (context) {
		var env = context.env;
		env.savePos(this.id, new Saving.Stack(env.stack));
	}
});

augment(AST.Object, {
	toDropShape: function (context) {
		var env = context.env;
		if (env.c === undefined) {
			return Shape.none;
		}
		
		var modifiers = this.modifiers;
		if (modifiers.isEmpty) {
			return this.object.toDropShape(context);
		} else {
			var tmpEnv = env.duplicate();
			var subcontext = new DrawingContext(Shape.none, tmpEnv);
			var reversedProcessedModifiers = List.empty;
			modifiers.foreach(function (m) {
				m.preprocess(subcontext, reversedProcessedModifiers);
				reversedProcessedModifiers = reversedProcessedModifiers.prepend(m);
			});
			var objectShape = this.object.toDropShape(subcontext);
			var objectBoundingBox = tmpEnv.c;
			if (objectBoundingBox === undefined) {
				return Shape.none;
			}
			var originalReferencePoint = tmpEnv.originalReferencePoint;
			tmpEnv = env.duplicate(); // restore angle
			tmpEnv.c = objectBoundingBox;
			tmpEnv.originalReferencePoint = originalReferencePoint;
			subcontext = new DrawingContext(Shape.none, tmpEnv);
			objectShape = modifiers.head.modifyShape(subcontext, objectShape, modifiers.tail);
			context.appendShapeToFront(objectShape);
			env.c = tmpEnv.c.move(env.c.x, env.c.y);
			return objectShape;
		}
	},
	toConnectShape: function (context) {
		var env = context.env;
		if (env.c === undefined) {
			return Shape.none;
		}
		
		var modifiers = this.modifiers;
		if (modifiers.isEmpty) {
			return this.object.toConnectShape(context);
		} else {
			var tmpEnv = env.duplicate();
			var subcontext = new DrawingContext(Shape.none, tmpEnv);
			var reversedProcessedModifiers = List.empty;
			modifiers.foreach(function (m) {
				m.preprocess(subcontext, reversedProcessedModifiers);
				reversedProcessedModifiers = reversedProcessedModifiers.prepend(m);
			});
			var objectShape = this.object.toConnectShape(subcontext);
			env.angle = tmpEnv.angle;
			env.lastCurve = tmpEnv.lastCurve;
			var objectBoundingBox = tmpEnv.c;
			if (objectBoundingBox === undefined) {
				return Shape.none;
			}
			var originalReferencePoint = tmpEnv.originalReferencePoint;
			tmpEnv = env.duplicate(); // restore angle
			tmpEnv.c = objectBoundingBox;
			tmpEnv.originalReferencePoint = originalReferencePoint;
			subcontext = new DrawingContext(Shape.none, tmpEnv);
			objectShape = modifiers.head.modifyShape(subcontext, objectShape, modifiers.tail);
			context.appendShapeToFront(objectShape);
			env.c = tmpEnv.c.move(env.c.x, env.c.y);
			return objectShape;
		}
	},
	boundingBox: function (context) {
		var tmpEnvContext = context.duplicateEnv();
		var tmpEnv = tmpEnvContext.env;
		tmpEnv.angle = 0;
		tmpEnv.p = tmpEnv.c = Env.originPosition;
		tmpEnvContext.shape = Shape.none;
		var dropShape = this.toDropShape(tmpEnvContext);
		return dropShape.getBoundingBox();
	}
});

augment(AST.ObjectBox, {
	toConnectShape: function (context) {
		// 多重線の幅、点線・破線の幅の基準
		var env = context.env;
		var origC = env.c;
		var env = context.env;
		var t = xypicGlobalContext.measure.thickness;
		var s = env.p.edgePoint(env.c.x, env.c.y);
		var e = env.c.edgePoint(env.p.x, env.p.y);
		if (s.x !== e.x || s.y !== e.y) {
			var shape = new Curve.Line(s, e).toShape(context, this, "196883" /* dummy dir name */, "");
			env.originalReferencePoint = origC;
			return shape;
		} else {
			env.angle = 0;
			env.lastCurve = LastCurve.none;
			env.originalReferencePoint = origC;
			return Shape.none;
		}
	},
	boundingBox: function (context) {
		var tmpEnvContext = context.duplicateEnv();
		var tmpEnv = tmpEnvContext.env;
		tmpEnv.angle = 0;
		tmpEnv.p = tmpEnv.c = Env.originPosition;
		tmpEnvContext.shape = Shape.none;
		var dropShape = this.toDropShape(tmpEnvContext);
		return dropShape.getBoundingBox();
	}
});

augment(AST.ObjectBox.WrapUpObject, {
	toDropShape: function (context) {
		var env = context.env;
		var shape = this.object.toDropShape(context);
		env.originalReferencePoint = env.c;
		return shape;
	},
	toConnectShape: function (context) {
		var env = context.env;
		var shape = this.object.toConnectShape(context);
		env.originalReferencePoint = env.c;
		return shape;
	}
});

augment(AST.ObjectBox.CompositeObject, {
	toDropShape: function (context) {
		var env = context.env;
		var origC = env.c;
		if (origC === undefined) {
			return Shape.none;
		}
		var c = origC;
		var tmpEnv = env.duplicate();
		var subcontext = new DrawingContext(Shape.none, tmpEnv);
		this.objects.foreach(function (obj) {
			tmpEnv.c = origC;
			var tmpShape = obj.toDropShape(subcontext);
			c = Frame.combineRect(c, tmpEnv.c);
			c = Frame.combineRect(c, tmpShape.getBoundingBox().toPoint());
		});
		env.c = c;
		var compositeShape = subcontext.shape;
		context.appendShapeToFront(compositeShape);
		env.originalReferencePoint = origC;
		return compositeShape;
	}
});

augment(AST.ObjectBox.Xybox, {
	toDropShape: function (context) {
		var env = context.env;
		var c = env.c;
		if (c === undefined) {
			return Shape.none;
		}
		var subenv = new Env();
		var subcontext = new DrawingContext(Shape.none, subenv);
		this.posDecor.toShape(subcontext);
		var subshape = subcontext.shape;
		var bbox = subshape.getBoundingBox();
		if (bbox === undefined) {
			return Shape.none;
		}
		var l = Math.max(0, bbox.l - bbox.x);
		var r = Math.max(0, bbox.r + bbox.x);
		var u = Math.max(0, bbox.u + bbox.y);
		var d = Math.max(0, bbox.d - bbox.y);
		env.c = new Frame.Rect(c.x, c.y, { l:l, r:r, u:u, d:d });
		env.originalReferencePoint = c;
		var objectShape = new Shape.TranslateShape(c.x, c.y, subshape);
		context.appendShapeToFront(objectShape);
		return objectShape;
	}
});

augment(AST.ObjectBox.Xymatrix, {
	toDropShape: function (context) {
		var env = context.env;
		var c = env.c;
		var shape = this.xymatrix.toShape(context);
		env.originalReferencePoint = c;
		return shape;
	}
});

augment(AST.ObjectBox.Text, {
	toDropShape: function (context) {
		var env = context.env;
		var textShape = new Shape.TextShape(env.c, this.math);
		context.appendShapeToFront(textShape);
		env.c = textShape.getBoundingBox();
		env.originalReferencePoint = textShape.getOriginalReferencePoint();
		return textShape;
	}
});

augment(AST.ObjectBox.Empty, {
	toDropShape: function (context) {
		var env = context.env;
		env.originalReferencePoint = env.c;
		env.c = new Frame.Point(env.c.x, env.c.y);
		return Shape.none;
	}
});


augment(AST.ObjectBox.Txt, {
	toDropShape: function (context) {
		var env = context.env;
		if (env.c === undefined) {
			return Shape.none;
		}
		// TODO change width
		var textShape = this.textObject.toDropShape(context);
		env.originalReferencePoint = env.c;
		return textShape;
	}
});
augment(AST.ObjectBox.Txt.Width.Vector, {
	width: function (context) {
		return this.vector.xy().x;
	}
});
augment(AST.ObjectBox.Txt.Width.Default, {
	width: function (context) {
		var c = context.env.c;
		return c.r + c.l;
	}
});

augment(AST.ObjectBox.Cir, {
	toDropShape: function (context) {
		var env = context.env;
		if (env.c === undefined) {
			return Shape.none;
		}
		env.originalReferencePoint = env.c;
		var r = this.radius.radius(context);
		var x = env.c.x;
		var y = env.c.y;
		var circleShape = this.cir.toDropShape(context, x, y, r);
		env.c = new Frame.Ellipse(x, y, r, r, r, r);
		
		return circleShape;
	},
	toConnectShape: function (context) {
		// TODO: 何もしなくてよいかTeXの出力結果を確認する。
		var env = context.env;
		env.originalReferencePoint = env.c;
		return Shape.none;
	}
});

augment(AST.ObjectBox.Cir.Radius.Vector, {
	radius: function (context) {
		return this.vector.xy(context).x;
	}
});
augment(AST.ObjectBox.Cir.Radius.Default, {
	radius: function (context) {
		return context.env.c.r;
	}
});
augment(AST.ObjectBox.Cir.Cir.Segment, {
	toDropShape: function (context, x, y, r) {
		var env = context.env;
		var sa = this.startPointDegree(context);
		var ea = this.endPointDegree(context, sa);
		var da = ea - sa;
		da = (da < 0? da + 360 : da);
		if (da === 0) {
			return Shape.none;
		}
		
		var large, flip;
		if (this.orient === "^") {
			large = (da > 180? "1" : "0");
			flip = "0";
		} else {
			large = (da > 180? "0" : "1");
			flip = "1";
		}
		
		var degToRadCoef = Math.PI / 180;
		var sx = x + r * Math.cos(sa * degToRadCoef);
		var sy = y + r * Math.sin(sa * degToRadCoef);
		var ex = x + r * Math.cos(ea * degToRadCoef);
		var ey = y + r * Math.sin(ea * degToRadCoef);
		
		var circleSegmentShape = new Shape.CircleSegmentShape(x, y, sx, sy, r, large, flip, ex, ey);
		context.appendShapeToFront(circleSegmentShape);
		return circleSegmentShape;
	},
	startPointDegree: function (contect) {
		var sd = this.startDiag.toString();
		var sa;
		if (this.orient === "^") {
			sa = this.diagToAngleACW(sd);
		} else {
			sa = this.diagToAngleCW(sd);
		}
		return sa;
	},
	endPointDegree: function (contect, startAngle) {
		var ed = this.endDiag.toString();
		var ea;
		if (this.orient === "^") {
			ea = this.diagToAngleACW(ed, startAngle);
		} else {
			ea = this.diagToAngleCW(ed, startAngle);
		}
		return ea;
	},
	diagToAngleACW: function (diag, angle) {
		switch (diag) {
			case "l": return 90;
			case "r": return -90;
			case "d": return 180;
			case "u": return 0;
			case "dl":
			case "ld":
				return 135;
			case "dr":
			case "rd":
				return -135;
			case "ul":
			case "lu":
				return 45;
			case "ur":
			case "ru":
				return -45;
			default:
				if (angle !== undefined) {
					return angle + 180;
				} else {
					return 0;
				}
		}
	},
	diagToAngleCW: function (diag, angle) {
		switch (diag) {
			case "l": return -90;
			case "r": return 90;
			case "d": return 0;
			case "u": return 180;
			case "dl":
			case "ld":
				return -45;
			case "dr":
			case "rd":
				return 45;
			case "ul":
			case "lu":
				return -135;
			case "ur":
			case "ru":
				return 135;
			default:
				if (angle !== undefined) {
					return angle + 180;
				} else {
					return 0;
				}
		}
	}
});
augment(AST.ObjectBox.Cir.Cir.Full, {
	toDropShape: function (context, x, y, r) {
		var fullCircleShape = new Shape.FullCircleShape(x, y, r);
		context.appendShapeToFront(fullCircleShape);
		return fullCircleShape;
	}
});

augment(AST.ObjectBox.Frame, {
	toDropShape: function (context) {
		var env = context.env;
		env.originalReferencePoint = env.c;
		return this.toDropFilledShape(context, "currentColor", false)
	},
	toDropFilledShape: function (context, color, convertToEllipse) {
		var env = context.env;
		var c = env.c;
		if (c === undefined) {
			return Shape.none;
		}
		
		var t = xypicGlobalContext.measure.thickness;
		var x = c.x;
		var y = c.y;
		var left = c.l;
		var right = c.r;
		var up = c.u;
		var down = c.d;
		var shape = Shape.none;
		switch (this.main) {
			case '--':
				var dash = 3 * t;
				if (convertToEllipse) {
					var xy = this.radius.xy(context);
					shape = new Shape.EllipseShape(x + (right - left) / 2, y + (up - down) / 2, xy.x, xy.y, false, color, xypicGlobalContext.measure.em2px(dash) + " " + xypicGlobalContext.measure.em2px(dash));
				} else {
					var radius = this.radius.radius(context);
					shape = new Shape.RectangleShape(x, y, left, right, up, down, radius, false, color, xypicGlobalContext.measure.em2px(dash) + " " + xypicGlobalContext.measure.em2px(dash));
				}
				break;
				
			case '==':
				var dash = 3 * t;
				if (convertToEllipse) {
					var xy = this.radius.xy(context);
					shape = new Shape.EllipseShape(x + (right - left) / 2, y + (up - down) / 2, xy.x, xy.y, true, color, xypicGlobalContext.measure.em2px(dash) + " " + xypicGlobalContext.measure.em2px(dash));
				} else {
					var radius = this.radius.radius(context);
					shape = new Shape.RectangleShape(x, y, left, right, up, down, radius, true, color, xypicGlobalContext.measure.em2px(dash) + " " + xypicGlobalContext.measure.em2px(dash));
				}
				break;
				
			case 'o-':
				var dash = 3 * t;
				var radius = xypicGlobalContext.measure.lineElementLength;
				shape = new Shape.RectangleShape(x, y, left, right, up, down, radius, false, color, xypicGlobalContext.measure.em2px(dash) + " " + xypicGlobalContext.measure.em2px(dash));
				break;
				
			case 'oo':
				var xy = this.radius.xy(context);
				var r = xy.x;
				shape = new Shape.EllipseShape(x + (right - left) / 2, y + (up - down) / 2, r, r, true, color, undefined);
				break;
				
			case 'ee':
				var xy = this.radius.xy(context);
				shape = new Shape.EllipseShape(x + (right - left) / 2, y + (up - down) / 2, xy.x, xy.y, true, color, undefined);
				break;
				
			case '-,':
				var depth = this.radius.depth(context);
				var radius = this.radius.radius(context);
				shape = new Shape.CompositeShape(
					new Shape.RectangleShape(x, y, left, right, up, down, radius, false, color, undefined),
					new Shape.BoxShadeShape(x, y, left, right, up, down, depth)
				);
				break;
				
			case '.o':
				var xy = this.radius.xy(context);
				var r = xy.x;
				shape = new Shape.EllipseShape(x + (right - left) / 2, y + (up - down) / 2, r, r, false, color, xypicGlobalContext.measure.dottedDasharray);
				break;
				
			case '-o':
				var dash = 3 * t;
				var xy = this.radius.xy(context);
				var r = xy.x;
				shape = new Shape.EllipseShape(x + (right - left) / 2, y + (up - down) / 2, r, r, false, color, xypicGlobalContext.measure.em2px(dash) + " " + xypicGlobalContext.measure.em2px(dash));
				break;
				
			case '.e':
				var xy = this.radius.xy(context);
				shape = new Shape.EllipseShape(x + (right - left) / 2, y + (up - down) / 2, xy.x, xy.y, false, color, xypicGlobalContext.measure.dottedDasharray);
				break;
				
			case '-e':
				var dash = 3 * t;
				var xy = this.radius.xy(context);
				shape = new Shape.EllipseShape(x + (right - left) / 2, y + (up - down) / 2, xy.x, xy.y, false, color, xypicGlobalContext.measure.em2px(dash) + " " + xypicGlobalContext.measure.em2px(dash));
				break;
				
			case '-':
				if (convertToEllipse) {
					var xy = this.radius.xy(context);
					shape = new Shape.EllipseShape(x + (right - left) / 2, y + (up - down) / 2, xy.x, xy.y, false, color, undefined);
				} else {
					var radius = this.radius.radius(context);
					shape = new Shape.RectangleShape(x, y, left, right, up, down, radius, false, color, undefined);
				}
				break;
				
			case '=':
				if (convertToEllipse) {
					var xy = this.radius.xy(context);
					shape = new Shape.EllipseShape(x + (right - left) / 2, y + (up - down) / 2, xy.x, xy.y, true, color, undefined);
				} else {
					var radius = this.radius.radius(context);
					shape = new Shape.RectangleShape(x, y, left, right, up, down, radius, true, color, undefined);
				}
				break;
				
			case '.':
				if (convertToEllipse) {
					var xy = this.radius.xy(context);
					shape = new Shape.EllipseShape(x + (right - left) / 2, y + (up - down) / 2, xy.x, xy.y, false, color, xypicGlobalContext.measure.dottedDasharray);
				} else {
					var radius = this.radius.radius(context);
					shape = new Shape.RectangleShape(x, y, left, right, up, down, radius, false, color, xypicGlobalContext.measure.dottedDasharray);
				}
				break;
				
			case ',':
				var depth = this.radius.depth(context);
				shape = new Shape.BoxShadeShape(x, y, left, right, up, down, depth, color);
				break;
				
			case 'o':
				var xy = this.radius.xy(context);
				var r = xy.x;
				shape = new Shape.EllipseShape(x + (right - left) / 2, y + (up - down) / 2, r, r, false, color, undefined);
				break;
				
			case 'e':
				var xy = this.radius.xy(context);
				shape = new Shape.EllipseShape(x + (right - left) / 2, y + (up - down) / 2, xy.x, xy.y, false, color, undefined);
				break;
				
			case '\\{':
				shape = new Shape.LeftBrace(x - left, y, up, down, 0, color);
				break;
				
			case '\\}':
				shape = new Shape.LeftBrace(x + right, y, down, up, 180, color);
				break;
				
			case '^\\}':
			case '^\\{':
				shape = new Shape.LeftBrace(x, y + up, right, left, 270, color);
				break;
				
			case '_\\{':
			case '_\\}':
				shape = new Shape.LeftBrace(x, y - down, left, right, 90, color);
				break;
				
			case '(':
				shape = new Shape.LeftParenthesis(x - left, y + (up - down) / 2, up + down, 0, color);
				break;
				
			case ')':
				shape = new Shape.LeftParenthesis(x + right, y + (up - down) / 2, up + down, 180, color);
				break;
				
			case '^(':
			case '^)':
				shape = new Shape.LeftParenthesis(x + (right - left) / 2, y + up, left + right, 270, color);
				break;
				
			case '_(':
			case '_)':
				shape = new Shape.LeftParenthesis(x + (right - left) / 2, y - down, left + right, 90, color);
				break;
				
			case '*':
				if (c.isCircle()) {
					var xy = this.radius.xy(context);
					shape = new Shape.EllipseShape(x + (right - left) / 2, y + (up - down) / 2, xy.x, xy.y, false, "currentColor", undefined, color, true);
				} else {
					var radius = this.radius.radius(context);
					shape = new Shape.RectangleShape(x, y, left, right, up, down, radius, false, "currentColor", undefined, color, true);
				}
				break;
			
			case '**':
				if (c.isCircle()) {
					var xy = this.radius.xy(context);
					shape = new Shape.EllipseShape(x + (right - left) / 2, y + (up - down) / 2, xy.x, xy.y, false, "currentColor", undefined, color, false);
				} else {
					var radius = this.radius.radius(context);
					shape = new Shape.RectangleShape(x, y, left, right, up, down, radius, false, "currentColor", undefined, color, false);
				}
				break;
				
			default:
				return Shape.none;
		}
		
		context.appendShapeToFront(shape);
		
		return shape;
	},
	toConnectShape: function (context) {
		var env = context.env;
		var c = env.c;
		var p = env.p;
		if (c === undefined || p === undefined) {
			Shape.none;
		}
		env.originalReferencePoint = c;
		
		var tmpEnv = env.duplicate();
		tmpEnv.c = p.combineRect(c);
		
		var tmpContext = new DrawingContext(Shape.none, tmpEnv);
		var shape = this.toDropShape(tmpContext);
		context.appendShapeToFront(shape);
		
		return shape;
	}
});
augment(AST.ObjectBox.Frame.Radius.Vector, {
	radius: function (context) {
		return this.vector.xy(context).x;
	},
	depth: function (context) {
		return this.vector.xy(context).x;
	},
	xy: function (context) {
		return this.vector.xy(context);
	}
});
augment(AST.ObjectBox.Frame.Radius.Default, {
	radius: function (context) {
		return 0;
	},
	depth: function (context) {
		return xypicGlobalContext.measure.thickness / 2;
	},
	xy: function (context) {
		var c = context.env.c;
		return { x:(c.l + c.r) / 2, y:(c.u + c.d) / 2 };
	}
});

augment(AST.ObjectBox.Dir, {
	toDropShape: function (context) {
		var env = context.env;
		var c = env.c;
		env.originalReferencePoint = c;
		var angle = env.angle;
		if (c === undefined) {
			return Shape.none;
		}
		env.c = new Frame.Point(c.x, c.y);
		
		var t = xypicGlobalContext.measure.thickness;
		var shape = Shape.none;
		switch (this.main) {
			case "":
				return Shape.none;
			case ">":
				switch (this.variant) {
					case "2":
						shape = new Shape.GT2ArrowheadShape(c, angle);
						var r = shape.getRadius();
						env.c = new Frame.Ellipse(c.x, c.y, r, r, r, r);
						break;
					case "3":
						shape = new Shape.GT3ArrowheadShape(c, angle);
						var r = shape.getRadius();
						env.c = new Frame.Ellipse(c.x, c.y, r, r, r, r);
						break;
					default:
						if (this.variant === "^") {
							shape = new Shape.UpperGTArrowheadShape(c, angle);
						} else if (this.variant === "_") {
							shape = new Shape.LowerGTArrowheadShape(c, angle);
						} else {
							shape = new Shape.GTArrowheadShape(c, angle);
						}
				}
				break;
			case "<":
				switch (this.variant) {
					case "2":
						shape = new Shape.LT2ArrowheadShape(c, angle);
						var r = shape.getRadius();
						env.c = new Frame.Ellipse(c.x, c.y, r, r, r, r);
						break;
					case "3":
						shape = new Shape.LT3ArrowheadShape(c, angle);
						var r = shape.getRadius();
						env.c = new Frame.Ellipse(c.x, c.y, r, r, r, r);
						break;
					default:
						if (this.variant === "^") {
							shape = new Shape.UpperLTArrowheadShape(c, angle);
						} else if (this.variant === "_") {
							shape = new Shape.LowerLTArrowheadShape(c, angle);
						} else {
							shape = new Shape.LTArrowheadShape(c, angle);
						}
				}
				break;
			case "|":
				switch (this.variant) {
					case "^":
						shape = new Shape.UpperColumnArrowheadShape(c, angle);
						break;
					case "_":
						shape = new Shape.LowerColumnArrowheadShape(c, angle);
						break;
					case "2":
						shape = new Shape.Column2ArrowheadShape(c, angle);
						break;
					case "3":
						shape = new Shape.Column3ArrowheadShape(c, angle);
						break;
					default:
						shape = new Shape.ColumnArrowheadShape(c, angle);
				}
				break;
			case "(":
				switch (this.variant) {
					case "^":
						shape = new Shape.UpperLParenArrowheadShape(c, angle);
						break;
					case "_":
						shape = new Shape.LowerLParenArrowheadShape(c, angle);
						break;
					default:
						shape = new Shape.LParenArrowheadShape(c, angle);
				}
				break;
			case ")":
				switch (this.variant) {
					case "^":
						shape = new Shape.UpperRParenArrowheadShape(c, angle);
						break;
					case "_":
						shape = new Shape.LowerRParenArrowheadShape(c, angle);
						break;
					default:
						shape = new Shape.RParenArrowheadShape(c, angle);
				}
				break;
			case "`":
				switch (this.variant) {
					case "_":
						shape = new Shape.LowerBackquoteArrowheadShape(c, angle);
						break;
					case "^":
					default:
						shape = new Shape.UpperBackquoteArrowheadShape(c, angle);
						break;
				}
				break;
			case "'":
				switch (this.variant) {
					case "_":
						shape = new Shape.LowerQuoteArrowheadShape(c, angle);
						break;
					case "^":
					default:
						shape = new Shape.UpperQuoteArrowheadShape(c, angle);
						break;
				}
				break;
			case '*':
				shape = new Shape.AsteriskArrowheadShape(c, 0);
				break;
			case 'o':
				shape = new Shape.OArrowheadShape(c, 0);
				break;
			case '+':
				shape = new Shape.PlusArrowheadShape(c, angle);
				break;
			case 'x':
				shape = new Shape.XArrowheadShape(c, angle);
				break;
			case '/':
				shape = new Shape.SlashArrowheadShape(c, angle);
				break;
			case '-':
			case '--':
				var lineLen = xypicGlobalContext.measure.lineElementLength;
				if (this.variant === "3") {
					shape = new Shape.Line3ArrowheadShape(c, angle);
				} else if (this.variant === "2") {
					shape = new Shape.Line2ArrowheadShape(c, angle);
				} else {
					shape = new Shape.LineArrowheadShape(c, angle);
				}
				break;
			case '=':
			case '==':
				shape = new Shape.Line2ArrowheadShape(c, angle);
				break;
			case '.':
			case '..':
				if (this.variant === "3") {
					shape = new Shape.Dot3ArrowheadShape(c, angle);
				} else if (this.variant === "2") {
					shape = new Shape.Dot2ArrowheadShape(c, angle);
				} else {
					shape = new Shape.DotArrowheadShape(c, angle);
				}
				break;
			case ':':
			case '::':
				shape = new Shape.Dot2ArrowheadShape(c, angle);
				break;
			case '~':
			case '~~':
				if (this.variant === "3") {
					shape = new Shape.Tilde3ArrowheadShape(c, angle);
				} else if (this.variant === "2") {
					shape = new Shape.Tilde2ArrowheadShape(c, angle);
				} else {
					shape = new Shape.TildeArrowheadShape(c, angle);
				}
				break;
			case '>>':
				switch (this.variant) {
					case "^":
						shape = new Shape.UpperGTGTArrowheadShape(c, angle);
						break;
					case "_":
						shape = new Shape.LowerGTGTArrowheadShape(c, angle);
						break;
					case "2":
						shape = new Shape.GTGT2ArrowheadShape(c, angle);
						var r = shape.getRadius();
						env.c = new Frame.Ellipse(c.x, c.y, r, r, r, r);
						break;
					case "3":
						shape = new Shape.GTGT3ArrowheadShape(c, angle);
						var r = shape.getRadius();
						env.c = new Frame.Ellipse(c.x, c.y, r, r, r, r);
						break;
					default:
						shape = new Shape.GTGTArrowheadShape(c, angle);
						break;
				}
				break;
			case '<<':
				switch (this.variant) {
					case "^":
						shape = new Shape.UpperLTLTArrowheadShape(c, angle);
						break;
					case "_":
						shape = new Shape.LowerLTLTArrowheadShape(c, angle);
						break;
					case "2":
						shape = new Shape.LTLT2ArrowheadShape(c, angle);
						var r = shape.getRadius();
						env.c = new Frame.Ellipse(c.x, c.y, r, r, r, r);
						break;
					case "3":
						shape = new Shape.LTLT3ArrowheadShape(c, angle);
						var r = shape.getRadius();
						env.c = new Frame.Ellipse(c.x, c.y, r, r, r, r);
						break;
					default:
						shape = new Shape.LTLTArrowheadShape(c, angle);
						break;
				}
				break;
			case '||':
				switch (this.variant) {
					case "^":
						shape = new Shape.UpperColumnColumnArrowheadShape(c, angle);
						break;
					case "_":
						shape = new Shape.LowerColumnColumnArrowheadShape(c, angle);
						break;
					case "2":
						shape = new Shape.ColumnColumn2ArrowheadShape(c, angle);
						break;
					case "3":
						shape = new Shape.ColumnColumn3ArrowheadShape(c, angle);
						break;
					default:
						shape = new Shape.ColumnColumnArrowheadShape(c, angle);
						break;
				}
				break;
			case '|-':
				switch (this.variant) {
					case "^":
						shape = new Shape.UpperColumnLineArrowheadShape(c, angle);
						break;
					case "_":
						shape = new Shape.LowerColumnLineArrowheadShape(c, angle);
						break;
					case "2":
						shape = new Shape.ColumnLine2ArrowheadShape(c, angle);
						break;
					case "3":
						shape = new Shape.ColumnLine3ArrowheadShape(c, angle);
						break;
					default:
						shape = new Shape.ColumnLineArrowheadShape(c, angle);
						break;
				}
				break;
			case '>|':
				shape = new Shape.GTColumnArrowheadShape(c, angle);
				break;
			case ">>|":
				shape = new Shape.GTGTColumnArrowheadShape(c, angle);
				break;
			case "|<":
				shape = new Shape.ColumnLTArrowheadShape(c, angle);
				break;
			case "|<<":
				shape = new Shape.ColumnLTLTArrowheadShape(c, angle);
				break;
			case "//":
				shape = new Shape.SlashSlashArrowheadShape(c, angle);
				break;
			case "=>":
				shape = new Shape.LineGT2ArrowheadShape(c, angle);
				break;
				
			default:
				var newdirObj = xypicGlobalContext.repositories.dirRepository.get(this.main);
				if (newdirObj !== undefined) {
					shape = newdirObj.toDropShape(context);
				} else {
					throw createXypicError("ExecutionError", "\\dir " + this.variant + "{" + this.main + "} not defined.");
				}
		}
		
		context.appendShapeToFront(shape);
		return shape;
	},
	toConnectShape: function (context) {
		// 多重線の幅、点線・破線の幅の基準
		var env = context.env;
		env.originalReferencePoint = env.c;
		var t = xypicGlobalContext.measure.thickness;
		var s = env.p.edgePoint(env.c.x, env.c.y);
		var e = env.c.edgePoint(env.p.x, env.p.y);
		if (s.x !== e.x || s.y !== e.y) {
			var shape = new Curve.Line(s, e).toShape(context, this, this.main, this.variant);
			return shape;
		} else {
			env.angle = 0;
			env.lastCurve = LastCurve.none;
			return Shape.none;
		}
	}
});

augment(AST.ObjectBox.Curve, {
	toDropShape: function (context) {
		var env = context.env;
		env.originalReferencePoint = env.c;
		return Shape.none;
	},
	toConnectShape: function (context) {
		var env = context.env;
		env.originalReferencePoint = env.c;
		// find object for drop and connect
		var objectForDrop = undefined;
		var objectForConnect = undefined;
		this.objects.foreach(function (o) {
			objectForDrop = o.objectForDrop(objectForDrop);
			objectForConnect = o.objectForConnect(objectForConnect);
		});
		if (objectForDrop === undefined && objectForConnect === undefined) {
			objectForConnect = new AST.Object(List.empty, new AST.ObjectBox.Dir("", "-"));
		}
		
		var thickness = xypicGlobalContext.measure.thickness;
		
		var c = env.c;
		var p = env.p;
		var controlPoints = [];
		this.poslist.foreach(function (p) {
			p.addPositions(controlPoints, context);
			// svg.createSVGElement("circle", {
			// 	cx:xypicGlobalContext.measure.em2px(env.c.x), cy:-xypicGlobalContext.measure.em2px(env.c.y), r:xypicGlobalContext.measure.em2px(thickness/2)
			// });
		});
		
		env.c = c;
		env.p = p;
		var shape = Shape.none;
		var s = p;
		var e = c;
		switch (controlPoints.length) {
			case 0:
				if (s.x === e.x && s.y === e.y) {
					env.lastCurve = LastCurve.none;
					env.angle = 0;
					return Shape.none;
				}
				if (objectForConnect !== undefined) {
					return objectForConnect.toConnectShape(context);
				} else {
					return objectForDrop.toConnectShape(context);
				}
				
			case 1:
				var origBezier = new Curve.QuadBezier(s, controlPoints[0], e);
				var tOfShavedStart = origBezier.tOfShavedStart(s);
				var tOfShavedEnd = origBezier.tOfShavedEnd(e);
				if (tOfShavedStart === undefined || tOfShavedEnd === undefined || tOfShavedStart >= tOfShavedEnd) {
						env.angle = 0;
						env.lastCurve = LastCurve.none;
						return Shape.none;
				}
				shape = origBezier.toShape(context, objectForDrop, objectForConnect);
				env.lastCurve = new LastCurve.QuadBezier(origBezier, tOfShavedStart, tOfShavedEnd, shape);
				env.angle = Math.atan2(e.y - s.y, e.x - s.x);
				break;
				
			case 2:
				var origBezier = new Curve.CubicBezier(s, controlPoints[0], controlPoints[1], e);
				var tOfShavedStart = origBezier.tOfShavedStart(s);
				var tOfShavedEnd = origBezier.tOfShavedEnd(e);
				if (tOfShavedStart === undefined || tOfShavedEnd === undefined || tOfShavedStart >= tOfShavedEnd) {
						env.angle = 0;
						env.lastCurve = LastCurve.none;
						return Shape.none;
				}
				shape = origBezier.toShape(context, objectForDrop, objectForConnect);
				env.lastCurve = new LastCurve.CubicBezier(origBezier, tOfShavedStart, tOfShavedEnd, shape);
				env.angle = Math.atan2(e.y - s.y, e.x - s.x);
				break;
				
			default:
				var spline = new Curve.CubicBSpline(s, controlPoints, e);
				var origBeziers = new Curve.CubicBeziers(spline.toCubicBeziers());
				var tOfShavedStart = origBeziers.tOfShavedStart(s);
				var tOfShavedEnd = origBeziers.tOfShavedEnd(e);
				if (tOfShavedStart === undefined || tOfShavedEnd === undefined || tOfShavedStart >= tOfShavedEnd) {
						env.angle = 0;
						env.lastCurve = LastCurve.none;
						return Shape.none;
				}
				shape = origBeziers.toShape(context, objectForDrop, objectForConnect);
				env.lastCurve = new LastCurve.CubicBSpline(s, e, origBeziers, tOfShavedStart, tOfShavedEnd, shape);
				env.angle = Math.atan2(e.y - s.y, e.x - s.x);
				break;
		}
		
//        svg.createSVGElement("rect", {
//          x:xypicGlobalContext.measure.em2px(box.x-box.l), y:xypicGlobalContext.measure.em2px(-box.y-box.u), width:xypicGlobalContext.measure.em2px(box.l+box.r), height:xypicGlobalContext.measure.em2px(box.u+box.d),
//          "stroke-width":"0.02em", stroke:"green"
//        })
		return shape;
	}
});

augment(AST.ObjectBox.Curve.Object.Drop, {
	objectForDrop: function (object) {
		return this.object;
	},
	objectForConnect: function (object) {
		return object;
	}
});

augment(AST.ObjectBox.Curve.Object.Connect, {
	objectForDrop: function (object) {
		return object;
	},
	objectForConnect: function (object) {
		return this.object;
	}
});

augment(AST.ObjectBox.Curve.PosList.CurPos, {
	addPositions: function (controlPoints, context) {
		var env = context.env;
		controlPoints.push(env.c);
	}
});

augment(AST.ObjectBox.Curve.PosList.Pos, {
	addPositions: function (controlPoints, context) {
		var env = context.env;
		this.pos.toShape(context);
		controlPoints.push(env.c);
	}
});

augment(AST.ObjectBox.Curve.PosList.AddStack, {
	addPositions: function (controlPoints, context) {
		context.env.stack.reverse().foreach(function (p) {
			controlPoints.push(p);
		});
	}
});

augment(AST.Coord.C, {
	position: function (context) {
		return context.env.c;
	}
});

augment(AST.Coord.P, {
	position: function (context) {
		return context.env.p;
	}
});

augment(AST.Coord.X, {
	position: function (context) {
		var env = context.env;
		var p = env.p;
		var c = env.c;
		var o = env.origin;
		var b = env.xBase;
		var a0 = c.y - p.y, b0 = p.x - c.x, c0 = c.x * p.y - c.y * p.x;
		var a1 = b.y, b1 = -b.x, c1 = b.x * o.y - b.y * o.x;
		var d = a0 * b1 - a1 * b0;
		
		if (Math.abs(d) < XypicConstants.machinePrecision) {
			console.log("there is no intersection point.");
			return Env.originPosition;
		}
		var x = -(b1 * c0 - b0 * c1)/d;
		var y = (a1 * c0 - a0 * c1)/d;
		return new Frame.Point(x, y);
	}
});

augment(AST.Coord.Y, {
	position: function (context) {
		var env = context.env;
		var p = env.p;
		var c = env.c;
		var o = env.origin;
		var b = env.yBase;
		var a0 = c.y - p.y, b0 = p.x - c.x, c0 = c.x * p.y - c.y * p.x;
		var a1 = b.y, b1 = -b.x, c1 = b.x * o.y - b.y * o.x;
		var d = a0 * b1 - a1 * b0;
		
		if (Math.abs(d) < XypicConstants.machinePrecision) {
			console.log("there is no intersection point.");
			return Env.originPosition;
		}
		var x = -(b1 * c0 - b0 * c1)/d;
		var y = (a1 * c0 - a0 * c1)/d;
		return new Frame.Point(x, y);
	}
});

augment(AST.Coord.Vector, {
	position: function (context) {
		var xy = this.vector.xy(context);
		return new Frame.Point(xy.x, xy.y);
	}
});

augment(AST.Coord.Id, {
	position: function (context) {
		return context.env.lookupPos(this.id).position(context);
	}
});

augment(AST.Coord.Group, {
	position: function (context) {
		var env = context.env;
		var origin = env.origin;
		var xBase = env.xBase;
		var yBase = env.yBase;
		var p = env.p;
		// side effect
		this.posDecor.toShape(context);
		env.p = p;
		env.origin = origin;
		env.xBase = xBase;
		env.yBase = yBase;
		return env.c;
	}
});

augment(AST.Coord.StackPosition, {
	position: function (context) {
		return context.env.stackAt(this.number);
	}
});

augment(AST.Coord.DeltaRowColumn, {
	position: function (context) {
		var env = context.env;
		var row = env.xymatrixRow;
		var col = env.xymatrixCol;
		if (row === undefined || col === undefined) {
			throw createXypicError("ExecutionError", "xymatrix rows and columns not found for " + this.toSring());
		}
		var id = this.prefix + (row + this.dr) + "," + (col + this.dc);
		return context.env.lookupPos(id, 'in entry "' + env.xymatrixRow + "," + env.xymatrixCol + '": No ' + this + " (is " + id + ") from here.").position(context);
	}
});

augment(AST.Coord.Hops, {
	position: function (context) {
		var env = context.env;
		var row = env.xymatrixRow;
		var col = env.xymatrixCol;
		if (row === undefined || col === undefined) {
			throw createXypicError("ExecutionError", "xymatrix rows and columns not found for " + this.toSring());
		}
		this.hops.foreach(function (hop) {
			switch (hop) {
				case 'u':
					row -= 1;
					break;
				case 'd':
					row += 1;
					break;
				case 'l':
					col -= 1;
					break;
				case 'r':
					col += 1;
					break;
			}
		});
		var id = this.prefix + row + "," + col;
		return context.env.lookupPos(id, 'in entry "' + env.xymatrixRow + "," + env.xymatrixCol + '": No ' + this + " (is " + id + ") from here.").position(context);
	}
});

augment(AST.Coord.HopsWithPlace, {
	position: function (context) {
		var env = context.env;
		var row = env.xymatrixRow;
		var col = env.xymatrixCol;
		if (row === undefined || col === undefined) {
			throw createXypicError("ExecutionError", "xymatrix rows and columns not found for " + this.toSring());
		}
		this.hops.foreach(function (hop) {
			switch (hop) {
				case 'u':
					row -= 1;
					break;
				case 'd':
					row += 1;
					break;
				case 'l':
					col -= 1;
					break;
				case 'r':
					col += 1;
					break;
			}
		});
		var id = this.prefix + row + "," + col;
		var pos = context.env.lookupPos(id, 'in entry "' + env.xymatrixRow + "," + env.xymatrixCol + '": No ' + this + " (is " + id + ") from here.").position(context);
		var c = env.c;
		
		var tmpEnv = env.duplicate();
		tmpEnv.p = env.c;
		tmpEnv.c = pos;
		var dx = tmpEnv.c.x - tmpEnv.p.x;
		var dy = tmpEnv.c.y - tmpEnv.p.y;
		var angle;
		if (dx === 0 && dy === 0) {
			angle = 0;
		} else {
			angle = Math.atan2(dy, dx);
		}
		tmpEnv.angle = angle;
		var s = tmpEnv.p.edgePoint(tmpEnv.c.x, tmpEnv.c.y);
		var e = tmpEnv.c.edgePoint(tmpEnv.p.x, tmpEnv.p.y);
		tmpEnv.lastCurve = new LastCurve.Line(s, e, tmpEnv.p, tmpEnv.c, undefined);
		var tmpContext = new DrawingContext(Shape.none, tmpEnv);
		var t = this.place.toShape(tmpContext);
		
		return tmpEnv.lastCurve.position(t);
	}
});

augment(AST.Vector.InCurBase, {
	xy: function (context) {
		return context.env.absVector(this.x, this.y);
	},
	angle: function (context) {
		var xy = context.env.absVector(this.x, this.y);
		return Math.atan2(xy.y, xy.x);
	}
});

augment(AST.Vector.Abs, {
	xy: function (context) {
		return { x:xypicGlobalContext.measure.length2em(this.x), y:xypicGlobalContext.measure.length2em(this.y) };
	},
	angle: function (context) {
		var xy = this.xy(context);
		return Math.atan2(xy.y, xy.x);
	}
});

augment(AST.Vector.Angle, {
	xy: function (context) {
		var angle = Math.PI / 180 * this.degree;
		var xy = context.env.absVector(Math.cos(angle), Math.sin(angle));
		return xy;
	},
	angle: function (context) {
		return Math.PI / 180 * this.degree;
	}
});

augment(AST.Vector.Dir, {
	xy: function (context) {
		var l = xypicGlobalContext.measure.length2em(this.dimen);
		var angle = this.dir.angle(context);
		return { x:l * Math.cos(angle), y:l * Math.sin(angle) };
	},
	angle: function (context) {
		return this.dir.angle(context);
	}
});

augment(AST.Vector.Corner, {
	xy: function (context) {
		var xy = this.corner.xy(context);
		return { x:xy.x*this.factor, y:xy.y*this.factor };
	},
	angle: function (context) {
		return this.corner.angle(context);
	}
});

augment(AST.Corner.L, {
	xy: function (context) {
		var c = context.env.c;
		return { x:-c.l, y:0 };
	},
	angle: function (context) {
		return Math.PI;
	}
});

augment(AST.Corner.R, {
	xy: function (context) {
		var c = context.env.c;
		return { x:c.r, y:0 };
	},
	angle: function (context) {
		return 0;
	}
});

augment(AST.Corner.D, {
	xy: function (context) {
		var c = context.env.c;
		return { x:0, y:-c.d };
	},
	angle: function (context) {
		return -Math.PI / 2;
	}
});

augment(AST.Corner.U, {
	xy: function (context) {
		var c = context.env.c;
		return { x:0, y:c.u };
	},
	angle: function (context) {
		return Math.PI / 2;
	}
});

augment(AST.Corner.CL, {
	xy: function (context) {
		var c = context.env.c;
		return { x:-c.l, y:(c.u - c.d) / 2 };
	},
	angle: function (context) {
		var xy = this.xy(context);
		return Math.atan2(xy.y, xy.x);
	}
});

augment(AST.Corner.CR, {
	xy: function (context) {
		var c = context.env.c;
		return { x:c.r, y:(c.u - c.d) / 2 };
	},
	angle: function (context) {
		var xy = this.xy(context);
		return Math.atan2(xy.y, xy.x);
	}
});

augment(AST.Corner.CD, {
	xy: function (context) {
		var c = context.env.c;
		return { x:(c.r-c.l)/2, y:-c.d };
	},
	angle: function (context) {
		var xy = this.xy(context);
		return Math.atan2(xy.y, xy.x);
	}
});

augment(AST.Corner.CU, {
	xy: function (context) {
		var c = context.env.c;
		return { x:(c.r-c.l)/2, y:c.u };
	},
	angle: function (context) {
		var xy = this.xy(context);
		return Math.atan2(xy.y, xy.x);
	}
});

augment(AST.Corner.LU, {
	xy: function (context) {
		var c = context.env.c;
		return { x:-c.l, y:c.u };
	},
	angle: function (context) {
		var xy = this.xy(context);
		return Math.atan2(xy.y, xy.x);
	}
});

augment(AST.Corner.LD, {
	xy: function (context) {
		var c = context.env.c;
		return { x:-c.l, y:-c.d };
	},
	angle: function (context) {
		var xy = this.xy(context);
		return Math.atan2(xy.y, xy.x);
	}
});

augment(AST.Corner.RU, {
	xy: function (context) {
		var c = context.env.c;
		return { x:c.r, y:c.u };
	},
	angle: function (context) {
		var xy = this.xy(context);
		return Math.atan2(xy.y, xy.x);
	}
});

augment(AST.Corner.RD, {
	xy: function (context) {
		var c = context.env.c;
		return { x:c.r, y:-c.d };
	},
	angle: function (context) {
		var xy = this.xy(context);
		return Math.atan2(xy.y, xy.x);
	}
});

augment(AST.Corner.NearestEdgePoint, {
	xy: function (context) {
		var env = context.env;
		var c = env.c;
		var e = c.edgePoint(env.p.x, env.p.y);  
		return { x:e.x - c.x, y:e.y - c.y };
	},
	angle: function (context) {
		var xy = this.xy(context);
		return Math.atan2(xy.y, xy.x);
	}
});

augment(AST.Corner.PropEdgePoint, {
	xy: function (context) {
		var env = context.env;
		var c = env.c;
		var e = c.proportionalEdgePoint(env.p.x, env.p.y);
		return { x:e.x - c.x, y:e.y - c.y };
	},
	angle: function (context) {
		var xy = this.xy(context);
		return Math.atan2(xy.y, xy.x);
	}
});

augment(AST.Corner.Axis, {
	xy: function (context) {
		return { x:0, y:xypicGlobalContext.measure.axisHeightLength };
	},
	angle: function (context) {
		return Math.PI / 2;
	}
});

augment(AST.Modifier, {
	proceedModifyShape: function (context, objectShape, restModifiers) {
		if (restModifiers.isEmpty) {
			return objectShape;
		} else {
			return restModifiers.head.modifyShape(context, objectShape, restModifiers.tail);
		}
	}
});

augment(AST.Modifier.Vector, {
	preprocess: function (context, reversedProcessedModifiers) {
	},
	modifyShape: function (context, objectShape, restModifiers) {
		var d = this.vector.xy(context);
		var env = context.env;
		env.c = env.c.shiftFrame(-d.x, -d.y);
		objectShape = new Shape.TranslateShape(-d.x, -d.y, objectShape);
		return this.proceedModifyShape(context, objectShape, restModifiers);
	}
});

augment(AST.Modifier.RestoreOriginalRefPoint, {
	preprocess: function (context, reversedProcessedModifiers) {
	},
	modifyShape: function (context, objectShape, restModifiers) {
		var env = context.env;
		var origRefPoint = env.originalReferencePoint;
		if (origRefPoint !== undefined) {
			var dx = env.c.x - origRefPoint.x;
			var dy = env.c.y - origRefPoint.y;
			env.c = env.c.shiftFrame(dx, dy);
			objectShape = new Shape.TranslateShape(dx, dy, objectShape);
		}
		return this.proceedModifyShape(context, objectShape, restModifiers);
	}
});

augment(AST.Modifier.Shape.Point, {
	preprocess: function (context, reversedProcessedModifiers) {
	},
	modifyShape: function (context, objectShape, restModifiers) {
		var c = context.env.c;
		context.env.c = new Frame.Point(c.x, c.y);
		return this.proceedModifyShape(context, objectShape, restModifiers);
	}
});

augment(AST.Modifier.Shape.Rect, {
	preprocess: function (context, reversedProcessedModifiers) {
	},
	modifyShape: function (context, objectShape, restModifiers) {
		var c = context.env.c;
		context.env.c = new Frame.Rect(c.x, c.y, { l:c.l, r:c.r, u:c.u, d:c.d });
		return this.proceedModifyShape(context, objectShape, restModifiers);
	}
});

augment(AST.Modifier.Shape.Circle, {
	preprocess: function (context, reversedProcessedModifiers) {
	},
	modifyShape: function (context, objectShape, restModifiers) {
		var c = context.env.c;
		context.env.c = new Frame.Ellipse(c.x, c.y, c.l, c.r, c.u, c.d);
		return this.proceedModifyShape(context, objectShape, restModifiers);
	}
});

augment(AST.Modifier.Shape.L, {
	preprocess: function (context, reversedProcessedModifiers) {
	},
	modifyShape: function (context, objectShape, restModifiers) {
		var env = context.env;
		var c = env.c;
		if (c !== undefined) {
			var width = c.r + c.l;
			var height = c.u + c.d;
			var dx, dy;
			if (width < height) {
				dx = (c.l - c.r) / 2;
				dy = (c.d - c.u) / 2;
			} else {
				dx = -c.r + height / 2;
				dy = (c.d - c.u) / 2;
			}
			env.c = env.c.shiftFrame(dx, dy);
			objectShape = new Shape.TranslateShape(dx, dy, objectShape);
		}
		return this.proceedModifyShape(context, objectShape, restModifiers);
	}
});

augment(AST.Modifier.Shape.R, {
	preprocess: function (context, reversedProcessedModifiers) {
	},
	modifyShape: function (context, objectShape, restModifiers) {
		var env = context.env;
		var c = env.c;
		if (c !== undefined) {
			var width = c.r + c.l;
			var height = c.u + c.d;
			var dx, dy;
			if (width < height) {
				dx = (c.l - c.r) / 2;
				dy = (c.d - c.u) / 2;
			} else {
				dx = c.l - height / 2;
				dy = (c.d - c.u) / 2;
			}
			env.c = env.c.shiftFrame(dx, dy);
			objectShape = new Shape.TranslateShape(dx, dy, objectShape);
		}
		return this.proceedModifyShape(context, objectShape, restModifiers);
	}
});

augment(AST.Modifier.Shape.U, {
	preprocess: function (context, reversedProcessedModifiers) {
	},
	modifyShape: function (context, objectShape, restModifiers) {
		var env = context.env;
		var c = env.c;
		if (c !== undefined) {
			var width = c.r + c.l;
			var height = c.u + c.d;
			var dx, dy;
			if (width > height) {
				dx = (c.l - c.r) / 2;
				dy = (c.d - c.u) / 2;
			} else {
				dx = (c.l - c.r) / 2;
				dy = c.d - width / 2;
			}
			env.c = env.c.shiftFrame(dx, dy);
			objectShape = new Shape.TranslateShape(dx, dy, objectShape);
		}
		return this.proceedModifyShape(context, objectShape, restModifiers);
	}
});

augment(AST.Modifier.Shape.D, {
	preprocess: function (context, reversedProcessedModifiers) {
	},
	modifyShape: function (context, objectShape, restModifiers) {
		var env = context.env;
		var c = env.c;
		if (c !== undefined) {
			var width = c.r + c.l;
			var height = c.u + c.d;
			var dx, dy;
			if (width > height) {
				dx = (c.l - c.r) / 2;
				dy = (c.d - c.u) / 2;
			} else {
				dx = (c.l - c.r) / 2;
				dy = -c.u + width / 2;
			}
			env.c = env.c.shiftFrame(dx, dy);
			objectShape = new Shape.TranslateShape(dx, dy, objectShape);
		}
		return this.proceedModifyShape(context, objectShape, restModifiers);
	}
});

augment(AST.Modifier.Shape.C, {
	preprocess: function (context, reversedProcessedModifiers) {
	},
	modifyShape: function (context, objectShape, restModifiers) {
		var env = context.env;
		var c = env.c;
		if (c !== undefined) {
			var dx, dy;
			dx = (c.l - c.r) / 2;
			dy = (c.d - c.u) / 2;
			env.c = env.c.shiftFrame(dx, dy);
			objectShape = new Shape.TranslateShape(dx, dy, objectShape);
		}
		return this.proceedModifyShape(context, objectShape, restModifiers);
	}
});

augment(AST.Modifier.Shape.ChangeColor, {
	preprocess: function (context, reversedProcessedModifiers) {
	},
	modifyShape: function (context, objectShape, restModifiers) {
		objectShape = this.proceedModifyShape(context, objectShape, restModifiers);
		return new Shape.ChangeColorShape(this.colorName, objectShape);
	}
});

augment(AST.Modifier.Shape.Alphabets, {
	preprocess: function (context, reversedProcessedModifiers) {
		var modifier = xypicGlobalContext.repositories.modifierRepository.get(this.alphabets);
		if (modifier !== undefined) {
			return modifier.preprocess(context, reversedProcessedModifiers);
		} else {
			// TODO 存在しないshape名が指定されたらエラーを発生させる。
		}
	},
	modifyShape: function (context, objectShape, restModifiers) {
		var modifier = xypicGlobalContext.repositories.modifierRepository.get(this.alphabets);
		if (modifier !== undefined) {
			return modifier.modifyShape(context, objectShape, restModifiers);
		}
	}
});

augment(AST.Modifier.Shape.DefineShape, {
	preprocess: function (context, reversedProcessedModifiers) {
		var processedModifiers = reversedProcessedModifiers.reverse();
		xypicGlobalContext.repositories.modifierRepository.put(this.shape, new AST.Modifier.Shape.CompositeModifiers(processedModifiers));
	},
	modifyShape: function (context, objectShape, restModifiers) {
		return this.proceedModifyShape(context, objectShape, restModifiers);
	}
});

// ユーザ定義されたshape
augment(AST.Modifier.Shape.CompositeModifiers, {
	preprocess: function (context, reversedProcessedModifiers) {
		this.modifiers.foreach(function (m) {
			m.preprocess(context, reversedProcessedModifiers);
			reversedProcessedModifiers = reversedProcessedModifiers.prepend(m);
		});
	},
	modifyShape: function (context, objectShape, restModifiers) {
		objectShape = this.proceedModifyShape(context, objectShape, this.modifiers);
		return this.proceedModifyShape(context, objectShape, restModifiers);
	}
});

augment(AST.Modifier.Invisible, {
	preprocess: function (context, reversedProcessedModifiers) {
	},
	modifyShape: function (context, objectShape, restModifiers) {
		objectShape = this.proceedModifyShape(context, objectShape, restModifiers);
		return Shape.none;
	}
});

augment(AST.Modifier.Hidden, {
	preprocess: function (context, reversedProcessedModifiers) {
	},
	modifyShape: function (context, objectShape, restModifiers) {
		// TODO implement hidden modifier
		return this.proceedModifyShape(context, objectShape, restModifiers);
	}
});

augment(AST.Modifier.Direction, {
	preprocess: function (context, reversedProcessedModifiers) {
		context.env.angle = this.direction.angle(context);
	},
	modifyShape: function (context, objectShape, restModifiers) {
		context.env.angle = this.direction.angle(context);
		return this.proceedModifyShape(context, objectShape, restModifiers);
	}
});

augment(AST.Modifier.AddOp, {
	preprocess: function (context, reversedProcessedModifiers) {
	},
	modifyShape: function (context, objectShape, restModifiers) {
		var c = context.env.c;
		context.env.c = this.op.apply(this.size, c, context);
		context.appendShapeToFront(new Shape.InvisibleBoxShape(context.env.c));
		return this.proceedModifyShape(context, objectShape, restModifiers);
	}
});
augment(AST.Modifier.AddOp.Grow, {
	apply: function (size, c, context) {
		var env = context.env;
		var margin = (size.isDefault?
			{ x:2 * env.objectmargin, y:2 * env.objectmargin }:
			size.vector.xy(context));
		var xMargin = Math.abs(margin.x / 2);
		var yMargin = Math.abs(margin.y / 2);
		return c.grow(xMargin, yMargin);
	},
	applyToDimen: function (lhsEm, rhsEm) {
		return lhsEm + rhsEm;
	}
});
augment(AST.Modifier.AddOp.Shrink, {
	apply: function (size, c, context) {
		var env = context.env;
		var margin = (size.isDefault?
			{ x:2 * env.objectmargin, y:2 * env.objectmargin }:
			size.vector.xy(context));
		var xMargin = -Math.abs(margin.x / 2);
		var yMargin = -Math.abs(margin.y / 2);
		return c.grow(xMargin, yMargin);
	},
	applyToDimen: function (lhsEm, rhsEm) {
		return lhsEm - rhsEm;
	}
});
augment(AST.Modifier.AddOp.Set, {
	apply: function (size, c, context) {
		var env = context.env;
		var margin = (size.isDefault?
			{ x:env.objectwidth, y:env.objectheight }:
			size.vector.xy(context));
		var width = Math.abs(margin.x);
		var height = Math.abs(margin.y);
		return c.toSize(width, height);
	},
	applyToDimen: function (lhsEm, rhsEm) {
		return rhsEm;
	}
});
augment(AST.Modifier.AddOp.GrowTo, {
	apply: function (size, c, context) {
		var l = Math.max(c.l + c.r, c.u + c.d);
		var margin = (size.isDefault? { x:l, y:l } : size.vector.xy(context));
		var width = Math.abs(margin.x);
		var height = Math.abs(margin.y);
		return c.growTo(width, height);
	},
	applyToDimen: function (lhsEm, rhsEm) {
		return Math.max(Math.max(lhsEm, rhsEm), 0);
	}
});
augment(AST.Modifier.AddOp.ShrinkTo, {
	apply: function (size, c, context) {
		var l = Math.min(c.l + c.r, c.u + c.d);
		var margin = (size.isDefault? { x:l, y:l } : size.vector.xy(context));
		var width = Math.abs(margin.x);
		var height = Math.abs(margin.y);
		return c.shrinkTo(width, height);
	},
	applyToDimen: function (lhsEm, rhsEm) {
		return Math.max(Math.min(lhsEm, rhsEm), 0);
	}
});

augment(AST.Modifier.Shape.Frame, {
	preprocess: function (context, reversedProcessedModifiers) {
	},
	modifyShape: function (context, objectShape, restModifiers) {
		var env = context.env;
		if (env.c !== undefined) {
			var main = this.main;
			var radius = new AST.ObjectBox.Frame.Radius.Default();
			var colorName = "currentColor";
			this.options.foreach(function (op) { radius = op.getRadius(radius); });
			this.options.foreach(function (op) { colorName = op.getColorName(colorName); });
			
			var dummyEnv = env.duplicate();
			var dummyContext = new DrawingContext(Shape.none, dummyEnv);
			var frameObject = new AST.ObjectBox.Frame(radius, this.main);
			var frameShape = frameObject.toDropFilledShape(dummyContext, colorName, env.c.isCircle());
			objectShape = new Shape.CompositeShape(objectShape, frameShape);
		}
		return this.proceedModifyShape(context, objectShape, restModifiers);
	}
});
augment(AST.Modifier.Shape.Frame.Radius, {
	getRadius: function (radius) {
		return new AST.ObjectBox.Frame.Radius.Vector(this.vector);
	},
	getColorName: function (colorName) {
		return colorName;
	}
});
augment(AST.Modifier.Shape.Frame.Color, {
	getRadius: function (radius) {
		return radius;
	},
	getColorName: function (colorName) {
		return this.colorName;
	}
});

augment(AST.Direction.Compound, {
	angle: function (context) {
		var angle = this.dir.angle(context);
		this.rots.foreach(function (rot) { angle = rot.rotate(angle, context); });
		return angle;
	}
});

augment(AST.Direction.Diag, {
	angle: function (context) {
		return this.diag.angle(context);
	}
});

augment(AST.Direction.Vector, {
	angle: function (context) {
		return this.vector.angle(context);
	}
});

augment(AST.Direction.ConstructVector, {
	angle: function (context) {
		var env = context.env;
		var origin = env.origin;
		var xBase = env.xBase;
		var yBase = env.yBase;
		var p = env.p;
		var c = env.c;
		// side effect
		this.posDecor.toShape(context);
		var angle = Math.atan2(env.c.y - env.p.y, env.c.x - env.p.x);
		env.c = c;
		env.p = p;
		env.origin = origin;
		env.xBase = xBase;
		env.yBase = yBase;
		return angle;
	}
});

augment(AST.Direction.RotVector, {
	rotate: function (angle, context) {
		return angle + this.vector.angle(context);
	}
});

augment(AST.Direction.RotCW, {
	rotate: function (angle, context) {
		return angle + Math.PI /2;
	}
});

augment(AST.Direction.RotAntiCW, {
	rotate: function (angle, context) {
		return angle - Math.PI / 2;
	}
});

augment(AST.Diag.Default, {
	isEmpty: true,
	angle: function (context) {
		return context.env.angle;
	}
});
	
augment(AST.Diag.Angle, {
	isEmpty: false,
	angle: function (context) {
		return this.ang;
	}
});

augment(AST.Decor, {
	toShape: function (context) {
		this.commands.foreach(function (c) {
			c.toShape(context);
		});
	}
});

augment(AST.Command.Save, {
	toShape: function (context) {
		context.env.saveState();
		this.pos.toShape(context);
	}
});

augment(AST.Command.Restore, {
	toShape: function (context) {
		context.env.restoreState();
	}
});

augment(AST.Command.Pos, {
	toShape: function (context) {
		this.pos.toShape(context);
	}
});

augment(AST.Command.AfterPos, {
	toShape: function (context) {
		this.pos.toShape(context);
		this.decor.toShape(context);
	}
});

augment(AST.Command.Drop, {
	toShape: function (context) {
		this.object.toDropShape(context);
	}
});

augment(AST.Command.Connect, {
	toShape: function (context) {
		this.object.toConnectShape(context);
	}
});

augment(AST.Command.Relax, {
	toShape: function (context) {
		// do nothing
	}
});

augment(AST.Command.Ignore, {
	toShape: function (context) {
		// do nothing
	}
});

augment(AST.Command.ShowAST, {
	toShape: function (context) {
		console.log(this.pos.toString() + " " + this.decor);
	}
});

augment(AST.Command.Ar, {
	toShape: function (context) {
		var env = context.env;
		var origin = env.origin;
		var xBase = env.xBase;
		var yBase = env.yBase;
		var p = env.p;
		var c = env.c;
		
		env.pathActionForBeforeSegment = Option.empty;
		env.pathActionForAfterSegment = Option.empty;
		env.labelsForNextSegmentOnly = Option.empty;
		env.labelsForLastSegmentOnly = Option.empty;
		env.labelsForEverySegment = Option.empty;
		env.segmentSlideEm = Option.empty;
		env.lastTurnDiag = Option.empty;
		
		env.arrowVariant = "";
		env.tailTip = new AST.Command.Ar.Form.Tip.Tipchars("");
		env.headTip = new AST.Command.Ar.Form.Tip.Tipchars(">");
		env.stemConn = new AST.Command.Ar.Form.Conn.Connchars("-");
		env.reverseAboveAndBelow = false;
		env.arrowObjectModifiers = List.empty;
		
		this.forms.foreach(function (f) { f.toShape(context); });
		
		if (!env.pathActionForBeforeSegment.isDefined) {
		// the following AST means **\dir{stem}.
			env.pathActionForBeforeSegment = new Option.Some(
				new AST.PosDecor(
					new AST.Pos.Coord(
						new AST.Coord.C(),
						List.empty.append(
							new AST.Pos.ConnectObject(
								new AST.Object(
									env.arrowObjectModifiers, 
									env.stemConn.getObject(context)
								)
							)
						)
					),
					new AST.Decor(List.empty)
				)
			);
		}
		
		env.labelsForNextSegmentOnly = new Option.Some(
			new AST.Command.Path.Labels(
				List.empty.append(
					new AST.Command.Path.Label.At(
						new AST.Pos.Place(new AST.Place(1, 1, new AST.Place.Factor(0), new AST.Slide(Option.empty))),
						env.tailTip.getObject(context),
						Option.empty
					)
				)
			)
		);
		
		// arrow head
		env.labelsForLastSegmentOnly = new Option.Some(
			new AST.Command.Path.Labels(
				List.empty.append(
					new AST.Command.Path.Label.At(
						new AST.Pos.Place(new AST.Place(1, 1, new AST.Place.Factor(1), new AST.Slide(Option.empty))),
						env.headTip.getObject(context),
						Option.empty
					)
				)
			)
		);
		
		this.path.toShape(context);
		
		env.c = c;
		env.p = p;
		env.origin = origin;
		env.xBase = xBase;
		env.yBase = yBase;
	}
});

augment(AST.Command.Ar.Form.BuildArrow, {
	toShape: function (context) {
		var env = context.env;
		env.arrowVariant = this.variant;
		env.tailTip = this.tailTip;
		env.stemConn = this.stemConn;
		env.headTip = this.headTip;
	}
});

augment(AST.Command.Ar.Form.ChangeVariant, {
	toShape: function (context) {
		var env = context.env;
		env.arrowVariant = this.variant;
	}
});

augment(AST.Command.Ar.Form.ChangeStem, {
	toShape: function (context) {
		var env = context.env;
		env.stemConn = new AST.Command.Ar.Form.Conn.Connchars(this.connchar);
	}
});

augment(AST.Command.Ar.Form.DashArrowStem, {
	toShape: function (context) {
		// TODO impl
	}
});

augment(AST.Command.Ar.Form.CurveArrow, {
	toShape: function (context) {
		var env = context.env;
		var cpDist = xypicGlobalContext.measure.em2length(xypicGlobalContext.measure.length2em(this.dist) * 2);
		// the following AST means **\crv{{**@{} ?+/d 2l/}}. too long...
		env.pathActionForBeforeSegment = new Option.Some(
			new AST.PosDecor(
				new AST.Pos.Coord(
					new AST.Coord.C(),
					List.empty.append(
						new AST.Pos.ConnectObject(new AST.Object(env.arrowObjectModifiers, new AST.ObjectBox.Curve(
							List.empty,
							List.empty.append(
								new AST.ObjectBox.Curve.Object.Connect(
									env.stemConn.getObject(context)
								)
							),
							List.empty.append(
								new AST.ObjectBox.Curve.PosList.Pos(
									new AST.Pos.Coord(
										new AST.Coord.Group(
											new AST.PosDecor(
												new AST.Pos.Coord(
													new AST.Coord.C(),
													List.empty.append(
														new AST.Pos.ConnectObject(
															new AST.Object(
																List.empty,
																new AST.ObjectBox.Dir("", "")
															)
														)
													).append(
														new AST.Pos.Place(
															new AST.Place(0, 0, undefined, new AST.Slide(Option.empty))
														)
													).append(
														new AST.Pos.Plus(
															new AST.Coord.Vector(
																new AST.Vector.Dir(this.direction, cpDist)
															)
														)
													)
												),
												new AST.Decor(List.empty)
											)
										),
										List.empty
									)
								)
							)
						)))
					)
				),
				new AST.Decor(List.empty)
			)
		);
	}
});

augment(AST.Command.Ar.Form.CurveFitToDirection, {
	toShape: function (context) {
		// the following AST means **\crv{;+/outdir 3pc/ & ;+/indir 3pc/}.
		var env = context.env;
		env.pathActionForBeforeSegment = new Option.Some(
			new AST.PosDecor(
				new AST.Pos.Coord(
					new AST.Coord.C(),
					List.empty.append(
						new AST.Pos.ConnectObject(new AST.Object(env.arrowObjectModifiers, new AST.ObjectBox.Curve(
							List.empty,
							List.empty.append(
								new AST.ObjectBox.Curve.Object.Connect(
									env.stemConn.getObject(context)
								)
							),
							List.empty.append(
								new AST.ObjectBox.Curve.PosList.Pos(
									new AST.Pos.Coord(
										new AST.Coord.C(),
										List.empty.append(
											new AST.Pos.SwapPAndC(
												new AST.Coord.C()
											)
										).append(
											new AST.Pos.Plus(
												new AST.Coord.Vector(new AST.Vector.Dir(this.outDirection, "3pc"))
											)
										)
									)
								)
							).append(
								new AST.ObjectBox.Curve.PosList.Pos(
									new AST.Pos.Coord(
										new AST.Coord.C(),
										List.empty.append(
											new AST.Pos.SwapPAndC(
												new AST.Coord.C()
											)
										).append(
											new AST.Pos.Plus(
												new AST.Coord.Vector(new AST.Vector.Dir(this.inDirection, "3pc"))
											)
										)
									)
								)
							)
						)))
					)
				),
				new AST.Decor(List.empty)
			)
		);
	}
});

augment(AST.Command.Ar.Form.CurveWithControlPoints, {
	toShape: function (context) {
		var env = context.env;
		var tmpEnv = env.duplicate();
		tmpEnv.startCapturePositions();
		var tmpContext = new DrawingContext(Shape.none, tmpEnv);
		this.coord.position(tmpContext);
		var positions = tmpEnv.endCapturePositions();
		positions = positions.append(tmpEnv.c);
		
		var points = List.empty;
		positions.reverse().foreach(function (pos) {
			var xy = env.inverseAbsVector(pos.x, pos.y);
			points = points.prepend(new AST.ObjectBox.Curve.PosList.Pos(
									new AST.Pos.Coord(
										new AST.Coord.Vector(new AST.Vector.InCurBase(xy.x, xy.y)),
										List.empty
									)
								));
		});
		
		// the following AST means **\crv{ control points }.
		env.pathActionForBeforeSegment = new Option.Some(
			new AST.PosDecor(
				new AST.Pos.Coord(
					new AST.Coord.C(),
					List.empty.append(
						new AST.Pos.ConnectObject(new AST.Object(env.arrowObjectModifiers, new AST.ObjectBox.Curve(
							List.empty,
							List.empty.append(
								new AST.ObjectBox.Curve.Object.Connect(
									env.stemConn.getObject(context)
								)
							),
							points
						)))
					)
				),
				new AST.Decor(List.empty)
			)
		);
	}
});

augment(AST.Command.Ar.Form.AddShape, {
	toShape: function (context) {
		context.env.arrowObjectModifiers = List.empty.append(this.shape);
	}
});

augment(AST.Command.Ar.Form.AddModifiers, {
	toShape: function (context) {
		context.env.arrowObjectModifiers = this.modifiers;
	}
});

augment(AST.Command.Ar.Form.Slide, {
	toShape: function (context) {
		context.env.segmentSlideEm = new Option.Some(xypicGlobalContext.measure.length2em(this.slideDimen));
	}
});

augment(AST.Command.Ar.Form.LabelAt, {
	toShape: function (context) {
		var env = context.env;
		env.labelsForEverySegment = new Option.Some(
			new AST.Command.Path.Labels(
				List.empty.append(
					new AST.Command.Path.Label.At(
						new AST.Pos.Place(this.anchor), this.it, Option.empty
					)
				)
			)
		);
	}
});

augment(AST.Command.Ar.Form.LabelAbove, {
	toShape: function (context) {
		var env = context.env;
		var label;
		if (env.reverseAboveAndBelow) {
			label = new AST.Command.Path.Label.Below(
						new AST.Pos.Place(this.anchor), this.it, Option.empty
					);
		} else {
			label = new AST.Command.Path.Label.Above(
						new AST.Pos.Place(this.anchor), this.it, Option.empty
					);
		}
		env.labelsForEverySegment = new Option.Some(
			new AST.Command.Path.Labels(List.empty.append(label))
		);
	}
});

augment(AST.Command.Ar.Form.LabelBelow, {
	toShape: function (context) {
		var env = context.env;
		var label;
		if (env.reverseAboveAndBelow) {
			label = new AST.Command.Path.Label.Above(
						new AST.Pos.Place(this.anchor), this.it, Option.empty
					);
		} else {
			label = new AST.Command.Path.Label.Below(
						new AST.Pos.Place(this.anchor), this.it, Option.empty
					);
		}
		env.labelsForEverySegment = new Option.Some(
			new AST.Command.Path.Labels(List.empty.append(label))
		);
	}
});

augment(AST.Command.Ar.Form.ReverseAboveAndBelow, {
	toShape: function (context) {
		context.env.reverseAboveAndBelow = true;
	}
});

augment(AST.Command.Ar.Form.Conn.Connchars, {
	getObject: function (context) {
		var env = context.env;
		var dir = new AST.ObjectBox.Dir(env.arrowVariant, this.connchars);
		return new AST.Object(env.arrowObjectModifiers, dir);
	}
});

augment(AST.Command.Ar.Form.Conn.Object, {
	getObject: function (context) {
		var modifiers = context.env.arrowObjectModifiers.concat(this.object.modifiers);
		return new AST.Object(modifiers, this.object.object);
	}
});

augment(AST.Command.Ar.Form.Conn.Dir, {
	getObject: function (context) {
		var env = context.env;
		var thisDir = this.dir;
		var dir = thisDir;
		if (thisDir.variant === "" && env.arrowVariant !== "") {
			dir = new AST.ObjectBox.Dir(env.arrowVariant, thisDir.main);
		}
		return new AST.Object(env.arrowObjectModifiers, dir);
	}
});

augment(AST.Command.Ar.Form.Tip.Tipchars, {
	getObject: function (context) {
		var env = context.env;
		var dir = new AST.ObjectBox.Dir(env.arrowVariant, this.tipchars);
		return new AST.Object(env.arrowObjectModifiers, dir);
	}
});

augment(AST.Command.Ar.Form.Tip.Object, {
	getObject: function (context) {
		var modifiers = context.env.arrowObjectModifiers.concat(this.object.modifiers);
		return new AST.Object(modifiers, this.object.object);
	}
});

augment(AST.Command.Ar.Form.Tip.Dir, {
	getObject: function (context) {
		var env = context.env;
		var thisDir = this.dir;
		var dir = thisDir;
		if (thisDir.variant === "" && env.arrowVariant !== "") {
			dir = new AST.ObjectBox.Dir(env.arrowVariant, thisDir.main);
		}
		return new AST.Object(env.arrowObjectModifiers, dir);
	}
});



augment(AST.Command.Path, {
	toShape: function (context) {
		var env = context.env;
		var origin = env.origin;
		var xBase = env.xBase;
		var yBase = env.yBase;
		var p = env.p;
		var c = env.c;
		
		env.pathActionForBeforeSegment = Option.empty;
		env.pathActionForAfterSegment = Option.empty;
		env.labelsForNextSegmentOnly = Option.empty;
		env.labelsForLastSegmentOnly = Option.empty;
		env.labelsForEverySegment = Option.empty;
		env.segmentSlideEm = Option.empty;
		env.lastTurnDiag = Option.empty;
		
		this.path.toShape(context);
		
		env.c = c;
		env.p = p;
		env.origin = origin;
		env.xBase = xBase;
		env.yBase = yBase;
	}
});

augment(AST.Command.AfterPath, {
	toShape: function (context) {
		this.path.toShape(context);
		this.decor.toShape(context);
	}
});

augment(AST.Command.Path.Path, {
	toShape: function (context) {
		this.pathElements.foreach(function (e) {
			e.toShape(context);
		});
	}
});

augment(AST.Command.Path.SetBeforeAction, {
	toShape: function (context) {
		context.env.pathActionForBeforeSegment = new Option.Some(this.posDecor);
	}
});

augment(AST.Command.Path.SetAfterAction, {
	toShape: function (context) {
		context.env.pathActionForAfterSegment = new Option.Some(this.posDecor);
	}
});

augment(AST.Command.Path.AddLabelNextSegmentOnly, {
	toShape: function (context) {
		context.env.labelsForNextSegmentOnly = new Option.Some(this.labels);
	}
});

augment(AST.Command.Path.AddLabelLastSegmentOnly, {
	toShape: function (context) {
		context.env.labelsForLastSegmentOnly = new Option.Some(this.labels);
	}
});

augment(AST.Command.Path.AddLabelEverySegment, {
	toShape: function (context) {
		context.env.labelsForEverySegment = new Option.Some(this.labels);
	}
});

augment(AST.Command.Path.StraightSegment, {
	toShape: function (context) {
		var env = context.env;
		this.segment.setupPositions(context);
		var c = env.c;
		env.pathActionForBeforeSegment.foreach(function (action) {
			action.toShape(context);
		});
		env.labelsForNextSegmentOnly.foreach(function (labels) {
			labels.toShape(context);
			env.labelsForNextSegmentOnly = Option.empty;
		});
		env.labelsForEverySegment.foreach(function (labels) {
			labels.toShape(context);
		});
		env.c = c;
		env.pathActionForAfterSegment.foreach(function (action) {
			action.toShape(context);
		});
		this.segment.toLabelsShape(context);
	}
});

augment(AST.Command.Path.LastSegment, {
	toShape: function (context) {
		var env = context.env;
		this.segment.setupPositions(context);
		var c = env.c;
		env.pathActionForBeforeSegment.foreach(function (action) {
			action.toShape(context);
		});
		env.labelsForNextSegmentOnly.foreach(function (labels) {
			labels.toShape(context);
			env.labelsForNextSegmentOnly = Option.empty;
		});
		env.labelsForLastSegmentOnly.foreach(function (labels) {
			labels.toShape(context);
			env.labelsForNextSegmentOnly = Option.empty;
		});
		env.labelsForEverySegment.foreach(function (labels) {
			labels.toShape(context);
		});
		env.c = c;
		env.pathActionForAfterSegment.foreach(function (action) {
			action.toShape(context);
		});
		this.segment.toLabelsShape(context);
	}
});

augment(AST.Command.Path.TurningSegment, {
	toShape: function (context) {
		var env = context.env;
		var p = env.c;
		this.segment.pos.toShape(context);
		env.p = p;
		var circle = this.turn.explicitizedCircle(context);
		var r = this.turn.radius.radius(context);
		env.lastTurnDiag = new Option.Some(circle.endDiag);
		
		var sv = circle.startVector(context);
		var ev = circle.endVector(context);
		
		var slideEm = env.segmentSlideEm.getOrElse(0);
		this.segment.slide.dimen.foreach(function (d) {
			slideEm = xypicGlobalContext.measure.length2em(d);
			env.segmentSlideEm = new Option.Some(slideEm);
		});
		if (slideEm !== 0) {
			env.p = env.p.move(
				env.p.x - slideEm * sv.y,
				env.p.y + slideEm * sv.x);
			env.c = env.c.move(
				env.c.x - slideEm * ev.y,
				env.c.y + slideEm * ev.x);
			if (circle.orient === "^") {
				r = Math.max(0, r - slideEm);
			} else {
				r = Math.max(0, r + slideEm);
			}
		}
		
		var s = env.p.edgePoint(env.p.x + sv.x, env.p.y + sv.y);
		var e = env.c;
		
		var ds = circle.relativeStartPoint(context, r);
		var de = circle.relativeEndPoint(context, r);
		var deo = circle.relativeEndPoint(context, r + (circle.orient === "^"? slideEm : -slideEm));
		
		var t;
		var det = sv.x * ev.y - sv.y * ev.x;
		if (Math.abs(det) < XypicConstants.machinePrecision) {
			t = 0;
		} else {
			var dx = e.x - s.x + ds.x - de.x;
			var dy = e.y - s.y + ds.y - de.y;
			t = (ev.y * dx - ev.x * dy)/det;
			if (t < 0) { t = 0; }
		}
		var x = s.x - ds.x + t * sv.x;
		var y = s.y - ds.y + t * sv.y;
		
		var circleShape = circle.toDropShape(context, x, y, r);
		
		var c = new Frame.Point(x + deo.x, y + deo.y);
		
		env.c = new Frame.Point(x + ds.x, y + ds.y);
		env.pathActionForBeforeSegment.foreach(function (action) {
			action.toShape(context);
		});
		env.labelsForNextSegmentOnly.foreach(function (labels) {
			labels.toShape(context);
			env.labelsForNextSegmentOnly = Option.empty;
		});
		env.labelsForEverySegment.foreach(function (labels) {
			labels.toShape(context);
		});
		env.c = c;
		env.pathActionForAfterSegment.foreach(function (action) {
			action.toShape(context);
		});
		
		this.segment.toLabelsShape(context);
	}
});

augment(AST.Command.Path.Turn.Cir, {
	explicitizedCircle: function (context) {
		var env = context.env;
		var startDiag, orient, endDiag;
		if (this.cir.startDiag.isEmpty) {
			startDiag = env.lastTurnDiag.getOrElse(new AST.Diag.R());
		} else {
			startDiag = this.cir.startDiag;
		}
		orient = this.cir.orient;
		if (this.cir.endDiag.isEmpty) {
			endDiag = startDiag.turn(orient);
		} else {
			endDiag = this.cir.endDiag;
		}
		return new AST.ObjectBox.Cir.Cir.Segment(startDiag, orient, endDiag);
	}
});

augment(AST.ObjectBox.Cir.Cir.Segment, {
	startVector: function (context) {
		var angle = this.startDiag.angle(context);
		return { x:Math.cos(angle), y:Math.sin(angle) };
	},
	endVector: function (context) {
		var angle = this.endDiag.angle(context);
		return { x:Math.cos(angle), y:Math.sin(angle) };
	},
	relativeStartPointAngle: function (context) {
		return this.startPointDegree(context) / 180 * Math.PI;
	},
	relativeStartPoint: function (context, r) {
		var angle = this.startPointDegree(context) / 180 * Math.PI;
		return { x:r * Math.cos(angle), y:r * Math.sin(angle) };
	},
	relativeEndPoint: function (context, r) {
		var angle;
		angle = this.endPointDegree(context, this.relativeStartPointAngle(context)) / 180 * Math.PI;
		return { x:r * Math.cos(angle), y:r * Math.sin(angle) };
	}
});

augment(AST.Command.Path.Turn.Diag, {
	explicitizedCircle: function (context) {
		var env = context.env;
		var startDiag, orient, endDiag;
		if (this.diag.isEmpty) {
			startDiag = env.lastTurnDiag.getOrElse(new AST.Diag.R());
		} else {
			startDiag = this.diag;
		}
		var angle = startDiag.angle(context);
		var det = (env.c.x - env.p.x) * Math.sin(angle) - (env.c.y - env.p.y) * Math.cos(angle);
		orient = (det < 0? "^" : "_");
		endDiag = startDiag.turn(orient);
		return new AST.ObjectBox.Cir.Cir.Segment(startDiag, orient, endDiag);
	}
});

augment(AST.Command.Path.TurnRadius.Default, {
	radius: function (context) {
		return xypicGlobalContext.measure.turnradius;
	}
});

augment(AST.Command.Path.TurnRadius.Dimen, {
	radius: function (context) {
		return xypicGlobalContext.measure.length2em(this.dimen);
	}
});

augment(AST.Command.Path.Segment, {
	setupPositions: function (context) {
		var env = context.env;
		env.p = env.c;
		this.pos.toShape(context);
		var p = env.p;
		var c = env.c;
		
		var tx = c.x - p.x;
		var ty = c.y - p.y;
		var angle = Math.atan2(ty, tx) + Math.PI / 2;
		var slideEm = env.segmentSlideEm.getOrElse(0);
		this.slide.dimen.foreach(function (d) {
			slideEm = xypicGlobalContext.measure.length2em(d);
			env.segmentSlideEm = new Option.Some(slideEm);
		});
		if (slideEm !== 0) {
			p = p.move(p.x + slideEm * Math.cos(angle), p.y + slideEm * Math.sin(angle));
			c = c.move(c.x + slideEm * Math.cos(angle), c.y + slideEm * Math.sin(angle));
		}
		
		env.p = p;
		env.c = c;
	},
	toLabelsShape: function (context) {
		var env = context.env;
		var c = env.c, p = env.p;
		this.labels.toShape(context);
		env.c = c;
		env.p = p;
	}
});

augment(AST.Command.Path.Labels, {
	toShape: function (context) {
		this.labels.foreach(function (label) {
			label.toShape(context);
		});
	}
});

augment(AST.Command.Path.Label, {
	toShape: function (context) {
		var env = context.env;
		var p = env.p;
		var c = env.c;
		var t = this.anchor.toShape(context);
		var labelmargin = this.getLabelMargin(context);
		if (labelmargin !== 0) {
			var lastCurve = env.lastCurve;
			var angle;
			if (!lastCurve.isNone) {
				angle = lastCurve.angle(t) + Math.PI/2 + (labelmargin > 0? 0 : Math.PI);
			} else {
				angle = Math.atan2(c.y - p.y, c.x - p.x) + Math.PI/2;
			}
			var c = env.c;
			var subcontext = new DrawingContext(Shape.none, env);
			this.it.toDropShape(subcontext);
			var labelShape = subcontext.shape;
			var bbox = labelShape.getBoundingBox();
			if (bbox !== undefined) {
				var x = bbox.x - c.x;
				var y = bbox.y - c.y;
				var l = bbox.l;
				var r = bbox.r;
				var u = bbox.u;
				var d = bbox.d;
				
				var cos = Math.cos(angle);
				var sin = Math.sin(angle);
				var delta = Math.min(
					(x - l) * cos + (y - d) * sin,
					(x - l) * cos + (y + u) * sin,
					(x + r) * cos + (y - d) * sin,
					(x + r) * cos + (y + u) * sin
				);
				var margin = Math.abs(labelmargin) - delta;
				env.c = env.c.move(c.x + margin * cos, c.y + margin * sin);
				context.appendShapeToFront(new Shape.TranslateShape(margin * cos, margin * sin, labelShape));
			}
		} else {
			this.it.toDropShape(context);
		}
		var lastCurve = env.lastCurve;
		
		if (this.shouldSliceHole && lastCurve.isDefined && t !== undefined) {
			lastCurve.sliceHole(env.c, t);
		}
		this.aliasOption.foreach(function (alias) {
			env.savePos(alias, new Saving.Position(env.c));
		});
	}
});

augment(AST.Command.Path.Label.Above, {
	getLabelMargin: function (context) {
		return context.env.labelmargin;
	},
	shouldSliceHole: false
});

augment(AST.Command.Path.Label.Below, {
	getLabelMargin: function (context) {
		return -context.env.labelmargin;
	},
	shouldSliceHole: false
});

augment(AST.Command.Path.Label.At, {
	getLabelMargin: function (context) {
		return 0;
	},
	shouldSliceHole: true
});

augment(AST.Command.Xymatrix, {
	toShape: function (context) {
		var origEnv = context.env;
		if (origEnv.c === undefined) {
			return Shape.none;
		}
		
		var subEnv = origEnv.duplicate();
		var subcontext = new DrawingContext(Shape.none, subEnv);
		subEnv.xymatrixPrefix = "";
		subEnv.xymatrixRowSepEm = xypicGlobalContext.measure.length2em("2pc");
		subEnv.xymatrixColSepEm = xypicGlobalContext.measure.length2em("2pc");
		subEnv.xymatrixPretendEntryHeight = Option.empty;
		subEnv.xymatrixPretendEntryWidth = Option.empty;
		subEnv.xymatrixFixedRow = false;
		subEnv.xymatrixFixedCol = false;
		subEnv.xymatrixOrientationAngle = 0;
		subEnv.xymatrixEntryModifiers = List.empty;
		
		this.setup.foreach(function (sw) { sw.toShape(subcontext); });
		
		var orientation = subEnv.xymatrixOrientationAngle;
		
		var rowCount;
		var columnCount = 0;
		var rownum = 0, colnum;
		var matrix = new Xymatrix(
			this.rows.map(function (row) {
				rownum += 1;
				colnum = 0;
				var rowModel = new Xymatrix.Row(
					row.entries.map(function (entry) {
						colnum += 1;
						var localEnv = subEnv.duplicate();
						localEnv.origin = {x:0, y:0};
						localEnv.p = localEnv.c = Env.originPosition;
						localEnv.angle = 0;
						localEnv.lastCurve = LastCurve.none;
						localEnv.xymatrixRow = rownum; // = \the\Row
						localEnv.xymatrixCol = colnum; // = \the\Col
						var localContext = new DrawingContext(Shape.none, localEnv);
						var shape = entry.toShape(localContext);
						var c = localEnv.c;
						var l, r, u, d;
						if (subEnv.xymatrixPretendEntryHeight.isDefined) {
							var h = subEnv.xymatrixPretendEntryHeight.get;
							u = h / 2;
							d = h / 2;
						} else {
							u = c.u;
							d = c.d;
						}
						if (subEnv.xymatrixPretendEntryWidth.isDefined) {
							var w = subEnv.xymatrixPretendEntryWidth.get;
							l = w / 2;
							r = w / 2;
						} else {
							l = c.l;
							r = c.r;
						}
						var frame = new Frame.Rect(0, 0, { l:l, r:r, u:u, d:d });
						return new Xymatrix.Entry(localEnv.c, shape, entry.decor, frame);
					}),
					orientation
				);
				columnCount = Math.max(columnCount, colnum);
				return rowModel;
			}),
			orientation
		);
		rowCount = rownum;
		
		if (rowCount === 0) {
			return Shape.none;
		}
		
		var colnum;
		matrix.rows.foreach(function (row) {
			colnum = 0;
			row.entries.foreach (function (entry) {
				colnum += 1;
				var column = matrix.getColumn(colnum);
				column.addEntry(entry);
			});
		});
		
		/*
		console.log(matrix.toString());
		
		var rownum = 0;
		matrix.rows.foreach(function (row) {
			rownum += 1;
			console.log("row[" + rownum + "] #" + row.entries.length() + " u:" + row.getU() + ", d:" + row.getD());
		})
		var colnum = 0;
		matrix.columns.foreach(function (col) {
			colnum += 1;
			console.log("column[" + colnum + "] #" + col.entries.length() + " l:" + col.getL() + ", r:" + col.getR());
		})
		*/
		
		var colsep = subEnv.xymatrixColSepEm;
		var xs = [];
		var x = origEnv.c.x;
		xs.push(x);
		var l, r;
		if (subEnv.xymatrixFixedCol) {
			var maxL = 0;
			var maxR = 0;
			matrix.columns.foreach(function (col) {
				maxL = Math.max(maxL, col.getL());
				maxR = Math.max(maxR, col.getR());
			});
			matrix.columns.tail.foreach(function (col) {
				x = x + maxR + colsep + maxL;
				xs.push(x);
			});
			l = maxL;
			r = xs[xs.length - 1] + maxR;
		} else {
			var prevCol = matrix.columns.head;
			matrix.columns.tail.foreach(function (col) {
				x = x + prevCol.getR() + colsep + col.getL();
				xs.push(x);
				prevCol = col;
			});
			l = matrix.columns.head.getL();
			r = x + matrix.columns.at(columnCount - 1).getR() - xs[0];
		}
		
		var rowsep = subEnv.xymatrixRowSepEm;
		var ys = [];
		var y = origEnv.c.y;
		ys.push(y);
		var u, d;
		if (subEnv.xymatrixFixedRow) {
			var maxU = 0;
			var maxD = 0;
			matrix.rows.foreach(function (row) {
				maxU = Math.max(maxU, row.getU());
				maxD = Math.max(maxD, row.getD());
			});
			matrix.rows.tail.foreach(function (row) {
				y = y - (maxD + rowsep + maxU);
				ys.push(y);
			});
			u = maxU;
			d = ys[0] - ys[ys.length - 1] + maxD;
		} else {
			var prevRow = matrix.rows.head;
			matrix.rows.tail.foreach(function (row) {
				y = y - (prevRow.getD() + rowsep + row.getU());
				ys.push(y);
				prevRow = row;
			});
			u = matrix.rows.head.getU();
			d = ys[0] - y + matrix.rows.at(rowCount - 1).getD();
		}
		origEnv.c = new Frame.Rect(origEnv.c.x, origEnv.c.y, { l:l, r:r, u:u, d:d });
		
		var prefix = subEnv.xymatrixPrefix;
		var cos = Math.cos(orientation);
		var sin = Math.sin(orientation);
		var rowIndex = 0;
		matrix.rows.foreach(function (row) {
			var colIndex = 0;
			row.entries.foreach (function (entry) {
				var x0 = xs[colIndex];
				var y0 = ys[rowIndex];
				var x = x0 * cos - y0 * sin;
				var y = x0 * sin + y0 * cos;
				var colnum = colIndex + 1;
				var rownum = rowIndex + 1;
				var pos = new Saving.Position(entry.c.move(x, y));
				subEnv.savePos("" + rownum + "," + colnum, pos);
				subEnv.savePos(prefix + rownum + "," + colnum, pos);
				colIndex += 1;
			});
			rowIndex += 1;
		});
		
		subcontext = new DrawingContext(Shape.none, subEnv);
		var rowIndex = 0;
		matrix.rows.foreach(function (row) {
			var colIndex = 0;
			row.entries.foreach (function (entry) {
				var x0 = xs[colIndex];
				var y0 = ys[rowIndex];
				var x = x0 * cos - y0 * sin;
				var y = x0 * sin + y0 * cos;
				var colnum = colIndex + 1;
				var rownum = rowIndex + 1;
				var objectShape = new Shape.TranslateShape(x, y, entry.objectShape);
				subcontext.appendShapeToFront(objectShape);
				// draw decor
				subEnv.c = entry.c.move(x, y);
				subEnv.xymatrixRow = rownum; // = \the\Row
				subEnv.xymatrixCol = colnum; // = \the\Col
				entry.decor.toShape(subcontext);
				colIndex += 1;
			});
			rowIndex += 1;
		});
		var matrixShape = subcontext.shape;
		context.appendShapeToFront(matrixShape);
		origEnv.savedPosition = subEnv.savedPosition;
		
		return matrixShape;
	}
});

// xymatrix data models
class Xymatrix {
	constructor(rows, orientation) {
		this.rows = rows;
		this.columns = List.empty;
		this.orientation = orientation;
	}

	getColumn(colnum /* >= 1 */) {
		if (this.columns.length() >= colnum) {
			return this.columns.at(colnum - 1);
		} else {
			var column = new Xymatrix.Column(this.orientation);
			this.columns = this.columns.append(column);
			return column;
		}
	}

	toString() {
		return "Xymatrix{\n" + this.rows.mkString("\\\\\n") + "\n}";
	}
}

Xymatrix.Row = class Xymatrix_Row {
	constructor(entries, orientation) {
		this.entries = entries;
		this.orientation = orientation;
		XypicUtil.memoize(this, "getU");
		XypicUtil.memoize(this, "getD");
	}

	getU() {
		var orientation = this.orientation;
		var maxU = 0;
		this.entries.foreach(function (e) { maxU = Math.max(maxU, e.getU(orientation)); })
		return maxU;
	}

	getD() {
		var orientation = this.orientation;
		var maxD = 0;
		this.entries.foreach(function (e) { maxD = Math.max(maxD, e.getD(orientation)); })
		return maxD;
	}

	toString() {
		return this.entries.mkString(" & ");
	}
}

Xymatrix.Column = class Xymatrix_Column {
	constructor(orientation) {
		this.entries = List.empty;
		this.orientation = orientation;
		XypicUtil.memoize(this, "getL");
		XypicUtil.memoize(this, "getR");
	}

	addEntry(entry) {
		this.entries = this.entries.append(entry);
		this.getL.reset;
		this.getR.reset;
	}

	getL() {
		var orientation = this.orientation;
		var maxL = 0;
		this.entries.foreach(function (e) { maxL = Math.max(maxL, e.getL(orientation)); })
		return maxL;
	}

	getR() {
		var orientation = this.orientation;
		var maxR = 0;
		this.entries.foreach(function (e) { maxR = Math.max(maxR, e.getR(orientation)); })
		return maxR;
	}

	toString() {
		return this.entries.mkString(" \\\\ ");
	}
}

Xymatrix.Entry = class Xymatrix_Entry {
	constructor(c, objectShape, decor, frame) {
		this.c = c;
		this.objectShape = objectShape;
		this.decor = decor;
		this.frame = frame;
	}

	getDistanceToEdgePoint(frame, angle) {
		var edgePoint = frame.edgePoint(frame.x + Math.cos(angle), frame.y + Math.sin(angle));
		var dx = edgePoint.x - frame.x;
		var dy = edgePoint.y - frame.y;
		return Math.sqrt(dx * dx + dy * dy);
	}

	getU(orientation) {
		if (orientation === 0) {
			return this.frame.u;
		}
		return this.getDistanceToEdgePoint(this.frame, orientation + Math.PI / 2);
	}

	getD(orientation) {
		if (orientation === 0) {
			return this.frame.d;
		}
		return this.getDistanceToEdgePoint(this.frame, orientation - Math.PI / 2);
	}

	getL(orientation) {
		if (orientation === 0) {
			return this.frame.l;
		}
		return this.getDistanceToEdgePoint(this.frame, orientation + Math.PI);
	}

	getR(orientation) {
		if (orientation === 0) {
			return this.frame.r;
		}
		return this.getDistanceToEdgePoint(this.frame, orientation);
	}

	toString() {
		return this.objectShape.toString() + " " + this.decor;
	}
}


augment(AST.Command.Xymatrix.Setup.Prefix, {
	toShape: function (context) {
		context.env.xymatrixPrefix = this.prefix;
	}
});

augment(AST.Command.Xymatrix.Setup.ChangeSpacing.Row, {
	toShape: function (context) {
		var env = context.env;
		env.xymatrixRowSepEm = this.addop.applyToDimen(env.xymatrixRowSepEm, xypicGlobalContext.measure.length2em(this.dimen));
	}
});

augment(AST.Command.Xymatrix.Setup.ChangeSpacing.Column, {
	toShape: function (context) {
		var env = context.env;
		env.xymatrixColSepEm = this.addop.applyToDimen(env.xymatrixColSepEm, xypicGlobalContext.measure.length2em(this.dimen));
	}
});

augment(AST.Command.Xymatrix.Setup.ChangeSpacing.RowAndColumn, {
	toShape: function (context) {
		var env = context.env;
		var sepEm = this.addop.applyToDimen(env.xymatrixRowSepEm, xypicGlobalContext.measure.length2em(this.dimen));
		env.xymatrixRowSepEm = sepEm;
		env.xymatrixColSepEm = sepEm;
	}
});

augment(AST.Command.Xymatrix.Setup.PretendEntrySize.Height, {
	toShape: function (context) {
		context.env.xymatrixPretendEntryHeight = new Option.Some(xypicGlobalContext.measure.length2em(this.dimen));
	}
});

augment(AST.Command.Xymatrix.Setup.PretendEntrySize.Width, {
	toShape: function (context) {
		context.env.xymatrixPretendEntryWidth = new Option.Some(xypicGlobalContext.measure.length2em(this.dimen));
	}
});

augment(AST.Command.Xymatrix.Setup.PretendEntrySize.HeightAndWidth, {
	toShape: function (context) {
		var len = new Option.Some(xypicGlobalContext.measure.length2em(this.dimen));
		context.env.xymatrixPretendEntryHeight = len;
		context.env.xymatrixPretendEntryWidth = len;
	}
});

augment(AST.Command.Xymatrix.Setup.FixGrid.Row, {
	toShape: function (context) {
		context.env.xymatrixFixedRow = true;
	}
});

augment(AST.Command.Xymatrix.Setup.FixGrid.Column, {
	toShape: function (context) {
		context.env.xymatrixFixedCol = true;
	}
});

augment(AST.Command.Xymatrix.Setup.FixGrid.RowAndColumn, {
	toShape: function (context) {
		context.env.xymatrixFixedRow = true;
		context.env.xymatrixFixedCol = true;
	}
});

augment(AST.Command.Xymatrix.Setup.AdjustEntrySize.Margin, {
	toShape: function (context) {
		var env = context.env;
		env.objectmargin = this.addop.applyToDimen(env.objectmargin, xypicGlobalContext.measure.length2em(this.dimen));
	}
});

augment(AST.Command.Xymatrix.Setup.AdjustEntrySize.Width, {
	toShape: function (context) {
		var env = context.env;
		env.objectwidth = this.addop.applyToDimen(env.objectwidth, xypicGlobalContext.measure.length2em(this.dimen));
	}
});

augment(AST.Command.Xymatrix.Setup.AdjustEntrySize.Height, {
	toShape: function (context) {
		var env = context.env;
		env.objectheight = this.addop.applyToDimen(env.objectheight, xypicGlobalContext.measure.length2em(this.dimen));
	}
});

augment(AST.Command.Xymatrix.Setup.AdjustLabelSep, {
	toShape: function (context) {
		var env = context.env;
		env.labelmargin = this.addop.applyToDimen(env.labelmargin, xypicGlobalContext.measure.length2em(this.dimen));
	}
});

augment(AST.Command.Xymatrix.Setup.SetOrientation, {
	toShape: function (context) {
		var env = context.env;
		env.xymatrixOrientationAngle = this.direction.angle(context);
	}
});

augment(AST.Command.Xymatrix.Setup.AddModifier, {
	toShape: function (context) {
		var env = context.env;
		env.xymatrixEntryModifiers = env.xymatrixEntryModifiers.prepend(this.modifier);
	}
});

augment(AST.Command.Xymatrix.Entry.SimpleEntry, {
	toShape: function (context) {
		var env = context.env;
		var defaultWidth = xypicGlobalContext.measure.em2length(env.objectmargin + env.objectwidth);
		var defaultHeight = xypicGlobalContext.measure.em2length(env.objectmargin + env.objectheight);
		var defaultSizeModifier = new AST.Modifier.AddOp(new AST.Modifier.AddOp.GrowTo(), new AST.Modifier.AddOp.VactorSize(new AST.Vector.Abs(
			defaultWidth, defaultHeight
		)));
		var margin = xypicGlobalContext.measure.em2length(env.objectmargin);
		var marginModifier = new AST.Modifier.AddOp(new AST.Modifier.AddOp.Grow(), new AST.Modifier.AddOp.VactorSize(new AST.Vector.Abs(
			margin, margin
		)));
		var modifiers = this.modifiers.concat(env.xymatrixEntryModifiers).prepend(defaultSizeModifier).prepend(marginModifier);
		return new AST.Object(modifiers, this.objectbox).toDropShape(context);
	}
});

augment(AST.Command.Xymatrix.Entry.EmptyEntry, {
	toShape: function (context) {
		var env = context.env;
		var defaultWidth = xypicGlobalContext.measure.em2length(env.objectmargin + env.objectwidth);
		var defaultHeight = xypicGlobalContext.measure.em2length(env.objectmargin + env.objectheight);
		var defaultSizeModifier = new AST.Modifier.AddOp(new AST.Modifier.AddOp.GrowTo(), new AST.Modifier.AddOp.VactorSize(new AST.Vector.Abs(
			defaultWidth, defaultHeight
		)));
		var margin = xypicGlobalContext.measure.em2length(env.objectmargin);
		var marginModifier = new AST.Modifier.AddOp(new AST.Modifier.AddOp.Grow(), new AST.Modifier.AddOp.VactorSize(new AST.Vector.Abs(
			margin, margin
		)));
		var modifiers = env.xymatrixEntryModifiers.prepend(defaultSizeModifier).prepend(marginModifier);
		return new AST.Object(modifiers, new AST.ObjectBox.Empty()).toDropShape(context);
	}
});

augment(AST.Command.Xymatrix.Entry.ObjectEntry, {
	toShape: function (context) {
		return this.object.toDropShape(context);
	}
});


augment(AST.Command.Twocell, {
	toShape: function (context) {
		var origEnv = context.env;
		if (origEnv.c === undefined) {
			return Shape.none;
		}
		
		var subEnv = origEnv.duplicate();
		var subcontext = new DrawingContext(Shape.none, subEnv);
		subEnv.twocellmodmapobject = origEnv.twocellmodmapobject || new AST.Object(List.empty, new AST.ObjectBox.Dir("", "|"));
		subEnv.twocellhead = origEnv.twocellhead || new AST.Object(List.empty, new AST.ObjectBox.Dir("", ">"));
		subEnv.twocelltail = origEnv.twocelltail || new AST.Object(List.empty, new AST.ObjectBox.Dir("", ""));
		subEnv.twocellarrowobject = origEnv.twocellarrowobject || new AST.Object(List.empty, new AST.ObjectBox.Dir("", "=>"));
		
		subEnv.twocellUpperCurveObjectSpacer = origEnv.twocellUpperCurveObjectSpacer;
		subEnv.twocellUpperCurveObject = origEnv.twocellUpperCurveObject;
		subEnv.twocellLowerCurveObjectSpacer = origEnv.twocellLowerCurveObjectSpacer;
		subEnv.twocellLowerCurveObject = origEnv.twocellLowerCurveObject;
		
		// temporary attributes
		subEnv.twocellUpperLabel = Option.empty;
		subEnv.twocellLowerLabel = Option.empty;
		subEnv.twocellCurvatureEm = Option.empty;
		subEnv.twocellShouldDrawCurve = true;
		subEnv.twocellShouldDrawModMap = false;
		
		this.switches.foreach(function (sw) { sw.setup(subcontext); });
		this.twocell.toShape(subcontext, this.arrow);
		context.appendShapeToFront(subcontext.shape);
	}
});

augment(AST.Command.Twocell.Hops2cell, {
	toShape: function (context, arrow) {
		var env = context.env;
		var c = env.c;
		var angle = env.angle;
		
		var s = env.c;
		var e = this.targetPosition(context);
		if (s === undefined || e === undefined) {
			return;
		}
		
		var dx = e.x - s.x;
		var dy = e.y - s.y;
		if (dx === 0 && dy === 0) {
			return;
		}
		
		var m = new Frame.Point(
				s.x + dx * 0.5,
				s.y + dy * 0.5
			);
		var tangle = Math.atan2(dy, dx);
		var antiClockwiseAngle = tangle + Math.PI / 2;
		
		var curvatureEm = env.twocellCurvatureEm.getOrElse(this.getDefaultCurvature());
		var ncos = Math.cos(antiClockwiseAngle);
		var nsin = Math.sin(antiClockwiseAngle);
		var ucp = this.getUpperControlPoint(s, e, m, curvatureEm, ncos, nsin);
		var lcp = this.getLowerControlPoint(s, e, m, curvatureEm, ncos, nsin);
		
		if (env.twocellShouldDrawCurve) {
			// upper curve
			var objectForDrop = env.twocellUpperCurveObjectSpacer;
			var objectForConnect;
			if (objectForDrop === undefined) {
				objectForConnect = new AST.Object(List.empty, new AST.ObjectBox.Dir("", "-"));
			} else {
				if (env.twocellUpperCurveObject !== undefined) {
					objectForConnect = env.twocellUpperCurveObject.getOrElse(undefined);
				} else {
					objectForConnect = undefined;
				}
			}
			this.toUpperCurveShape(context, s, ucp, e, objectForDrop, objectForConnect);
			if (env.lastCurve.isDefined) {
				env.angle = tangle;
				var ucmp = this.getUpperLabelPosition(s, e, m, curvatureEm, ncos, nsin);
				var uangle = this.getUpperLabelAngle(antiClockwiseAngle, s, e, m, curvatureEm, ncos, nsin);
				env.twocellUpperLabel.foreach(function (l) {
					l.toShape(context, ucmp, Math.cos(uangle), Math.sin(uangle), tangle);
				});
				if (this.hasUpperTips) {
					arrow.toUpperTipsShape(context);
				}
			}
			
			// lower curve
			var objectForDrop = env.twocellLowerCurveObjectSpacer;
			var objectForConnect;
			if (objectForDrop === undefined) {
				objectForConnect = new AST.Object(List.empty, new AST.ObjectBox.Dir("", "-"));
			} else {
				if (env.twocellLowerCurveObject !== undefined) {
					objectForConnect = env.twocellLowerCurveObject.getOrElse(undefined);
				} else {
					objectForConnect = undefined;
				}
			}
			this.toLowerCurveShape(context, s, lcp, e, objectForDrop, objectForConnect);
			if (env.lastCurve.isDefined) {
				env.angle = tangle;
				var lcmp = this.getLowerLabelPosition(s, e, m, curvatureEm, ncos, nsin);
				var langle = this.getLowerLabelAngle(antiClockwiseAngle, s, e, m, curvatureEm, ncos, nsin);
				env.twocellLowerLabel.foreach(function (l) {
					l.toShape(context, lcmp, Math.cos(langle), Math.sin(langle), tangle);
				});
				if (this.hasLowerTips) {
					arrow.toLowerTipsShape(context);
				}
			}
		}
		
		env.c = this.getDefaultArrowPoint(s, e, m, curvatureEm, ncos, nsin);
		env.angle = antiClockwiseAngle + Math.PI;
		var labelOrigin = m;
		arrow.toArrowShape(context, labelOrigin);
		
		env.c = c;
		env.angle = angle;
	},
	_toCurveShape: function (context, s, cp, e, objectForDrop, objectForConnect) {
		var env = context.env;
		var origBezier = new Curve.QuadBezier(s, cp, e);
		var tOfShavedStart = origBezier.tOfShavedStart(s);
		var tOfShavedEnd = origBezier.tOfShavedEnd(e);
		if (tOfShavedStart === undefined || tOfShavedEnd === undefined || tOfShavedStart >= tOfShavedEnd) {
			env.lastCurve = LastCurve.none;
			return;
		}
		var curveShape = origBezier.toShape(context, objectForDrop, objectForConnect);
		env.lastCurve = new LastCurve.QuadBezier(origBezier, tOfShavedStart, tOfShavedEnd, curveShape);
	},
	targetPosition: function (context) {
		var env = context.env;
		var row = env.xymatrixRow;
		var col = env.xymatrixCol;
		if (row === undefined || col === undefined) {
			throw createXypicError("ExecutionError", "rows and columns not found for hops [" + this.hops + "]");
		}
		for (var i = 0; i < this.hops.length; i++) {
			switch (this.hops[i]) {
				case 'u':
					row -= 1;
					break;
				case 'd':
					row += 1;
					break;
				case 'l':
					col -= 1;
					break;
				case 'r':
					col += 1;
					break;
			}
		}
		var id = "" + row + "," + col;
		return context.env.lookupPos(id, 'in entry "' + env.xymatrixRow + "," + env.xymatrixCol + '": No ' + this + " (is " + id + ") from here.").position(context);
	}
});

augment(AST.Command.Twocell.Twocell, {
	getUpperControlPoint: function (s, e, midPoint, curvatureEm, ncos, nsin) {
		return new Frame.Point(
			midPoint.x + curvatureEm * ncos,
			midPoint.y + curvatureEm * nsin
		);
	},
	getLowerControlPoint: function (s, e, midPoint, curvatureEm, ncos, nsin) {
		return new Frame.Point(
			midPoint.x - curvatureEm * ncos,
			midPoint.y - curvatureEm * nsin
		);
	},
	getUpperLabelPosition: function (s, e, midPoint, curvatureEm, ncos, nsin) {
		return new Frame.Point(
			midPoint.x + 0.5 * curvatureEm * ncos,
			midPoint.y + 0.5 * curvatureEm * nsin
		);
	},
	getLowerLabelPosition: function (s, e, midPoint, curvatureEm, ncos, nsin) {
		return new Frame.Point(
			midPoint.x - 0.5 * curvatureEm * ncos,
			midPoint.y - 0.5 * curvatureEm * nsin
		);
	},
	getUpperLabelAngle: function (antiClockwiseAngle, s, e, midPoint, curvatureEm, ncos, nsin) {
		var rot = (curvatureEm < 0? Math.PI : 0);
		return antiClockwiseAngle + rot;
	},
	getLowerLabelAngle: function (antiClockwiseAngle, s, e, midPoint, curvatureEm, ncos, nsin) {
		var rot = (curvatureEm < 0? 0 : Math.PI);
		return antiClockwiseAngle + rot;
	},
	getDefaultArrowPoint: function (s, e, midPoint, curvatureEm, ncos, nsin) {
		return midPoint;
	},
	toUpperCurveShape: function (context, s, cp, e, objectForDrop, objectForConnect) {
		this._toCurveShape(context, s, cp, e, objectForDrop, objectForConnect);
	},
	toLowerCurveShape: function (context, s, cp, e, objectForDrop, objectForConnect) {
		this._toCurveShape(context, s, cp, e, objectForDrop, objectForConnect);
	},
	getDefaultCurvature: function () { return 3.5 * xypicGlobalContext.measure.lineElementLength; },
	hasUpperTips: true,
	hasLowerTips: true
});

augment(AST.Command.Twocell.UpperTwocell, {
	getUpperControlPoint: function (s, e, midPoint, curvatureEm, ncos, nsin) {
		return new Frame.Point(
			midPoint.x + curvatureEm * ncos,
			midPoint.y + curvatureEm * nsin
		);
	},
	getLowerControlPoint: function (s, e, midPoint, curvatureEm, ncos, nsin) {
		return midPoint;
	},
	getUpperLabelPosition: function (s, e, midPoint, curvatureEm, ncos, nsin) {
		return new Frame.Point(
			midPoint.x + 0.5 * curvatureEm * ncos,
			midPoint.y + 0.5 * curvatureEm * nsin
		);
	},
	getLowerLabelPosition: function (s, e, midPoint, curvatureEm, ncos, nsin) {
		return midPoint;
	},
	getUpperLabelAngle: function (antiClockwiseAngle, s, e, midPoint, curvatureEm, ncos, nsin) {
		var rot = (curvatureEm < 0? Math.PI : 0);
		return antiClockwiseAngle + rot;
	},
	getLowerLabelAngle: function (antiClockwiseAngle, s, e, midPoint, curvatureEm, ncos, nsin) {
		var rot = (curvatureEm < 0? 0 : Math.PI);
		return antiClockwiseAngle + rot;
	},
	getDefaultArrowPoint: function (s, e, midPoint, curvatureEm, ncos, nsin) {
		return new Frame.Point(
			midPoint.x + 0.25 * curvatureEm * ncos,
			midPoint.y + 0.25 * curvatureEm * nsin
		);
	},
	toUpperCurveShape: function (context, s, cp, e, objectForDrop, objectForConnect) {
		this._toCurveShape(context, s, cp, e, objectForDrop, objectForConnect);
	},
	toLowerCurveShape: function (context, s, cp, e, objectForDrop, objectForConnect) {
		var shavedS = s.edgePoint(e.x, e.y);
		var shavedE = e.edgePoint(s.x, s.y);
		if (shavedS.x !== shavedE.x || shavedS.y !== shavedE.y) {
			context.env.lastCurve = new LastCurve.Line(shavedS, shavedE, s, e, undefined);
		} else {
			context.env.lastCurve = LastCurve.none;
		}
	},
	getDefaultCurvature: function () { return 7 * xypicGlobalContext.measure.lineElementLength; },
	hasUpperTips: true,
	hasLowerTips: false
});

augment(AST.Command.Twocell.LowerTwocell, {
	getUpperControlPoint: function (s, e, midPoint, curvatureEm, ncos, nsin) {
		return midPoint;
	},
	getLowerControlPoint: function (s, e, midPoint, curvatureEm, ncos, nsin) {
		return new Frame.Point(
			midPoint.x + curvatureEm * ncos,
			midPoint.y + curvatureEm * nsin
		);
	},
	getUpperLabelPosition: function (s, e, midPoint, curvatureEm, ncos, nsin) {
		return midPoint;
	},
	getLowerLabelPosition: function (s, e, midPoint, curvatureEm, ncos, nsin) {
		return new Frame.Point(
			midPoint.x + 0.5 * curvatureEm * ncos,
			midPoint.y + 0.5 * curvatureEm * nsin
		);
	},
	getUpperLabelAngle: function (antiClockwiseAngle, s, e, midPoint, curvatureEm, ncos, nsin) {
		var rot = (curvatureEm < 0? 0 : Math.PI);
		return antiClockwiseAngle + rot;
	},
	getLowerLabelAngle: function (antiClockwiseAngle, s, e, midPoint, curvatureEm, ncos, nsin) {
		var rot = (curvatureEm < 0? Math.PI : 0);
		return antiClockwiseAngle + rot;
	},
	getDefaultArrowPoint: function (s, e, midPoint, curvatureEm, ncos, nsin) {
		return new Frame.Point(
			midPoint.x + 0.25 * curvatureEm * ncos,
			midPoint.y + 0.25 * curvatureEm * nsin
		);
	},
	toUpperCurveShape: function (context, s, cp, e, objectForDrop, objectForConnect) {
		var shavedS = s.edgePoint(e.x, e.y);
		var shavedE = e.edgePoint(s.x, s.y);
		if (shavedS.x !== shavedE.x || shavedS.y !== shavedE.y) {
			context.env.lastCurve = new LastCurve.Line(shavedS, shavedE, s, e, undefined);
		} else {
			context.env.lastCurve = LastCurve.none;
		}
	},
	toLowerCurveShape: function (context, s, cp, e, objectForDrop, objectForConnect) {
		this._toCurveShape(context, s, cp, e, objectForDrop, objectForConnect);
	},
	getDefaultCurvature: function () { return -7 * xypicGlobalContext.measure.lineElementLength; },
	hasUpperTips: false,
	hasLowerTips: true
});

augment(AST.Command.Twocell.CompositeMap, {
	getUpperControlPoint: function (s, e, midPoint, curvatureEm, ncos, nsin) {
		var midBoxSize = this.getMidBoxSize();
		return new Frame.Ellipse(
			midPoint.x + curvatureEm * ncos,
			midPoint.y + curvatureEm * nsin,
			midBoxSize, midBoxSize, midBoxSize, midBoxSize
		);
	},
	getLowerControlPoint: function (s, e, midPoint, curvatureEm, ncos, nsin) {
		var midBoxSize = this.getMidBoxSize();
		return new Frame.Ellipse(
			midPoint.x + curvatureEm * ncos,
			midPoint.y + curvatureEm * nsin,
			midBoxSize, midBoxSize, midBoxSize, midBoxSize
		);
	},
	getUpperLabelPosition: function (s, e, midPoint, curvatureEm, ncos, nsin) {
		var dx = midPoint.x + curvatureEm * ncos - e.x;
		var dy = midPoint.y + curvatureEm * nsin - e.y;
		var l = Math.sqrt(dx * dx + dy * dy);
		return new Frame.Point(
			e.x + 0.5 * dx,
			e.y + 0.5 * dy
		);
	},
	getLowerLabelPosition: function (s, e, midPoint, curvatureEm, ncos, nsin) {
		var dx = midPoint.x + curvatureEm * ncos - s.x;
		var dy = midPoint.y + curvatureEm * nsin - s.y;
		var l = Math.sqrt(dx * dx + dy * dy);
		return new Frame.Point(
			s.x + 0.5 * dx,
			s.y + 0.5 * dy
		);
	},
	getUpperLabelAngle: function (antiClockwiseAngle, s, e, midPoint, curvatureEm, ncos, nsin) {
		var dx = e.x - midPoint.x + curvatureEm * ncos;
		var dy = e.y - midPoint.y + curvatureEm * nsin;
		var angle = Math.atan2(dy, dx);
		var rot = (curvatureEm < 0? Math.PI : 0);
		return angle + Math.PI / 2 + rot;
	},
	getLowerLabelAngle: function (antiClockwiseAngle, s, e, midPoint, curvatureEm, ncos, nsin) {
		var dx = midPoint.x + curvatureEm * ncos - s.x;
		var dy = midPoint.y + curvatureEm * nsin - s.y;
		var angle = Math.atan2(dy, dx);
		var rot = (curvatureEm < 0? Math.PI : 0);
		return angle + Math.PI / 2 + rot;
	},
	getDefaultArrowPoint: function (s, e, midPoint, curvatureEm, ncos, nsin) {
		return midPoint;
	},
	toUpperCurveShape: function (context, s, cp, e, objectForDrop, objectForConnect) {
		var env = context.env;
		var start = s;
		var end = cp;
		var shavedS = start.edgePoint(end.x, end.y);
		var shavedE = end.edgePoint(start.x, start.y);
		var p = env.p;
		var c = env.c;
		env.p = start;
		env.c = end;
		new Curve.Line(shavedS, shavedE).toShape(context, undefined, "-", "");
		env.p = p;
		env.c = c;
	},
	toLowerCurveShape: function (context, s, cp, e, objectForDrop, objectForConnect) {
		var env = context.env;
		var start = cp;
		var end = e;
		var shavedS = start.edgePoint(end.x, end.y);
		var shavedE = end.edgePoint(start.x, start.y);
		var p = env.p;
		var c = env.c;
		env.p = start;
		env.c = end;
		new Curve.Line(shavedS, shavedE).toShape(context, undefined, "-", "");
		env.p = p;
		env.c = c;
	},
	getMidBoxSize: function () { return 0.5 * xypicGlobalContext.measure.lineElementLength; },
	getDefaultCurvature: function () { return 3.5 * xypicGlobalContext.measure.lineElementLength; },
	hasUpperTips: true,
	hasLowerTips: true
});

augment(AST.Command.Twocell.Switch.UpperLabel, {
	setup: function (context) {
		var env = context.env;
		env.twocellUpperLabel = new Option.Some(this);
	},
	toShape: function (context, curveMidPos, ncos, nsin, tangle) {
		this.label.toShape(context, curveMidPos, ncos, nsin, tangle);
	}
});

augment(AST.Command.Twocell.Switch.LowerLabel, {
	setup: function (context) {
		var env = context.env;
		env.twocellLowerLabel = new Option.Some(this);
	},
	toShape: function (context, curveMidPos, ncos, nsin, tangle) {
		this.label.toShape(context, curveMidPos, ncos, nsin, tangle);
	}
});

augment(AST.Command.Twocell.Switch.SetCurvature, {
	setup: function (context) {
		var env = context.env;
		if (this.nudge.isOmit) {
			env.twocellShouldDrawCurve = false;
		} else {
			env.twocellCurvatureEm = new Option.Some(this.nudge.number * xypicGlobalContext.measure.lineElementLength);
		}
	}
});

augment(AST.Command.Twocell.Switch.DoNotSetCurvedArrows, {
	setup: function (context) {
		var env = context.env;
		env.twocellShouldDrawCurve = false;
	}
});

augment(AST.Command.Twocell.Switch.PlaceModMapObject, {
	setup: function (context) {
		var env = context.env;
		env.twocellShouldDrawModMap = true;
	}
});

augment(AST.Command.Twocell.Switch.ChangeHeadTailObject, {
	setup: function (context) {
		var env = context.env;
		switch (this.what) {
			case '`':
				env.twocelltail = this.object;
				break;
			case "'":
				env.twocellhead = this.object;
				break;
		}
	}
});

augment(AST.Command.Twocell.Switch.ChangeCurveObject, {
	setup: function (context) {
		var env = context.env;
		switch (this.what) {
			case '':
				env.twocellUpperCurveObjectSpacer = this.spacer;
				env.twocellUpperCurveObject = this.maybeObject;
				env.twocellLowerCurveObjectSpacer = this.spacer;
				env.twocellLowerCurveObject = this.maybeObject;
				break;
			case '^':
				env.twocellUpperCurveObjectSpacer = this.spacer;
				env.twocellUpperCurveObject = this.maybeObject;
				break;
			case '_':
				env.twocellLowerCurveObjectSpacer = this.spacer;
				env.twocellLowerCurveObject = this.maybeObject;
				break;
		}
	}
});

augment(AST.Command.Twocell.Label, {
	toShape: function (context, curveMidPos, ncos, nsin, tangle) {
		var maybeNudge = this.maybeNudge;
		var offset;
		if (maybeNudge.isDefined) {
			var nudge = maybeNudge.get;
			if (nudge.isOmit) {
				return;
			} else {
				offset = nudge.number * xypicGlobalContext.measure.lineElementLength;
			}
		} else {
			offset = this.getDefaultLabelOffset();
		}
		
		var env = context.env;
		var c = env.c;
		env.c = new Frame.Point(
			curveMidPos.x + offset * ncos,
			curveMidPos.y + offset * nsin
		);
		var labelObject = this.labelObject;
		labelObject.toDropShape(context);
		env.c = c;
		
	},
	getDefaultLabelOffset: function () { return xypicGlobalContext.measure.lineElementLength; }
});

augment(AST.Command.Twocell.Nudge.Number, {
	isOmit: false
});

augment(AST.Command.Twocell.Nudge.Omit, {
	isOmit: true
});

augment(AST.Command.Twocell.Arrow, {
	toTipsShape: function (context, reversed, doubleHeaded) {
		var env = context.env;
		var lastCurve = env.lastCurve;
		var c = env.c;
		var angle = env.angle;
		
		var rot = (reversed? Math.PI : 0);
		var t = lastCurve.tOfPlace(true, true, (reversed? 0 : 1), 0);
		env.c = lastCurve.position(t);
		env.angle = lastCurve.angle(t) + rot;
		env.twocellhead.toDropShape(context);
		
		var t = lastCurve.tOfPlace(true, true, (reversed? 1 : 0), 0);
		env.c = lastCurve.position(t);
		env.angle = lastCurve.angle(t) + rot;
		if (doubleHeaded) {
			env.twocellhead.toDropShape(context);
		} else {
			env.twocelltail.toDropShape(context);
		}
		
		if (env.twocellShouldDrawModMap) {
			var t = lastCurve.tOfPlace(false, false, 0.5, 0);
			env.c = lastCurve.position(t);
			env.angle = lastCurve.angle(t) + rot;
			env.twocellmodmapobject.toDropShape(context);
		}
		
		env.c = c;
		env.angle = angle;
	}
});

augment(AST.Command.Twocell.Arrow.WithOrientation, {
	toUpperTipsShape: function (context) {
		switch (this.tok) {
			case '':
			case '^':
			case '_':
			case '=':
			case '\\omit':
			case "'":
				this.toTipsShape(context, false, false);
				break;
			case '`':
				this.toTipsShape(context, true, false);
				break;
			case '"':
				this.toTipsShape(context, false, true);
				break;
			case '!':
				break;
		}
	},
	toLowerTipsShape: function (context) {
		switch (this.tok) {
			case '':
			case '^':
			case '_':
			case '=':
			case '\\omit':
			case '`':
				this.toTipsShape(context, false, false);
				break;
			case "'":
				this.toTipsShape(context, true, false);
				break;
			case '"':
				this.toTipsShape(context, false, true);
				break;
			case '!':
				break;
		}
	},
	toArrowShape: function(context, labelOrigin) {
		var env = context.env;
		var c = env.c;
		switch (this.tok) {
			case '^':
				var angle = env.angle;
				env.angle = angle + Math.PI;
				env.twocellarrowobject.toDropShape(context);
				env.c = new Frame.Point(
					c.x + xypicGlobalContext.measure.lineElementLength * Math.cos(angle - Math.PI / 2),
					c.y + xypicGlobalContext.measure.lineElementLength * Math.sin(angle - Math.PI / 2)
				);
				this.labelObject.toDropShape(context);
				env.angle = angle;
				break;
			case '':
			case '_':
				var angle = env.angle;
				env.twocellarrowobject.toDropShape(context);
				env.c = new Frame.Point(
					c.x + xypicGlobalContext.measure.lineElementLength * Math.cos(angle + Math.PI / 2),
					c.y + xypicGlobalContext.measure.lineElementLength * Math.sin(angle + Math.PI / 2)
				);
				this.labelObject.toDropShape(context);
				break;
			case '=':
				var angle = env.angle;
				var shape = new Shape.TwocellEqualityArrowheadShape(env.c, env.angle);
				context.appendShapeToFront(shape);
				env.c = new Frame.Point(
					c.x + xypicGlobalContext.measure.lineElementLength * Math.cos(angle + Math.PI / 2),
					c.y + xypicGlobalContext.measure.lineElementLength * Math.sin(angle + Math.PI / 2)
				);
				this.labelObject.toDropShape(context);
				break;
			default:
				this.labelObject.toDropShape(context);
				break;
		}
		env.c = c;
	}
});

augment(AST.Command.Twocell.Arrow.WithPosition, {
	toUpperTipsShape: function (context) {
		this.toTipsShape(context, false, false);
	},
	toLowerTipsShape: function (context) {
		this.toTipsShape(context, false, false);
	},
	toArrowShape: function(context, labelOrigin) {
		var env = context.env;
		var c = env.c;
		var angle = env.angle;
		var arrowPos;
		var nudge = this.nudge;
		if (nudge.isOmit) {
			arrowPos = c;
		} else {
			var offset = nudge.number * xypicGlobalContext.measure.lineElementLength;
			arrowPos = new Frame.Point(
				labelOrigin.x + offset * Math.cos(angle),
				labelOrigin.y + offset * Math.sin(angle)
			);
		}
		
		env.c = arrowPos;
		env.twocellarrowobject.toDropShape(context);
		if (!nudge.isOmit) {
			env.c = new Frame.Point(
				arrowPos.x + xypicGlobalContext.measure.lineElementLength * Math.cos(angle + Math.PI / 2),
				arrowPos.y + xypicGlobalContext.measure.lineElementLength * Math.sin(angle + Math.PI / 2)
			);
			this.labelObject.toDropShape(context);
		}
		env.c = c;
	}
});

augment(AST.Pos.Xyimport.TeXCommand, {
	toShape: function (context) {
		var origEnv = context.env;
		if (origEnv.c === undefined) {
			return Shape.none;
		}
		
		var subEnv = origEnv.duplicate();
		var subcontext = new DrawingContext(Shape.none, subEnv);
		var shape = this.graphics.toDropShape(subcontext);
		
		var xyWidth = this.width;
		var xyHeight = this.height;
		if (xyWidth === 0 || xyHeight === 0) {
			throw createXypicError("ExecutionError", "the 'width' and 'height' attributes of the \\xyimport should be non-zero.");
		}
		
		var c = subEnv.c;
		var imageWidth = c.l + c.r;
		var imageHeight = c.u + c.d;
		
		if (imageWidth === 0 || imageHeight === 0) {
			throw createXypicError("ExecutionError", "the width and height of the graphics to import should be non-zero.");
		}
		
		var xOffset = this.xOffset;
		var yOffset = this.yOffset;
		
		origEnv.c = c.toRect({
			u:imageHeight / xyHeight * (xyHeight - yOffset),
			d:imageHeight / xyHeight * yOffset,
			l:imageWidth / xyWidth * xOffset,
			r:imageWidth / xyWidth * (xyWidth - xOffset)
		});
		
		origEnv.setXBase(imageWidth / xyWidth, 0);
		origEnv.setYBase(0, imageHeight / xyHeight);
		
		var dx = c.l - origEnv.c.l;
		var dy = c.d - origEnv.c.d;
		var shape = new Shape.TranslateShape(dx, dy, subcontext.shape);
		context.appendShapeToFront(shape);
	}
});

augment(AST.Pos.Xyimport.Graphics, {
	toShape: function (context) {
		var origEnv = context.env;
		if (origEnv.c === undefined) {
			return Shape.none;
		}
		
		var subEnv = origEnv.duplicate();
		var subcontext = new DrawingContext(Shape.none, subEnv);
		
		var xyWidth = this.width;
		var xyHeight = this.height;
		if (xyWidth === 0 || xyHeight === 0) {
			throw createXypicError("ExecutionError", "the 'width' and 'height' attributes of the \\xyimport should be non-zero.");
		}
		
		var graphics = this.graphics;
		graphics.setup(subcontext);
		if (!subEnv.includegraphicsWidth.isDefined || !subEnv.includegraphicsHeight.isDefined) {
			throw createXypicError("ExecutionError", "the 'width' and 'height' attributes of the \\includegraphics are required.");
		}
		var imageWidth = subEnv.includegraphicsWidth.get;
		var imageHeight = subEnv.includegraphicsHeight.get;
		
		if (imageWidth === 0 || imageHeight === 0) {
			throw createXypicError("ExecutionError", "the 'width' and 'height' attributes of the \\includegraphics should be non-zero.");
		}
		
		var xOffset = this.xOffset;
		var yOffset = this.yOffset;
		
		origEnv.c = subEnv.c.toRect({
			u:imageHeight / xyHeight * (xyHeight - yOffset),
			d:imageHeight / xyHeight * yOffset,
			l:imageWidth / xyWidth * xOffset,
			r:imageWidth / xyWidth * (xyWidth - xOffset)
		});
		
		origEnv.setXBase(imageWidth / xyWidth, 0);
		origEnv.setYBase(0, imageHeight / xyHeight);
		
		var imageShape = new Shape.ImageShape(origEnv.c, graphics.filepath);
		context.appendShapeToFront(imageShape);
	}
});

augment(AST.Command.Includegraphics, {
	setup: function (context) {
		var env = context.env;
		env.includegraphicsWidth = Option.empty;
		env.includegraphicsHeight = Option.empty;
		
		this.attributeList.foreach(function (attr) {
			attr.setup(context);
		});
	}
});

augment(AST.Command.Includegraphics.Attr.Width, {
	setup: function (context) {
		var env = context.env;
		env.includegraphicsWidth = new Option.Some(xypicGlobalContext.measure.length2em(this.dimen));
	}
});

augment(AST.Command.Includegraphics.Attr.Height, {
	setup: function (context) {
		var env = context.env;
		env.includegraphicsHeight = new Option.Some(xypicGlobalContext.measure.length2em(this.dimen));
	}
});
