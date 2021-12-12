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


import {SVGWrapper} from "mathjax-full/js/output/svg/Wrapper.js";
import {SVGWrappers} from "mathjax-full/js/output/svg/Wrappers.js";

import createXypicError from "../core/XypicError.js";
import {BBox} from 'mathjax-full/js/util/BBox.js';

import {xypicGlobalContext} from "../core/xypicGlobalContext.js";
import {AST} from "../input/XyNodes.js";
import {Shape} from "./Shapes.js";
import {Frame} from "./Frames.js";
import {Graphics} from "./Graphics.js";
import {DrawingContext} from "./DrawingContext.js";
import {Env} from "./Curves.js";
import {XypicUtil} from "../util/XypicUtil.js";


const SVGNS = 'http://www.w3.org/2000/svg';
const XLINKNS = 'http://www.w3.org/1999/xlink';

const round2 = XypicUtil.round2;

export function CreateSVGWrapper(wrapper, wrappers) {

	class AbstractSVGxypic extends wrapper {
		constructor(factory, node, parent=null) {
			super(factory, node, parent);

			const wrapperOfTextObjectMap = xypicGlobalContext.wrapperOfTextObjectMap;
			const textMmls = node.textMmls;
			const wrappers = this.childNodes;
			const childCount = textMmls.length;
			for (let i = 0; i < childCount; i++) {
				const textObjectId = textMmls[i].xypicTextObjectId;
				wrapperOfTextObjectMap[textObjectId] = wrappers[i];
			}

			// このxypicノードが内包するTextObjectのDOM
			this._textObjects = [];
		}

		getElement() {
			return this.svgNode;
		}

		appendTextObject(textObject) {
			this._textObjects.push(textObject);
		}

		getChildWrapper(childMml) {
			const textObjectId = childMml.xypicTextObjectId;
			if (textObjectId == undefined) {
				// 不到達コード
				throw createXypicError("IllegalStateError", "BUG");
			}
			const wrapper = xypicGlobalContext.wrapperOfTextObjectMap[textObjectId];
			if (wrapper == undefined) {
				// 不到達コード
				throw createXypicError("IllegalStateError", "unknown textObjectId:" + textObjectId);
			}

			return wrapper;
		}

		toSVG(parent) {
			const oldSvgForDebug = xypicGlobalContext.svgForDebug;
			const oldSvgForTestLayout = xypicGlobalContext.svgForTestLayout;

			this._textObjects = [];
			this.setupMeasure(this);

			this._toSVG(parent);

			xypicGlobalContext.svgForDebug = oldSvgForDebug;
			xypicGlobalContext.svgForTestLayout = oldSvgForTestLayout;
		}

		setupMeasure(wrapper) {
			const round2 = XypicUtil.round2;
			const oneem = wrapper.length2em("1em");
			const em = parseFloat(wrapper.px(100).replace("px", "")) / 100;
			const axis_height = wrapper.font.params.axis_height;
			const thickness = wrapper.length2em("0.15em");
			const em2px = function (n) { return Math.round(parseFloat(wrapper.px(n * 100).replace("px", ""))) / 100; };

			xypicGlobalContext.measure = {
				length2em: function (len) { return round2(wrapper.length2em(len)); },
				oneem: oneem,
				em2length: function (len) { return round2(len / oneem) + "em"; },
				Em: function (x) { return wrapper.em(x); },
				em: em,
				em2px: em2px,
				axis_height: axis_height,
				
				strokeWidth: wrapper.length2em("0.04em"),
				thickness: thickness,
				jot: wrapper.length2em("3pt"),
				objectmargin: wrapper.length2em("3pt"),
				objectwidth: wrapper.length2em("0pt"),
				objectheight: wrapper.length2em("0pt"),
				labelmargin: wrapper.length2em("2.5pt"),
				turnradius: wrapper.length2em("10pt"),
				lineElementLength: wrapper.length2em("5pt"),
				axisHeightLength: axis_height * wrapper.length2em("10pt"),
				
				dottedDasharray: "" + oneem + " " + em2px(thickness)
			}
		}

		append(parent, child) {
			this.adaptor.append(parent, child);
		}

		remove(child) {
			this.adaptor.remove(child);
		}

		svg(kind, properties={}, children=[]) {
			return this.adaptor.node(kind, properties, children, SVGNS);
		}

		setAttribute(node, name, value, ns) {
			return this.adaptor.setAttribute(node, name, value, ns);
		}

		setStyle(node, name, value) {
			this.adaptor.setStyle(node, name, value);
		}

		drawTextObject(textObject, svg, test) {
			const p = xypicGlobalContext.measure.length2em("0.2em");
			const parent = svg.xypicWrapper;
			const textObjectWrapper = parent.getChildWrapper(textObject.math);
			const adaptor = textObjectWrapper.adaptor;

			const bbox = textObjectWrapper.getBBox();
			const scale = bbox.scale;
			const H = (bbox.h + p) * scale;
			const D = (bbox.d + p) * scale;
			const W = (bbox.w + 2 * p) * scale;

			const halfHD = (H + D) / 2;
			const halfW = W / 2;

			const c = textObject.c;
			textObject.originalBBox = { H:H, D:D, W:W };

			if (!test) {
				const thisRoot = textObjectWrapper.svg("g");
				adaptor.append(parent.getElement(), thisRoot);

				adaptor.setAttribute(thisRoot, "stroke", svg.getCurrentColor());
				adaptor.setAttribute(thisRoot, "fill", svg.getCurrentColor());
				textObjectWrapper.toSVG(thisRoot);

				const origin = svg.getOrigin();
				adaptor.setAttribute(thisRoot, "data-x", (c.x - halfW - origin.x + p * scale));
				adaptor.setAttribute(thisRoot, "data-y", (-c.y + ((H - D) / 2) - origin.y));
				adaptor.setAttribute(thisRoot, "data-xypic-id", textObject.math.xypicTextObjectId);
				parent.appendTextObject(thisRoot);

				// for DEBUGGING
				// svg.createSVGElement("rect", {
				// 	x: xypicGlobalContext.measure.em2px(c.x - halfW),
				// 	y: -xypicGlobalContext.measure.em2px(c.y - (H - D) / 2),
				// 	width: xypicGlobalContext.measure.em2px(W),
				// 	height: 0.01,
				// 	stroke: "green", "stroke-width": 0.3
				// });
				// svg.createSVGElement("rect", {
				// 	x: xypicGlobalContext.measure.em2px(c.x - halfW),
				// 	y: -xypicGlobalContext.measure.em2px(c.y + halfHD),
				// 	width: xypicGlobalContext.measure.em2px(W),
				// 	height: xypicGlobalContext.measure.em2px(H + D),
				// 	stroke: "green", "stroke-width":0.5
				// });
			}

			return c.toRect({ u:halfHD, d:halfHD, l:halfW, r:halfW });
		}
	}



	class SVGxypic extends AbstractSVGxypic {
		constructor(factory, node, parent=null) {
			super(factory, node, parent);
			this.shape = null;
		}

		computeBBox(bbox, recompute=false) {
			bbox.empty();

			const xypicData = this.node.cmd;
			if (xypicData) {
				const p = this.length2em("0.2em");

				if (this.shape == null) {
					const oldSvgForDebug = xypicGlobalContext.svgForDebug;
					const oldSvgForTestLayout = xypicGlobalContext.svgForTestLayout;
					this._textObjects = [];
					this.setupMeasure(this);
		
					const adaptor = this.adaptor;
		
					const t = xypicGlobalContext.measure.strokeWidth;
		
					const H = 1, D = 0, W = 1;
		
					const em2px = xypicGlobalContext.measure.em2px;
		
					const color = "black";
					const svg = Graphics.createSVG(this, H, D, W, t, color, {
						viewBox: [0, -em2px(H + D), em2px(W), em2px(H + D)].join(" "),
						role: "img", 
						focusable: false,
						overflow: "visible"
					});
		
					xypicGlobalContext.svgForDebug = svg;
					xypicGlobalContext.svgForTestLayout = svg;
		
					const env = new Env();
					const context = new DrawingContext(Shape.none, env);
					xypicData.toShape(context);
					const shape = context.shape;
					this.shape = shape;

					xypicGlobalContext.svgForDebug = oldSvgForDebug;
					xypicGlobalContext.svgForTestLayout = oldSvgForTestLayout;
				}

				const shape = this.shape;
				let box = shape.getBoundingBox();
				
				if (box !== undefined) {
					box = new Frame.Rect(
						0, 0,
						{
							l: Math.max(0, -(box.x - box.l)),
							r: Math.max(0, box.x + box.r),
							u: Math.max(0, box.y + box.u),
							d: Math.max(0, -(box.y - box.d))
						}
					);
					bbox.updateFrom(new BBox({ w: box.l + box.r + 2 * p, h: box.u + 2 * p, d: box.d }));
				}
			}
		}

		get kind() {
			return AST.xypic.prototype.kind;
		}

		static get styles() {
			return {
				'g[data-mml-node="xypic"] path': {
					"stroke-width": "inherit"
				},
				'.MathJax g[data-mml-node="xypic"] path': {
					"stroke-width": "inherit"
				}
			};
		}

		_toSVG(parent) {
			const svgNode = this.standardSVGnode(parent);
			this.svgNode = svgNode;
			const adaptor = this.adaptor;

			const p = this.length2em("0.2em");
			const t = xypicGlobalContext.measure.strokeWidth;

			const bbox = { h:1, d:0, w:1, lw:0, rw:1 };
			const H = bbox.h, D = bbox.d, W = bbox.w;

			const em2px = xypicGlobalContext.measure.em2px;

			const color = "black";
			const svg = Graphics.createSVG(this, H, D, W, t, color, {
				viewBox: [0, -em2px(H + D), em2px(W), em2px(H + D)].join(" "),
				role: "img", 
				focusable: false,
				overflow: "visible"
			});

			xypicGlobalContext.svgForDebug = svg;
			xypicGlobalContext.svgForTestLayout = svg;

			adaptor.append(svgNode, svg.drawArea);

			const xypicData = this.node.cmd;
			if (xypicData) {
				if (this.shape == null) {
					const env = new Env();
					const context = new DrawingContext(Shape.none, env);
					xypicData.toShape(context);
					const shape = context.shape;
					this.shape = shape;
				}

				const shape = this.shape;
				shape.draw(svg);
				let box = shape.getBoundingBox();
				
				if (box !== undefined) {
					box = new Frame.Rect(
						0, 0,
						{
							l: Math.max(0, -(box.x - box.l)),
							r: Math.max(0, box.x + box.r),
							u: Math.max(0, box.y + box.u),
							d: Math.max(0, -(box.y - box.d))
						}
					);

					const xOffsetEm = box.x - box.l - p;
					const yOffsetEm = -box.y - box.u - p;

					const svgWidth = box.l + box.r + 2 * p;
					const svgHeight = box.u + box.d + 2 * p;
					
					svg.setWidth(svgWidth);
					svg.setHeight(svgHeight);
					svg.setAttribute("viewBox", [
							em2px(xOffsetEm), em2px(yOffsetEm), 
							em2px(svgWidth), em2px(svgHeight)
						].join(" "));

					// for DEBUGGING
					// this.drawBBox();

					const fixedScale = this.fixed(1) / em2px(1);
					adaptor.setAttribute(svg.drawArea, "transform", "translate(" + this.fixed(-xOffsetEm) + "," + this.fixed(box.y + xypicGlobalContext.measure.axis_height) + ") scale(" + fixedScale + ", " + (-fixedScale) + ")");

					for (let to of this._textObjects) {
						const tx = parseFloat(adaptor.getAttribute(to, "data-x"));
						const ty = parseFloat(adaptor.getAttribute(to, "data-y"));
						const translateX = tx - xOffsetEm;
						const translateY = -ty + box.y + xypicGlobalContext.measure.axis_height;
						this.place(translateX, translateY, to);
					}
				} else {
					// there is no contents
					adaptor.remove(svg.drawArea);
				}
			} else {
				// there is no contents
				adaptor.remove(svg.drawArea);
			}
		}
	}

	wrappers[SVGxypic.prototype.kind] = SVGxypic;


	class SVGnewdir extends AbstractSVGxypic {
		constructor(factory, node, parent=null) {
			super(factory, node, parent);
		}

		get kind() {
			return AST.xypic.newdir.prototype.kind;
		}

		computeBBox(bbox, recompute=false) {
			let newdir = this.node.cmd;
			xypicGlobalContext.repositories.dirRepository.put(newdir.dirMain, newdir.compositeObject);
		}

		_toSVG(parent) {
			let newdir = this.node.cmd;
			xypicGlobalContext.repositories.dirRepository.put(newdir.dirMain, newdir.compositeObject);
		}
	}

	wrappers[SVGnewdir.prototype.kind] = SVGnewdir;


	class SVGincludegraphics extends AbstractSVGxypic {
		constructor(factory, node, parent=null) {
			super(factory, node, parent);
			this._setupGraphics();
			this.computeBBox(this.bbox);
			this.bboxComputed = true;
		}

		get kind() {
			return AST.xypic.includegraphics.prototype.kind;
		}

		_setupGraphics() {
			this.setupMeasure(this);
			const env = new Env();
			const context = new DrawingContext(Shape.none, env);

			const graphics = this.node.cmd;
			graphics.setup(context);
			if (!env.includegraphicsWidth.isDefined || !env.includegraphicsHeight.isDefined) {
				throw createXypicError("ExecutionError", "the 'width' and 'height' attributes of the \\includegraphics are required.");
			}

			const imageWidth = env.includegraphicsWidth.get;
			const imageHeight = env.includegraphicsHeight.get;
			
			this.imageWidth = this.length2em(imageWidth);
			this.imageHeight = this.length2em(imageHeight);
			this.filepath = graphics.filepath;
		}

		computeBBox(bbox, recompute=false) {
			bbox.empty();
			bbox.updateFrom(new BBox({ w: this.imageWidth, h: this.imageHeight, d: 0 }));
		}

		_toSVG(parent) {
			const svgNode = this.standardSVGnode(parent);
			this.svgNode = svgNode;
			const fixedScale = this.fixed(1);
			const img = this.svg("image", {
				"x": "0",
				"y": "0",
				"preserveAspectRatio": "none",
				"width": round2(this.imageWidth),
				"height": round2(this.imageHeight),
				"transform": "scale(" + fixedScale + "," + (-fixedScale) + ") translate(0," + round2(-this.imageHeight) + ")"
			});
			this.adaptor.setAttribute(img, "xlink:href", this.filepath, XLINKNS);
			this.adaptor.append(svgNode, img);
		}
	}

	wrappers[SVGincludegraphics.prototype.kind] = SVGincludegraphics;
}

if (SVGWrapper !== undefined) {
	CreateSVGWrapper(SVGWrapper, SVGWrappers);
}
