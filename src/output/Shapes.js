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


import {MathJax} from "../../mathjax/js/components/global.js";
import {XypicUtil} from "../util/XypicUtil.js";
import {List} from "../fp/List.js";
import {Frame} from "./Frames.js";


export class Shape {
	// <<interface>>
	/**
	 * 図形を描画する。
	 * @param {Graphics.SVG} svg SVG
	 */
	// draw function (svg) {}
	
	/**
	 * Bounding Boxを返す。
	 * @returns {Frame.Rect} Bounding Box (ない場合はundefined)
	 */
	// getBoundingBox() {}
	
	/**
	 * 中身が空であるかどうかを返す。
	 * @returns {boolean} true:空である、false:空でない
	 */
	get isNone() {
		return false;
	}
};


Shape.NoneShape = class Shape_NoneShape extends Shape {
	constructor() {
		super();
	}

	draw(svg) {
	}

	getBoundingBox() {
		return undefined;
	}

	toString() {
		return "NoneShape";
	}

	get isNone() {
		return true;
	}
};

Shape.none = new Shape.NoneShape();


Shape.InvisibleBoxShape = class Shape_InvisibleBoxShape extends Shape {
	constructor(bbox) {
		super();
		this.bbox = bbox;
	}

	draw(svg) {
	}

	getBoundingBox() {
		return this.bbox;
	}

	toString() {
		return "InvisibleBoxShape[bbox:" + this.bbox.toString() + "]";
	}
};


