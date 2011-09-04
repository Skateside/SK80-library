(function (sk80, undef) {

    "use strict";

        // The version of this treatment.
    var version = '0.1a',
    
        // A short-cut to the String.prototype.
        StringProto = String.prototype,
    
        // Use native Array.forEach if we can or a custom function if it's not
        // available.
        forEach = Array.prototype.forEach || function (func, thisArg) {
            var i = 0,
                il = this.length;
            for (; i < il; i += 1) {
                func.call(thisArg, this[i], i, this);
            }
        };

    // The SK80String constructor. Curiously, it ends up looking nothing like
    // a String.
    function SK80String(str) {
        this.string = str;
        return this;
    }
    
    // Sadly it's not possible to set this to new String because we can't
    // directly set the result of this. Instead, create a prototype with a
    // getNative function.
    SK80String.prototype = {
        getNative: function () {
            return this.string;
        }
    };
    
    // Anything that returns a string should be run through SK80String before
    // it's returned. Please note that "substr" is not part of the specs.
    forEach.call(['charAt', 'concat', 'replace', 'slice', 'substring',
            'toLocaleLowerCase', 'toLocaleUpperCase', 'toLowerCase',
            'toUpperCase', 'trim'], function (prop) {
        if (StringProto[prop] !== undef) {
            SK80String.prototype[prop] = function () {
                return new SK80String(StringProto[prop].apply(this.string, arguments));
            };
        }
    });
    
    // Anything that doesn't return a string should simply return the value
    // itself.
    forEach.call(['charCodeAt', 'indexOf', 'lastIndexOf', 'localeCompare',
            'match', 'search', 'split'], function (prop) {
        if (StringProto[prop] !== undef) {
            SK80String.prototype[prop] = function () {
                return StringProto[prop].apply(this.string, arguments);
            };
        }
    });
    
    sk80.expand(SK80String.prototype, {
        
        // This function is based on 'trim12' by Steven Levithan.
        // http://blog.stevenlevithan.com/archives/faster-trim-javascript
        trim: function () {
            var str = this.string.replace(/^\s\s*/, ''),
                ws = /\s/,
                i = str.length - 1;
            
            while (ws.test(str.charAt(i))) {
                i -= 1;
            }
            
            return new SK80String(str.slice(0, i + 1));
        }
    });
    
    // Add the treatment.
    sk80.define('string', function (str) {
        return new SK80String(str);
    }, {
        version: version
    });

    // Expose the prototype for easy augmenting.
    sk80.stringProto = SK80String.prototype;
    
}(SK80));