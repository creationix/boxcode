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
      var file = new File();
      body.newTab(file);
      if (path) file.load(path);
    },
    close: function () {
      body.closeTab();
    },
    save: function () {
      var tab = body.focusedTab;
      tab && tab.save && tab.save();
    }
  };

  actions.create("index.js");
  actions.create("index.html");
  actions.create("lib/grid.js");
  actions.create("css/grid.css");
  actions.create("lib/file.js");

  document.addEventListener('keydown', function (evt) {
    if (!(evt.ctrlKey || evt.altKey)) return;
    var orientation;
    var action;
    var index;
    switch (evt.keyCode) {
      case 37: orientation = "left"; break;
      case 38: orientation = "top"; break;
      case 39: orientation = "right"; break;
      case 40: orientation = "bottom"; break;
      case 78: action = "create"; break;
      case 87: action = "close"; break;
      case 83: action = "save"; break;
      case 49: index = 0; break;
      case 50: index = 1; break;
      case 51: index = 2; break;
      case 52: index = 3; break;
      case 53: index = 4; break;
      case 54: index = 5; break;
      case 55: index = 6; break;
      case 56: index = 7; break;
      case 57: index = 8; break;
      case 48: index = 9; break;
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
    if (index !== undefined && evt.altKey) {
      var leaf = body.focusedLeaf;
      if (leaf) {
        var tab = leaf.tabs[index];
        if (tab) {
          evt.preventDefault();
          evt.stopPropagation();
          leaf.select(tab);
          return false;
        }
      }
    }
  }, true);

  // Wire up the resize events.
  window.onresize = function () {
    body.resize(window.innerWidth, window.innerHeight);
  };
  window.onresize();

});
