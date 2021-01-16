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


import {XypicConstants} from "../util/XypicConstants.js";
import {XypicUtil} from "../util/XypicUtil.js";


export class Frame {
	constructor() {}

	toRect(def) {
		return new Frame.Rect(this.x, this.y, def);
	}

	toPoint() {
		return new Frame.Point(this.x, this.y);
	}

	combineRect(that) {
		return Frame.combineRect(this, that);
	}

	static combineRect(frame1, frame2) {
		if (frame1 === undefined) {
			return frame2;
		} else if (frame2 === undefined) {
			return frame1;
		} else {
			var l = -(Math.min(frame1.x-frame1.l, frame2.x-frame2.l) - frame1.x);
			var r = Math.max(frame1.x+frame1.r, frame2.x+frame2.r) - frame1.x;
			var d = -(Math.min(frame1.y-frame1.d, frame2.y-frame2.d) - frame1.y);
			var u = Math.max(frame1.y+frame1.u, frame2.y+frame2.u) - frame1.y;
			return frame1.toRect({l:l, r:r, d:d, u:u});
		}
	}
}


Frame.Point = class Frame_Point extends Frame {
	constructor(x, y) {
		super();
		this.x = x;
		this.y = y;
	}

	get l() {
		return 0;
	}

	get r() {
		return 0;
	}

	get u() {
		return 0;
	}

	get d() {
		return 0;
	}

	isPoint() {
		return true;
	}

	isRect() {
		return false;
	}

	isCircle() {
		return false;
	}

	edgePoint(x, y) {
		return this;
	}

	proportionalEdgePoint(x, y) {
		return this;
	}

	grow(xMargin, yMargin) {
		var xm = Math.max(0, xMargin);
		var ym = Math.max(0, yMargin);
		return this.toRect({l:xm, r:xm, u:ym, d:ym});
	}

	toSize(width, height) {
		return this.toRect({ l:width / 2, r:width / 2, u:height / 2, d:height / 2 });
	}

	growTo(width, height) {
		var w = Math.max(0, width);
		var h = Math.max(0, height);
		return this.toRect({ l:w / 2, r:w / 2, u:h / 2, d:h / 2 });
	}

	shrinkTo(width, height) {
		return this;
	}

	move(x, y) {
		return new Frame.Point(x, y);
	}

	shiftFrame(dx, dy) {
		return this;
	}

	rotate(angle) {
		return this;
	}

	contains(point) {
		return false;
	}

	toString() {
		return "{x:"+this.x+", y:"+this.y+"}";
	}
}