Shape.TranslateShape = class Shape_TranslateShape extends Shape {
	constructor(dx, dy, shape) {
		super();
		this.dx = dx;
		this.dy = dy;
		this.shape = shape;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	draw(svg) {
		var g = svg.createGroup(svg.transformBuilder().translate(this.dx, this.dy));
		this.shape.draw(g);
	}

	getBoundingBox() {
		var bbox = this.shape.getBoundingBox();
		if (bbox === undefined) {
			return undefined;
		}
		return new Frame.Rect(bbox.x + this.dx, bbox.y + this.dy, bbox);
	}

	toString() {
		return "TranslateShape[dx:" + this.dx + ", dy:" + this.dy + ", shape:" + this.shape.toString() + "]";
	}
};


Shape.CompositeShape = class Shape_CompositeShape extends Shape {
	constructor(foregroundShape, backgroundShape) {
		super();
		this.foregroundShape = foregroundShape;
		this.backgroundShape = backgroundShape;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	draw(svg) {
		this.backgroundShape.draw(svg);
		this.foregroundShape.draw(svg);
	}

	getBoundingBox() {
		return Frame.combineRect(this.foregroundShape.getBoundingBox(), this.backgroundShape.getBoundingBox());
	}

	toString() {
		return "(" + this.foregroundShape.toString() + ", " + this.backgroundShape.toString() + ")";
	}
};


Shape.ChangeColorShape = class Shape_ChangeColorShape extends Shape {
	constructor(color, shape) {
		super();
		this.color = color;
		this.shape = shape;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	draw(svg) {
		var g = svg.createChangeColorGroup(this.color);
		this.shape.draw(g);
	}

	getBoundingBox() {
		return this.shape.getBoundingBox();
	}

	toString() {
		return "" + this.shape + ", color:" + this.color;
	}
};


Shape.CircleSegmentShape = class Shape_CircleSegmentShape extends Shape {
	constructor(x, y, sx, sy, r, large, flip, ex, ey) {
		super();
		this.x = x;
		this.y = y;
		this.sx = sx;
		this.sy = sy;
		this.r = r;
		this.large = large;
		this.flip = flip;
		this.ex = ex;
		this.ey = ey;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	draw(svg) {
		svg.createSVGElement("path", {
			d:"M" + MathJax.xypic.measure.em2px(this.sx) + "," + MathJax.xypic.measure.em2px(-this.sy) + " A" + MathJax.xypic.measure.em2px(this.r) + "," + MathJax.xypic.measure.em2px(this.r) + " 0 " + this.large + "," + this.flip + " " + MathJax.xypic.measure.em2px(this.ex) + "," + MathJax.xypic.measure.em2px(-this.ey)
		});
	}

	getBoundingBox() {
		return new Frame.Ellipse(this.x, this.y, this.r, this.r, this.r, this.r);
	}

	toString() {
		return "CircleSegmentShape[x:" + this.x + ", y:" + this.y + ", sx:" + this.sx + ", sy:" + this.sy + ", r:" + this.r + ", large:" + this.large + ", flip:" + this.flip + ", ex:" + this.ex + ", ey:" + this.ey + "]";
	}
};


Shape.FullCircleShape = class Shape_FullCircleShape extends Shape {
	constructor(x, y, r) {
		super();
		this.x = x;
		this.y = y;
		this.r = r;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	draw(svg) {
		svg.createSVGElement("circle", {
			cx:MathJax.xypic.measure.em2px(this.x), cy:MathJax.xypic.measure.em2px(-this.y), r:MathJax.xypic.measure.em2px(this.r)
		});
	}

	getBoundingBox() {
		return new Frame.Ellipse(this.x, this.y, this.r, this.r, this.r, this.r);
	}

	toString() {
		return "FullCircleShape[x:" + this.x + ", y:" + this.y + ", r:" + this.r + "]";
	}
};


Shape.RectangleShape = class Shape_RectangleShape extends Shape {
	constructor(x, y, left, right, up, down, r, isDoubled, color, dasharray, fillColor, hideLine) {
		super();
		this.x = x;
		this.y = y;
		this.left = left;
		this.right = right;
		this.up = up;
		this.down = down;
		this.r = r;
		this.isDoubled = isDoubled;
		this.color = color;
		this.dasharray = dasharray;
		this.fillColor = fillColor;
		this.hideLine = hideLine || false;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	draw(svg) {
		var def;
		def = {
			x:MathJax.xypic.measure.em2px(this.x - this.left), 
			y:-MathJax.xypic.measure.em2px(this.y + this.up), 
			width:MathJax.xypic.measure.em2px(this.left + this.right), 
			height:MathJax.xypic.measure.em2px(this.up + this.down), 
			rx:MathJax.xypic.measure.em2px(this.r)
		};
		if (this.dasharray !== undefined) {
			def["stroke-dasharray"] = this.dasharray;
		}
		if (this.hideLine) {
			def["stroke"] = "none";
		} else if (this.color !== undefined) {
			def["stroke"] = this.color;
		}
		if (this.fillColor !== undefined) {
			def["fill"] = this.fillColor;
		}
		svg.createSVGElement("rect", def);
		if (this.isDoubled) {
			def = {
				x:MathJax.xypic.measure.em2px(this.x - this.left + MathJax.xypic.measure.thickness), 
				y:-MathJax.xypic.measure.em2px(this.y + this.up - MathJax.xypic.measure.thickness), 
				width:MathJax.xypic.measure.em2px(this.left + this.right - 2 * MathJax.xypic.measure.thickness), 
				height:MathJax.xypic.measure.em2px(this.up + this.down - 2 * MathJax.xypic.measure.thickness), 
				rx:MathJax.xypic.measure.em2px(Math.max(this.r - MathJax.xypic.measure.thickness, 0))
			};
			if (this.dasharray !== undefined) {
				def["stroke-dasharray"] = this.dasharray;
			}
			if (this.hideLine) {
				def["stroke"] = "none";
			} else if (this.color !== undefined) {
				def["stroke"] = this.color;
			}
			if (this.fillColor !== undefined) {
				def["fill"] = this.fillColor;
			}
			svg.createSVGElement("rect", def);
		}
	}

	getBoundingBox() {
		return new Frame.Rect(this.x, this.y, { l:this.left, r:this.right, u:this.up, d:this.down });
	}

	toString() {
		return "RectangleShape[x:" + this.x + ", y:" + this.y + ", left:" + this.left + ", right:" + this.right + ", up:" + this.up + ", down:" + this.down + ", r:" + this.r + ", isDouble:" + this.isDouble + ", dasharray:" + this.dasharray + "]";
	}
};


Shape.EllipseShape = class Shape_EllipseShape extends Shape {
	constructor(x, y, rx, ry, isDoubled, color, dasharray, fillColor, hideLine) {
		super();
		this.x = x;
		this.y = y;
		this.rx = rx;
		this.ry = ry;
		this.isDoubled = isDoubled;
		this.color = color;
		this.dasharray = dasharray;
		this.fillColor = fillColor;
		this.hideLine = hideLine || false;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	draw(svg) {
		var def;
		def = {
			cx:MathJax.xypic.measure.em2px(this.x), 
			cy:-MathJax.xypic.measure.em2px(this.y), 
			rx:MathJax.xypic.measure.em2px(this.rx), 
			ry:MathJax.xypic.measure.em2px(this.ry)
		};
		if (this.dasharray !== undefined) {
			def["stroke-dasharray"] = this.dasharray;
		}
		if (this.hideLine) {
			def["stroke"] = "none";
		} else if (this.color !== undefined) {
			def["stroke"] = this.color;
		}
		if (this.fillColor !== undefined) {
			def["fill"] = this.fillColor;
		}
		svg.createSVGElement("ellipse", def);
		if (this.isDoubled) {
			def = {
				cx:MathJax.xypic.measure.em2px(this.x), 
				cy:-MathJax.xypic.measure.em2px(this.y), 
				rx:MathJax.xypic.measure.em2px(Math.max(this.rx - MathJax.xypic.measure.thickness)), 
				ry:MathJax.xypic.measure.em2px(Math.max(this.ry - MathJax.xypic.measure.thickness))
			};
			if (this.dasharray !== undefined) {
				def["stroke-dasharray"] = this.dasharray;
			}
			if (this.hideLine) {
				def["stroke"] = "none";
			} else if (this.color !== undefined) {
				def["stroke"] = this.color;
			}
			if (this.fillColor !== undefined) {
				def["fill"] = this.fillColor;
			}
			svg.createSVGElement("ellipse", def);
		}
	}

	getBoundingBox() {
		return new Frame.Rect(this.x, this.y, { l:this.rx, r:this.rx, u:this.ry, d:this.ry });
	}

	toString() {
		return "EllipseShape[x:" + this.x + ", y:" + this.y + ", rx:" + this.rx + ", ry:" + this.ry + ", isDoubled:" + this.isDoubled + ", dasharray:" + this.dasharray + "]";
	}
};


Shape.BoxShadeShape = class Shape_BoxShadeShape extends Shape {
	constructor(x, y, left, right, up, down, depth, color) {
		super();
		this.x = x;
		this.y = y;
		this.left = left;
		this.right = right;
		this.up = up;
		this.down = down;
		this.depth = depth;
		this.color = color || "currentColor";
		XypicUtil.memoize(this, "getBoundingBox");
	}

	draw(svg) {
		var x = MathJax.xypic.measure.em2px(this.x);
		var y = MathJax.xypic.measure.em2px(this.y);
		var l = MathJax.xypic.measure.em2px(this.left);
		var r = MathJax.xypic.measure.em2px(this.right);
		var u = MathJax.xypic.measure.em2px(this.up);
		var d = MathJax.xypic.measure.em2px(this.down);
		var depth = MathJax.xypic.measure.em2px(this.depth);
		svg.createSVGElement("path", {
			d: "M" + (x - l + depth) + "," + (-y + d) + 
				"L" + (x + r) + "," + (-y + d) + 
				"L" + (x + r) + "," + (-y - u + depth) + 
				"L" + (x + r + depth) + "," + (-y - u + depth) + 
				"L" + (x + r + depth) + "," + (-y + d + depth) + 
				"L" + (x - l + depth) + "," + (-y + d + depth) + 
				"Z",
			stroke: this.color,
			fill: this.color
		});
	}

	getBoundingBox() {
		return new Frame.Rect(this.x, this.y, { l:this.left, r:this.right + this.depth, u:this.up, d:this.down + this.depth });
	}

	toString() {
		return "RectangleShape[x:" + this.x + ", y:" + this.y + ", left:" + this.left + ", right:" + this.right + ", up:" + this.up + ", down:" + this.down + ", depth:" + this.depth + "]";
	}
};


Shape.LeftBrace = class Shape_LeftBrace extends Shape {
	constructor(x, y, up, down, degree, color) {
		super();
		this.x = x;
		this.y = y;
		this.up = up;
		this.down = down;
		this.degree = degree;
		this.color = color || "currentColor";
		XypicUtil.memoize(this, "getBoundingBox");
	}

	draw(svg) {
		var scale = MathJax.xypic.measure.oneem;
		var down = Math.max(0.759375 + 0.660375, this.down / scale * 1.125) - 0.660375;
		var up = - Math.max(0.759375 + 0.660375, this.up / scale * 1.125) + 0.660375;
		
		var d;
		d = "M" + MathJax.xypic.measure.em2px(-0.0675) + " " + MathJax.xypic.measure.em2px(down) + 
			"T" + MathJax.xypic.measure.em2px(-0.068625) + " " + MathJax.xypic.measure.em2px(0.07875 + down) + 
			"Q" + MathJax.xypic.measure.em2px(-0.068625) + " " + MathJax.xypic.measure.em2px(0.190125 + down) + 
			" " + MathJax.xypic.measure.em2px(-0.0585) + " " + MathJax.xypic.measure.em2px(0.250875 + down) + 
			"T" + MathJax.xypic.measure.em2px(-0.01125) + " " + MathJax.xypic.measure.em2px(0.387 + down) + 
			"Q" + MathJax.xypic.measure.em2px(0.07425) + " " + MathJax.xypic.measure.em2px(0.55575 + down) + 
			" " + MathJax.xypic.measure.em2px(0.2475) + " " + MathJax.xypic.measure.em2px(0.6525 + down) + 
			"L" + MathJax.xypic.measure.em2px(0.262125) + " " + MathJax.xypic.measure.em2px(0.660375 + down) + 
			"L" + MathJax.xypic.measure.em2px(0.3015) + " " + MathJax.xypic.measure.em2px(0.660375 + down) + 
			"L" + MathJax.xypic.measure.em2px(0.30825) + " " + MathJax.xypic.measure.em2px(0.653625 + down) + 
			"V" + MathJax.xypic.measure.em2px(0.622125 + down) + 
			"Q" + MathJax.xypic.measure.em2px(0.30825) + " " + MathJax.xypic.measure.em2px(0.60975 + down) + 
			" " + MathJax.xypic.measure.em2px(0.2925) + " " + MathJax.xypic.measure.em2px(0.60075 + down) + 
			"Q" + MathJax.xypic.measure.em2px(0.205875) + " " + MathJax.xypic.measure.em2px(0.541125 + down) + 
			" " + MathJax.xypic.measure.em2px(0.149625) + " " + MathJax.xypic.measure.em2px(0.44775 + down) + 
			"T" + MathJax.xypic.measure.em2px(0.07425) + " " + MathJax.xypic.measure.em2px(0.239625 + down) + 
			"Q" + MathJax.xypic.measure.em2px(0.07425) + " " + MathJax.xypic.measure.em2px(0.2385 + down) + 
			" " + MathJax.xypic.measure.em2px(0.073125) + " " + MathJax.xypic.measure.em2px(0.235125 + down) + 
			"Q" + MathJax.xypic.measure.em2px(0.068625) + " " + MathJax.xypic.measure.em2px(0.203625 + down) + 
			" " + MathJax.xypic.measure.em2px(0.0675) + " " + MathJax.xypic.measure.em2px(0.041625 + down) + 
			"L" + MathJax.xypic.measure.em2px(0.0675) + " " + MathJax.xypic.measure.em2px(0.75825) + 
			"Q" + MathJax.xypic.measure.em2px(0.0675) + " " + MathJax.xypic.measure.em2px(0.496125) + 
			" " + MathJax.xypic.measure.em2px(0.066375) + " " + MathJax.xypic.measure.em2px(0.486) + 
			"Q" + MathJax.xypic.measure.em2px(0.05625) + " " + MathJax.xypic.measure.em2px(0.336375) + 
			" " + MathJax.xypic.measure.em2px(-0.021375) + " " + MathJax.xypic.measure.em2px(0.212625) + 
			"T" + MathJax.xypic.measure.em2px(-0.226125) + " " + MathJax.xypic.measure.em2px(0.010125) + 
			"L" + MathJax.xypic.measure.em2px(-0.241875) + " 0" + 
			"L" + MathJax.xypic.measure.em2px(-0.226125) + " " + MathJax.xypic.measure.em2px(-0.010125) + 
			"Q" + MathJax.xypic.measure.em2px(-0.106875) + " " + MathJax.xypic.measure.em2px(-0.084375) + 
			" " + MathJax.xypic.measure.em2px(-0.025875) + " " + MathJax.xypic.measure.em2px(-0.207) + 
			"T" + MathJax.xypic.measure.em2px(0.066375) + " " + MathJax.xypic.measure.em2px(-0.486) + 
			"Q" + MathJax.xypic.measure.em2px(0.0675) + " " + MathJax.xypic.measure.em2px(-0.496125) + 
			" " + MathJax.xypic.measure.em2px(0.0675) + " " + MathJax.xypic.measure.em2px(-0.75825) + 
			"L" + MathJax.xypic.measure.em2px(0.0675) + " " + MathJax.xypic.measure.em2px(-0.041625 + up) + 
			"Q" + MathJax.xypic.measure.em2px(0.068625) + " " + MathJax.xypic.measure.em2px(-0.203625 + up) + 
			" " + MathJax.xypic.measure.em2px(0.073125) + " " + MathJax.xypic.measure.em2px(-0.235125 + up) + 
			"Q" + MathJax.xypic.measure.em2px(0.07425) + " " + MathJax.xypic.measure.em2px(-0.2385 + up) + 
			" " + MathJax.xypic.measure.em2px(0.07425) + " " + MathJax.xypic.measure.em2px(-0.239625 + up) + 
			"Q" + MathJax.xypic.measure.em2px(0.093375) + " " + MathJax.xypic.measure.em2px(-0.354375 + up) + 
			" " + MathJax.xypic.measure.em2px(0.149625) + " " + MathJax.xypic.measure.em2px(-0.44775 + up) + 
			"T" + MathJax.xypic.measure.em2px(0.2925) + " " + MathJax.xypic.measure.em2px(-0.60075 + up) + 
			"Q" + MathJax.xypic.measure.em2px(0.30825) + " " + MathJax.xypic.measure.em2px(-0.60975 + up) + 
			" " + MathJax.xypic.measure.em2px(0.30825) + " " + MathJax.xypic.measure.em2px(-0.622125 + up) + 
			"L" + MathJax.xypic.measure.em2px(0.30825) + " " + MathJax.xypic.measure.em2px(-0.653625 + up) + 
			"L" + MathJax.xypic.measure.em2px(0.3015) + " " + MathJax.xypic.measure.em2px(-0.660375 + up) + 
			"L" + MathJax.xypic.measure.em2px(0.262125) + " " + MathJax.xypic.measure.em2px(-0.660375 + up) + 
			"L" + MathJax.xypic.measure.em2px(0.2475) + " " + MathJax.xypic.measure.em2px(-0.6525 + up) + 
			"Q" + MathJax.xypic.measure.em2px(0.07425) + " " + MathJax.xypic.measure.em2px(-0.55575 + up) + 
			" " + MathJax.xypic.measure.em2px(-0.01125) + " " + MathJax.xypic.measure.em2px(-0.387 + up) + 
			"Q" + MathJax.xypic.measure.em2px(-0.048375) + " " + MathJax.xypic.measure.em2px(-0.311625 + up) + 
			" " + MathJax.xypic.measure.em2px(-0.0585) + " " + MathJax.xypic.measure.em2px(-0.250875 + up) + 
			"T" + MathJax.xypic.measure.em2px(-0.068625) + " " + MathJax.xypic.measure.em2px(-0.07875 + up) + 
			"Q" + MathJax.xypic.measure.em2px(-0.0675) + " " + MathJax.xypic.measure.em2px(up) + 
			" " + MathJax.xypic.measure.em2px(-0.0675) + " " + MathJax.xypic.measure.em2px(up) + 
			"L" + MathJax.xypic.measure.em2px(-0.0675) + " " + MathJax.xypic.measure.em2px(-0.759375) + 
			"V" + MathJax.xypic.measure.em2px(-0.5985) + 
			"Q" + MathJax.xypic.measure.em2px(-0.0675) + " " + MathJax.xypic.measure.em2px(-0.47925) + 
			" " + MathJax.xypic.measure.em2px(-0.075375) + " " + MathJax.xypic.measure.em2px(-0.41175) + 
			"T" + MathJax.xypic.measure.em2px(-0.11475) + " " + MathJax.xypic.measure.em2px(-0.27) + 
			"Q" + MathJax.xypic.measure.em2px(-0.133875) + " " + MathJax.xypic.measure.em2px(-0.2205) + 
			" " + MathJax.xypic.measure.em2px(-0.160875) + " " + MathJax.xypic.measure.em2px(-0.17775) + 
			"T" + MathJax.xypic.measure.em2px(-0.212625) + " " + MathJax.xypic.measure.em2px(-0.106875) + 
			"T" + MathJax.xypic.measure.em2px(-0.25875) + " " + MathJax.xypic.measure.em2px(-0.06075) + 
			"T" + MathJax.xypic.measure.em2px(-0.293625) + " " + MathJax.xypic.measure.em2px(-0.0315) + 
			"T" + MathJax.xypic.measure.em2px(-0.307125) + " " + MathJax.xypic.measure.em2px(-0.02025) + 
			"Q" + MathJax.xypic.measure.em2px(-0.30825) + " " + MathJax.xypic.measure.em2px(-0.019125) + 
			" " + MathJax.xypic.measure.em2px(-0.30825) + " 0" + 
			"T" + MathJax.xypic.measure.em2px(-0.307125) + " " + MathJax.xypic.measure.em2px(0.02025) + 
			"Q" + MathJax.xypic.measure.em2px(-0.307125) + " " + MathJax.xypic.measure.em2px(0.021375) + 
			" " + MathJax.xypic.measure.em2px(-0.284625) + " " + MathJax.xypic.measure.em2px(0.03825) + 
			"T" + MathJax.xypic.measure.em2px(-0.2295) + " " + MathJax.xypic.measure.em2px(0.091125) + 
			"T" + MathJax.xypic.measure.em2px(-0.162) + " " + MathJax.xypic.measure.em2px(0.176625) + 
			"T" + MathJax.xypic.measure.em2px(-0.10125) + " " + MathJax.xypic.measure.em2px(0.30825) + 
			"T" + MathJax.xypic.measure.em2px(-0.068625) + " " + MathJax.xypic.measure.em2px(0.482625) + 
			"Q" + MathJax.xypic.measure.em2px(-0.0675) + " " + MathJax.xypic.measure.em2px(0.496125) + 
			" " + MathJax.xypic.measure.em2px(-0.0675) + " " + MathJax.xypic.measure.em2px(0.759375) + 
			"Z";
		svg.createSVGElement("path", {
			d:d, 
			fill:this.color, 
			stroke:this.color, 
			"stroke-width":"0pt", 
			transform:"translate(" + MathJax.xypic.measure.em2px(this.x) + "," + MathJax.xypic.measure.em2px(-this.y) +") rotate(" + (-this.degree) + ") scale(" + (scale / 1.125) + ")"
		});
	}

	getBoundingBox() {
		var scale = MathJax.xypic.measure.oneem;
		return new Frame.Rect(this.x, this.y, { l:0.274 * scale, r:0.274 * scale, u:Math.max((0.759375 + 0.660375) * scale / 1.125, this.up), d:Math.max((0.759375 + 0.660375) * scale / 1.125, this.down) }).rotate(this.degree * Math.PI / 180);
	}

	toString() {
		return "LeftBrace[x:" + this.x + ", y:" + this.y + ", up:" + this.up + ", down:" + this.down + "]";
	}
};


Shape.LeftParenthesis = class Shape_LeftParenthesis extends Shape {
	constructor(x, y, height, degree, color) {
		super();
		this.x = x;
		this.y = y;
		this.height = height;
		this.degree = degree;
		this.color = color || "currentColor";
		XypicUtil.memoize(this, "getBoundingBox");
	}

	draw(svg) {
		var scale = MathJax.xypic.measure.oneem;
		var down = Math.max(0.660375, this.height / 2 / scale * 1.125) - 0.660375;
		var up = -down;
		
		var d;
		d = "M" + MathJax.xypic.measure.em2px(-0.0675) + " " + MathJax.xypic.measure.em2px(down) + 
			"T" + MathJax.xypic.measure.em2px(-0.068625) + " " + MathJax.xypic.measure.em2px(0.07875 + down) + 
			"Q" + MathJax.xypic.measure.em2px(-0.068625) + " " + MathJax.xypic.measure.em2px(0.190125 + down) + 
			" " + MathJax.xypic.measure.em2px(-0.0585) + " " + MathJax.xypic.measure.em2px(0.250875 + down) + 
			"T" + MathJax.xypic.measure.em2px(-0.01125) + " " + MathJax.xypic.measure.em2px(0.387 + down) + 
			"Q" + MathJax.xypic.measure.em2px(0.07425) + " " + MathJax.xypic.measure.em2px(0.55575 + down) + 
			" " + MathJax.xypic.measure.em2px(0.2475) + " " + MathJax.xypic.measure.em2px(0.6525 + down) + 
			"L" + MathJax.xypic.measure.em2px(0.262125) + " " + MathJax.xypic.measure.em2px(0.660375 + down) + 
			"L" + MathJax.xypic.measure.em2px(0.3015) + " " + MathJax.xypic.measure.em2px(0.660375 + down) + 
			"L" + MathJax.xypic.measure.em2px(0.30825) + " " + MathJax.xypic.measure.em2px(0.653625 + down) + 
			"V" + MathJax.xypic.measure.em2px(0.622125 + down) + 
			"Q" + MathJax.xypic.measure.em2px(0.30825) + " " + MathJax.xypic.measure.em2px(0.60975 + down) + 
			" " + MathJax.xypic.measure.em2px(0.2925) + " " + MathJax.xypic.measure.em2px(0.60075 + down) + 
			"Q" + MathJax.xypic.measure.em2px(0.205875) + " " + MathJax.xypic.measure.em2px(0.541125 + down) + 
			" " + MathJax.xypic.measure.em2px(0.149625) + " " + MathJax.xypic.measure.em2px(0.44775 + down) + 
			"T" + MathJax.xypic.measure.em2px(0.07425) + " " + MathJax.xypic.measure.em2px(0.239625 + down) + 
			"Q" + MathJax.xypic.measure.em2px(0.07425) + " " + MathJax.xypic.measure.em2px(0.2385 + down) + 
			" " + MathJax.xypic.measure.em2px(0.073125) + " " + MathJax.xypic.measure.em2px(0.235125 + down) + 
			"Q" + MathJax.xypic.measure.em2px(0.068625) + " " + MathJax.xypic.measure.em2px(0.203625 + down) + 
			" " + MathJax.xypic.measure.em2px(0.0675) + " " + MathJax.xypic.measure.em2px(0.041625 + down) + 
			"L" + MathJax.xypic.measure.em2px(0.0675) + " " + MathJax.xypic.measure.em2px(-0.041625 + up) + 
			"Q" + MathJax.xypic.measure.em2px(0.068625) + " " + MathJax.xypic.measure.em2px(-0.203625 + up) + 
			" " + MathJax.xypic.measure.em2px(0.073125) + " " + MathJax.xypic.measure.em2px(-0.235125 + up) + 
			"Q" + MathJax.xypic.measure.em2px(0.07425) + " " + MathJax.xypic.measure.em2px(-0.2385 + up) + 
			" " + MathJax.xypic.measure.em2px(0.07425) + " " + MathJax.xypic.measure.em2px(-0.239625 + up) + 
			"Q" + MathJax.xypic.measure.em2px(0.093375) + " " + MathJax.xypic.measure.em2px(-0.354375 + up) + 
			" " + MathJax.xypic.measure.em2px(0.149625) + " " + MathJax.xypic.measure.em2px(-0.44775 + up) + 
			"T" + MathJax.xypic.measure.em2px(0.2925) + " " + MathJax.xypic.measure.em2px(-0.60075 + up) + 
			"Q" + MathJax.xypic.measure.em2px(0.30825) + " " + MathJax.xypic.measure.em2px(-0.60975 + up) + 
			" " + MathJax.xypic.measure.em2px(0.30825) + " " + MathJax.xypic.measure.em2px(-0.622125 + up) + 
			"L" + MathJax.xypic.measure.em2px(0.30825) + " " + MathJax.xypic.measure.em2px(-0.653625 + up) + 
			"L" + MathJax.xypic.measure.em2px(0.3015) + " " + MathJax.xypic.measure.em2px(-0.660375 + up) + 
			"L" + MathJax.xypic.measure.em2px(0.262125) + " " + MathJax.xypic.measure.em2px(-0.660375 + up) + 
			"L" + MathJax.xypic.measure.em2px(0.2475) + " " + MathJax.xypic.measure.em2px(-0.6525 + up) + 
			"Q" + MathJax.xypic.measure.em2px(0.07425) + " " + MathJax.xypic.measure.em2px(-0.55575 + up) + 
			" " + MathJax.xypic.measure.em2px(-0.01125) + " " + MathJax.xypic.measure.em2px(-0.387 + up) + 
			"Q" + MathJax.xypic.measure.em2px(-0.048375) + " " + MathJax.xypic.measure.em2px(-0.311625 + up) + 
			" " + MathJax.xypic.measure.em2px(-0.0585) + " " + MathJax.xypic.measure.em2px(-0.250875 + up) + 
			"T" + MathJax.xypic.measure.em2px(-0.068625) + " " + MathJax.xypic.measure.em2px(-0.07875 + up) + 
			"Q" + MathJax.xypic.measure.em2px(-0.0675) + " " + MathJax.xypic.measure.em2px(up) + 
			" " + MathJax.xypic.measure.em2px(-0.0675) + " " + MathJax.xypic.measure.em2px(up) + 
			"Z";
		svg.createSVGElement("path", {
			d:d, 
			fill:this.color, 
			stroke:this.color, 
			"stroke-width":"0pt", 
			transform:"translate(" + MathJax.xypic.measure.em2px(this.x) + "," + MathJax.xypic.measure.em2px(-this.y) +") rotate(" + (-this.degree) + ") scale(" + (scale / 1.125) + ")"
		});
	}

	getBoundingBox() {
		var scale = MathJax.xypic.measure.oneem;
		return new Frame.Rect(this.x, this.y, { l:0.06 * scale, r:0.274 * scale, u:Math.max(0.660375 * scale / 1.125, this.height / 2), d:Math.max(0.660375 * scale / 1.125, this.height / 2) }).rotate(this.degree * Math.PI / 180);
	}

	toString() {
		return "LeftBrace[x:" + this.x + ", y:" + this.y + ", up:" + this.up + ", down:" + this.down + "]";
	}
};


Shape.TextShape = class Shape_TextShape extends Shape {
	constructor(c, math) {
		super();
		this.c = c;
		this.math = math;
		this.originalBBox = undefined;
		XypicUtil.memoize(this, "getBoundingBox");
		XypicUtil.memoize(this, "getOriginalReferencePoint");
	}

	draw(svg) {
		this._draw(svg, false);
	}

	getBoundingBox() {
		return this._draw(MathJax.xypic.svgForTestLayout, true);
	}

	getOriginalReferencePoint() {
		this.getBoundingBox();
		var originalBBox = this.originalBBox;
		
		var c = this.c;
		var H = originalBBox.H;
		var D = originalBBox.D;
		return new Frame.Point(c.x, c.y - (H - D) / 2);
	}
	toString() {
		return "TextShape[c:" + this.c.toString() + ", math:" + this.math.toString() + "]";
	}
};


Shape.ImageShape = class Shape_ImageShape extends Shape {
	constructor(c, url) {
		super();
		this.c = c;
		this.url = url;
		XypicUtil.memoize(this, "getBoundingBox");
		XypicUtil.memoize(this, "getOriginalReferencePoint");
	}

	draw(svg) {
		var c = this.c;
		svg.createSVGElement("image", {
			x: MathJax.xypic.measure.em2px(c.x - c.l),
			y: MathJax.xypic.measure.em2px(-c.y - c.u),
			width: MathJax.xypic.measure.em2px(c.l + c.r),
			height: MathJax.xypic.measure.em2px(c.u + c.d),
			preserveAspectRatio: "none",
			"xlink:href": this.url
		});
	}

	getBoundingBox() {
		return this.c;
	}

	getOriginalReferencePoint() {
		return this.c;
	}

	toString() {
		return "ImageShape[c:" + this.c.toString() + ", height:" + this.height + ", width:" + this.width + ", url:" + this.url + "]";
	}
};


Shape.ArrowheadShape = class Shape_ArrowheadShape extends Shape {
	constructor() {
		super();
	}

	draw(svg) {
		var g = svg.createGroup(svg.transformBuilder().translate(this.c.x, this.c.y).rotateRadian(this.angle));
		this.drawDelegate(g);
	}

	getBoundingBox() {
		return this.c.toRect(this.getBox()).rotate(this.angle);
	}

	toString() {
		return "ArrowheadShape[c:" + this.c.toString() + ", angle:" + this.angle + "]";
	}
};


// @2{>}
Shape.GT2ArrowheadShape = class Shape_GT2ArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		var scale = MathJax.xypic.measure.oneem;
		return { l:0.456 * scale, r:0, d:0.229 * scale, u:0.229 * scale };
	}

	getRadius() {
		var scale = MathJax.xypic.measure.oneem;
		return 0.213 * scale;
	}

	drawDelegate(svg) {
		var scale = MathJax.xypic.measure.oneem;
		var gu = svg.createGroup(svg.transformBuilder().rotateDegree(-10));
		var gd = svg.createGroup(svg.transformBuilder().rotateDegree(10));
		gu.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(-0.222 * scale) + "," + MathJax.xypic.measure.em2px(-0.020 * scale) + " " + MathJax.xypic.measure.em2px(-0.489 * scale) + "," + MathJax.xypic.measure.em2px(-0.147 * scale)
		});
		gd.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(-0.222 * scale) + ","+MathJax.xypic.measure.em2px(0.020 * scale) + " " + MathJax.xypic.measure.em2px(-0.489 * scale) + "," + MathJax.xypic.measure.em2px(0.147 * scale)
		});
	}
};


// @3{>}
Shape.GT3ArrowheadShape = class Shape_GT3ArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		var scale = MathJax.xypic.measure.oneem;
		return { l:0.507 * scale, r:0, d:0.268 * scale, u:0.268 * scale };
	}

	getRadius() {
		var scale = MathJax.xypic.measure.oneem;
		return 0.325 * scale;
	}

	drawDelegate(svg) {
		var scale = MathJax.xypic.measure.oneem;
		var gu = svg.createGroup(svg.transformBuilder().rotateDegree(-15));
		var gd = svg.createGroup(svg.transformBuilder().rotateDegree(15));
		gu.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(-0.222 * scale) + "," + MathJax.xypic.measure.em2px(-0.020 * scale) + " " + MathJax.xypic.measure.em2px(-0.489 * scale) + "," + MathJax.xypic.measure.em2px(-0.147 * scale)
		});
		svg.createSVGElement("line", {
			x1:0, y1:0, x2:MathJax.xypic.measure.em2px(-0.507 * scale), y2:0
		});
		gd.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(-0.222 * scale) + "," + MathJax.xypic.measure.em2px(0.020 * scale) + " " + MathJax.xypic.measure.em2px(-0.489 * scale) + "," + MathJax.xypic.measure.em2px(0.147 * scale)
		});
	}
};


