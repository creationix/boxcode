/*global load*/

window.addEventListener("load", function () {
  "use strict";

  var domBuilder = load('dombuilder');
  var Grid = load('grid');
  var File = load('file');
  var fs = load('fs');

  // Create our full-page grid.
  document.body.textContent = "";
  var body = window.body = new Grid(document.body);

  // Wire up the resize events.
  window.onresize = function () {
    body.resize(window.innerWidth, window.innerHeight);
  };
  window.onresize();

  var interesting = /\.(js|css|html)$/i;
  function loaddir(dir) {
    fs.readdir(dir, function (err, files) {
      files.forEach(function (path) {
        if (!interesting.test(path)) return;
        // Randomly skip half of what's left
        if (Math.random() > 0.5) return;
        var file = new File();
        body.newTab(file);
        file.load(dir + "/" + path);
      });
    });
  }
  loaddir("lib");
  loaddir(".");

  document.addEventListener('keydown', function (evt) {
    if (!(evt.ctrlKey || evt.altKey)) return;
    var orientation;
    var action;
    var index;
    switch (evt.keyCode) {
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
      case 78: action = "create"; break;
      case 87: action = "close"; break;
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


}, false);
