/*global require*/

window.addEventListener("load", function () {
  "use strict";

  var domBuilder = require('dombuilder');
  var Grid = require('grid');
  var File = require('file');

  // Create our full-page grid.
  document.body.textContent = "";
  var body = window.body = new Grid(document.body);

  var id = 1;
  var actions = {
    create: function (path) {
      path = path || "file_" + (id++) + ".js";
      var file = new File(path);
      body.newTab(file);
      file.load();
    },
    close: function () {
      body.closeTab();
    }
  };

  actions.create("index.js");
  actions.create("index.html");
  actions.create("lib/grid.js");
  actions.create("css/grid.css");
  actions.create("lib/file.js");
  
  document.addEventListener('keydown', function (evt) {
    var orientation;
    var action;
    switch (evt.keyCode) {
      case 37: orientation = "left"; break;
      case 38: orientation = "top"; break;
      case 39: orientation = "right"; break;
      case 40: orientation = "bottom"; break;
      case 78: action = "create"; break;
      case 87: action = "close"; break;
    }
    if (orientation && evt.shiftKey && evt.altKey) {
      evt.preventDefault();
      evt.stopPropagation();
      if (evt.crtlKey) {
        body.innerSplit(orientation);
      }
      else {
        body.outerSplit(orientation);
      }
      return false;
    }
    if (action && evt.ctrlKey) {
      evt.preventDefault();
      evt.stopPropagation();
      actions[action]();
      return false;
    }
  }, true);

  // Wire up the resize events.
  window.onresize = function () {
    body.resize(window.innerWidth, window.innerHeight);
  };
  window.onresize();
  
});
