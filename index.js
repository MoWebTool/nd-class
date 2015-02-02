'use strict';

// Class
// -----------------
// 2.x:
//  - only for mobile
// fork from:
//  - https://github.com/aralejs/class/blob/master/class.js
// Thanks to:
//  - http://mootools.net/docs/core/Class/Class
//  - http://ejohn.org/blog/simple-javascript-inheritance/
//  - https://github.com/ded/klass
//  - http://documentcloud.github.com/backbone/#Model-extend
//  - https://github.com/joyent/node/blob/master/lib/util.js
//  - https://github.com/kissyteam/kissy/blob/master/src/seed/src/kissy.js

var Class;

// Helpers
// ------------

var isFunction = function(val) {
  return Object.prototype.toString.call(val) === '[object Function]';
};

function mix(r, s, wl) {
  // Copy "all" properties including inherited ones.
  for (var p in s) {
    if (s.hasOwnProperty(p)) {
      if (wl && wl.indexOf(p) === -1) {
        continue;
      }

      // 在 iPhone 1 代等设备的 Safari 中，prototype 也会被枚举出来，需排除
      if (p !== 'prototype') {
        r[p] = s[p];
      }
    }
  }
}


// Class
// ------------

function implement(properties) {
  var key, value;

  /*jshint validthis: true*/
  for (key in properties) {
    value = properties[key];

    if (Class.Mutators.hasOwnProperty(key)) {
      Class.Mutators[key].call(this, value);
    } else {
      this.prototype[key] = value;
    }
  }
}

function classify(cls) {
  cls.extend = Class.extend;
  cls.implement = implement;
  return cls;
}

// Shared empty constructor function to aid in prototype-chain creation.
function Ctor() {}

// See: http://jsperf.com/object-create-vs-new-ctor
var createProto = Object['__proto__'] ?
  function(proto) {
    return {
      /*jshint proto:true*/
      __proto__: proto
    };
  } :
  function(proto) {
    Ctor.prototype = proto;
    return new Ctor();
  };

// The base Class implementation.
Class = function(o) {
  // Convert existed function to Class.
  if (!(this instanceof Class) && isFunction(o)) {
    return classify(o);
  }
};

// Create a new Class.
//
//  var SuperPig = Class.create({
//    Extends: Animal,
//    Implements: Flyable,
//    initialize: function() {
//      SuperPig.superclass.initialize.apply(this, arguments)
//    },
//    Statics: {
//      COLOR: 'red'
//    }
// })
//
Class.create = function(parent, properties) {
  if (!isFunction(parent)) {
    properties = parent;
    parent = null;
  }

  properties || (properties = {});
  parent || (parent = properties.Extends || Class);
  properties.Extends = parent;

  // The created class constructor
  function SubClass() {
    // Call the parent constructor.
    parent.apply(this, arguments);

    // Only call initialize in self constructor.
    if (this.constructor === SubClass && this.initialize) {
      this.initialize.apply(this, arguments);
    }
  }

  // Inherit class (static) properties from parent.
  if (parent !== Class) {
    mix(SubClass, parent, parent.StaticsWhiteList);
  }

  // Add instance properties to the subclass.
  implement.call(SubClass, properties);

  // Make subclass extendable.
  return classify(SubClass);
};


// Create a sub Class based on `Class`.
Class.extend = function(properties) {
  properties || (properties = {});
  properties.Extends = this;

  return Class.create(properties);
};


// Mutators define special properties.
Class.Mutators = {

  'Extends': function(parent) {
    var existed = this.prototype;
    var proto = createProto(parent.prototype);

    // Keep existed properties.
    mix(proto, existed);

    // Enforce the constructor to be what we expect.
    proto.constructor = this;

    // Set the prototype chain to inherit from `parent`.
    this.prototype = proto;

    // Set a convenience property in case the parent's prototype is
    // needed later.
    this.superclass = parent.prototype;
  },

  'Implements': function(items) {
    Array.isArray(items) || (items = [items]);
    var proto = this.prototype,
      item;

    while ((item = items.shift())) {
      mix(proto, item.prototype || item);
    }
  },

  'Statics': function(staticProperties) {
    mix(this, staticProperties);
  }
};

module.exports = Class;
