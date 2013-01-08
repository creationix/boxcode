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
  var isInteresting = interesting.test.bind(interesting);
  function loaddirs(dirs, callback) {
    var items = [];
    var left = 1; // async counter
    dirs.forEach(function (dir) {
      left++; // we're calling an async function, wait for it.
      fs.readdir(dir, function (err, files) {
        if (err) return callback(err);
        files.filter(isInteresting).forEach(function (file) {
          file = dir + "/" + file;
          var path, stat;
          left++;
          fs.realpath(file, function (err, result) {
            if (err) return callback(err);
            path = result;
            if (stat) stat.path = path;
            check();
          });
          left++;
          fs.stat(file, function (err, result) {
            if (err) return callback(err);
            stat = result;
            if (path) stat.path = result;
            items.push(stat);
            check();
          });
        });
        check();
      });
    });
    check();

    function check() {
      if (--left) return;
      callback(null, items);
    }
  }
  // Load the five most recently modified files.
  loaddirs(["lib", "css", "."], function (err, items) {
    items.sort(function (a, b) {
      return a.mtime - b.mtime;
    });
    items.slice(items.length - 5).forEach(function (item) {
      var file = new File(item.path);
      body.newTab(file);
      file.load();
    });
  });

}, false);