// @^{>}
Shape.UpperGTArrowheadShape = class Shape_UpperGTArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		var scale = MathJax.xypic.measure.oneem;
		return { l:0.489 * scale, r:0, d:0, u:0.147 * scale };
	}

	drawDelegate(svg) {
		var scale = MathJax.xypic.measure.oneem;
		svg.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(-0.222 * scale) + "," + MathJax.xypic.measure.em2px(-0.020 * scale) + " " + MathJax.xypic.measure.em2px(-0.489 * scale) + "," + MathJax.xypic.measure.em2px(-0.147 * scale)
		});
	}
};


// @_{>}
Shape.LowerGTArrowheadShape = class Shape_LowerGTArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		var scale = MathJax.xypic.measure.oneem;
		return { l:0.489 * scale, r:0, d:0.147 * scale, u:0 };
	}

	drawDelegate(svg) {
		var scale = MathJax.xypic.measure.oneem;
		svg.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(-0.222 * scale) + "," + MathJax.xypic.measure.em2px(0.020 * scale) + " " + MathJax.xypic.measure.em2px(-0.489 * scale) + "," + MathJax.xypic.measure.em2px(0.147 * scale)
		});
	}
};


// @{>}
Shape.GTArrowheadShape = class Shape_GTArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		var scale = MathJax.xypic.measure.oneem;
		return { l:0.489 * scale, r:0, d:0.147 * scale, u:0.147 * scale };
	}

	drawDelegate(svg) {
		var scale = MathJax.xypic.measure.oneem;
		svg.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(-0.222 * scale) + "," + MathJax.xypic.measure.em2px(0.020 * scale) + " " + MathJax.xypic.measure.em2px(-0.489 * scale) + "," + MathJax.xypic.measure.em2px(0.147 * scale)
		});
		svg.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(-0.222 * scale) + "," + MathJax.xypic.measure.em2px(-0.020 * scale) + " " + MathJax.xypic.measure.em2px(-0.489 * scale) + "," + MathJax.xypic.measure.em2px(-0.147 * scale)
		});
	}
};


