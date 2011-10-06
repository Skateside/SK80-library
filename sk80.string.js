(function (sk80, undef) {

    "use strict";

        // The version of this treatment.
    var version = '0.1a',

        // A couple of short cuts.
        StringProto = String.prototype,
        toString = Object.prototype.toString,

        // Use native Array.forEach if we can or a custom function if it's not
        // available.
        forEach = Array.prototype.forEach || function (func, thisArg) {
            var i = 0,
                il = this.length;
            for (; i < il; i += 1) {
                func.call(thisArg, this[i], i, this);
            }
        };

    // Based on a script found at 
    // http://www.breakingpar.com/bkp/home.nsf/0/87256B280015193F87256BFB0077DFFD
    function arraysMatch(array1, array2) {

        var temp = {},
            i,
            il,
            key,

            // Start by checking that both array1 and array2 are arrays and
            // that their lengths match.
            match = toString.call(array1) === '[object Array]' &&
                    toString.call(array2) === '[object Array]' &&
                    Number(array1.length) === Number(array2.length);

        if (match) {

            // Go through each of the elements in array1 and create a checking
            // object containing a count of each of the elements. This allows
            // the element to exist in array1 multiple times.
            for (i = 0, il = array1.length; i < il; i += 1) {
                key = toString.call(array1[i]) + '~' + array1[i];
                if (temp[key] === undef) {
                    temp[key] = 0;
                }
                temp[key] += 1;
            }

            // Do the same again with array2 but this time deduct the count in
            // the checking object. If that count doesn't exist or it drops
            // below 0 then we know the arrays don't match.
            for (i = 0, il = array2.length; i < il; i += 1) {
                key = toString.call(array2[i]) + '~' + array2[i];
                if (temp[key] === undef || temp[key] <= 0) {
                    match = false;
                    break;
                } else {
                    temp[key] -= 1;
                }
            }

            // If we've been successful so far, check the checking object.
            // Every one of the keys should have been reduced to 0 if the 
            // arrays match.
            if (match) {
                for (key in temp) {
                    if (temp.hasOwnProperty(key)) {
                        if (temp[key] !== 0) {
                            match = false;
                            break;
                        }
                    }
                }
            }

        }

        return match;

    }

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
                return new SK80String(StringProto[prop].apply(this.string,
                    arguments));
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

    // Replacing the split method if we need to. Tests based on the work on
    // Steven Levithan.
    // http://blog.stevenlevithan.com/archives/cross-browser-split
    sk80.expand(SK80String.prototype, {
        split: function (sep, limit) {

            var string = this.string,
                output = [],
                lastIndex,
                lastLength,
                match,
                lastLastIndex = 0,
                separator,
                separator2,
                flags = '',

                undefine = function (str, sep) {
                    return str.replace(sep, function () {
                        var i = 0,
                            il = arguments.length - 2;
                        for (; i < il; i += 1) {
                            if (arguments[i] === undef) {
                                match[i] = undef;
                            }
                        }
                    });
                },

                // NPCG: nonparticipating capturing group.
                compliantExecNpcg = /()??/.exec('')[1] === undef;

            if (toString.call(sep) !== '[object RexExp]') {
                output = StringProto.split.call(string, sep, limit);
            } else {

                if (sep.ignoreCase) {
                    flags += 'i';
                }
                if (sep.multiline) {
                    flags += 'm';
                }
                if (sep.sticky) {
                    flags += 'y';
                }

                // Make `global` and avoid `lastIndex` issues by working with
                // a copy.
                separator = new RexExp(sep.source, flags + 'g');

                if (!compliantExecNpcg) {
                    separator2 = new RegExp('^' + sep.source + '$(?!\\s)',
                        flags);
                }

                // behavior for `limit`: if it's...
                // - `undefined`: no limit.
                // - `NaN` or zero: return an empty array.
                // - a positive number: use `Math.floor(limit)`.
                // - a negative number: no limit.
                // - other: type-convert, then use the above rules.
                if (limit === undefined || +limit < 0) {
                    limit = Infinity;
                } else {
                    limit = Math.floor(+limit);
                }

                if (limit) {

                    while (match = separator.exec(string)) {

                        // `separator.lastIndex` is not reliable cross-browser.
                        lastIndex = match.index + match[0].length;

                        if (lastIndex > lastLastIndex) {
                            output.push(string.slice(lastLastIndex,
                                match.index));


                            // Fix browsers whose `exec` methods don't
                            // consistently return `undefined` for
                            // nonparticipating capturing groups.
                            if (!compliantExecNpcg && match.length > 1) {
                                match[0] = undefine(match[0], separator2);
                            }

                            if (match.length > 1 &&
                                    match.index < string.length) {
                                output.push(match.slice(1));
                            }

                            lastLength = match[0].length;
                            lastLastIndex = lastIndex;

                            if (output.length >= limit) {
                                break;
                            }

                        }

                        if (separator.lastIndex === match.index) {
                            // Avoid an infinite loop.
                            separator.lastIndex += 1;
                        }

                    }

                    if (lastLastIndex === string.length) {
                        if (lastLength || !separator.test('')) {
                            output.push('');
                        }
                    } else {
                        output.push(string.slice(lastLastIndex));
                    }

                }

            }

            return output.length > limit ? output.slice(0, limit) : output;

        }

    // Opera fails the first test, Safari failes the second, IE fails the 3rd.
    }, !arraysMatch(''.split(/()()/), []) ||
            !arraysMatch('.'.split(/()()/), ['.']) ||
            !arraysMatch('ab'.split(/a*/), ['', 'b']));


    // Add the treatment.
    sk80.define('string', function (str) {
        return new SK80String(str);
    }, {
        version: version
    });

    // Expose the prototype for easy augmenting.
    sk80.stringProto = SK80String.prototype;

}(SK80));