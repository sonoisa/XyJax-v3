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


import {XypicUtil} from "../util/XypicUtil.js";
import {List} from "../fp/List.js";
import {Frame} from "./Frames.js";


const SVGNS = 'http://www.w3.org/2000/svg';
const XLINKNS = 'http://www.w3.org/1999/xlink';


export class Graphics {
	static createSVG(xypicWrapper, height, depth, width, strokeWidth, color, def) {
		return new World(xypicWrapper, height, depth, width, strokeWidth, color, def);
	}
}


class SVG {
	constructor(xypicWrapper) {
		this.xypicWrapper = xypicWrapper;
	}

	createElement(type) {
		return this.xypicWrapper.svg(type);
	}

	createGroup(transform) {
		return new Group(this, transform);
	}

	createChangeColorGroup(color) {
		return new ChangeColorGroup(this, color);
	}

	createSVGElement(type, def) {
		let obj = this.createElement(type);
		if (def) {
			for (let id in def) {
				if (def.hasOwnProperty(id)) {
					let value = def[id].toString();
					if (id === "xlink:href") {
						this.xypicWrapper.setAttribute(obj, id, value, XLINKNS);
					} else {
						this.xypicWrapper.setAttribute(obj, id, value);
					}
				}
			}
		}
		this.drawArea.appendChild(obj);
		return obj;
	}

	appendChild(svgElement) {
		this.drawArea.appendChild(svgElement);
		return svgElement;
	}

	transformBuilder() {
		return new Transform();
	}
}


class World extends SVG {
	constructor(xypicWrapper, height, depth, width, strokeWidth, color, def) {
		super(xypicWrapper);

		let svg = this.createElement("svg");
		this.xypicWrapper.setAttribute(svg, "xmlns", SVGNS);
		this.xypicWrapper.setAttribute(svg, "version", "1.1");

		if (def) {
			for (let id in def) {
				if (def.hasOwnProperty(id)) {
					this.xypicWrapper.setAttribute(svg, id, def[id].toString());
				}
			}
		}

		if (svg.style) {
			svg.style.width = MathJax.xypic.measure.Em(width);
			svg.style.height = MathJax.xypic.measure.Em(height + depth);
		}

		var def = {
			fill: "none", 
			stroke: color, 
			"stroke-linecap": "round",
			"stroke-width": MathJax.xypic.measure.em2px(strokeWidth)
		}

		this.drawArea = this.createElement("g");
		for (var id in def) {
			if (def.hasOwnProperty(id)) {
				this.xypicWrapper.setAttribute(this.drawArea, id, def[id].toString());
			}
		}

		this.xypicWrapper.append(svg, this.drawArea);

		this.svg = svg;
		this.boundingBox = undefined;
		this.color = color;
	}

	setHeight(height) {
		this.xypicWrapper.setStyle(this.svg, "height", MathJax.xypic.measure.Em(height));
	}

	setWidth(width) {
		this.xypicWrapper.setStyle(this.svg, "width", MathJax.xypic.measure.Em(width));
	}

	setAttribute(name, value) {
		this.xypicWrapper.setAttribute(this.svg, name, value.toString());
	}

	extendBoundingBox(boundingBox) {
		this.boundingBox = Frame.combineRect(this.boundingBox, boundingBox);
	}

	getOrigin() {
		return { x:0, y:0 };
	}

	getCurrentColor() {
		return this.color;
	}
}


class Transform {
	constructor(transform) {
		this.transform = transform || List.empty;
	}

	translate(x, y) {
		return new Transform(
			this.transform.append(new Translate(x, y))
		);
	}

	rotateDegree(degree) {
		return new Transform(
			this.transform.append(new Rotate(degree / 180 * Math.PI))
		);
	}

	rotateRadian(radian) {
		return new Transform(
			this.transform.append(new Rotate(radian))
		);
	}

	toString() {
		var form = "";
		this.transform.foreach(function (tr) { form += tr.toTranslateForm() });
		return form;
	}

	apply(x, y) {
		var o = { x:x, y:y };
		this.transform.foreach(function (tr) { o = tr.apply(o.x, o.y) });
		return o;
	}
}


class Translate {
	constructor(dx, dy) {
		this.dx = dx;
		this.dy = dy;
	}

	apply(x, y) {
		return { x:x - this.dx, y:y + this.dy };
	}

	toTranslateForm() {
		return "translate(" + MathJax.xypic.measure.em2px(this.dx) + "," + MathJax.xypic.measure.em2px(-this.dy) + ") ";
	}
}


class Rotate {
	constructor(radian) {
		this.radian = radian;
	}

	apply(x, y) {
		var c = Math.cos(this.radian);
		var s = Math.sin(this.radian);
		return { x:c * x + s * y, y:-s * x + c * y };
	}

	toTranslateForm() {
		return "rotate(" + (-180 * this.radian / Math.PI) + ") ";
	}
}


class Group extends SVG {
	constructor(parent, transform) {
		super(parent.xypicWrapper);

		this.parent = parent;
		this.drawArea = parent.createSVGElement("g", 
			transform === undefined? {} : { transform: transform.toString() });
		var parentOrigin = parent.getOrigin();
		if (transform === undefined) {
			this.origin = parentOrigin;
		} else {
			this.origin = transform.apply(parentOrigin.x, parentOrigin.y);
		}
		XypicUtil.memoize(this, "getCurrentColor");
	}

	remove() {
		this.xypicWrapper.remove(this.drawArea);
	}

	extendBoundingBox(boundingBox) {
		this.parent.extendBoundingBox(boundingBox);
	}

	getOrigin() {
		return this.origin;
	}

	getCurrentColor() {
		return this.parent.getCurrentColor();
	}
}


class ChangeColorGroup extends SVG {
	constructor(parent, color) {
		super(parent.xypicWrapper);

		this.parent = parent;
		this.drawArea = parent.createSVGElement("g", {
			stroke: color
		});
		this.color = color;
		XypicUtil.memoize(this, "getOrigin");
	}

	remove() {
		this.xypicWrapper.remove(this.drawArea);
	}

	extendBoundingBox(boundingBox) {
		this.parent.extendBoundingBox(boundingBox);
	}

	getOrigin() {
		return this.parent.getOrigin();
	}

	getCurrentColor() {
		return this.color;
	}
}