// @2{<}
Shape.LT2ArrowheadShape = class Shape_LT2ArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		var scale = MathJax.xypic.measure.oneem;
		return { l:0, r:0.456 * scale, d:0.229 * scale, u:0.229  * scale };
	}

	getRadius() {
		var scale = MathJax.xypic.measure.oneem;
		return 0.213 * scale;
	}

	drawDelegate(svg) {
		var scale = MathJax.xypic.measure.oneem;
		var gu = svg.createGroup(svg.transformBuilder().rotateDegree(10)); 
		var gd = svg.createGroup(svg.transformBuilder().rotateDegree(-10));
		gu.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(0.222 * scale) + "," + MathJax.xypic.measure.em2px(-0.020 * scale) + " " + MathJax.xypic.measure.em2px(0.489 * scale) + "," + MathJax.xypic.measure.em2px(-0.147 * scale)
		});
		gd.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(0.222 * scale) + "," + MathJax.xypic.measure.em2px(0.020 * scale) + " " + MathJax.xypic.measure.em2px(0.489 * scale) + "," + MathJax.xypic.measure.em2px(0.147 * scale)
		});
	}
};


// @3{<}
Shape.LT3ArrowheadShape = class Shape_LT3ArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		var scale = MathJax.xypic.measure.oneem;
		return { l:0, r:0.507 * scale, d:0.268 * scale, u:0.268 * scale };
	}

	getRadius() {
		var scale = MathJax.xypic.measure.oneem;
		return 0.325 * scale;
	}

	drawDelegate(svg) {
		var scale = MathJax.xypic.measure.oneem;
		var gu = svg.createGroup(svg.transformBuilder().rotateDegree(15));
		var gd = svg.createGroup(svg.transformBuilder().rotateDegree(-15));
		gu.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(0.222 * scale) + "," + MathJax.xypic.measure.em2px(-0.020 * scale) + " " + MathJax.xypic.measure.em2px(0.489 * scale) + "," + MathJax.xypic.measure.em2px(-0.147 * scale)
		});
		svg.createSVGElement("line", {
			x1:0, y1:0, x2:MathJax.xypic.measure.em2px(0.507 * scale), y2:0
		});
		gd.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(0.222 * scale) + "," + MathJax.xypic.measure.em2px(0.020 * scale) + " " + MathJax.xypic.measure.em2px(0.489 * scale) + "," + MathJax.xypic.measure.em2px(0.147 * scale)
		});
	}
};


// @^{<}
Shape.UpperLTArrowheadShape = class Shape_UpperLTArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		var scale = MathJax.xypic.measure.oneem;
		return { l:0, r:0.489 * scale, d:0, u:0.147 * scale };
	}

	drawDelegate(svg) {
		var scale = MathJax.xypic.measure.oneem;
		svg.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(0.222 * scale) + "," + MathJax.xypic.measure.em2px(-0.020 * scale) + " " + MathJax.xypic.measure.em2px(0.489 * scale) + "," + MathJax.xypic.measure.em2px(-0.147 * scale)
		});
	}
};


// @_{<}
Shape.LowerLTArrowheadShape = class Shape_LowerLTArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		var scale = MathJax.xypic.measure.oneem;
		return { l:0, r:0.489 * scale, d:0.147 * scale, u:0 };
	}

	drawDelegate(svg) {
		var scale = MathJax.xypic.measure.oneem;
		svg.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(0.222 * scale) + "," + MathJax.xypic.measure.em2px(0.020 * scale) + " " + MathJax.xypic.measure.em2px(0.489 * scale) + "," + MathJax.xypic.measure.em2px(0.147 * scale)
		});
	}
};


// @{<}
Shape.LTArrowheadShape = class Shape_LTArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		var scale = MathJax.xypic.measure.oneem;
		return { l:0, r:0.489 * scale, d:0.147 * scale, u:0.147 * scale };
	}

	drawDelegate(svg) {
		var scale = MathJax.xypic.measure.oneem;
		svg.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(0.222 * scale) + "," + MathJax.xypic.measure.em2px(-0.020 * scale) + " " + MathJax.xypic.measure.em2px(0.489 * scale) + "," + MathJax.xypic.measure.em2px(-0.147 * scale)
		});
		svg.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(0.222 * scale) + "," + MathJax.xypic.measure.em2px(0.020 * scale) + " " + MathJax.xypic.measure.em2px(0.489 * scale) + "," + MathJax.xypic.measure.em2px(0.147 * scale)
		});
	}
};


// @^{|}
Shape.UpperColumnArrowheadShape = class Shape_UpperColumnArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		return { l:0, r:0, u:MathJax.xypic.measure.lineElementLength, d:0 };
	}

	drawDelegate(svg) {
		var l = MathJax.xypic.measure.em2px(MathJax.xypic.measure.lineElementLength);
		svg.createSVGElement("line", {
			x1:0, y1:0, x2:0, y2:-l
		});
	}
};


// @_{|}
Shape.LowerColumnArrowheadShape = class Shape_LowerColumnArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		return { l:0, r:0, u:0, d:MathJax.xypic.measure.lineElementLength };
	}

	drawDelegate(svg) {
		var l = MathJax.xypic.measure.em2px(MathJax.xypic.measure.lineElementLength);
		svg.createSVGElement("line", {
			x1:0, y1:0, x2:0, y2:l
		});
	}
};


// @2{|}
Shape.Column2ArrowheadShape = class Shape_Column2ArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		return { l:0, r:0, u:0.5 * (MathJax.xypic.measure.lineElementLength + MathJax.xypic.measure.thickness), d:0.5 * (MathJax.xypic.measure.lineElementLength + MathJax.xypic.measure.thickness) };
	}

	drawDelegate(svg) {
		var l = MathJax.xypic.measure.em2px(0.5 * (MathJax.xypic.measure.lineElementLength + MathJax.xypic.measure.thickness));
		svg.createSVGElement("line", {
			x1:0, y1:l, x2:0, y2:-l
		});
	}
};


// @3{|}
Shape.Column3ArrowheadShape = class Shape_Column3ArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		return { l:0, r:0, u:0.5 * MathJax.xypic.measure.lineElementLength + MathJax.xypic.measure.thickness, d:0.5 * MathJax.xypic.measure.lineElementLength + MathJax.xypic.measure.thickness };
	}

	drawDelegate(svg) {
		var l = MathJax.xypic.measure.em2px(0.5 * MathJax.xypic.measure.lineElementLength + MathJax.xypic.measure.thickness);
		svg.createSVGElement("line", {
			x1:0, y1:l, x2:0, y2:-l
		});
	}
};


// @{|}
Shape.ColumnArrowheadShape = class Shape_ColumnArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		return { l:0, r:0, u:0.5 * MathJax.xypic.measure.lineElementLength, d:0.5 * MathJax.xypic.measure.lineElementLength };
	}

	drawDelegate(svg) {
		var t = MathJax.xypic.measure.thickness;
		var l = MathJax.xypic.measure.em2px(0.5 * MathJax.xypic.measure.lineElementLength);
		svg.createSVGElement("line", {
			x1:0, y1:l, x2:0, y2:-l
		});
	}
};


// @^{(}
Shape.UpperLParenArrowheadShape = class Shape_UpperLParenArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		return { l:0.5 * MathJax.xypic.measure.lineElementLength, r:0, u:MathJax.xypic.measure.lineElementLength, d:0 };
	}

	drawDelegate(svg) {
		var t = MathJax.xypic.measure.thickness;
		var r = MathJax.xypic.measure.em2px(0.5 * MathJax.xypic.measure.lineElementLength);
		svg.createSVGElement("path", {
			d:"M0,0 A " + r + "," + r + " 0 0,1 0," + (-2 * r)
		});
	}
};


// @_{(}
Shape.LowerLParenArrowheadShape = class Shape_LowerLParenArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		return { l:0.5 * MathJax.xypic.measure.lineElementLength, r:0, u:0, d:MathJax.xypic.measure.lineElementLength };
	}

	drawDelegate(svg) {
		var t = MathJax.xypic.measure.thickness;
		var r = MathJax.xypic.measure.em2px(0.5 * MathJax.xypic.measure.lineElementLength);
		svg.createSVGElement("path", {
			d:"M0,0 A " + r + "," + r + " 0 0,0 0," + (2 * r)
		});
	}
};


// @{(}
Shape.LParenArrowheadShape = class Shape_LParenArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		return { l:0, r:0.5 * MathJax.xypic.measure.lineElementLength, u:0.5 * MathJax.xypic.measure.lineElementLength, d:0.5 * MathJax.xypic.measure.lineElementLength };
	}

	drawDelegate(svg) {
		var t = MathJax.xypic.measure.thickness;
		var r = MathJax.xypic.measure.em2px(0.5 * MathJax.xypic.measure.lineElementLength);
		svg.createSVGElement("path", {
			d:"M" + r + "," + (-r) + " A " + r + "," + r + " 0 0,0 " + r + "," + r
		});
	}
};


// @^{)}
Shape.UpperRParenArrowheadShape = class Shape_UpperRParenArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		return { l:0, r:0.5 * MathJax.xypic.measure.lineElementLength, u:MathJax.xypic.measure.lineElementLength, d:0 };
	}

	drawDelegate(svg) {
		var t = MathJax.xypic.measure.thickness;
		var r = MathJax.xypic.measure.em2px(0.5 * MathJax.xypic.measure.lineElementLength);
		svg.createSVGElement("path", {
			d:"M0,0 A " + r + "," + r + " 0 0,0 0," + (-2 * r)
		});
	}
};


// @_{)}
Shape.LowerRParenArrowheadShape = class Shape_LowerRParenArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		return { l:0, r:0.5 * MathJax.xypic.measure.lineElementLength, u:0, d:MathJax.xypic.measure.lineElementLength };
	}

	drawDelegate(svg) {
		var t = MathJax.xypic.measure.thickness;
		var r = MathJax.xypic.measure.em2px(0.5 * MathJax.xypic.measure.lineElementLength);
		svg.createSVGElement("path", {
			d:"M0,0 A " + r + "," + r + " 0 0,1 0," + (2 * r)
		});
	}
};


// @{)}
Shape.RParenArrowheadShape = class Shape_RParenArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		return { l:0.5 * MathJax.xypic.measure.lineElementLength, r:0, u:0.5 * MathJax.xypic.measure.lineElementLength, d:0.5 * MathJax.xypic.measure.lineElementLength };
	}

	drawDelegate(svg) {
		var t = MathJax.xypic.measure.thickness;
		var r = MathJax.xypic.measure.em2px(0.5 * MathJax.xypic.measure.lineElementLength);
		svg.createSVGElement("path", {
			d:"M" + (-r) + "," + (-r) + " A " + r + "," + r + " 0 0,1 " + (-r) + "," + r
		});
	}
};


// @_{`}
Shape.LowerBackquoteArrowheadShape = class Shape_LowerBackquoteArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		return { l:0.5 * MathJax.xypic.measure.lineElementLength, r:0, u:0, d:0.5 * MathJax.xypic.measure.lineElementLength };
	}

	drawDelegate(svg) {
		var t = MathJax.xypic.measure.thickness;
		var r = MathJax.xypic.measure.em2px(0.5 * MathJax.xypic.measure.lineElementLength);
		svg.createSVGElement("path", {
			d:"M0,0 A " + r + "," + r + " 0 0,0 " + (-r) + "," + (r)
		});
	}
};


// @{`}, @^{`}
Shape.UpperBackquoteArrowheadShape = class Shape_UpperBackquoteArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		return { l:0.5 * MathJax.xypic.measure.lineElementLength, r:0, u:0.5 * MathJax.xypic.measure.lineElementLength, d:0 };
	}

	drawDelegate(svg) {
		var t = MathJax.xypic.measure.thickness;
		var r = MathJax.xypic.measure.em2px(0.5 * MathJax.xypic.measure.lineElementLength);
		svg.createSVGElement("path", {
			d:"M0,0 A " + r + "," + r + " 0 0,1 " + (-r) + "," + (-r)
		});
	}
};


