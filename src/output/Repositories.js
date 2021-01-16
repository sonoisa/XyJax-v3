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


import {AST} from "../input/XyNodes.js";


export class DirRepository {
	constructor() {
		this.userDirMap = {};
	}

	get(dirMain) {
		return this.userDirMap[dirMain];
	}

	put(dirMain, compositeObject) {
		this.userDirMap[dirMain] = compositeObject;
	}
}


export class ModifierRepository {
	constructor() {
		this.userModifierMap = {};
	}

	get(shapeName) {
		var modifier = ModifierRepository.embeddedModifierMap[shapeName];
		if (modifier !== undefined) {
			return modifier;
		}
		return this.userModifierMap[shapeName];
	}

	put(shapeName, modifier) {
		if (ModifierRepository.embeddedModifierMap[shapeName] === undefined) {
			this.userModifierMap[shapeName] = modifier;
		}
	}
}

ModifierRepository.embeddedModifierMap = {
	"o": new AST.Modifier.Shape.Circle(),
	"l": new AST.Modifier.Shape.L(),
	"r": new AST.Modifier.Shape.R(),
	"u": new AST.Modifier.Shape.U(),
	"d": new AST.Modifier.Shape.D(),
	"c": new AST.Modifier.Shape.C(),
	"aliceblue": new AST.Modifier.Shape.ChangeColor("aliceblue"),
	"antiquewhite": new AST.Modifier.Shape.ChangeColor("antiquewhite"),
	"aqua": new AST.Modifier.Shape.ChangeColor("aqua"),
	"aquamarine": new AST.Modifier.Shape.ChangeColor("aquamarine"),
	"azure": new AST.Modifier.Shape.ChangeColor("azure"),
	"beige": new AST.Modifier.Shape.ChangeColor("beige"),
	"bisque": new AST.Modifier.Shape.ChangeColor("bisque"),
	"black": new AST.Modifier.Shape.ChangeColor("black"),
	"blanchedalmond": new AST.Modifier.Shape.ChangeColor("blanchedalmond"),
	"blue": new AST.Modifier.Shape.ChangeColor("blue"),
	"blueviolet": new AST.Modifier.Shape.ChangeColor("blueviolet"),
	"brown": new AST.Modifier.Shape.ChangeColor("brown"),
	"burlywood": new AST.Modifier.Shape.ChangeColor("burlywood"),
	"cadetblue": new AST.Modifier.Shape.ChangeColor("cadetblue"),
	"chartreuse": new AST.Modifier.Shape.ChangeColor("chartreuse"),
	"chocolate": new AST.Modifier.Shape.ChangeColor("chocolate"),
	"coral": new AST.Modifier.Shape.ChangeColor("coral"),
	"cornflowerblue": new AST.Modifier.Shape.ChangeColor("cornflowerblue"),
	"cornsilk": new AST.Modifier.Shape.ChangeColor("cornsilk"),
	"crimson": new AST.Modifier.Shape.ChangeColor("crimson"),
	"cyan": new AST.Modifier.Shape.ChangeColor("cyan"),
	"darkblue": new AST.Modifier.Shape.ChangeColor("darkblue"),
	"darkcyan": new AST.Modifier.Shape.ChangeColor("darkcyan"),
	"darkgoldenrod": new AST.Modifier.Shape.ChangeColor("darkgoldenrod"),
	"darkgray": new AST.Modifier.Shape.ChangeColor("darkgray"),
	"darkgreen": new AST.Modifier.Shape.ChangeColor("darkgreen"),
	"darkgrey": new AST.Modifier.Shape.ChangeColor("darkgrey"),
	"darkkhaki": new AST.Modifier.Shape.ChangeColor("darkkhaki"),
	"darkmagenta": new AST.Modifier.Shape.ChangeColor("darkmagenta"),
	"darkolivegreen": new AST.Modifier.Shape.ChangeColor("darkolivegreen"),
	"darkorange": new AST.Modifier.Shape.ChangeColor("darkorange"),
	"darkorchid": new AST.Modifier.Shape.ChangeColor("darkorchid"),
	"darkred": new AST.Modifier.Shape.ChangeColor("darkred"),
	"darksalmon": new AST.Modifier.Shape.ChangeColor("darksalmon"),
	"darkseagreen": new AST.Modifier.Shape.ChangeColor("darkseagreen"),
	"darkslateblue": new AST.Modifier.Shape.ChangeColor("darkslateblue"),
	"darkslategray": new AST.Modifier.Shape.ChangeColor("darkslategray"),
	"darkslategrey": new AST.Modifier.Shape.ChangeColor("darkslategrey"),
	"darkturquoise": new AST.Modifier.Shape.ChangeColor("darkturquoise"),
	"darkviolet": new AST.Modifier.Shape.ChangeColor("darkviolet"),
	"deeppink": new AST.Modifier.Shape.ChangeColor("deeppink"),
	"deepskyblue": new AST.Modifier.Shape.ChangeColor("deepskyblue"),
	"dimgray": new AST.Modifier.Shape.ChangeColor("dimgray"),
	"dimgrey": new AST.Modifier.Shape.ChangeColor("dimgrey"),
	"dodgerblue": new AST.Modifier.Shape.ChangeColor("dodgerblue"),
	"firebrick": new AST.Modifier.Shape.ChangeColor("firebrick"),
	"floralwhite": new AST.Modifier.Shape.ChangeColor("floralwhite"),
	"forestgreen": new AST.Modifier.Shape.ChangeColor("forestgreen"),
	"fuchsia": new AST.Modifier.Shape.ChangeColor("fuchsia"),
	"gainsboro": new AST.Modifier.Shape.ChangeColor("gainsboro"),
	"ghostwhite": new AST.Modifier.Shape.ChangeColor("ghostwhite"),
	"gold": new AST.Modifier.Shape.ChangeColor("gold"),
	"goldenrod": new AST.Modifier.Shape.ChangeColor("goldenrod"),
	"gray": new AST.Modifier.Shape.ChangeColor("gray"),
	"grey": new AST.Modifier.Shape.ChangeColor("grey"),
	"green": new AST.Modifier.Shape.ChangeColor("green"),
	"greenyellow": new AST.Modifier.Shape.ChangeColor("greenyellow"),
	"honeydew": new AST.Modifier.Shape.ChangeColor("honeydew"),
	"hotpink": new AST.Modifier.Shape.ChangeColor("hotpink"),
	"indianred": new AST.Modifier.Shape.ChangeColor("indianred"),
	"indigo": new AST.Modifier.Shape.ChangeColor("indigo"),
	"ivory": new AST.Modifier.Shape.ChangeColor("ivory"),
	"khaki": new AST.Modifier.Shape.ChangeColor("khaki"),
	"lavender": new AST.Modifier.Shape.ChangeColor("lavender"),
	"lavenderblush": new AST.Modifier.Shape.ChangeColor("lavenderblush"),
	"lawngreen": new AST.Modifier.Shape.ChangeColor("lawngreen"),
	"lemonchiffon": new AST.Modifier.Shape.ChangeColor("lemonchiffon"),
	"lightblue": new AST.Modifier.Shape.ChangeColor("lightblue"),
	"lightcoral": new AST.Modifier.Shape.ChangeColor("lightcoral"),
	"lightcyan": new AST.Modifier.Shape.ChangeColor("lightcyan"),
	"lightgoldenrodyellow": new AST.Modifier.Shape.ChangeColor("lightgoldenrodyellow"),
	"lightgray": new AST.Modifier.Shape.ChangeColor("lightgray"),
	"lightgreen": new AST.Modifier.Shape.ChangeColor("lightgreen"),
	"lightgrey": new AST.Modifier.Shape.ChangeColor("lightgrey"),
	"lightpink": new AST.Modifier.Shape.ChangeColor("lightpink"),
	"lightsalmon": new AST.Modifier.Shape.ChangeColor("lightsalmon"),
	"lightseagreen": new AST.Modifier.Shape.ChangeColor("lightseagreen"),
	"lightskyblue": new AST.Modifier.Shape.ChangeColor("lightskyblue"),
	"lightslategray": new AST.Modifier.Shape.ChangeColor("lightslategray"),
	"lightslategrey": new AST.Modifier.Shape.ChangeColor("lightslategrey"),
	"lightsteelblue": new AST.Modifier.Shape.ChangeColor("lightsteelblue"),
	"lightyellow": new AST.Modifier.Shape.ChangeColor("lightyellow"),
	"lime": new AST.Modifier.Shape.ChangeColor("lime"),
	"limegreen": new AST.Modifier.Shape.ChangeColor("limegreen"),
	"linen": new AST.Modifier.Shape.ChangeColor("linen"),
	"magenta": new AST.Modifier.Shape.ChangeColor("magenta"),
	"maroon": new AST.Modifier.Shape.ChangeColor("maroon"),
	"mediumaquamarine": new AST.Modifier.Shape.ChangeColor("mediumaquamarine"),
	"mediumblue": new AST.Modifier.Shape.ChangeColor("mediumblue"),
	"mediumorchid": new AST.Modifier.Shape.ChangeColor("mediumorchid"),
	"mediumpurple": new AST.Modifier.Shape.ChangeColor("mediumpurple"),
	"mediumseagreen": new AST.Modifier.Shape.ChangeColor("mediumseagreen"),
	"mediumslateblue": new AST.Modifier.Shape.ChangeColor("mediumslateblue"),
	"mediumspringgreen": new AST.Modifier.Shape.ChangeColor("mediumspringgreen"),
	"mediumturquoise": new AST.Modifier.Shape.ChangeColor("mediumturquoise"),
	"mediumvioletred": new AST.Modifier.Shape.ChangeColor("mediumvioletred"),
	"midnightblue": new AST.Modifier.Shape.ChangeColor("midnightblue"),
	"mintcream": new AST.Modifier.Shape.ChangeColor("mintcream"),
	"mistyrose": new AST.Modifier.Shape.ChangeColor("mistyrose"),
	"moccasin": new AST.Modifier.Shape.ChangeColor("moccasin"),
	"navajowhite": new AST.Modifier.Shape.ChangeColor("navajowhite"),
	"navy": new AST.Modifier.Shape.ChangeColor("navy"),
	"oldlace": new AST.Modifier.Shape.ChangeColor("oldlace"),
	"olive": new AST.Modifier.Shape.ChangeColor("olive"),
	"olivedrab": new AST.Modifier.Shape.ChangeColor("olivedrab"),
	"orange": new AST.Modifier.Shape.ChangeColor("orange"),
	"orangered": new AST.Modifier.Shape.ChangeColor("orangered"),
	"orchid": new AST.Modifier.Shape.ChangeColor("orchid"),
	"palegoldenrod": new AST.Modifier.Shape.ChangeColor("palegoldenrod"),
	"palegreen": new AST.Modifier.Shape.ChangeColor("palegreen"),
	"paleturquoise": new AST.Modifier.Shape.ChangeColor("paleturquoise"),
	"palevioletred": new AST.Modifier.Shape.ChangeColor("palevioletred"),
	"papayawhip": new AST.Modifier.Shape.ChangeColor("papayawhip"),
	"peachpuff": new AST.Modifier.Shape.ChangeColor("peachpuff"),
	"peru": new AST.Modifier.Shape.ChangeColor("peru"),
	"pink": new AST.Modifier.Shape.ChangeColor("pink"),
	"plum": new AST.Modifier.Shape.ChangeColor("plum"),
	"powderblue": new AST.Modifier.Shape.ChangeColor("powderblue"),
	"purple": new AST.Modifier.Shape.ChangeColor("purple"),
	"red": new AST.Modifier.Shape.ChangeColor("red"),
	"rosybrown": new AST.Modifier.Shape.ChangeColor("rosybrown"),
	"royalblue": new AST.Modifier.Shape.ChangeColor("royalblue"),
	"saddlebrown": new AST.Modifier.Shape.ChangeColor("saddlebrown"),
	"salmon": new AST.Modifier.Shape.ChangeColor("salmon"),
	"sandybrown": new AST.Modifier.Shape.ChangeColor("sandybrown"),
	"seagreen": new AST.Modifier.Shape.ChangeColor("seagreen"),
	"seashell": new AST.Modifier.Shape.ChangeColor("seashell"),
	"sienna": new AST.Modifier.Shape.ChangeColor("sienna"),
	"silver": new AST.Modifier.Shape.ChangeColor("silver"),
	"skyblue": new AST.Modifier.Shape.ChangeColor("skyblue"),
	"slateblue": new AST.Modifier.Shape.ChangeColor("slateblue"),
	"slategray": new AST.Modifier.Shape.ChangeColor("slategray"),
	"slategrey": new AST.Modifier.Shape.ChangeColor("slategrey"),
	"snow": new AST.Modifier.Shape.ChangeColor("snow"),
	"springgreen": new AST.Modifier.Shape.ChangeColor("springgreen"),
	"steelblue": new AST.Modifier.Shape.ChangeColor("steelblue"),
	"tan": new AST.Modifier.Shape.ChangeColor("tan"),
	"teal": new AST.Modifier.Shape.ChangeColor("teal"),
	"thistle": new AST.Modifier.Shape.ChangeColor("thistle"),
	"tomato": new AST.Modifier.Shape.ChangeColor("tomato"),
	"turquoise": new AST.Modifier.Shape.ChangeColor("turquoise"),
	"violet": new AST.Modifier.Shape.ChangeColor("violet"),
	"wheat": new AST.Modifier.Shape.ChangeColor("wheat"),
	"white": new AST.Modifier.Shape.ChangeColor("white"),
	"whitesmoke": new AST.Modifier.Shape.ChangeColor("whitesmoke"),
	"yellow": new AST.Modifier.Shape.ChangeColor("yellow"),
	"yellowgreen": new AST.Modifier.Shape.ChangeColor("yellowgreen")
};
