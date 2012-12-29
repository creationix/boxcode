/*global define, require*/
define('file', function () {
  "use strict";

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

  var domBuilder = require('dombuilder');
  var ace = require('ace');
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

  function File(path) {
    this.path = path;
    this.title = path;

    domBuilder([".editor$el"], this);

    this.editor = new Editor(new Renderer(this.el));
    var self = this;
    this.editor.on("focus", function () {
      self.leaf.select(self);
    });
    new MultiSelect(this.editor);
    this.editor.setTheme("ace/theme/ambiance");
    // this.editor.setShowInvisibles(localStorage.showInvisibles);
    var mode = "ace/mode/text";
    for (var index in modesByName) {
      if (modesByName[index].test(path)) {
        mode = "ace/mode/" + index;
        break;
      }
    }

    this.session = new EditSession("", mode);
    this.session.setUndoManager(new UndoManager());
    this.editor.setSession(this.session);
  }

  File.prototype.icon = "icon-file";

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

  File.prototype.load = function () {
    var xhr = new XMLHttpRequest();
    var self = this;
    xhr.open("GET", this.path, true);
    xhr.onload = function(evt) {
      var text = xhr.responseText;
      var lines = text.substr(0, 0x1000).trim().split("\n");
      var indent = detectIndents(lines);
      if (indent === "tabs") {
        self.session.setUseSoftTabs(false);
        self.session.setTabSize(4);
      }
      else {
        self.session.setUseSoftTabs(true);
        self.session.setTabSize(parseInt(indent, 10));
      }
      self.session.setValue(text);


      self.setBusy(false);
    };
    xhr.send();
    this.setBusy(true);
  };

  File.prototype.save = function () {
    this.editor.replaceAll("", {needle: "\\s*$", regExp: true});
  };

  return File;
});