Frame.Rect = class Frame_Rect extends Frame {
	constructor(x, y, def) {
		super();
		this.x = x;
		this.y = y;
		this.l = (def.l || 0);
		this.r = (def.r || 0);
		this.u = (def.u || 0);
		this.d = (def.d || 0);
	}

	isPoint() {
		return this.l === 0 && this.r === 0 && this.u === 0 && this.d === 0;
	}

	isRect() {
		return !this.isPoint();
	}

	isCircle() {
		return false;
	}

	edgePoint(x, y) {
		if (this.isPoint()) {
			return this;
		}
		var dx = x - this.x;
		var dy = y - this.y;
		if (dx > 0) {
			var ey = dy * this.r / dx;
			if (ey > this.u) {
				return new Frame.Point(this.x + this.u * dx / dy, this.y + this.u);
			} else if (ey < -this.d) {
				return new Frame.Point(this.x - this.d * dx / dy, this.y - this.d);
			}
			return new Frame.Point(this.x + this.r, this.y + ey);
		} else if (dx < 0) {
			var ey = -dy * this.l / dx;
			if (ey > this.u) {
				return new Frame.Point(this.x + this.u * dx / dy, this.y + this.u);
			} else if (ey < -this.d) {
				return new Frame.Point(this.x - this.d * dx / dy, this.y - this.d);
			}
			return new Frame.Point(this.x - this.l, this.y + ey);
		} else {
			if (dy > 0) {
				return new Frame.Point(this.x, this.y + this.u);
			}
			return new Frame.Point(this.x, this.y - this.d);
		}
	}

	proportionalEdgePoint(x, y) {
		if (this.isPoint()) {
			return this;
		}
		var dx = x - this.x;
		var dy = y - this.y;
		if (Math.abs(dx) < XypicConstants.machinePrecision && Math.abs(dy) < XypicConstants.machinePrecision) {
			return new Frame.Point(this.x - this.l, this.y + this.u);
		}
		var w = this.l + this.r, h = this.u + this.d;
		var pi = Math.PI;
		var angle = Math.atan2(dy, dx);
		var f;
		if (-3*pi/4 < angle && angle <= -pi/4) {
			// d
			f = (angle + 3*pi/4)/(pi/2);
			return new Frame.Point(this.x + this.r - f * w, this.y + this.u);
		} else if (-pi/4 < angle && angle <= pi/4) {
			// r
			f = (angle + pi/4)/(pi/2);
			return new Frame.Point(this.x - this.l, this.y + this.u - f * h);
		} else if (pi/4 < angle && angle <= 3*pi/4) {
			// u
			f = (angle - pi/4)/(pi/2);
			return new Frame.Point(this.x - this.l + f * w, this.y - this.d);
		} else {
			// l
			f = (angle - (angle > 0? 3*pi/4 : -5*pi/4))/(pi/2);
			return new Frame.Point(this.x + this.r, this.y - this.d + f * h);
		}
	}

	grow(xMargin, yMargin) {
		return this.toRect({
			l:Math.max(0, this.l + xMargin),
			r:Math.max(0, this.r + xMargin),
			u:Math.max(0, this.u + yMargin),
			d:Math.max(0, this.d + yMargin)
		});
	}

	toSize(width, height) {
		var u, d, r, l;
		var ow = this.l + this.r;
		var oh = this.u + this.d;
		if (ow === 0) {
			l = width / 2;
			r = width / 2;
		} else {
			l = width * this.l / ow;
			r = width * this.r / ow;
		}
		if (oh === 0) {
			u = height / 2;
			d = height / 2;
		} else {
			u = height * this.u / oh;
			d = height * this.d / oh;
		}
		return this.toRect({ l:l, r:r, u:u, d:d });
	}

	growTo(width, height) {
		var u = this.u;
		var d = this.d;
		var r = this.r;
		var l = this.l;
		var ow = l + r;
		var oh = u + d;
		if (width > ow) {
			if (ow === 0) {
				l = width / 2;
				r = width / 2;
			} else {
				l = width * this.l / ow;
				r = width * this.r / ow;
			}
		}
		if (height > oh) {
			if (oh === 0) {
				u = height / 2;
				d = height / 2;
			} else {
				u = height * this.u / oh;
				d = height * this.d / oh;
			}
		}
		return this.toRect({ l:l, r:r, u:u, d:d });
	}

	shrinkTo(width, height) {
		var u = this.u;
		var d = this.d;
		var r = this.r;
		var l = this.l;
		var ow = l + r;
		var oh = u + d;
		if (width < ow) {
			if (ow === 0) {
				l = width / 2;
				r = width / 2;
			} else {
				l = width * this.l / ow;
				r = width * this.r / ow;
			}
		}
		if (height < oh) {
			if (oh === 0) {
				u = height / 2;
				d = height / 2;
			} else {
				u = height * this.u / oh;
				d = height * this.d / oh;
			}
		}
		
		return this.toRect({ l:l, r:r, u:u, d:d });
	}

	move(x, y) {
		return new Frame.Rect(x, y, { l:this.l, r:this.r, u:this.u, d:this.d });
	}

	shiftFrame(dx, dy) {
		return new Frame.Rect(this.x, this.y, {
			l:Math.max(0, this.l - dx),
			r:Math.max(0, this.r + dx),
			u:Math.max(0, this.u + dy),
			d:Math.max(0, this.d - dy)
		});
	}

	rotate(angle) {
		var c = Math.cos(angle), s = Math.sin(angle);
		var lx = -this.l, rx = this.r, uy = this.u, dy = -this.d;
		var lu = {x:lx*c-uy*s, y:lx*s+uy*c};
		var ld = {x:lx*c-dy*s, y:lx*s+dy*c};
		var ru = {x:rx*c-uy*s, y:rx*s+uy*c};
		var rd = {x:rx*c-dy*s, y:rx*s+dy*c};
		return this.toRect({
			l:-Math.min(lu.x, ld.x, ru.x, rd.x),
			r:Math.max(lu.x, ld.x, ru.x, rd.x),
			u:Math.max(lu.y, ld.y, ru.y, rd.y),
			d:-Math.min(lu.y, ld.y, ru.y, rd.y)
		});
	}

	contains(point) {
		var x = point.x;
		var y = point.y;
		return (x >= this.x - this.l) && (x <= this.x + this.r) && (y >= this.y - this.d) && (y <= this.y + this.u);
	}

	toString() {
		return "{x:"+this.x+", y:"+this.y+", l:"+this.l+", r:"+this.r+", u:"+this.u+", d:"+this.d+"}";
	}
}


