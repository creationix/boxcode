/*global ace*/
var defines = {};
var modules = {ace:ace};

function define(name, fn) {
  "use strict";
  defines[name] = fn;
}

function require(name) {
  "use strict";
  var module, define;
  module = modules[name];
  if (module !== undefined) {
    return module;
  }
  define = defines[name];
  if (define !== undefined) {
    delete defines[name];
    return modules[name] = define();
  }
  throw new Error("Cannot find module " + name);
}
