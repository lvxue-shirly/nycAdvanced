'use strict';
module.exports = makeTests;

var recast = require('recast');
var makeComment = require('inline-source-map-comment');
var types = recast.types;
var n = types.namedTypes;

function makeTests(inputSource, opts) {
	var results = [];

	opts = opts || {};

	var filename = opts.sourceMaps !== false && (opts.filename || opts.fileName);

	function parse() {
		var parseOpts = filename ? {sourceFileName: filename} : null;
		return recast.parse(inputSource, parseOpts);
	}

	function print(ast) {
		var printOpts = filename ? {sourceMapName: filename + '.map'} : null;
		var result = recast.print(ast, printOpts);

		if (filename && opts.attachComment) {
			result.code = result.code + '\n' + makeComment(result.map);
		}

		return result;
	}

	function copy(path) {
		return rootNode(_copy(path));
	}

	function _copy(path) {
		var copied;
		if (path.parentPath) {
			copied = _copy(path.parentPath).get(path.name);
		} else {
			copied = new types.NodePath({root: parse()});
		}

		var parent = copied.parent;
		var node = copied.value;
		if (!(n.Node.check(node) && parent && (n.BlockStatement.check(parent.node) || n.Program.check(parent.node)))) {
			return copied;
		}

		var body = parent.get('body').value;
		var keeper = parent.get('body', path.name).node;

		var statementIdx = 0;

		while (statementIdx < body.length) {
			var statement = body[statementIdx];
			if ((isDescribe(statement) || isIt(statement)) && statement !== keeper) {
				parent.get('body', statementIdx).replace();
			} else {
				statementIdx++;
			}
		}

		return copied;
	}

	types.visit(parse(), {
		visitExpressionStatement: function (path) {
			var node = path.node;
			if (isIt(node)) {
				var result = print(copy(path));
				result.nestedName = nestedName(path);
				results.push(result);
				return false;
			}
			this.traverse(path);
		}
	});

	return results;
}

function isDescribe(node) {
	if (!n.ExpressionStatement.check(node)) {
		return false;
	}
	node = node.expression;
	return n.CallExpression.check(node) && n.Identifier.check(node.callee) && (node.callee.name === 'describe');
}

function isIt(node) {
	if (!n.ExpressionStatement.check(node)) {
		return false;
	}
	node = node.expression;
	return n.CallExpression.check(node) && n.Identifier.check(node.callee) && (node.callee.name === 'it');
}

// Walks the path up to the root.
function rootNode(path) {
	while (path.parent) {
		path = path.parent;
	}
	return path;
}

function nestedName(path) {
	var arr = [];
	_nestedName(path, arr);
	return arr.reverse();
}

function _nestedName(path, arr) {
	if (!path) {
		return;
	}
	if (isDescribe(path.node) || isIt(path.node)) {
		var firstArg = path.get('expression', 'arguments', 0).node;
		n.Literal.assert(firstArg);
		arr.push(firstArg.value);
	}
	_nestedName(path.parent, arr);
}