// @_{'}
Shape.LowerQuoteArrowheadShape = class Shape_LowerQuoteArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		return { l:0, r:0.5 * MathJax.xypic.measure.lineElementLength, u:0, d:0.5 * MathJax.xypic.measure.lineElementLength };
	}

	drawDelegate(svg) {
		var t = MathJax.xypic.measure.thickness;
		var r = MathJax.xypic.measure.em2px(0.5 * MathJax.xypic.measure.lineElementLength);
		svg.createSVGElement("path", {
			d:"M0,0 A " + r + "," + r + " 0 0,1 " + r + "," + (r)
		});
	}
};


// @{'}, @^{'}
Shape.UpperQuoteArrowheadShape = class Shape_UpperQuoteArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		return { l:0, r:0.5 * MathJax.xypic.measure.lineElementLength, u:0.5 * MathJax.xypic.measure.lineElementLength, d:0 };
	}

	drawDelegate(svg) {
		var t = MathJax.xypic.measure.thickness;
		var r = MathJax.xypic.measure.em2px(0.5 * MathJax.xypic.measure.lineElementLength);
		svg.createSVGElement("path", {
			d:"M0,0 A " + r + "," + r + " 0 0,0 " + r + "," + (-r)
		});
	}
};


// @{*}
Shape.AsteriskArrowheadShape = class Shape_AsteriskArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = 0;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		return { l:MathJax.xypic.measure.thickness, r:MathJax.xypic.measure.thickness, u:MathJax.xypic.measure.thickness, d:MathJax.xypic.measure.thickness };
	}

	drawDelegate(svg) {
		svg.createSVGElement("circle", {
			cx:0, cy:0, r:MathJax.xypic.measure.em2px(MathJax.xypic.measure.thickness),
			fill: "currentColor"
		});
	}
};


// @{o}
Shape.OArrowheadShape = class Shape_OArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = 0;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		return { l:MathJax.xypic.measure.thickness, r:MathJax.xypic.measure.thickness, u:MathJax.xypic.measure.thickness, d:MathJax.xypic.measure.thickness };
	}

	drawDelegate(svg) {
		svg.createSVGElement("circle", {
			cx:0, cy:0, r:MathJax.xypic.measure.em2px(MathJax.xypic.measure.thickness)
		});
	}
};


// @{+}
Shape.PlusArrowheadShape = class Shape_PlusArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		return { l:0.5 * MathJax.xypic.measure.lineElementLength, r:0.5 * MathJax.xypic.measure.lineElementLength, u:0.5 * MathJax.xypic.measure.lineElementLength, d:0.5 * MathJax.xypic.measure.lineElementLength };
	}

	drawDelegate(svg) {
		var halfLen = MathJax.xypic.measure.lineElementLength / 2;
		var halfLenPx = MathJax.xypic.measure.em2px(halfLen);
		svg.createSVGElement("line", {
			x1:-halfLenPx, y1:0, x2:halfLenPx, y2:0
		});
		svg.createSVGElement("line", {
			x1:0, y1:halfLenPx, x2:0, y2:-halfLenPx
		});
	}
};


// @{x}
Shape.XArrowheadShape = class Shape_XArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle + Math.PI / 4;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		return { l:0.5 * MathJax.xypic.measure.lineElementLength, r:0.5 * MathJax.xypic.measure.lineElementLength, u:0.5 * MathJax.xypic.measure.lineElementLength, d:0.5 * MathJax.xypic.measure.lineElementLength };
	}

	drawDelegate(svg) {
		var halfLen = MathJax.xypic.measure.lineElementLength / 2;
		var halfLenPx = MathJax.xypic.measure.em2px(halfLen);
		svg.createSVGElement("line", {
			x1:-halfLenPx, y1:0, x2:halfLenPx, y2:0
		});
		svg.createSVGElement("line", {
			x1:0, y1:halfLenPx, x2:0, y2:-halfLenPx
		});
	}
};


// @{/}
Shape.SlashArrowheadShape = class Shape_SlashArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle - Math.PI / 10;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		return { l:0, r:0, u:MathJax.xypic.measure.lineElementLength / 2, d:MathJax.xypic.measure.lineElementLength / 2 };
	}

	drawDelegate(svg) {
		var halfLen = MathJax.xypic.measure.lineElementLength / 2;
		var halfLenPx = MathJax.xypic.measure.em2px(halfLen);
		svg.createSVGElement("line", {
			x1:0, y1:halfLenPx, x2:0, y2:-halfLenPx
		});
	}
};


// @3{-}
Shape.Line3ArrowheadShape = class Shape_Line3ArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		return { l:0, r:MathJax.xypic.measure.lineElementLength, u:MathJax.xypic.measure.thickness, d:MathJax.xypic.measure.thickness };
	}

	drawDelegate(svg) {
		var lineLen = MathJax.xypic.measure.em2px(MathJax.xypic.measure.lineElementLength);
		var vshift = MathJax.xypic.measure.em2px(MathJax.xypic.measure.thickness);
		svg.createSVGElement("line", {
			x1:0, y1:vshift, x2:lineLen, y2:vshift
		});
		svg.createSVGElement("line", {
			x1:0, y1:0, x2:lineLen, y2:0
		});
		svg.createSVGElement("line", {
			x1:0, y1:-vshift, x2:lineLen, y2:-vshift
		});
	}
};


// @2{-}
Shape.Line2ArrowheadShape = class Shape_Line2ArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		return { l:0, r:MathJax.xypic.measure.lineElementLength, u:0.5 * MathJax.xypic.measure.thickness, d:0.5 * MathJax.xypic.measure.thickness };
	}

	drawDelegate(svg) {
		var vshift = MathJax.xypic.measure.em2px(0.5 * MathJax.xypic.measure.thickness);
		var lineLen = MathJax.xypic.measure.em2px(MathJax.xypic.measure.lineElementLength);
		svg.createSVGElement("line", {
			x1:0, y1:vshift, x2:lineLen, y2:vshift
		});
		svg.createSVGElement("line", {
			x1:0, y1:-vshift, x2:lineLen, y2:-vshift
		});
	}
};


// @{-}
Shape.LineArrowheadShape = class Shape_LineArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		return { l:0, r:MathJax.xypic.measure.lineElementLength, u:0, d:0 };
	}

	drawDelegate(svg) {
		var lineLen = MathJax.xypic.measure.em2px(MathJax.xypic.measure.lineElementLength);
		svg.createSVGElement("line", {
			x1:0, y1:0, x2:lineLen, y2:0
		});
	}
};


// @3{.}
Shape.Dot3ArrowheadShape = class Shape_Dot3ArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		return { l:0, r:0, u:MathJax.xypic.measure.thickness, d:MathJax.xypic.measure.thickness };
	}

	drawDelegate(svg) {
		var scale = MathJax.xypic.measure.oneem;
		var vshift = MathJax.xypic.measure.em2px(MathJax.xypic.measure.thickness);
		var lineLen = MathJax.xypic.measure.em2px(MathJax.xypic.measure.thickness);
		var dasharray = MathJax.xypic.measure.dottedDasharray;
		svg.createSVGElement("line", {
			x1:0, y1:vshift, x2:lineLen, y2:vshift,
			"stroke-dasharray": dasharray
		});
		svg.createSVGElement("line", {
			x1:0, y1:0, x2:lineLen, y2:0,
			"stroke-dasharray": dasharray
		});
		svg.createSVGElement("line", {
			x1:0, y1:-vshift, x2:lineLen, y2:-vshift,
			"stroke-dasharray": dasharray
		});
		
	}
};


// @2{.}
Shape.Dot2ArrowheadShape = class Shape_Dot2ArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		return { l:0, r:0, u:0.5 * MathJax.xypic.measure.thickness, d:0.5 * MathJax.xypic.measure.thickness };
	}

	drawDelegate(svg) {
		var vshift = MathJax.xypic.measure.em2px(0.5 * MathJax.xypic.measure.thickness);
		var lineLen = MathJax.xypic.measure.em2px(MathJax.xypic.measure.thickness);
		var dasharray = MathJax.xypic.measure.dottedDasharray;
		svg.createSVGElement("line", {
			x1:0, y1:vshift, x2:lineLen, y2:vshift,
		"stroke-dasharray": dasharray
		});
		svg.createSVGElement("line", {
			x1:0, y1:-vshift, x2:lineLen, y2:-vshift,
		"stroke-dasharray": dasharray
		});
	}
};


// @{.}
Shape.DotArrowheadShape = class Shape_DotArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		return { l:0, r:0, u:0, d:0 };
	}

	drawDelegate(svg) {
		var scale = MathJax.xypic.measure.oneem;
		var lineLen = MathJax.xypic.measure.em2px(MathJax.xypic.measure.thickness);
		var dasharray = MathJax.xypic.measure.dottedDasharray;
		svg.createSVGElement("line", {
			x1:0, y1:0, x2:lineLen, y2:0,
			"stroke-dasharray": dasharray
		});
	}
};


// @3{~}
Shape.Tilde3ArrowheadShape = class Shape_Tilde3ArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		return { l:-2 * MathJax.xypic.measure.thickness, r:2 * MathJax.xypic.measure.thickness, u:2 * MathJax.xypic.measure.thickness, d:2* MathJax.xypic.measure.thickness };
	}

	drawDelegate(svg) {
		var s = MathJax.xypic.measure.em2px(MathJax.xypic.measure.thickness);
		svg.createSVGElement("path", {
			d:"M" + (-2 * s) + "," + s + 
				" Q" + (-s) + ",0" + 
				" 0," + s +
				" T" + (2 * s) + "," + s + 
				"M" + (-2 * s) + ",0" + 
				" Q" + (-s) + "," + (-s) +
				" 0,0" +
				" T" + (2 * s) + ",0" + 
				"M" + (-2 * s) + "," + (-s) + 
				" Q" + (-s) + "," + (-2 * s) +
				" 0," + (-s) +
				" T" + (2 * s) + "," + (-s)
		});
	}
};


// @2{~}
Shape.Tilde2ArrowheadShape = class Shape_Tilde2ArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		return { l:-2 * MathJax.xypic.measure.thickness, r:2 * MathJax.xypic.measure.thickness, u:1.5 * MathJax.xypic.measure.thickness, d:1.5 * MathJax.xypic.measure.thickness };
	}

	drawDelegate(svg) {
		var s = MathJax.xypic.measure.em2px(MathJax.xypic.measure.thickness);
		svg.createSVGElement("path", {
			d:"M" + (-2 * s) + "," + (0.5 * s) + 
				" Q" + (-s) + "," + (-0.5 * s) +
				" 0," + (0.5 * s) +
				" T" + (2 * s) + "," + (0.5 * s) + 
				"M" + (-2 * s) + "," + (-0.5 * s) + 
				" Q" + (-s) + "," + (-1.5 * s) +
				" 0," + (-0.5 * s) +
				" T" + (2 * s) + "," + (-0.5 * s)
		});
	}
};


// @{~}
Shape.TildeArrowheadShape = class Shape_TildeArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		return { l:-2 * MathJax.xypic.measure.thickness, r:2 * MathJax.xypic.measure.thickness, u:MathJax.xypic.measure.thickness, d:MathJax.xypic.measure.thickness };
	}

	drawDelegate(svg) {
		var s = MathJax.xypic.measure.em2px(MathJax.xypic.measure.thickness);
		svg.createSVGElement("path", {
			d:"M" + (-2 * s) + ",0" + 
				" Q" + (-s) + "," + (-s) +
				" 0,0" +
				" T" + (2 * s) + ",0"
		});
	}
};


// @{~}
Shape.TildeArrowheadShape = class Shape_TildeArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		return { l:-2 * MathJax.xypic.measure.thickness, r:2 * MathJax.xypic.measure.thickness, u:MathJax.xypic.measure.thickness, d:MathJax.xypic.measure.thickness };
	}

	drawDelegate(svg) {
		var s = MathJax.xypic.measure.em2px(MathJax.xypic.measure.thickness);
		svg.createSVGElement("path", {
			d:"M" + (-2 * s) + ",0" + 
				" Q" + (-s) + "," + (-s) +
				" 0,0" +
				" T" + (2 * s) + ",0"
		});
	}
};


