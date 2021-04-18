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

// for DEBUGGING
// import {} from "../../src/util/EnableSourceMap.js";

import {Configuration} from "../../mathjax/js/input/tex/Configuration.js";
import {CommandMap, EnvironmentMap} from "../../mathjax/js/input/tex/SymbolMap.js";
import BaseMethods from "../../mathjax/js/input/tex/base/BaseMethods.js";
import ParseMethods from "../../mathjax/js/input/tex/ParseMethods.js";
import TexParser from "../../mathjax/js/input/tex/TexParser.js";
import TexError from "../../mathjax/js/input/tex/TexError.js";

import {XypicConstants} from "../util/XypicConstants.js"
import {Parsers, StringReader} from "../fp/Parsers.js";
import {AST} from "../input/XyNodes.js"
import {XyParser} from "../input/XyParser.js"

import {xypicGlobalContext} from "./xypicGlobalContext.js";
import {ModifierRepository, DirRepository} from "../output/Repositories.js";

import {} from "../output/AugmentXyNodes.js";

function parseXypic(texParser, xyParser, mmlKind) {
	const textMmls = [];

	const createTextNode = function (text) {
		const textMml = new TexParser(text, texParser.stack.env, texParser.configuration).mml();
		textMml.xypicTextObjectId = xypicGlobalContext.textObjectIdCounter;
		xypicGlobalContext.textObjectIdCounter++;
		textMmls.push(textMml);
		return textMml;
	};

	const parseContext = {
		lastNoSuccess: undefined,
		whiteSpaceRegex: XypicConstants.whiteSpaceRegex,
		createTextNode: createTextNode
	};
	const input = new StringReader(texParser.string, texParser.i, parseContext);
	const result = Parsers.parse(xyParser, input);
	texParser.i = result.next.offset;

	if (result.successful) {
		const mml = texParser.create(mmlKind, result.get(), textMmls);
		// const mml = texParser.create("node", mmlKind, result.get(), textMmls);
		return mml;
	} else {
		const pos = parseContext.lastNoSuccess.next.pos();
		const content = pos.lineContents();
		const text = parseContext.lastNoSuccess.msg + '. Parse error at or near "' + content + '".';
		throw new TexError("SyntaxError", text);
	}
}


const XypicMethods = {};
XypicMethods.Macro = BaseMethods.Macro;

XypicMethods.xybox = function (parser, name, type) {
	const mml = parseXypic(parser, XyParser.xybox(), AST.xypic.prototype.kind);
	parser.Push(mml);
};

XypicMethods.xymatrixbox = function (parser, name, type) {
	const mml = parseXypic(parser, XyParser.xymatrixbox(), AST.xypic.prototype.kind);
	parser.Push(mml);
};

XypicMethods.newdir = function (parser, name, type) {
	const mml = parseXypic(parser, XyParser.newdir(), AST.xypic.newdir.prototype.kind);
	parser.Push(mml);
};

XypicMethods.xyincludegraphics = function (parser, name, type) {
	const mml = parseXypic(parser, XyParser.includegraphics(), AST.xypic.includegraphics.prototype.kind);
	parser.Push(mml);
};

XypicMethods.xyEnvironment = function(parser, begin) {
	const mml = parseXypic(parser, XyParser.xy(), AST.xypic.prototype.kind);
	parser.Push(begin);
	return mml;
};


const XypicCommandMap = new CommandMap("xypic-command", {
	hole: ["Macro", "{\\style{visibility:hidden}{x}}"],
	objectstyle: ["Macro", "\\textstyle"],
	labelstyle: ["Macro", "\\scriptstyle"],
	twocellstyle: ["Macro", "\\scriptstyle"],
	xybox: ["xybox", "xybox"],
	xymatrix: ["xymatrixbox", "xymatrix"],
	newdir: ["newdir", "newdir"],
	includegraphics: ["xyincludegraphics", "includegraphics"]
}, XypicMethods);

const XypicEnvironmentMap = new EnvironmentMap("xypic-environment", ParseMethods.environment, {
	xy: ["xyEnvironment", null, false]
}, XypicMethods);

function initializeXypicGlobalContext() {
	xypicGlobalContext.repositories.modifierRepository = new ModifierRepository();
	xypicGlobalContext.repositories.dirRepository = new DirRepository();
	xypicGlobalContext.textObjectIdCounter = 0;
	xypicGlobalContext.wrapperOfTextObjectMap = {};
}

const XypicConfiguration = Configuration.create(
	"xypic", {
		handler: {
			macro: ["xypic-command"],
			environment: ["xypic-environment"]
		},
		preprocessors: [
			({math, document, data}) => {
				initializeXypicGlobalContext();
			}
		],
		nodes: {
			"xypic": function(nodeFactory, command, textMmls) {
				const mmlFactory = nodeFactory.mmlFactory;
				return new AST.xypic(mmlFactory, command, textMmls);
			},
			"xypic-newdir": function(nodeFactory, command, textMmls) {
				const mmlFactory = nodeFactory.mmlFactory;
				return new AST.xypic.newdir(mmlFactory, command, textMmls);
			},
			"xypic-includegraphics": function(nodeFactory, command, textMmls) {
				const mmlFactory = nodeFactory.mmlFactory;
				return new AST.xypic.includegraphics(mmlFactory, command, textMmls);
			}
		}
	}
);