Frame.Ellipse = class Frame_Ellipse extends Frame {
	constructor(x, y, l, r, u, d) {
		super();
		this.x = x;
		this.y = y;
		this.l = l;
		this.r = r;
		this.u = u;
		this.d = d;
	}

	isPoint() {
		return this.r === 0 && this.l ===0 || this.u === 0 && this.d ===0;
	}

	isRect() {
		return false;
	}

	isCircle() {
		return !this.isPoint();
	}

	isPerfectCircle() {
		return this.l === this.r && this.l === this.u && this.l === this.d;
	}

	edgePoint(x, y) {
		if (this.isPoint()) {
			return this;
		}
		if (this.isPerfectCircle()) {
			var dx = x - this.x;
			var dy = y - this.y;
			var angle;
			if (Math.abs(dx) < XypicConstants.machinePrecision && Math.abs(dy) < XypicConstants.machinePrecision) {
				angle = -Math.PI/2;
			} else {
				angle = Math.atan2(dy, dx);
			}
			return new Frame.Point(this.x + this.r * Math.cos(angle), this.y + this.r * Math.sin(angle));
		} else {
			// ellipse
			var pi = Math.PI;
			var l = this.l;
			var r = this.r;
			var u = this.u;
			var d = this.d;
			var x0 = this.x;
			var y0 = this.y;
			var cx = x0 + (r - l) / 2;
			var cy = y0 + (u - d) / 2;
			var rx = (l + r) / 2;
			var ry = (u + d) / 2;
			
			var dx = x - x0;
			var dy = y - y0;
			var a0 = dy;
			var b0 = -dx;
			var c0 = dx * y0 - dy * x0;
			var a = a0 * rx;
			var b = b0 * ry;
			var c = c0 * rx + (rx - ry) * b0 * cy;
			var aabb = a * a + b * b;
			var d = a * cx + b * cy + c;
			var e = -d / aabb;
			var ff = aabb * rx * rx - d * d;
			if (ff < 0) {
				return new Frame.Point(this.x, this.y - this.d);
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
			
			var sign = XypicUtil.sign;
			
			if (sign(xp0 - cx) === sign(x - cx) && sign(yp0 - cy) === sign(y - cy)) {
				return new Frame.Point(xp0, yp0);
			} else {
				return new Frame.Point(xm0, ym0);
			}
		}
	}

	proportionalEdgePoint(x, y) {
		if (this.isPoint()) {
			return this;
		}
		if (this.isPerfectCircle()) {
			var dx = x - this.x;
			var dy = y - this.y;
			var angle;
			if (Math.abs(dx) < XypicConstants.machinePrecision && Math.abs(dy) < XypicConstants.machinePrecision) {
				angle = -Math.PI/2;
			} else {
				angle = Math.atan2(dy, dx);
			}
			return new Frame.Point(this.x - this.r * Math.cos(angle), this.y - this.r * Math.sin(angle));
		} else {
			// ellipse
			var pi = Math.PI;
			var l = this.l;
			var r = this.r;
			var u = this.u;
			var d = this.d;
			var x0 = this.x;
			var y0 = this.y;
			var cx = x0 + (r - l) / 2;
			var cy = y0 + (u - d) / 2;
			var rx = (l + r) / 2;
			var ry = (u + d) / 2;
			
			var dx = x - x0;
			var dy = y - y0;
			var a0 = dy;
			var b0 = -dx;
			var c0 = dx * y0 - dy * x0;
			var a = a0 * rx;
			var b = b0 * ry;
			var c = c0 * rx + (rx - ry) * b0 * cy;
			var aabb = a * a + b * b;
			var d = a * cx + b * cy + c;
			var e = -d / aabb;
			var ff = aabb * rx * rx - d * d;
			if (ff < 0) {
				return new Frame.Point(this.x, this.y - this.d);
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
			
			var dxp = xp0 - x;
			var dyp = yp0 - y;
			var dxm = xm0 - x;
			var dym = ym0 - y;
			
			if (sign(xp0 - cx) === sign(x - cx) && sign(yp0 - cy) === sign(y - cy)) {
				return new Frame.Point(xm0, ym0);
			} else {
				return new Frame.Point(xp0, yp0);
			}
		}
	}

	grow(xMargin, yMargin) {
		return new Frame.Ellipse(
			this.x, this.y, 
			Math.max(0, this.l + xMargin), 
			Math.max(0, this.r + xMargin), 
			Math.max(0, this.u + yMargin), 
			Math.max(0, this.d + yMargin));
	}

	toSize(width, height) {
		var u, d, r, l;
		var ow = this.l + this.r;
		var oh = this.u + this.d;
		if (ow === 0) {
			l = width / 2;
			r = width / 2;
		} else {
			l = width * this.l / ow;
			r = width * this.r / ow;
		}
		if (oh === 0) {
			u = height / 2;
			d = height / 2;
		} else {
			u = height * this.u / oh;
			d = height * this.d / oh;
		}
		
		return new Frame.Ellipse(this.x, this.y, l, r, u, d);
	}

	growTo(width, height) {
		var u = this.u;
		var d = this.d;
		var r = this.r;
		var l = this.l;
		var ow = l + r;
		var oh = u + d;
		if (width > ow) {
			if (ow === 0) {
				l = width / 2;
				r = width / 2;
			} else {
				l = width * this.l / ow;
				r = width * this.r / ow;
			}
		}
		if (height > oh) {
			if (oh === 0) {
				u = height / 2;
				d = height / 2;
			} else {
				u = height * this.u / oh;
				d = height * this.d / oh;
			}
		}
		
		return new Frame.Ellipse(this.x, this.y, l, r, u, d);
	}

	shrinkTo(width, height) {
		var u = this.u;
		var d = this.d;
		var r = this.r;
		var l = this.l;
		var ow = l + r;
		var oh = u + d;
		if (width < ow) {
			if (ow === 0) {
				l = width / 2;
				r = width / 2;
			} else {
				l = width * this.l / ow;
				r = width * this.r / ow;
			}
		}
		if (height < oh) {
			if (oh === 0) {
				u = height / 2;
				d = height / 2;
			} else {
				u = height * this.u / oh;
				d = height * this.d / oh;
			}
		}
		
		return new Frame.Ellipse(this.x, this.y, l, r, u, d);
	}

	move(x, y) {
		return new Frame.Ellipse(x, y, this.l, this.r, this.u, this.d);
	}

	shiftFrame(dx, dy) {
		return new Frame.Ellipse(this.x, this.y, 
			Math.max(0, this.l - dx),
			Math.max(0, this.r + dx),
			Math.max(0, this.u + dy),
			Math.max(0, this.d - dy)
		);
	}

	rotate(angle) {
		return this;
	}

	contains(point) {
		var x = point.x;
		var y = point.y;
		if (this.isPoint()) {
			return false;
		}
		var l = this.l;
		var r = this.r;
		var u = this.u;
		var d = this.d;
		var x0 = this.x;
		var y0 = this.y;
		var cx = x0 + (r - l) / 2;
		var cy = y0 + (u - d) / 2;
		var rx = (l + r) / 2;
		var ry = (u + d) / 2;
		
		var eps = ry / rx;
		var dx = x - cx;
		var dy = (y - cy) / eps;
		
		return dx * dx + dy * dy <= rx * rx;
	}

	toString() {
		return "{x:" + this.x + ", y:" + this.y + ", l:" + this.l + ", r:" + this.r + ", u:" + this.u + ", d:" + this.d + "}";
	}
}