// @{>>}
Shape.GTGTArrowheadShape = class Shape_GTGTArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		var scale = MathJax.xypic.measure.oneem; return { l:0.489 * scale + 2 * MathJax.xypic.measure.thickness, r:0, d:0.147 * scale, u:0.147 * scale };
	}

	drawDelegate(svg) {
		var scale = MathJax.xypic.measure.oneem;
		var t = MathJax.xypic.measure.thickness;
		var hshift = MathJax.xypic.measure.em2px(2 * t);
		svg.createSVGElement("path", {
			d:"M" + (-hshift) + ",0 Q" + (MathJax.xypic.measure.em2px(-0.222 * scale) - hshift) + "," + MathJax.xypic.measure.em2px(0.020 * scale) + " " + (MathJax.xypic.measure.em2px(-0.489 * scale) - hshift) + "," + MathJax.xypic.measure.em2px(0.147 * scale)
		});
		svg.createSVGElement("path", {
			d:"M" + (-hshift) + ",0 Q" + (MathJax.xypic.measure.em2px(-0.222 * scale) - hshift) + "," + MathJax.xypic.measure.em2px(-0.020 * scale) + " " + (MathJax.xypic.measure.em2px(-0.489 * scale) - hshift) + "," + MathJax.xypic.measure.em2px(-0.147 * scale)
		});
		svg.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(-0.222 * scale) + "," + MathJax.xypic.measure.em2px(0.020 * scale) + " " + MathJax.xypic.measure.em2px(-0.489 * scale) + "," + MathJax.xypic.measure.em2px(0.147 * scale)
		});
		svg.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(-0.222 * scale) + "," + MathJax.xypic.measure.em2px(-0.020 * scale) + " " + MathJax.xypic.measure.em2px(-0.489 * scale) + "," + MathJax.xypic.measure.em2px(-0.147 * scale)
		});
	}
};


// @^{>>}
Shape.UpperGTGTArrowheadShape = class Shape_UpperGTGTArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		var scale = MathJax.xypic.measure.oneem;
		return { l:0.489 * scale + 2 * MathJax.xypic.measure.thickness, r:0, d:0, u:0.147 * scale };
	}

	drawDelegate(svg) {
		var scale = MathJax.xypic.measure.oneem;
		var t = MathJax.xypic.measure.thickness;
		var hshift = MathJax.xypic.measure.em2px(2 * t);
		svg.createSVGElement("path", {
			d:"M" + (-hshift) + ",0 Q" + (MathJax.xypic.measure.em2px(-0.222 * scale) - hshift) + "," + MathJax.xypic.measure.em2px(-0.020 * scale) + " " + (MathJax.xypic.measure.em2px(-0.489 * scale) - hshift) + "," + MathJax.xypic.measure.em2px(-0.147 * scale)
		});
		svg.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(-0.222 * scale) + "," + MathJax.xypic.measure.em2px(-0.020 * scale) + " " + MathJax.xypic.measure.em2px(-0.489 * scale) + "," + MathJax.xypic.measure.em2px(-0.147 * scale)
		});
	}
};


// @_{>>}
Shape.LowerGTGTArrowheadShape = class Shape_LowerGTGTArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		var scale = MathJax.xypic.measure.oneem;
		return { l:0.489 * scale + 2 * MathJax.xypic.measure.thickness, r:0, d:0.147 * scale, u:0 };
	}

	drawDelegate(svg) {
		var scale = MathJax.xypic.measure.oneem;
		var t = MathJax.xypic.measure.thickness;
		var hshift = MathJax.xypic.measure.em2px(2 * t);
		svg.createSVGElement("path", {
			d:"M" + (-hshift) + ",0 Q" + (MathJax.xypic.measure.em2px(-0.222 * scale) - hshift) + "," + MathJax.xypic.measure.em2px(0.020 * scale) + " " + (MathJax.xypic.measure.em2px(-0.489 * scale) - hshift) + "," + MathJax.xypic.measure.em2px(0.147 * scale)
		});
		svg.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(-0.222 * scale) + "," + MathJax.xypic.measure.em2px(0.020 * scale) + " " + MathJax.xypic.measure.em2px(-0.489 * scale) + "," + MathJax.xypic.measure.em2px(0.147 * scale)
		});
	}
};


// @2{>>}
Shape.GTGT2ArrowheadShape = class Shape_GTGT2ArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		var scale = MathJax.xypic.measure.oneem;
		return { l:0.456 * scale + 2 * MathJax.xypic.measure.thickness, r:0, d:0.229 * scale, u:0.229 * scale };
	}

	getRadius() {
		var scale = MathJax.xypic.measure.oneem;
		return 0.213 * scale;
	}

	drawDelegate(svg) {
		var scale = MathJax.xypic.measure.oneem;
		var t = MathJax.xypic.measure.thickness;
		var gu1 = svg.createGroup(svg.transformBuilder().rotateDegree(-10));
		var gd1 = svg.createGroup(svg.transformBuilder().rotateDegree(10));
		gu1.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(-0.222 * scale) + "," + MathJax.xypic.measure.em2px(-0.020 * scale) + " " + MathJax.xypic.measure.em2px(-0.489 * scale) + "," + MathJax.xypic.measure.em2px(-0.147 * scale)
		});
		gd1.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(-0.222 * scale) + ","+MathJax.xypic.measure.em2px(0.020 * scale) + " " + MathJax.xypic.measure.em2px(-0.489 * scale) + "," + MathJax.xypic.measure.em2px(0.147 * scale)
		});
		var gu2 = svg.createGroup(svg.transformBuilder().translate(-2 * t, 0).rotateDegree(-10));
		var gd2 = svg.createGroup(svg.transformBuilder().translate(-2 * t, 0).rotateDegree(10));
		gu2.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(-0.222 * scale) + "," + MathJax.xypic.measure.em2px(-0.020 * scale) + " " + MathJax.xypic.measure.em2px(-0.489 * scale) + "," + MathJax.xypic.measure.em2px(-0.147 * scale)
		});
		gd2.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(-0.222 * scale) + ","+MathJax.xypic.measure.em2px(0.020 * scale) + " " + MathJax.xypic.measure.em2px(-0.489 * scale) + "," + MathJax.xypic.measure.em2px(0.147 * scale)
		});
	}
};


// @3{>>}
Shape.GTGT3ArrowheadShape = class Shape_GTGT3ArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		var scale = MathJax.xypic.measure.oneem;
		return { l:0.507 * scale + 2 * MathJax.xypic.measure.thickness, r:0, d:0.268 * scale, u:0.268 * scale };
	}

	getRadius() {
		var scale = MathJax.xypic.measure.oneem;
		return 0.325 * scale;
	}

	drawDelegate(svg) {
		var scale = MathJax.xypic.measure.oneem;
		var t = MathJax.xypic.measure.thickness;
		var gu1 = svg.createGroup(svg.transformBuilder().rotateDegree(-15));
		var gd1 = svg.createGroup(svg.transformBuilder().rotateDegree(15));
		gu1.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(-0.222 * scale) + "," + MathJax.xypic.measure.em2px(-0.020 * scale) + " " + MathJax.xypic.measure.em2px(-0.489 * scale) + "," + MathJax.xypic.measure.em2px(-0.147 * scale)
		});
		gd1.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(-0.222 * scale) + ","+MathJax.xypic.measure.em2px(0.020 * scale) + " " + MathJax.xypic.measure.em2px(-0.489 * scale) + "," + MathJax.xypic.measure.em2px(0.147 * scale)
		});
		var gu2 = svg.createGroup(svg.transformBuilder().translate(-2 * t, 0).rotateDegree(-15));
		var gd2 = svg.createGroup(svg.transformBuilder().translate(-2 * t, 0).rotateDegree(15));
		gu2.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(-0.222 * scale) + "," + MathJax.xypic.measure.em2px(-0.020 * scale) + " " + MathJax.xypic.measure.em2px(-0.489 * scale) + "," + MathJax.xypic.measure.em2px(-0.147 * scale)
		});
		gd2.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(-0.222 * scale) + ","+MathJax.xypic.measure.em2px(0.020 * scale) + " " + MathJax.xypic.measure.em2px(-0.489 * scale) + "," + MathJax.xypic.measure.em2px(0.147 * scale)
		});
		svg.createSVGElement("line", {
			x1:0, y1:0, x2:MathJax.xypic.measure.em2px(-0.507 * scale - 2 * t), y2:0
		});
	}
};


// @{<<}
Shape.LTLTArrowheadShape = class Shape_LTLTArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		var scale = MathJax.xypic.measure.oneem;
		return { l:0, r:0.489 * scale + 2 * MathJax.xypic.measure.thickness, d:0.147 * scale, u:0.147 * scale };
	}

	drawDelegate(svg) {
		var scale = MathJax.xypic.measure.oneem;
		var t = MathJax.xypic.measure.thickness;
		var hshift = MathJax.xypic.measure.em2px(2 * t);
		svg.createSVGElement("path", {
			d:"M" + hshift + ",0 Q" + (MathJax.xypic.measure.em2px(0.222 * scale) + hshift) + "," + MathJax.xypic.measure.em2px(-0.020 * scale) + " " + (MathJax.xypic.measure.em2px(0.489 * scale) + hshift) + "," + MathJax.xypic.measure.em2px(-0.147 * scale)
		});
		svg.createSVGElement("path", {
			d:"M" + hshift + ",0 Q" + (MathJax.xypic.measure.em2px(0.222 * scale) + hshift) + "," + MathJax.xypic.measure.em2px(0.020 * scale) + " " + (MathJax.xypic.measure.em2px(0.489 * scale) + hshift) + "," + MathJax.xypic.measure.em2px(0.147 * scale)
		});
		svg.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(0.222 * scale) + "," + MathJax.xypic.measure.em2px(-0.020 * scale) + " " + MathJax.xypic.measure.em2px(0.489 * scale) + "," + MathJax.xypic.measure.em2px(-0.147 * scale)
		});
		svg.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(0.222 * scale) + "," + MathJax.xypic.measure.em2px(0.020 * scale) + " " + MathJax.xypic.measure.em2px(0.489 * scale) + "," + MathJax.xypic.measure.em2px(0.147 * scale)
		});
	}
};


// @^{<<}
Shape.UpperLTLTArrowheadShape = class Shape_UpperLTLTArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		var scale = MathJax.xypic.measure.oneem;
		return { l:0, r:0.489 * scale + 2 * MathJax.xypic.measure.thickness, d:0, u:0.147 * scale };
	}

	drawDelegate(svg) {
		var scale = MathJax.xypic.measure.oneem;
		var t = MathJax.xypic.measure.thickness;
		var hshift = MathJax.xypic.measure.em2px(2 * t);
		svg.createSVGElement("path", {
			d:"M" + hshift + ",0 Q" + (MathJax.xypic.measure.em2px(0.222 * scale) + hshift) + "," + MathJax.xypic.measure.em2px(-0.020 * scale) + " " + (MathJax.xypic.measure.em2px(0.489 * scale) + hshift) + "," + MathJax.xypic.measure.em2px(-0.147 * scale)
		});
		svg.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(0.222 * scale) + "," + MathJax.xypic.measure.em2px(-0.020 * scale) + " " + MathJax.xypic.measure.em2px(0.489 * scale) + "," + MathJax.xypic.measure.em2px(-0.147 * scale)
		});
	}
};


// @_{<<}
Shape.LowerLTLTArrowheadShape = class Shape_LowerLTLTArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		var scale = MathJax.xypic.measure.oneem;
		return { l:0, r:0.489 * scale + 2 * MathJax.xypic.measure.thickness, d:0.147 * scale, u:0 };
	}

	drawDelegate(svg) {
		var scale = MathJax.xypic.measure.oneem;
		var t = MathJax.xypic.measure.thickness;
		var hshift = MathJax.xypic.measure.em2px(2 * t);
		svg.createSVGElement("path", {
			d:"M" + hshift + ",0 Q" + (MathJax.xypic.measure.em2px(0.222 * scale) + hshift) + "," + MathJax.xypic.measure.em2px(0.020 * scale) + " " + (MathJax.xypic.measure.em2px(0.489 * scale) + hshift) + "," + MathJax.xypic.measure.em2px(0.147 * scale)
		});
		svg.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(0.222 * scale) + "," + MathJax.xypic.measure.em2px(0.020 * scale) + " " + MathJax.xypic.measure.em2px(0.489 * scale) + "," + MathJax.xypic.measure.em2px(0.147 * scale)
		});
	}
};


