var SK80 = (function (undef) {

    "use strict";
    
        // A couple of prototype-caches to aid minification.
    var toString = Object.prototype.toString,
        toLower = String.prototype.toLowerCase,
        
        // The treatments that our object will get.
        treatments = {},
        
        // Version information will go here.
        versions = {
            SK80: '0.1a'
        };
    
    // Simply identifies an object and returns it as a lowercase string.
    function identifyObject(o) {
        var str = toString.call(o);
        if (str !== undef) {
            str = str.split(' ').pop();
            str = toLower.call(str.substr(0, str.length - 1));
        }
        return str;
    }
    
    // A small wrapper to handle a variety of errors.
    function error(msg, type) {
    
        var errorType = {
                'eval': EvalError,
                'range': RangeError,
                'ref': ReferenceError,
                'syntax': SyntaxError,
                'type': TypeError,
                'uri': URIError
            },
            ThisError = (type && errorType[toLower.call(type)]) || Error;
        
        // Prefix the error message so that we can quickly identify a problem
        // with one of these methods.
        if (msg !== undef) {
            msg = 'SK80 error: ' + msg;
        }
        
        throw new ThisError(msg);
    
    }
    
    // The expand function adds properties of one object to another. It checks
    // to ensure that the property doesn't exist in the source before adding
    // it. If it does exist, this function will check to see if the option to
    // overwrite the property has been set. The ability to back up properties
    // also exists.
    function expand(source, expansion, overwrite) {
        var key;
        for (key in expansion) {
            if (expansion.hasOwnProperty(key)) {
                if (key.charAt(0) === '$') {
                    error('Please do not start properties with $', 'syntax');
                } else if (source[key] === undef || overwrite === true) {
                    source[key] = expansion[key];
                } else if (overwrite === 'hold') {
                    source['$' + key] = source[key];
                    source[key] = expansion[key];
                }
            }
        }
        return source;
    }
    
    // The wrapper does nothing more than checking the treatments and returning
    // any corresponding function. It will throw an error if the treatment type
    // can not be found. The function is called with the this keyword bound to
    // undefined. The first argument passed to it is obj, extra arguments may
    // be passed using the extraArgs argument.
    function SK80(obj, forceType, extraArgs) {
    
        var treatAs = forceType || identifyObject(obj),
            treatment = treatments[toLower.call(treatAs)],
            applyArgs = [obj];
        
        if (treatment === undef) {
            error('"' + treatAs + '" is not a defined treatment', 'ref');
        
        } else {
            if (extraArgs !== undef) {
                applyArgs = applyArgs.concat(extraArgs);
            }
            return treatment.apply(undef, applyArgs);
        }
    
    }
    
    // Since we rely on these treatments we should create a way to define them.
    // This function will check to see if the treatment already exists and will
    // throw an error if it exists and hasn't been told to overwrite it. It
    // will also throw an error if func is not a function.
    SK80.define = function (type, func, options) {
    
        var existing,
            expander = {},
            version = {},
            defaults = {
                overwrite: false
            };
        
        if (options !== undef) {
            
            // Expand the options if we were sent an object.
            if (identifyObject(options) === 'object') {
                defaults = expand(defaults, options, true);
            
            // Set the overwrite default if we were sent a boolean or 'hold'.
            } else if (options === !!options || options === 'hold') {
                defaults.overwrite = options;
            }
        }
        
        type = toLower.call(type);
        existing = treatments[type];
        
        // Perform a couple of checks just to be sure.
        if (existing !== undef && defaults.overwrite !== true &&
                defaults.overwrite !== 'hold') {
            error('"' + type + '" is already a treatment.');
        } else if (identifyObject(func) !== 'function') {
            error(toString.call(func) + ' is not a function', 'type');
        }
        
        // Add information 
        if (defaults.version) {
            version[type] = defaults.version;
            expand(versions, version);
        }
        
        // Create the object to send to the expand function.
        expander[type] = func;
        expand(treatments, expander, defaults.overwrite);
    
    };
    
    SK80.expand = expand;
    SK80.error = error;
    
    // Keys will return an array of all the treatment keys. This allows us to
    // easily check the treatments without having to rely on a try-catch
    // statement. If a key is passed in, it will return true or false, based
    // on whether that key is in the treatments.
    SK80.keys = (function () {
    
        var hasObjKeys = Object.keys !== undef,
        
            // If the browser doesn't support a natic Array.indexOf, use a
            // quick custom-made one.
            indexOf = Array.prototype.indexOf || function (search, start) {
                var index = -1,
                    i = start,
                    il = this.length;
                for (; i < il; i += 1) {
                    if (this[i] === search) {
                        index = i;
                        break;
                    }
                }
                return index;
            };
        
        return function (key) {
            
            var arrayOfKeys = [],
                i,
                returnValue;
            
            // Before we do anything, we need an array of the keys.
            if (hasObjKeys) {
                arrayOfKeys = Object.keys(treatments);
            } else {
                for (i in treatments) {
                    if (treatments.hasOwnProperty(i)) {
                        arrayOfKeys.push(i);
                    }
                }
            }
            
            // Now we have our array, we need to know whether we should return
            // it or look through it.
            if (key === undef) {
                returnValue = arrayOfKeys;
            } else {
                returnValue = indexOf.call(arrayOfKeys, key, 0) > -1;
            }
            
            // Return the return value.
            return returnValue;
            
        };
    
    }());
    
    // Reduce will go through all the keys of an object and swap out the ones
    // that start with a $. "$array" becomes "array" etc. The old ones are
    // deleted and not recoverable.
    SK80.reduce = function (obj) {
    
        var key,
            givenObj = obj !== undef;
        if (!givenObj) {
            obj = treatments;
        }
        for (key in obj) {
            if (obj.hasOwnProperty(key) && key.charAt(0) === '$') {
                obj[key.slice(1)] = obj[key];
                delete obj[key];
            }
        }
        if (givenObj) {
            return obj;
        }
    
    };
    
    // Create a way of getting the versions, although deny the ability to
    // manipulate them.
    SK80.versions = function () {
        return versions;
    };
    
    return SK80;
    
}());