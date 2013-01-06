/*global define, load*/
define('file', function () {
  "use strict";
  var fs = load('fs');

  var modesByName = {
    asciidoc:   /\.asciidoc$/i,
    c9search:   /\.c9search_results$/i,
    coffee:     /(\.coffee|^Cakefile)$/i,
    coldfusion: /\.cfm$/i,
    csharp:     /\.cs$/i,
    css:        /\.css$/i,
    diff:       /\.diff|patch$/i,
    glsl:       /\.(glsl|frag|vert)$/i,
    golang:     /\.go$/i,
    groovy:     /\.groovy$/i,
    haxe:       /\.hx$/i,
    html:       /\.(htm|html|xhtml)$/i,
    c_cpp:      /\.(c|cc|cpp|cxx|h|hh|hpp)$/i,
    clojure:    /\.clj$/i,
    jade:       /\.jade$/i,
    java:       /\.java$/i,
    jsp:        /\.jsp$/i,
    javascript: /\.js$/i,
    json:       /\.json$/i,
    jsx:        /\.jsx$/i,
    latex:      /\.(latex|tex|ltx|bib)$/i,
    less:       /\.less$/i,
    liquid:     /\.liquid$/i,
    lua:        /\.(lua|ltin)$/i,
    luapage:    /\.lp$/i,
    markdown:   /\.(md|markdown)$/i,
    ocaml:      /\.(ml|mli)$/i,
    perl:       /\.(pl|pm)$/i,
    pgsql:      /\.pgsql$/i,
    php:        /\.(php|phtml)$/i,
    powershell: /\.ps1$/i,
    python:     /\.(py|gyp|gypi)$/i,
    ruby:       /\.(ru|gemspec|rake|rb)$/i,
    scad:       /\.scad$/i,
    scala:      /\.scala$/i,
    scss:       /\.(scss|sass)$/i,
    sh:         /(\.(sh|bash|bat)|^Makefile)$/i,
    sql:        /\.sql$/i,
    svg:        /\.svg$/i,
    tcl:        /\.tcl$/i,
    text:       /\.txt$/i,
    textile:    /\.textile$/i,
    typescript: /\.(typescript|ts|str)$/i,
    xml:        /\.(xml|rdf|rss|wsdl|xslt|atom|mathml|mml|xul|xbl)$/i,
    xquery:     /\.xq$/i,
    yaml:       /\.yaml$/i
  };

  var domBuilder = load('dombuilder');
  var ace = load('ace');
  var Editor = ace.require('ace/editor').Editor;
  var Renderer = ace.require("ace/virtual_renderer").VirtualRenderer;
  var MultiSelect = ace.require("ace/multi_select").MultiSelect;
  var EditSession = ace.require("ace/edit_session").EditSession;
  var UndoManager = ace.require("ace/undomanager").UndoManager;

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

  function File() {

    domBuilder([".editor$el"], this);

    this.editor = new Editor(new Renderer(this.el));
    var self = this;
    this.editor.on("focus", function () {
      self.leaf.select(self);
    });
    new MultiSelect(this.editor);
    this.editor.setTheme("ace/theme/ambiance");

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
    this.editor.resize();
  };

  File.prototype.onfocus = function () {
    this.editor.focus();
  };

  File.prototype.load = function (path) {
    var self = this;
    this.path = path;
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

    // Guess the mode based on the filename
    var mode = "ace/mode/text";
    for (var index in modesByName) {
      if (modesByName[index].test(this.path)) {
        mode = "ace/mode/" + index;
        break;
      }
    }

    // Create an editing session
    this.session = new EditSession(data, mode);
    this.session.setUndoManager(new UndoManager());
    this.editor.setSession(this.session);

    this.session.on("change", this.onchange);

    // Guess the indent based on the contents
    var lines = data.substr(0, 0x1000).trim().split("\n");
    var indent = detectIndents(lines);
    if (indent === "tabs") {
      this.session.setUseSoftTabs(false);
      this.session.setTabSize(4);
    }
    else {
      this.session.setUseSoftTabs(true);
      this.session.setTabSize(parseInt(indent, 10));
    }

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
