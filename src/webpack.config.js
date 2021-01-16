const PACKAGE = require("../mathjax/components/webpack.common.js");


module.exports = PACKAGE(
	"xypic",								// the name of the package to build
	"../mathjax/js",						// location of the mathjax library
	[										// packages to link to
		"components/src/core/lib",
		"components/src/input/tex-base/lib",
		"components/src/output/chtml/lib",
		"components/src/output/svg/lib",
	],
	__dirname,								// our directory
	"../build/"								// where to put the packaged component
);
