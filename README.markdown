SK80 is a wrapper that will act to enable all ES5 methods and prototypes on native JavaScript objects without modifying the objects themselves. It's designed to double-up as a safe area to add methods without affecting the in-built JavaScript features. It is also modular so it's possible to only include the parts you needs. When the project is finished, I'll put together a combined library of all the objects.

# Current status: #

SK80 core, SK80.string and SK80.array are working fine.

SK80.function is written, but not yet tested.

SK80.object is still being written.

SK80.date is probably worth writing, SK80.number, SK80.boolean, SK80.regexp probably aren't, but who knows.

# Testing #

I have a few browsers on my PC at home plus a login for [Spoon.net](http://spoon.net/Browsers/). I will get SK80 working consistently across all of those browsers. Therefore, SK80 works on:
* Chrome 13, 8, 6 (7, 5 and 4 wouldn't open)
* Firefox 6, 5, 4, 3.6, 3.5, 2
* Internet Explorer 8, 7, 6 (IE8 can display a page to IE7 standards)
* Opera 11, 10, 9
* Safari 5, 4, 3

# How to use: #

Simply wrap to variable in the SK80 wrapper to enable the ES5 methods. It always defaults to the in-built methods unless those methods are buggy.
Imagine the following piece of code in IE7:

    [1, 2, 3].forEach(function (number) {alert(number);}); // TypeError "forEach" is not defined.
    SK80([1, 2, 3]).forEach(function (number) {alert(number);}); // Alerts 1 then 2 then 3.

The SK80 wrapper also understands all the current methods.

    [1, 2, 3].concat([4]); // [1, 2, 3, 4]
    SK80([1, 2, 3]).concat([4]); // an SK80Array object representing [1, 2, 3, 4]

The SK80 objects are designed to be usable as a native object when possible.

    SK80([1, 2, 3])[1]; // 2

Sadly, this is not always possible (especially for things like Strings). On these occasions, the source object is stored in the SK80 object. To get it, use the getNative method:

    SK80([1, 2, 3]).getNative(); // [1, 2, 3]

# Expanding SK80: #

SK80 is designed to be expandable. To allow methods to be added, each SK80 object (or "treatment") has an exposed prototype. The current ones are:
SK80.arrayProto, SK80.stringProto, SK80.functionProto, SK80.objectProto (work in progress)
SK80 has a few utilities to aid expanding these. Most useful is the expand property, which takes 2 or 3 arguments: the source object to be expanded, an object containing methods to add to the source and an optional third argument that will only be needed when the source and the expansion contain properties with the same name. More on that a little later.

## To expand the SK80Array: ##

    SK80.expand(SK80.arrayProto, {
        random: function () {
            return this[Math.floor(Math.random() * this.length)];
        }
    });
    SK80([1, 2, 3]).random(); // maybe 1

By default, expand will not overwrite any existing properties:

    SK80.expand(SK80.arrayProto, {
        forEach: function () {
            alert('Mwa ha ha!');
        }
    });
    SK80([1, 2, 3]).forEach(); // TypeError undefined is not a function (still using the native forEach)

To tell expand to overwrite the property, set the third argument to true:

    SK80.expand(SK80.arrayProto, {
        forEach: function () {
            alert('Mwa ha ha!');
        }
    }, true);
    SK80([1, 2, 3]).forEach(); // alerts "Mwa ha ha!"

If you wish to overwrite the property but wish to back up the existing property, set the third argument to "hold". This will prefex the existing property with a dollar and then add the expansion. Because of this backing up process, expand will throw an error if the expansion contains any properties that start with a dollar.

    SK80.expand(SK80.arrayProto, {
        forEach: function () {
            alert('Mwa ha ha!');
        }
    }, 'hold');
    SK80([1, 2, 3]).forEach(); // alerts "Mwa ha ha!"
    SK80([1, 2, 3]).$forEach(); // TypeError undefined is not a function (using the native forEach)

To undo that process, the SK80.reduce function is available:

    SK80.reduce(SK80.arrayProto); // removes the forEach added in the previous example and sets "$forEach" to the "forEach"
    SK80([1, 2, 3]).forEach(); // TypeError undefined is not a function (using the native forEach)
    SK80([1, 2, 3]).$forEach(); // TypeError "$forEach" is not defined

SK80 has a couple of other utilities for adding treatments. A full documentation will be written when I've finished the project.