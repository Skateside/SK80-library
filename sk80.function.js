// NOTE TO SELF: still needs testing.
(function (sk80, undef) {

    "use strict";

        // The version of this treatment.
    var version = '0.1a',
        
        // A couple of short-cuts to aid minification.
        toString = Object.prototype.toString,
        slice = Array.prototype.slice,
        
        FuncProto = Function.prototype,
        
        // The standard forEach method or a workaround.
        forEach = Array.prototype.forEach || function (func, thisArg) {
            var i = 0,
                il = this.length;
            for (; i < il; i += 1) {
                func.call(thisArg, this[i], i, this);
            }
        };

    // The SK80Function and it's prototype.
    function SK80Function(func) {
        
        var that = this;
        
        that.func = func;
        that.length = Number(func === undef ||
                toString.call(func) !== '[object Function]');
        
        return that;
    }
    SK80Function.prototype = {
        getNative: function () {
            return this.func;
        }
    };
    
    // Add the methods to the prototype, if we can.
    forEach.call(['apply', 'bind', 'call', 'constructor',
            'toString'], function (prop) {
        if (FuncProto[prop] !== undef) {
            SK80Function[prop] = function () {
                return FuncProto[prop].apply(this.func, arguments);
            };
        }
    });
    
    // Add a bind method if the browser doesn't already support it.
    // https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
    sk80.expand(SK80Function.prototype, {
        bind: function (thisArg) {
        
            var args = slice.call(arguments, 1),
                toBind = this.func,
                F = function () {},
                bound = function () {
                    return toBind.apply(this instanceof F ? toBind : thisArg,
                            args.concat(slice.call(arguments)));
                };
        
            if (toString.call(toBind) !== '[object Function]') {
                sk80.error('Unable to bind to this function', 'type');
            }
            
            F.prototype = toBind.prototype;
            bound.prototype = new F;
            
            return bound;
        
        }
    });

    
    // Add the treatment.
    sk80.define('function', function (func) {
        return new SK80Function(func);
    }, {
        version: version
    });
    
    // Expose the SK80Function prototype.
    sk80.functionProto = SK80Function.prototype;

}(SK80));