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
// import {} from "./util/EnableSourceMap.js";

import {MathJax, combineWithMathJax, combineConfig} from "../mathjax/js/components/global.js";
import {STATE} from "../mathjax/js/core/MathItem.js";
import {Configuration} from "../mathjax/js/input/tex/Configuration.js";
import {CommandMap, EnvironmentMap} from "../mathjax/js/input/tex/SymbolMap.js";
import BaseMethods from "../mathjax/js/input/tex/base/BaseMethods.js";
import ParseMethods from "../mathjax/js/input/tex/ParseMethods.js";
import TexParser from "../mathjax/js/input/tex/TexParser.js";
import TexError from "../mathjax/js/input/tex/TexError.js";

import {XypicConstants} from "./util/XypicConstants.js"
import {Parsers, StringReader} from "./fp/Parsers.js";
import {AST} from "./input/XyNodes.js"
import {XyParser} from "./input/XyParser.js"
import {CHTMLxypic, CHTMLnewdir, CHTMLincludegraphics} from "./output/CHTMLWrappers.js";
import {ModifierRepository, DirRepository} from "./output/Repositories.js";


function parseXypic(texParser, xyParser, mmlKind) {
	const textMmls = [];

	const createTextNode = function (text) {
		const textMml = new TexParser(text, texParser.stack.env, texParser.configuration).mml();
		textMml.xypicTextObjectId = MathJax.xypic.textObjectIdCounter;
		MathJax.xypic.textObjectIdCounter++;
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
	const mml = parseXypic(parser, XyParser.xybox(), CHTMLxypic.kind);
	parser.Push(mml);
};

XypicMethods.xymatrixbox = function (parser, name, type) {
	const mml = parseXypic(parser, XyParser.xymatrixbox(), CHTMLxypic.kind);
	parser.Push(mml);
};

XypicMethods.newdir = function (parser, name, type) {
	const mml = parseXypic(parser, XyParser.newdir(), CHTMLnewdir.kind);
	parser.Push(mml);
};

XypicMethods.xyincludegraphics = function (parser, name, type) {
	const mml = parseXypic(parser, XyParser.includegraphics(), CHTMLincludegraphics.kind);
	parser.Push(mml);
};

XypicMethods.xyEnvironment = function(parser, begin) {
	const mml = parseXypic(parser, XyParser.xy(), CHTMLxypic.kind);
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


function registerNodeClassOnlyOnce(kind, mmlClass, wrapperClass, mmlFactory) {
	if (mmlFactory.getNodeClass(kind) === undefined) {
		mmlFactory.setNodeClass(kind, mmlClass);
	}

	const wrapperFactory = MathJax.startup.output.factory;
	if (wrapperFactory.getNodeClass(kind) === undefined) {
		switch (MathJax.startup.output.name) {
			case "CHTML":
				wrapperFactory.setNodeClass(kind, wrapperClass);
				break;
		}
	}
}

const XypicConfiguration = Configuration.create(
	"xypic", {
		handler: {
			macro: ["xypic-command"],
			environment: ["xypic-environment"]
		},
		nodes: {
			"xypic": function(nodeFactory, command, textMmls) {
				const mmlFactory = nodeFactory.mmlFactory;

				// TODO register this in the right place
				registerNodeClassOnlyOnce(CHTMLxypic.kind, AST.xypic, CHTMLxypic, mmlFactory);

				return new AST.xypic(mmlFactory, command, textMmls);
			},
			"xypic-newdir": function(nodeFactory, command, textMmls) {
				const mmlFactory = nodeFactory.mmlFactory;

				// TODO register this in the right place
				registerNodeClassOnlyOnce(CHTMLnewdir.kind, AST.xypic.newdir, CHTMLnewdir, mmlFactory);

				return new AST.xypic.newdir(mmlFactory, command, textMmls);
			},
			"xypic-includegraphics": function(nodeFactory, command, textMmls) {
				const mmlFactory = nodeFactory.mmlFactory;

				// TODO register this in the right place
				registerNodeClassOnlyOnce(CHTMLincludegraphics.kind, AST.xypic.includegraphics, CHTMLincludegraphics, mmlFactory);

				return new AST.xypic.includegraphics(mmlFactory, command, textMmls);
			}
		}
	}
);


if (typeof MathJax.xypic === "undefined") {
	combineWithMathJax({
		xypic: {
			repositories: {
				modifierRepository: new ModifierRepository(),
				dirRepository: new DirRepository()
			},
			textObjectIdCounter: 0,
			wrapperOfTextObjectMap: {}
		}
	});

	function initializeXypicGlobalContext() {
		MathJax.xypic.repositories.modifierRepository = new ModifierRepository();
		MathJax.xypic.repositories.dirRepository = new DirRepository();
		MathJax.xypic.textObjectIdCounter = 0;
		MathJax.xypic.wrapperOfTextObjectMap = {};
	}

	combineConfig(MathJax.config, {
		options: {
			renderActions: {
				initialize_xypic_context: [STATE.FINDMATH - 1, function (doc) {
					initializeXypicGlobalContext();
				}, function (math, doc) {
					initializeXypicGlobalContext();
				}, true]
			}
		}
	});
}
