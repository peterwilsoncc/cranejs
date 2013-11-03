//prevent logging from causing errors in IE.
console = this.console || {};
console.log = this.console.log || function(){};
console.error = this.console.error || function(){};

/*!
Crane - just simple dom manipulation
Copyright (c) 2013 Peter Wilson, http://peterwilson.cc

---

Incorporates 

-

Dean Edward's addEvent || http://dean.edwards.name/weblog/2005/10/add-event/
Licensed under http://www.gnu.org/licenses/lgpl-2.1.html

-

ess.js - A fast, simple, opinionated selector "engine".
Copyright (c) 2012 James Barwell, http://jamesbarwell.co.uk

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

-

Much inspiration and copying from jQuery 

Copyright 2005, 2013 jQuery Foundation, Inc. and other contributors
Released under the MIT license
http://jquery.org/license


*/


(function(window, document){
	var _Crane = function(){},
		event_guid = 1,
		selector_engine = window.Sizzle || ess,
		
		rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]*))$/,
		rbrace = /(?:\{[\s\S]*\}|\[[\s\S]*\])$/,
		rvalidchars = /^[\],:{}\s]*$/,
		rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g,
		rvalidescape = /\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g,
		rvalidtokens = /"[^"\\\r\n]*"|true|false|null|-?(?:\d+\.|)\d+(?:[eE][+-]?\d+|)/g,
		rmsPrefix = /^-ms-/,
		rdashAlpha = /-([\da-z])/gi;
	
	window.crane = function( selector ) {
		var new_crane = new _Crane();
		new_crane.init ( selector );
		return new_crane;
	}
	
	function clean_whitespace( stringValue ) {
		if ( typeof stringValue == 'string' ) {
			stringValue = stringValue.replace(/\s{2,}/g,' ').replace(/^\s+|\s+$/g,'');
		}
		return stringValue;
	}
	
	function ess(selector, context) {
		var elements = [];
		context = context || document;
		if (selector.indexOf(',') !== -1) {
			var parts = selector.split(','),
				this_selector = parts.shift(),
				next_selector = parts.join(','),
				results = ess(this_selector, context);
			if ( results.length > 0 ) {
				elements = results.concat(ess(next_selector));
			}
			else {
				elements = ess(next_selector);
			}
		}
		else if (selector.indexOf(' ') !== -1) {
			selector = selector.replace(/\s{2,}/g,' ').replace(/^\s+|\s+$/g,'');
			var parts = selector.split(' '),
				this_selector = parts.shift(),
				next_selector = parts.join(' '),
				results = ess(this_selector, context);
			if ( results.length > 0 ) {
                for (var i=0, l=results.length; i < l; i++) {
                    elements = elements.concat(ess(next_selector, results[i]));
                }
			}
		}
		else {
			var type = selector.substring(0, 1),
				list;
			if ( type == '#' ) {
				var el = document.getElementById(selector.substring(1));
				if ( el ) {
					elements.push(el);
				}
			}
			else if ( ( type == '.' ) && ( document.getElementsByClassName ) ) {
				list = context.getElementsByClassName(selector.substring(1));
			}
			else if ( ( type == '.' ) && ( document.querySelectorAll ) ) {
				list = context.querySelectorAll(selector);
			}
			else if ( type == '.' ) {
				var all = context.getElementsByTagName('*'),
					all_length = all.length,
					regexp = new RegExp('(\\s|^)'+selector.substring(1)+'(\\s|$)');
				for (var i = 0; i < all_length; i++) {
					var el = all[i];
					if ( regexp.test(el.className) ) {
						elements.push(el);
					}
				}
			}
			else {
				list = context.getElementsByTagName(selector);
			}
			if (typeof list != 'undefined') {
				for (var i =0, len = list.length; i<len; i++) {
					elements.push(list[i]);
				}
			}
		}
		return elements;
	}

	function manip_elements ( element ) {
		var match;

		if ( typeof element === 'string' ) {
			//ensure it's not HTML
			if ( element.charAt(0) === "<" && element.charAt( element.length - 1 ) === ">" && element.length >= 3 ) {
				match = [ null, element, null ];
			}
			else {
				match = rquickExpr.exec( element );
			}
			
			if ( match ) {
				//this isn't jQuery
				return false;
			}
			
			element = clean_whitespace( element );
			
			if ( element.indexOf( ' ' ) >= 0 ) {
				//ignore, contains white space
				return false;
			}
			
			// just make the element and put it in an array
			element = [document.createElement( element )];
		}
		
		else if ( element instanceof Element ) {
			//put the element in an array
			element = [element];
		}
		
		if ( typeof element === 'object' ) {
			// cleck element is an array like object
			if (!(
			( element instanceof _Crane ) ||
			( ( typeof HTMLCollection != 'undefined' ) && element instanceof HTMLCollection ) ||
			( ( typeof NodeList != 'undefined' ) && element instanceof NodeList ) ||
			( element instanceof Array )
			)) {
				// I can't deal with this
				return false;
			}
		}

		return element;
	}

	function parseJSON( data ) {
		// shamelessly ripped from jQuery
		// Attempt to parse using the native JSON parser first
		if ( window.JSON && window.JSON.parse ) {
			return window.JSON.parse( data );
		}

		if ( data === null ) {
			return data;
		}

		if ( typeof data === "string" ) {

			// Make sure leading/trailing whitespace is removed (IE can't handle it)
			data = data.replace(/^\s+|\s+$/g,'');

			if ( data ) {
				// Make sure the incoming data is actual JSON
				// Logic borrowed from http://json.org/json2.js
				if ( rvalidchars.test( data.replace( rvalidescape, "@" )
					.replace( rvalidtokens, "]" )
					.replace( rvalidbraces, "")) ) {

					return ( new Function( "return " + data ) )();
				}
			}
		}

		return false;
	}

	function fcamelCase ( all, letter ) {
		return letter.toUpperCase();
	}

	function camelCase( string ) {
		return string.replace( rmsPrefix, "ms-" ).replace( rdashAlpha, fcamelCase );
	}

	_Crane.prototype.init = function( selector ) {
		var elements = [],
			match,
			i,l;
		
		this.length = 0;
		if ( ! selector ) {
			return this;
		}
		
		if ( typeof selector === "string" ) {
			//ensure it's not HTML
			if ( selector.charAt(0) === "<" && selector.charAt( selector.length - 1 ) === ">" && selector.length >= 3 ) {
				match = [ null, selector, null ];
			}
			else {
				match = rquickExpr.exec( selector );
			}
			
			if ( match && (match[1]) ) {
				return this;
			}
			else {
				elements = selector_engine( selector );
			}
		}
		
		else if ( selector.nodeType || selector.window ) {
			elements = [selector];
		}

		else if ( selector instanceof Array ) {
			for (i=0,l=selector.length; i<l; i++) {
				if ( selector[i].nodeType || selector[i].window ) {
					elements.push( selector[i] );
				}
			}
		}
		
		else if ( typeof selector === 'function' ) {
			//document.ready
			return init( document ).addEvent( 'ready', selector );
		}
		
		else {
			elements = [];
		}
		
		for ( i=0,l=elements.length; i<l; i++ ) {
			this[i] = elements[i];
		}
		
		this.length = l;
		return this;
	}

	_Crane.prototype.get = function( num ) {
		var len = this.length,
			j = +num + ( num < 0 ? this.length : 0 );
		return j >= 0 && j < len ? this[j] : null;
	}

	_Crane.prototype.first = function() {
		return this.eq( 0 );
	}

	_Crane.prototype.last = function() {
		return this.eq( -1 );
	}

	_Crane.prototype.eq = function ( num ) {
		var len = this.length,
			j = +num + ( num < 0 ? len : 0 );

		return window.crane( j >= 0 && j < len ? this[j] : null );
	}
	
	_Crane.prototype.sort = [].sort;
	
	_Crane.prototype.splice = [].splice;
	
	_Crane.prototype.push = function( ) {
		var i,l,
			this_length = this.length;
		
		for (i=0,l=arguments.length; i<l; i++ ) {
			if ( arguments[i].nodeType ) {
				this[this_length++] = arguments[i] ;
			}
		}
		
		this.length = this_length;
	}
	
	_Crane.prototype.find = function( selector ) {
		var context = [],
			found = [],
			i,l,
			j,jlen;
		
		for ( i=0,l=this.length; i<l; i++ ) {
			var list = selector_engine( selector, this[i] );
			
			if (typeof list != 'undefined') {
				for (j=0, jlen = list.length; j<jlen; j++) {
					found.push(list[j]);
				}
			}
		}
		
		return window.crane(found);
		
	}

	//each

	//css - read only, inline styles are bad
	
	_Crane.prototype.addClass = function( name ){
		var i,l,
			j,jlen,
			classes;
		
		name = clean_whitespace ( name );
		name = name.split(' ');
		
			
		for ( i=0, l=this.length; i<l; i++ ) {
			classes = this[i].className;
			classes = ' ' + classes + ' ';
			
			for ( j=0, jlen = name.length; j<jlen; j++ ) {
				if ( classes.indexOf( " " + name[j] + " " ) < 0 ) {
					classes += name[j] + " ";
				}
			}
			
			classes = clean_whitespace ( classes );
			
			this[i].className = classes;
		}

		return this;
	}
	
	_Crane.prototype.removeClass = function( name ){
		var i,l,
			j,jlen,
			classes;
		
		name = clean_whitespace ( name );
		name = name.split(' ');

		for ( i=0, l=this.length; i<l; i++ ) {
			classes = this[i].className;
			classes = ' ' + classes + ' ';

			for ( j=0, jlen = name.length; j<jlen; j++ ) {
				while ( classes.indexOf( ' ' + name[j] + ' ' ) >= 0 ) {
					// loop to remove all instances
					classes = classes.replace( ' ' + name[j] + ' ', ' ' );
				}
			}
			
			classes = clean_whitespace ( classes );
			
			this[i].className = classes;
		}
		
		return this;
	}

	//toggleClass
	
	_Crane.prototype.hasClass = function( name ){
		var i,l,
			j,jlen,
			classes;

		name = clean_whitespace ( name );
		name = name.split(' ');

		for ( i=0, l=this.length; i<l; i++ ) {
			classes = this[i].className;
			classes = ' ' + classes + ' ';
			
			for ( j=0, jlen = name.length; j<jlen; j++ ) {
				if ( classes.indexOf( ' ' + name[j] + ' ' ) >= 0 ) {
					return true;
				}
			}
		}
		
		return false;
	}
	
	_Crane.prototype.addEvent = function ( type, handler ) {
		function _addEvent ( element, type, handler ) {
			if (element.addEventListener) {
				element.addEventListener(type, handler, false);
			} else {
				// assign each event handler a unique ID
				if (!handler.$$guid) handler.$$guid = event_guid++;
				// create a hash table of event types for the element
				if (!element.events) element.events = {};
				// create a hash table of event handlers for each element/event pair
				var handlers = element.events[type];
				if (!handlers) {
					handlers = element.events[type] = {};
					// store the existing event handler (if there is one)
					if (element["on" + type]) {
						handlers[0] = element["on" + type];
					}
				}
				// store the event handler in the hash table
				handlers[handler.$$guid] = handler;
				// assign a global event handler to do all the work
				element["on" + type] = _handleEvent;
			}
		}
		
		function _handleEvent(event) {
			var returnValue = true;
			// grab the event object (IE uses a global event object)
			event = event || _fixEvent(((this.ownerDocument || this.document || this).parentWindow || window).event);
			// get a reference to the hash table of event handlers
			var handlers = this.events[event.type];
			// execute each event handler
			for (var i in handlers) {
				this.$$handleEvent = handlers[i];
				if (this.$$handleEvent(event) === false) {
					returnValue = false;
				}
			}
			return returnValue;
		};

		function _fixEvent(event) {
			// add W3C standard event methods
			event.preventDefault = _fixEvent.preventDefault;
			event.stopPropagation = _fixEvent.stopPropagation;
			return event;
		};
		_fixEvent.preventDefault = function() {
			this.returnValue = false;
		};
		_fixEvent.stopPropagation = function() {
			this.cancelBubble = true;
		};		
		
		if ( typeof handler == 'function' ) {
			var i,l;
			for (i=0, l=this.length; i<l; i++ ) {
				var el = this[i];
				if ( el.tagName.toLowerCase() == 'html' ) {
					el = window;
				}
				_addEvent( el, type, handler );
			}
		}
		
		return this;
	}

	_Crane.prototype.removeEvent = function ( type, handler ) {
		function _removeEvent(element, type, handler) {
			if (element.removeEventListener) {
				element.removeEventListener(type, handler, false);
			} else {
				// delete the event handler from the hash table
				if (element.events && element.events[type]) {
					delete element.events[type][handler.$$guid];
				}
			}
		};

		if ( typeof handler == 'function' ) {
			var i,l;
			for (i=0, l=this.length; i<l; i++ ) {
				var el = this[i];
				if ( el.tagName.toLowerCase() == 'html' ) {
					el = window;
				}
				_removeEvent( el, type, handler );
			}
		}
		return this;
	}

	_Crane.prototype.click = function( handler ) { return this.addEvent( 'click', handler ); }
	_Crane.prototype.focus = function( handler ) { return this.addEvent( 'focus', handler ); }
	_Crane.prototype.blur = function( handler ) { return this.addEvent( 'blur', handler ); }
	_Crane.prototype.keydown = function( handler ) { return this.addEvent( 'keydown', handler ); }
	_Crane.prototype.keypress = function( handler ) { return this.addEvent( 'keypress', handler ); }
	_Crane.prototype.keyup = function( handler ) { return this.addEvent( 'keyup', handler ); }
	_Crane.prototype.mouseenter = function( handler ) { return this.addEvent( 'mouseover', handler ); }
	_Crane.prototype.mouseleave = function( handler ) { return this.addEvent( 'mouseout', handler ); }

	_Crane.prototype.hover = function( handler, out_handler ) {
		this.addEvent( 'mouseover', handler );
		return this.addEvent( 'mouseout', out_handler ); 
	}

	_Crane.prototype.data = function ( name, value ) {
		function _setData( element, name, value ) {
			element['$$craneJS$$_' + name] = value;
		}
		
		function _checkAttr( element, name ) {
			var attrname = "data-" + name,
				data = element.getAttribute( attrname );
			
			/* shamelessly ripped from jQuery */
			if ( typeof data === "string" ) {
				try {
					data = data === "true" ? true :
					data === "false" ? false :
					data === "null" ? null :
					// Only convert to a number if it doesn't change the string
					+data + "" === data ? +data :
					rbrace.test( data ) ? parseJSON( data ) :
					data;
				} catch( e ) {}

				// Make sure we set the data so it isn't changed later
				_setData( element, camelCase(name), data );

			} else {
				data = undefined;
			}
			
			return data;
		}
		
		if ( typeof value == 'undefined' ) {
			if ( this.length == 0 ) {
				return undefined;
			}
			//get value from the first element
			value = this[0]['$$craneJS$$_' + camelCase(name)];
			if ( !value ) {
				value = _checkAttr( this[0], name );
			}
			return value;
		}
		else {
			//set value on all elements
			var i,l;
			for (i=0, l=this.length; i<l; i++ ) {
				_setData( this[i], camelCase(name), value );
			}
			return this;
		}
	}

	_Crane.prototype.append = function ( element ) {
		var i,j,el_len,
			l = this.length,
			no_clone = l - 1,
			node;
		
		
		element = manip_elements ( element );
		if ( element === false ) {
			return this;
		}
			
		el_len = element.length;
		for ( i=0 ; i < l; i++ ) {

			for (j=0; j < el_len; j++ ) {
				if (!( element[j].nodeType && element[j].nodeType === 1 )) {
					continue;
				}
			
				if ( i !== no_clone ) {
					node = element[j].cloneNode(true);
				}
				else {
					node = element[j];
				}
			
				if ( this[i].nodeType === 1 || this[i].nodeType === 11 || this[i].nodeType === 9 ) {
					this[i].appendChild( node );
				}
			
			}
			
		}
			
		
		
		return this;
	}

	_Crane.prototype.remove = function() {
		var len,
			i,
			retained = [];
		
		for (len = this.length,i=len-1; i>=0; i--) {
			if ( this[i].parentNode ) {
				this[i].parentNode.removeChild( this[i] );
			}
			else {
				retained.push( this[i] );
			}
		}

		return window.crane(retained);
	}
	
	_Crane.prototype.prepend = function( element ) {
		var i,j,el_len,
			l = this.length,
			no_clone = l - 1,
			node;
		
		
		element = manip_elements ( element );
		if ( element === false ) {
			return this;
		}
			
		el_len = element.length;
		for ( i=0 ; i < l; i++ ) {

			for (j=0; j < el_len; j++ ) {
				if (!( element[j].nodeType && element[j].nodeType === 1 )) {
					continue;
				}
			
				if ( i !== no_clone ) {
					node = element[j].cloneNode(true);
				}
				else {
					node = element[j];
				}
			
				if ( this[i].nodeType === 1 || this[i].nodeType === 11 || this[i].nodeType === 9 ) {
					this[i].insertBefore( node, this[i].firstChild );
				}
			
			}
			
		}
			
		
		
		return this;
	}
	
	//html
	
	//text
	
}(this, document));