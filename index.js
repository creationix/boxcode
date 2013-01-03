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

}, false);
