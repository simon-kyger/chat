'use strict';

exports.__esModule = true;
exports.default = apply;

var _jquery = require('jquery');

var _jquery2 = _interopRequireDefault(_jquery);

var _linkifyElement = require('./linkify-element');

var _linkifyElement2 = _interopRequireDefault(_linkifyElement);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// Applies the plugin to jQuery
function apply($) {
	var doc = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;


	$.fn = $.fn || {};

	try {
		doc = doc || document || window && window.document || global && global.document;
	} catch (e) {/* do nothing for now */}

	if (!doc) {
		throw new Error('Cannot find document implementation. ' + 'If you are in a non-browser environment like Node.js, ' + 'pass the document implementation as the second argument to linkify/jquery');
	}

	if (typeof $.fn.linkify === 'function') {
		// Already applied
		return;
	}

	function jqLinkify(opts) {
		opts = _linkifyElement2.default.normalize(opts);
		return this.each(function () {
			_linkifyElement2.default.helper(this, opts, doc);
		});
	}

	$.fn.linkify = jqLinkify;

	$(doc).ready(function () {
		$('[data-linkify]').each(function () {
			var $this = $(this);
			var data = $this.data();
			var target = data.linkify;
			var nl2br = data.linkifyNlbr;
			var options = {
				attributes: data.linkifyAttributes,
				defaultProtocol: data.linkifyDefaultProtocol,
				events: data.linkifyEvents,
				format: data.linkifyFormat,
				formatHref: data.linkifyFormatHref,
				nl2br: !!nl2br && nl2br !== 0 && nl2br !== 'false',
				tagName: data.linkifyTagname,
				target: data.linkifyTarget,
				className: data.linkifyClassName || data.linkifyLinkclass, // linkClass is deprecated
				validate: data.linkifyValidate,
				ignoreTags: data.linkifyIgnoreTags
			};
			var $target = target === 'this' ? $this : $this.find(target);
			$target.linkify(options);
		});
	});
}

// Try assigning linkifyElement to the browser scope
try {
	var a = !define && (window.linkifyElement = _linkifyElement2.default);
} catch (e) {}