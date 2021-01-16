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


import {Shape} from "./Shapes.js";


export class DrawingContext {
	constructor(shape, env) {
		this.shape = shape;
		this.env = env;
	}
	
	duplicateEnv() {
		var newEnv = this.env.duplicate();
		return new DrawingContext(this.shape, newEnv);
	}
	
	/**
	 * shapeを最前面に追加する。
	 * @param {xypic.Shape} shape 追加する図形
	 */
	appendShapeToFront(shape) {
		if (shape.isNone) {
		} else if (this.shape.isNone) {
			this.shape = shape;
		} else {
			this.shape = new Shape.CompositeShape(shape, this.shape);
		}
	}
	
	/**
	 * shapeを最背面に追加する。
	 * @param {xypic.Shape} shape 追加する図形
	 */
	appendShapeToBack(shape) {
		if (shape.isNone) {
		} else if (this.shape.isNone) {
			this.shape = shape;
		} else {
			this.shape = new Shape.CompositeShape(this.shape, shape);
		}
	}
}