// @2{<<}
Shape.LTLT2ArrowheadShape = class Shape_LTLT2ArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		var scale = MathJax.xypic.measure.oneem;
		return { l:0, r:0.456 + scale + 2 * MathJax.xypic.measure.thickness, d:0.229 * scale, u:0.229 * scale };
	}

	getRadius() {
		var scale = MathJax.xypic.measure.oneem;
		return 0.213 * scale;
	}

	drawDelegate(svg) {
		var scale = MathJax.xypic.measure.oneem;
		var t = MathJax.xypic.measure.thickness;
		var gu1 = svg.createGroup(svg.transformBuilder().translate(2 * t, 0).rotateDegree(10)); 
		var gd1 = svg.createGroup(svg.transformBuilder().translate(2 * t, 0).rotateDegree(-10));
		gu1.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(0.222 * scale) + "," + MathJax.xypic.measure.em2px(-0.020 * scale) + " " + MathJax.xypic.measure.em2px(0.489 * scale) + "," + MathJax.xypic.measure.em2px(-0.147 * scale)
		});
		gd1.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(0.222 * scale) + "," + MathJax.xypic.measure.em2px(0.020 * scale) + " " + MathJax.xypic.measure.em2px(0.489 * scale) + "," + MathJax.xypic.measure.em2px(0.147 * scale)
		});
		var gu2 = svg.createGroup(svg.transformBuilder().rotateDegree(10)); 
		var gd2 = svg.createGroup(svg.transformBuilder().rotateDegree(-10));
		gu2.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(0.222 * scale) + "," + MathJax.xypic.measure.em2px(-0.020 * scale) + " " + MathJax.xypic.measure.em2px(0.489 * scale) + "," + MathJax.xypic.measure.em2px(-0.147 * scale)
		});
		gd2.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(0.222 * scale) + "," + MathJax.xypic.measure.em2px(0.020 * scale) + " " + MathJax.xypic.measure.em2px(0.489 * scale) + "," + MathJax.xypic.measure.em2px(0.147 * scale)
		});
	}
};


// @3{<<}
Shape.LTLT3ArrowheadShape = class Shape_LTLT3ArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		var scale = MathJax.xypic.measure.oneem;
		return { l:0, r:0.507 * scale + 2 * MathJax.xypic.measure.thickness, d:0.268 * scale, u:0.268 * scale };
	}

	getRadius() {
		var scale = MathJax.xypic.measure.oneem;
		return 0.325 * scale;
	}

	drawDelegate(svg) {
		var scale = MathJax.xypic.measure.oneem;
		var t = MathJax.xypic.measure.thickness;
		var gu1 = svg.createGroup(svg.transformBuilder().translate(2 * t, 0).rotateDegree(15)); 
		var gd1 = svg.createGroup(svg.transformBuilder().translate(2 * t, 0).rotateDegree(-15));
		gu1.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(0.222 * scale) + "," + MathJax.xypic.measure.em2px(-0.020 * scale) + " " + MathJax.xypic.measure.em2px(0.489 * scale) + "," + MathJax.xypic.measure.em2px(-0.147 * scale)
		});
		gd1.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(0.222 * scale) + "," + MathJax.xypic.measure.em2px(0.020 * scale) + " " + MathJax.xypic.measure.em2px(0.489 * scale) + "," + MathJax.xypic.measure.em2px(0.147 * scale)
		});
		var gu2 = svg.createGroup(svg.transformBuilder().rotateDegree(15)); 
		var gd2 = svg.createGroup(svg.transformBuilder().rotateDegree(-15));
		gu2.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(0.222 * scale) + "," + MathJax.xypic.measure.em2px(-0.020 * scale) + " " + MathJax.xypic.measure.em2px(0.489 * scale) + "," + MathJax.xypic.measure.em2px(-0.147 * scale)
		});
		gd2.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(0.222 * scale) + "," + MathJax.xypic.measure.em2px(0.020 * scale) + " " + MathJax.xypic.measure.em2px(0.489 * scale) + "," + MathJax.xypic.measure.em2px(0.147 * scale)
		});
		svg.createSVGElement("line", {
			x1:0, y1:0, x2:MathJax.xypic.measure.em2px(0.507 * scale + 2 * t), y2:0
		});
	}
};


// @{||}
Shape.ColumnColumnArrowheadShape = class Shape_ColumnColumnArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		return { l:MathJax.xypic.measure.thickness, r:0, u:0.5 * MathJax.xypic.measure.lineElementLength, d:0.5 * MathJax.xypic.measure.lineElementLength };
	}

	drawDelegate(svg) {
		var t = MathJax.xypic.measure.thickness;
		var l = MathJax.xypic.measure.em2px(0.5 * MathJax.xypic.measure.lineElementLength);
		svg.createSVGElement("line", {
			x1:0, y1:l, x2:0, y2:-l
		});
		svg.createSVGElement("line", {
			x1:-MathJax.xypic.measure.em2px(t), y1:l, x2:-MathJax.xypic.measure.em2px(t), y2:-l
		});
	}
};


// @^{||}
Shape.UpperColumnColumnArrowheadShape = class Shape_UpperColumnColumnArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		return { l:MathJax.xypic.measure.thickness, r:0, u:MathJax.xypic.measure.lineElementLength, d:0 };
	}

	drawDelegate(svg) {
		var t = MathJax.xypic.measure.thickness;
		var l = MathJax.xypic.measure.em2px(MathJax.xypic.measure.lineElementLength);
		svg.createSVGElement("line", {
			x1:0, y1:0, x2:0, y2:-l
		});
		svg.createSVGElement("line", {
			x1:-MathJax.xypic.measure.em2px(t), y1:0, x2:-MathJax.xypic.measure.em2px(t), y2:-l
		});
	}
};


// @_{||}
Shape.LowerColumnColumnArrowheadShape = class Shape_LowerColumnColumnArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		return { l:MathJax.xypic.measure.thickness, r:0, u:0, d:MathJax.xypic.measure.lineElementLength };
	}

	drawDelegate(svg) {
		var t = MathJax.xypic.measure.thickness;
		var l = MathJax.xypic.measure.em2px(MathJax.xypic.measure.lineElementLength);
		svg.createSVGElement("line", {
			x1:0, y1:0, x2:0, y2:l
		});
		svg.createSVGElement("line", {
			x1:-MathJax.xypic.measure.em2px(t), y1:0, x2:-MathJax.xypic.measure.em2px(t), y2:l
		});
	}
};


// @2{||}
Shape.ColumnColumn2ArrowheadShape = class Shape_ColumnColumn2ArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		return { l:MathJax.xypic.measure.thickness, r:0, u:0.5 * (MathJax.xypic.measure.lineElementLength + MathJax.xypic.measure.thickness), d:0.5 * (MathJax.xypic.measure.lineElementLength + MathJax.xypic.measure.thickness) };
	}

	drawDelegate(svg) {
		var t = MathJax.xypic.measure.thickness;
		var l = MathJax.xypic.measure.em2px(0.5 * (MathJax.xypic.measure.lineElementLength + MathJax.xypic.measure.thickness));
		svg.createSVGElement("line", {
			x1:0, y1:l, x2:0, y2:-l
		});
		svg.createSVGElement("line", {
			x1:-MathJax.xypic.measure.em2px(t), y1:l, x2:-MathJax.xypic.measure.em2px(t), y2:-l
		});
	}
};


// @3{||}
Shape.ColumnColumn3ArrowheadShape = class Shape_ColumnColumn3ArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		return { l:MathJax.xypic.measure.thickness, r:0, u:0.5 * MathJax.xypic.measure.lineElementLength + MathJax.xypic.measure.thickness, d:0.5 * MathJax.xypic.measure.lineElementLength + MathJax.xypic.measure.thickness };
	}

	drawDelegate(svg) {
		var t = MathJax.xypic.measure.thickness;
		var t = MathJax.xypic.measure.thickness;
		var l = MathJax.xypic.measure.em2px(0.5 * MathJax.xypic.measure.lineElementLength + MathJax.xypic.measure.thickness);
		svg.createSVGElement("line", {
			x1:0, y1:l, x2:0, y2:-l
		});
		svg.createSVGElement("line", {
			x1:-MathJax.xypic.measure.em2px(t), y1:l, x2:-MathJax.xypic.measure.em2px(t), y2:-l
		});
	}
};


// @{|-}
Shape.ColumnLineArrowheadShape = class Shape_ColumnLineArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		return { l:0, r:MathJax.xypic.measure.lineElementLength, u:0.5 * MathJax.xypic.measure.lineElementLength, d:0.5 * MathJax.xypic.measure.lineElementLength };
	}

	drawDelegate(svg) {
		var l = MathJax.xypic.measure.em2px(0.5 * MathJax.xypic.measure.lineElementLength);
		svg.createSVGElement("line", {
			x1:0, y1:l, x2:0, y2:-l
		});
		var lineLen = MathJax.xypic.measure.em2px(MathJax.xypic.measure.lineElementLength);
		svg.createSVGElement("line", {
			x1:0, y1:0, x2:lineLen, y2:0
		});
	}
};


// @^{|-}
Shape.UpperColumnLineArrowheadShape = class Shape_UpperColumnLineArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		return { l:0, r:MathJax.xypic.measure.lineElementLength, u:MathJax.xypic.measure.lineElementLength, d:0 };
	}

	drawDelegate(svg) {
		var t = MathJax.xypic.measure.thickness;
		var l = MathJax.xypic.measure.em2px(MathJax.xypic.measure.lineElementLength);
		svg.createSVGElement("line", {
			x1:0, y1:0, x2:0, y2:-l
		});
		var lineLen = MathJax.xypic.measure.em2px(MathJax.xypic.measure.lineElementLength);
		svg.createSVGElement("line", {
			x1:0, y1:0, x2:lineLen, y2:0
		});
	}
};


// @_{|-}
Shape.LowerColumnLineArrowheadShape = class Shape_LowerColumnLineArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		return { l:0, r:MathJax.xypic.measure.lineElementLength, u:0, d:MathJax.xypic.measure.lineElementLength };
	}

	drawDelegate(svg) {
		var t = MathJax.xypic.measure.thickness;
		var l = MathJax.xypic.measure.em2px(MathJax.xypic.measure.lineElementLength);
		svg.createSVGElement("line", {
			x1:0, y1:0, x2:0, y2:l
		});
		var lineLen = MathJax.xypic.measure.em2px(MathJax.xypic.measure.lineElementLength);
		svg.createSVGElement("line", {
			x1:0, y1:0, x2:lineLen, y2:0
		});
	}
};


// @2{|-}
Shape.ColumnLine2ArrowheadShape = class Shape_ColumnLine2ArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		return { l:0, r:MathJax.xypic.measure.lineElementLength, u:0.5 * (MathJax.xypic.measure.lineElementLength + MathJax.xypic.measure.thickness), d:0.5 * (MathJax.xypic.measure.lineElementLength + MathJax.xypic.measure.thickness) };
	}

	drawDelegate(svg) {
		var t = MathJax.xypic.measure.thickness;
		var l = MathJax.xypic.measure.em2px(0.5 * (MathJax.xypic.measure.lineElementLength + MathJax.xypic.measure.thickness));
		svg.createSVGElement("line", {
			x1:0, y1:-l, x2:0, y2:l
		});
		var vshift = MathJax.xypic.measure.em2px(0.5 * t);
		var lineLen = MathJax.xypic.measure.em2px(MathJax.xypic.measure.lineElementLength);
		svg.createSVGElement("line", {
			x1:0, y1:vshift, x2:lineLen, y2:vshift
		});
		svg.createSVGElement("line", {
			x1:0, y1:-vshift, x2:lineLen, y2:-vshift
		});
	}
};


// @3{|-}
Shape.ColumnLine3ArrowheadShape = class Shape_ColumnLine3ArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();  // TODO FIXME
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		return { l:0, r:MathJax.xypic.measure.lineElementLength, u:0.5 * MathJax.xypic.measure.lineElementLength + MathJax.xypic.measure.thickness, d:0.5 * MathJax.xypic.measure.lineElementLength + MathJax.xypic.measure.thickness };
	}

	drawDelegate(svg) {
		var t = MathJax.xypic.measure.thickness;
		var l = MathJax.xypic.measure.em2px(0.5 * MathJax.xypic.measure.lineElementLength + MathJax.xypic.measure.thickness);
		svg.createSVGElement("line", {
			x1:0, y1:-l, x2:0, y2:l
		});
		var lineLen = MathJax.xypic.measure.em2px(MathJax.xypic.measure.lineElementLength);
		var vshift = MathJax.xypic.measure.em2px(t);
		svg.createSVGElement("line", {
			x1:0, y1:vshift, x2:lineLen, y2:vshift
		});
		svg.createSVGElement("line", {
			x1:0, y1:0, x2:lineLen, y2:0
		});
		svg.createSVGElement("line", {
			x1:0, y1:-vshift, x2:lineLen, y2:-vshift
		});
	}
};


