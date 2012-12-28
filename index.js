/*global require*/

window.addEventListener("load", function () {
  "use strict";

  var domBuilder = require('dombuilder');
  var Grid = require('grid');

  // Create our full-page grid.
  document.body.textContent = "";
  var body = window.body = new Grid(document.body);

  function Logger() {
    domBuilder(["$el", {onclick: function () {
      this.textContent = "";
    }}], this);
  }

  Logger.prototype.resize = function (width, height) {
    this.el.style.width = width + "px";
    this.el.style.height = height + "px";
    this.log("resize", [width, height]);
  };

  Logger.prototype.onclose = function () {
    this.log("onclose");
    // return true;
  };

  Logger.prototype.onfocus = function () {
    this.log("focus");
  };

  Logger.prototype.ondefocus = function () {
    this.log("defocus");
  };

  Logger.prototype.onselect = function () {
    this.log("select");
  };

  Logger.prototype.ondeselect = function () {
    this.log("deselect");
  };

  Logger.prototype.log = function (name, args) {
    args = (args || []).map(JSON.stringify).join(", ");
    this.el.textContent = name + "(" + args + ")\n" + this.el.textContent;
  };
  
  var id = 1;
  var actions = {
    create: function () {
      var tab = new Logger(true);
      tab.title = "Test Cell " + id++;
      tab.icon = "icon-asterisk";
      body.newTab(tab);
    },
    close: function () {
      body.closeTab();
    }
  };
  
  for (var i = 0; i < 5; i++) {
    actions.create();
  }
  
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
    if (orientation) {
      evt.preventDefault();
      evt.stopPropagation();
      if (evt.shiftKey) {
        body.innerSplit(orientation);
      }
      else {
        body.outerSplit(orientation);
      }
      return false;
    }
    if (action) {
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
