// Most of these array methods are based on the functions found at the Mozilla
// Developer Network on (or around) 23-August-2011.
// https://developer.mozilla.org/en/JavaScript/New_in_JavaScript/1.6
(function (sk80, undef) {

    "use strict";
    
        // The version of this treatment.
    var version = '0.1a',
    
        // A short-cut to Object.toString for type checking.
        toString = Object.prototype.toString,

        // A short-cut to the Array prototype.
        ArrayProto = Array.prototype,
        
        // Cache the forEach method. If this doesn't exist, we'll map it to
        // the iterate function after we've declared it.
        forEach = ArrayProto.forEach,
        
        // We'll create this variable here to avoid hoisting and populate it
        // after we've created the SK80Array constructor.
        toArray,
        
        // An array ready for a test of Array.unshift later on.
        usTest = [1, 2];
    
    // The SK80Array constructor, based on the native Array. It is expanded
    // a little further down.
    function SK80Array(array) {
        var that = this;
        that.length = 0;
        ArrayProto.push.apply(that, array);
        return that;
    }
    SK80Array.prototype = [];

    // Create this now so that we can check that the faster slice call will
    // work on our SK80Array constructor and provide an alternative on failure.
    toArray = (function () {
        var slice = ArrayProto.slice;
        try {
            slice.call((new SK80Array()));
            return function (sk80Array) {
                return slice.call(sk80Array);
            };
        } catch (e) {
            return function (sk80Array) {
                var arr = [],
                    i = 0,
                    il = sk80Array.length;
                for (il = sk80Array.length; i < il; i += 1) {
                    arr[i] = sk80Array[i];
                }
                return arr;
            };
        }
    }());    
    
    // toInteger converts a string to a number. It more closely follows the
    // ToInteger described in the specs and can return negative numbers.
    // http://es5.github.com/#x9.4
    function toInteger(str) {
        var number = Number(str),
            returnValue = number;
        
        if (isNaN(number)) {
            returnValue = 0;
        } else if (number !== 0 && isFinite(number)) {
            returnValue = (number < 0 ? -1 : 1) * Math.floor(Math.abs(number));
        }
        
        return returnValue;
    }
    
    // Since Array.indexOf and Array.lastIndexOf work in basically the same
    // way, create a function with a boolean to identify what to do.
    function indexOf(last, search, offset) {

        var returnValue = -1,
            oThis = last ? this.reverse() : this,
            il = toInteger(oThis.length);
        
        // Check the object.
        if (oThis === undef || oThis === null) {
            sk80.error(toString.call(oThis) + ' is null or not an object',
                    'type');
        }
        
        // Force offset into a number.
        offset = toInteger(offset);
        // Check to ensure it's in range.
        // https://gist.github.com/1120592
        if (last) {
            offset = Math.min(offset, il - 1);
        } else if (offset < 0) {
            offset = Math.max(0, il + offset);
        }
        
        // If this is lastIndexOf then the array is reversed and we need to
        // re-calculate the offset based on a backwards array.
        if (last && offset > 0) {
            offset = il - 1 - offset;
        }
        
        // If the offset is more than the length, return -1.
        if (offset < oThis.length) {
        
            // Go through each element and find the index of a match.
            for (; offset < il; offset += 1) {
                if (oThis[offset] === search) {
                    returnValue = offset;
                    break;
                }
            }
        }
    
        // Since we go through the reversed array backwards, the return index
        // needs to be subtracted from the length and reduced by 1 to be the
        // correct index, unless we didn't find anything.
        if (last && returnValue > -1) {
            returnValue = il - returnValue - 1;
        }
    
        return returnValue;
    }
    
    // Since every, filter, forEach, map and some follow the same pattern,
    // we should create a new function to handle them all.
    function iterate(mode, func, thisArg) {
    
        var i,
            oThis = this,
            il = toInteger(oThis.length),
            value,
            returnValue,
            funcCall,
            isFilterOrMap = mode === 'filter' || mode === 'map',
            isEveryOrSome = mode === 'every' || mode === 'some';
        
        // A little checking, just to be sure.
        // To start we should ensure that this is a real object.
        if (oThis === undef || oThis === null) {
            sk80.error(toString.call(oThis) + ' is null or not an object',
                    'type');
        }
        
        // Then we should check that func is a callable function.
        if (toString.call(func) !== '[object Function]') {
            sk80.error(func + ' in not a function', 'type');
        }
        
        // Finally we should that we know how to handle the array.
        if (!isFilterOrMap && !isEveryOrSome && mode !== 'forEach') {
            sk80.error(mode + ' is not a recognised mode', 'type');
        }
        
        // Set up the return value.
        // filter and map return an array, every and some return a boolean.
        if (isFilterOrMap) {
            returnValue = [];
        } else if (isEveryOrSome) {
            returnValue = mode === 'every';
        }
        
        // Iterate through the array and skip the gaps.
        for (i = 0; i < il; i += 1) {
            value = oThis[i];
            if (value !== undef) {
                
                // forEach just executes the callback, it doesn't do anything
                // with the result.
                funcCall = func.call(thisArg, value, i, oThis);
                
                // every and some return booleans depending on whether the
                // result of func was truthy or falsy. If this is an every
                // function and func was falsy, or this is a some function and
                // func was truthy, break the loop.
                if (isEveryOrSome) {
                    returnValue = funcCall;
                    if ((mode === 'every' && !returnValue) ||
                            (mode === 'some' && returnValue)) {
                        returnValue = !!returnValue;
                        break;
                    }
                
                // filter pushes a value onto the return value array if func
                // was truthy.
                } else if (mode === 'filter') {
                    if (funcCall) {
                        returnValue.push(value);
                    }
                
                // map converts the entry in the array to the mapped version.
                } else if (mode === 'map') {
                    returnValue[i] = funcCall;
                
                }
            }
        }
        
        // Since our augmented array functions have more methods, we should
        // run a returned array through our wrapper before returning it.
        if (isFilterOrMap) {
            returnValue = new SK80Array(returnValue);
        }
        
        // forEach returns undefined, which would be the value of returnValue
        // if mode was 'forEach'.
        return returnValue;
    
    }
    
    // Now that we have an iterate function, use it if forEach doesn't exist.
    if (forEach === undef) {
        forEach = function (func, thisArg) {
            return iterate.call(this, 'forEach', func, thisArg);
        };
    }
    
    // Like indexOf and lastIndexOf, reduce and reduceRight do the same thing
    // but backwards from one another. Therefore, use the same function and a
    // boolean for identification.
    function reduce(fromRight, func, initial) {
        
        var i = 1,
            oThis = this,
            il = toInteger(oThis.length),
            currentValue,
            value,
            j;
        
        // Check the array that we were given.
        if (oThis === undef || oThis === null) {
            sk80.error(toString.call(oThis) + ' is null or not an object',
                    'type');
        }

        // For bonus points, check the function we were given too.
        if (toString.call(func) !== '[object Function]') {
            sk80.error(func + ' in not a function', 'type');
        }
        
        // Start with the value of the first (or last) element.
        currentValue = oThis[fromRight ? il - 1 : 0];
        
        if (initial !== undef) {
            i = 0;
            currentValue = initial;
        }
        
        for (; i < il; i += 1) {
        
            // By setting j to the length minus the index minus 1, we can walk
            // the array backwards while increasing the index.
            j = fromRight ? il - i - 1 : i;
            value = oThis[j];
            if (value !== undef) {
                currentValue = func.call(undef, currentValue, value, j, oThis);
            }
        }
        
        return currentValue;
    }


    // IE < 8 can't inherit from Array. The length never changes and can't be
    // set. Methods on 0-length arrays never do very much. To solve that, we
    // need to change the prototype to an empty object.
    if ((new SK80Array([1])).length !== 1) {
        SK80Array.prototype = {};
    }
        
    // Hijack the current methods so that they run through the SK80Array,
    // opening up our methods while retaining their functionality.
    // Methods that return arrays should be put through SK80Array.
    forEach.call(['concat', 'reverse', 'slice', 'sort', 'splice'], function (prop) {
        if (ArrayProto[prop] !== undef) {
            SK80Array.prototype[prop] = function () {
                return new SK80Array(ArrayProto[prop].apply(toArray(this), arguments));
            };
        }
    });
    // The others should simply return their values.
    forEach.call(['join', 'pop', 'push', 'shift', 'unshift'], function (prop) {
        if (ArrayProto[prop] !== undef) {
            SK80Array.prototype[prop] = function () {
                return ArrayProto[prop].apply(toArray(this), arguments);
            };
        }
    });
    
    
    // Test to see what Array.unshift does. It's not supported in some versions
    // of IE; it exists, it just doesn't do anything.
    if (!usTest.unshift || usTest.unshift(3) !== 3 || usTest.join('') !== '312') {
        SK80Array.prototype.unshift = function () {
            var that = this,
                len = arguments.length,
                i = 0,
                il = that.length - 1;
            for (; il >= 0; il -= 1) {
                that[il + len] = that[il];
            }
            for (; i < len; i += 1) {
                that[i] = arguments[i];
            }
            that.length += len;
            return that.length;
        };
    }

    
    // Add the new methods to our prototype.
    // We all know what they say about assumptions, but since ECMAScript has
    // been standardised, I'll assume that any browser that understands these
    // methods also implements them correctly.
    sk80.expand(SK80Array.prototype, {
        // The only non-standard method added converts this instance to a
        // JavaScript Array.
        getNative: function () {
            return toArray(this);
        },
        isArray: function () {
            return true; // Technically this should be false.
        },
        indexOf: function (search, offset) {
            return indexOf.call(this, false, search, offset);
        },
        lastIndexOf: function (search, offset) {
            return indexOf.call(this, true, search, offset);
        },
        every: function (func, thisArg) {
            return iterate.call(this, 'every', func, thisArg);
        },
        filter: function (func, thisArg) {
            return iterate.call(this, 'filter', func, thisArg);
        },
        forEach: function (func, thisArg) {
            return iterate.call(this, 'forEach', func, thisArg);
        },
        map: function (func, thisArg) {
            return iterate.call(this, 'map', func, thisArg);
        },
        some: function (func, thisArg) {
            return iterate.call(this, 'some', func, thisArg);
        },
        reduce: function (func, initial) {
            return reduce.call(this, false, func, initial);
        },
        reduceRight: function (func, initial) {
            return reduce.call(this, true, func, initial);
        }
    });
        
    // Add the treatment.
    sk80.define('array', function (arr) {
        return new SK80Array(arr);
    }, {
        version: version
    });
    
    // Expose the prototype for easy augmenting.
    sk80.arrayProto = SK80Array.prototype;

}(SK80));