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
  var cutoff = Date.now() - 1000 * 60 * 60;
  function loaddir(dir) {

    fs.readdir(dir, function (err, files) {
      files.forEach(function (path) {
        if (!interesting.test(path)) return;
        path = dir + "/" + path;
        // Load all files modified in the last hour
        fs.stat(path, function (err, stat) {
          if (err) throw err;
          if (stat.mtime < cutoff) return;
          console.log(stat);
          var file = new File();
          body.newTab(file);
          file.load(path);
        });
      });
    });
  }
  loaddir("lib");
  loaddir("css");
  loaddir(".");

}, false);
