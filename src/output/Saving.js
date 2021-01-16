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


export class Saving {};

Saving.Position = class Saving_Position {
	constructor(pos) {
		this.pos = pos;
	}

	position(context) {
		return this.pos;
	}

	toString() {
		return this.pos.toString();
	}
}


Saving.Macro = class Saving_Macro {
	constructor(macro) {
		this.macro = macro;
	}

	position(context) {
		env.c = this.macro.position(context);
		return env.c;
	}

	toString() {
		return this.macro.toString();
	}
}


Saving.Base = class Saving_Base {
	constructor(origin, xBase, yBase) {
		this.origin = origin;
		this.xBase = xBase;
		this.yBase = yBase;
	}

	position(context) {
		var env = context.env;
		env.origin = this.origin;
		env.xBase = this.xBase;
		env.yBase = this.yBase;
		return env.c;
	}

	toString() {
		return "origin:" + this.origin + ", xBase:" + this.xBase + ", yBase:" + this.yBase;
	}
}


Saving.Stack = class Saving_Stack {
	constructor(stack) {
		this.stack = stack;
	}

	position(context) {
		var env = context.env;
		if (!this.stack.isEmpty) {
			this.stack.tail.reverse().foreach(function (p) {
				env.capturePosition(p);
			});
			env.c = this.stack.head;
		}
		return env.c;
	}

	toString() {
		return this.stack.toString();
	}
}