// @{>|}
Shape.GTColumnArrowheadShape = class Shape_GTColumnArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();  // TODO FIXME
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		var scale = MathJax.xypic.measure.oneem;
		return { l:0.489 * scale, r:0, u:0.5 * MathJax.xypic.measure.lineElementLength, d:0.5 * MathJax.xypic.measure.lineElementLength };
	}

	drawDelegate(svg) {
		var scale = MathJax.xypic.measure.oneem;
		var l = MathJax.xypic.measure.em2px(0.5 * MathJax.xypic.measure.lineElementLength);
		svg.createSVGElement("line", {
			x1:0, y1:l, x2:0, y2:-l
		});
		svg.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(-0.222 * scale) + "," + MathJax.xypic.measure.em2px(0.020 * scale) + " " + MathJax.xypic.measure.em2px(-0.489 * scale) + "," + MathJax.xypic.measure.em2px(0.147 * scale)
		});
		svg.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(-0.222 * scale) + "," + MathJax.xypic.measure.em2px(-0.020 * scale) + " " + MathJax.xypic.measure.em2px(-0.489 * scale) + "," + MathJax.xypic.measure.em2px(-0.147 * scale)
		});
	}
};


// @{>>|}
Shape.GTGTColumnArrowheadShape = class Shape_GTGTColumnArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		var scale = MathJax.xypic.measure.oneem;
		return { l:0.489 * scale + 2 * MathJax.xypic.measure.thickness, r:0, u:0.5 * MathJax.xypic.measure.lineElementLength, d:0.5 * MathJax.xypic.measure.lineElementLength };
	}

	drawDelegate(svg) {
		var scale = MathJax.xypic.measure.oneem;
		var t = MathJax.xypic.measure.thickness;
		var l = MathJax.xypic.measure.em2px(0.5 * MathJax.xypic.measure.lineElementLength);
		svg.createSVGElement("line", {
			x1:0, y1:l, x2:0, y2:-l
		});
		var hshift = MathJax.xypic.measure.em2px(2 * t);
		svg.createSVGElement("path", {
			d:"M" + (-hshift) + ",0 Q" + (MathJax.xypic.measure.em2px(-0.222 * scale) - hshift) + "," + MathJax.xypic.measure.em2px(0.020 * scale) + " " + (MathJax.xypic.measure.em2px(-0.489 * scale) - hshift) + "," + MathJax.xypic.measure.em2px(0.147 * scale)
		});
		svg.createSVGElement("path", {
			d:"M" + (-hshift) + ",0 Q" + (MathJax.xypic.measure.em2px(-0.222 * scale) - hshift) + "," + MathJax.xypic.measure.em2px(-0.020 * scale) + " " + (MathJax.xypic.measure.em2px(-0.489 * scale) - hshift) + "," + MathJax.xypic.measure.em2px(-0.147 * scale)
		});
		svg.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(-0.222 * scale) + "," + MathJax.xypic.measure.em2px(0.020 * scale) + " " + MathJax.xypic.measure.em2px(-0.489 * scale) + "," + MathJax.xypic.measure.em2px(0.147 * scale)
		});
		svg.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(-0.222 * scale) + "," + MathJax.xypic.measure.em2px(-0.020 * scale) + " " + MathJax.xypic.measure.em2px(-0.489 * scale) + "," + MathJax.xypic.measure.em2px(-0.147 * scale)
		});
	}
};


// @{|<}
Shape.ColumnLTArrowheadShape = class Shape_ColumnLTArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		var scale = MathJax.xypic.measure.oneem;
		return { l:0, r:0.489 * scale, u:0.5 * MathJax.xypic.measure.lineElementLength, d:0.5 * MathJax.xypic.measure.lineElementLength };
	}

	drawDelegate(svg) {
		var scale = MathJax.xypic.measure.oneem;
		var t = MathJax.xypic.measure.thickness;
		var l = MathJax.xypic.measure.em2px(0.5 * MathJax.xypic.measure.lineElementLength);
		svg.createSVGElement("line", {
			x1:0, y1:l, x2:0, y2:-l
		});
		svg.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(0.222 * scale) + "," + MathJax.xypic.measure.em2px(-0.020 * scale) + " " + MathJax.xypic.measure.em2px(0.489 * scale) + "," + MathJax.xypic.measure.em2px(-0.147 * scale)
		});
		svg.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(0.222 * scale) + "," + MathJax.xypic.measure.em2px(0.020 * scale) + " " + MathJax.xypic.measure.em2px(0.489 * scale) + "," + MathJax.xypic.measure.em2px(0.147 * scale)
		});
	}
};


// @{|<<}
Shape.ColumnLTLTArrowheadShape = class Shape_ColumnLTLTArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		var scale = MathJax.xypic.measure.oneem;
		return { l:0, r:0.489 * scale + 2 * MathJax.xypic.measure.thickness, u:0.5 * MathJax.xypic.measure.lineElementLength, d:0.5 * MathJax.xypic.measure.lineElementLength };
	}

	drawDelegate(svg) {
		var scale = MathJax.xypic.measure.oneem;
		var t = MathJax.xypic.measure.thickness;
		var l = MathJax.xypic.measure.em2px(0.5 * MathJax.xypic.measure.lineElementLength);
		svg.createSVGElement("line", {
			x1:0, y1:l, x2:0, y2:-l
		});
		var hshift = MathJax.xypic.measure.em2px(2 * t);
		svg.createSVGElement("path", {
			d:"M" + hshift + ",0 Q" + (MathJax.xypic.measure.em2px(0.222 * scale) + hshift) + "," + MathJax.xypic.measure.em2px(-0.020 * scale) + " " + (MathJax.xypic.measure.em2px(0.489 * scale) + hshift) + "," + MathJax.xypic.measure.em2px(-0.147 * scale)
		});
		svg.createSVGElement("path", {
			d:"M" + hshift + ",0 Q" + (MathJax.xypic.measure.em2px(0.222 * scale) + hshift) + "," + MathJax.xypic.measure.em2px(0.020 * scale) + " " + (MathJax.xypic.measure.em2px(0.489 * scale) + hshift) + "," + MathJax.xypic.measure.em2px(0.147 * scale)
		});
		svg.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(0.222 * scale) + "," + MathJax.xypic.measure.em2px(-0.020 * scale) + " " + MathJax.xypic.measure.em2px(0.489 * scale) + "," + MathJax.xypic.measure.em2px(-0.147 * scale)
		});
		svg.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(0.222 * scale) + "," + MathJax.xypic.measure.em2px(0.020 * scale) + " " + MathJax.xypic.measure.em2px(0.489 * scale) + "," + MathJax.xypic.measure.em2px(0.147 * scale)
		});
	}
};


// @{//}
Shape.SlashSlashArrowheadShape = class Shape_SlashSlashArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle - Math.PI / 10;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		return { l:MathJax.xypic.measure.thickness, r:0, u:0.5 * MathJax.xypic.measure.lineElementLength, d:0.5 * MathJax.xypic.measure.lineElementLength };
	}

	drawDelegate(svg) {
		var hshift = MathJax.xypic.measure.em2px(MathJax.xypic.measure.thickness);
		var halfLenPx = MathJax.xypic.measure.em2px(0.5 * MathJax.xypic.measure.lineElementLength);
		svg.createSVGElement("line", {
			x1:0, y1:halfLenPx, x2:0, y2:-halfLenPx
		});
		svg.createSVGElement("line", {
			x1:-hshift, y1:halfLenPx, x2:-hshift, y2:-halfLenPx
		});
	}
};


// @{=>}
Shape.LineGT2ArrowheadShape = class Shape_LineGT2ArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		var scale = MathJax.xypic.measure.oneem;
		return { l:MathJax.xypic.measure.lineElementLength, r:MathJax.xypic.measure.lineElementLength, d:0.229 * scale, u:0.229 * scale };
	}

	getRadius() {
		var scale = MathJax.xypic.measure.oneem;
		return 0.213 * scale;
	}

	drawDelegate(svg) {
		var scale = MathJax.xypic.measure.oneem;
		var halfLen = MathJax.xypic.measure.lineElementLength;
		var hshift = MathJax.xypic.measure.em2px(halfLen);
		var v = 0.5 * MathJax.xypic.measure.thickness;
		var vshift = MathJax.xypic.measure.em2px(v);
		var r = this.getRadius();
		var delta = MathJax.xypic.measure.em2px(Math.sqrt(r * r - v * v));
		
		var gu = svg.createGroup(svg.transformBuilder().translate(halfLen, 0).rotateDegree(-10));
		var gd = svg.createGroup(svg.transformBuilder().translate(halfLen, 0).rotateDegree(10));
		gu.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(-0.222 * scale) + "," + MathJax.xypic.measure.em2px(-0.020 * scale) + " " + MathJax.xypic.measure.em2px(-0.489 * scale) + "," + MathJax.xypic.measure.em2px(-0.147 * scale)
		});
		gd.createSVGElement("path", {
			d:"M0,0 Q" + MathJax.xypic.measure.em2px(-0.222 * scale) + ","+MathJax.xypic.measure.em2px(0.020 * scale) + " " + MathJax.xypic.measure.em2px(-0.489 * scale) + "," + MathJax.xypic.measure.em2px(0.147 * scale)
		});
		svg.createSVGElement("path", {
			d:"M" + (-hshift) + "," + vshift + " L" + (hshift - delta) + "," + vshift + 
				" M" + (-hshift) + "," + (-vshift) + " L" + (hshift - delta) + "," + (-vshift)
		});
	}
};


// twocell equality arrow
Shape.TwocellEqualityArrowheadShape = class Shape_TwocellEqualityArrowheadShape extends Shape.ArrowheadShape {
	constructor(c, angle) {
		super();
		this.c = c;
		this.angle = angle;
		XypicUtil.memoize(this, "getBoundingBox");
	}

	getBox() {
		var scale = MathJax.xypic.measure.oneem;
		return { l:MathJax.xypic.measure.lineElementLength, r:MathJax.xypic.measure.lineElementLength, d:0.5 * MathJax.xypic.measure.thickness, u:0.5 * MathJax.xypic.measure.thickness };
	}

	drawDelegate(svg) {
		var scale = MathJax.xypic.measure.oneem;
		var hshift = MathJax.xypic.measure.em2px(MathJax.xypic.measure.lineElementLength);
		var vshift = MathJax.xypic.measure.em2px(0.5 * MathJax.xypic.measure.thickness);
		svg.createSVGElement("path", {
			d:"M" + (-hshift) + "," + vshift + " L" + hshift + "," + vshift + 
				" M" + (-hshift) + "," + (-vshift) + " L" + hshift + "," + (-vshift)
		});
	}
};


Shape.LineShape = class Shape_LineShape extends Shape {
	constructor(line, object, main, variant, bbox) {
		super();
		this.line = line;
		this.object = object;
		this.main = main;
		this.variant = variant;
		this.bbox = bbox;
		this.holeRanges = List.empty;
	}

	sliceHole(range) {
		this.holeRanges = this.holeRanges.prepend(range);
	}

	draw(svg) {
		this.line.drawLine(svg, this.object, this.main, this.variant, this.holeRanges);
	}

	getBoundingBox() {
		return this.bbox;
	}

	toString() {
		return "LineShape[line:" + this.line + ", object:" + this.object + ", main:" + this.main + ", variant:" + this.variant + "]";
	}
};


Shape.CurveShape = class Shape_CurveShape extends Shape {
	constructor(curve, objectForDrop, objectForConnect, bbox) {
		super();
		this.curve = curve;
		this.objectForDrop = objectForDrop;
		this.objectForConnect = objectForConnect;
		this.bbox = bbox;
		this.holeRanges = List.empty;
	}

	sliceHole(range) {
		this.holeRanges = this.holeRanges.prepend(range);
	}

	draw(svg) {
		this.curve.drawCurve(svg, this.objectForDrop, this.objectForConnect, this.holeRanges);
	}

	getBoundingBox() {
		return this.bbox;
	}

	toString() {
		return "CurveShape[curve" + this.curve + ", objectForDrop:" + (this.objectForDrop !== undefined? this.objectForDrop.toString() : "null") + ", objectForConnect:" + (this.objectForConnect !== undefined? this.objectForConnect.toString() : "null") + "]";
	}
};
