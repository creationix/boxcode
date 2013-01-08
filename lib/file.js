/*global define, load*/
define('file', function () {
  "use strict";
  var fs = load('fs');
  var getMime = load('mime')('text/plain');

  var domBuilder = load('dombuilder');
  var CodeMirror = load('codemirror');

  function detectIndents(lines, fallback) {
    var stats = {};
    var leastSpaces = Infinity;
    lines.forEach(function (line) {
      if ((/^\s\*/).test(line)) { return; }  // Ignore doc blocks
      var spaces = line.match(/^ */)[0].length;
      var tabs = line.match(/^\t*/)[0].length;
      if (tabs) {
        stats.tabs = (stats.tabs || 0) + 1;
      }
      if (spaces) {
        if (spaces < leastSpaces) {
          leastSpaces = spaces;
        }
        if (spaces === leastSpaces) {
          var name = spaces;
          stats[name] = (stats[name] || 0) + 1;
        }
      }
    });
    var most = 0;
    var winner = fallback || "2";
    for (var name in stats) {
      if (stats[name] > most) {
        most = stats[name];
        winner = name;
      }
    }
    return winner;
  }


  function File(path) {
    this.path = path;
    var self = this;


    var mime = getMime(path);
    var mode = CodeMirror.mimeModes[mime] || "null";

    this.codeMirror = CodeMirror(function (el) {
      self.el = el;
    }, {
      mode: mode,
      theme: "ambiance",
      lineNumbers: true,
    });

    // var self = this;
    // this.editor.on("focus", function () {
    //   self.leaf.select(self);
    // });
    // new MultiSelect(this.editor);
    // this.editor.setTheme("ace/theme/ambiance");

    this.onload = this.onload.bind(this);
    this.onchange = this.onchange.bind(this);
    this.onsave = this.onsave.bind(this);
  }

  File.prototype.icon = "icon-file-alt";
  File.prototype.title = "<untitled>";

  File.prototype.resize = function (width, height) {
    if (arguments.length === 2) {
      this.el.style.width = width + "px";
      this.el.style.height = height + "px";
    }
    // this.editor.resize();
  };

  File.prototype.onfocus = function () {
    this.codeMirror.focus();
  };

  File.prototype.load = function () {
    var self = this;
    var path = this.path;
    this.setIcon("icon-spinner icon-spin");
    fs.readFile(path, "utf8", this.onload);
  };

  File.prototype.onclose = function () {
    return this.modified && !confirm("Lose unsaved changes to " + this.path);
  };

  File.prototype.onchange = function () {
    var different = this.original !== this.session.getValue();
    if (this.modified && !different) {
      this.modified = false;
      this.setTitle(this.title);
    }
    else if (!this.modified && different) {
      this.modified = true;
      this.setTitle("*" + this.title);
    }
  };

  function filename(path) {
    if (path[0] === "/") {
      return path.substr(path.lastIndexOf("/") + 1);
    }
    return path.substr(path.lastIndexOf("\\") + 1);
  }

  File.prototype.onload = function (err, data) {
    if (err) throw err;
    this.setIcon(this.icon);
    this.title = filename(this.path);
    this.setTitle(this.title, this.path);
    this.original = data;
    this.modified = false;

    // this.session.on("change", this.onchange);

    // Guess the indent based on the contents
    var lines = data.substr(0, 0x1000).trim().split("\n");
    var indent = detectIndents(lines);
    if (indent === "tabs") {
      // this.session.setUseSoftTabs(false);
      // this.session.setTabSize(4);
    }
    else {
      // this.session.setUseSoftTabs(true);
      // this.session.setTabSize(parseInt(indent, 10));
    }

    this.codeMirror.setValue(data);

  };

  File.prototype.save = function () {
    this.editor.replaceAll("", {needle: "\\s*$", regExp: true});
    var text = this.session.getValue();
    this.saving = text;
    this.setIcon("icon-spinner icon-spin");
    fs.writeFile(this.path, text, this.onsave);
  };

  File.prototype.saveas = function () {
    var newname = prompt("Save As...", this.path);
    if (!newname) return;
    this.path = newname;
    this.title = filename(this.path);
    this.setTitle(this.title, this.path);
    this.save();
  };

  File.prototype.onsave = function (err) {
    if (err) throw err;
    var text = this.saving;
    this.setIcon(this.icon);
    this.saving = undefined;
    this.original = text;
    this.onchange();
  };

  File.prototype.menu = [
    {action: "save", name: "Save", description: "Save the file to disk", shortcut: {ctrlKey: true, keyCode: 83}},
    {action: "saveas", name: "Save As...", description: "Save the file to disk with a new name"},
  ];

  return File;
});
