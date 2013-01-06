/*global define, load */
define("grid", function () {
  "use strict";

  var domBuilder = load('dombuilder');

  function isNumber(value) {
    return typeof value === "number" && !isNaN(value);
  }

  function Grid(el) {
    this.el = el || document.createElement('div');
    this.el.className = "grid";
    this.root = new Leaf(this, this);
    this.focusedLeaf = this.root;
    this.focusedTab = undefined;
    this.el.appendChild(this.root.el);
  }

  Grid.prototype.resize = function (width, height) {
    if (arguments.length === 0) {
      if (!isNumber(this.width) || !isNumber(this.height)) {
        return;
      }
      width = this.width;
      height = this.height;
    }
    else {
      if (!isNumber(width) || !isNumber(height)) {
        throw new TypeError("width and height must be numbers");
      }
      this.width = width;
      this.height = height;
    }

    this.el.style.width = width + "px";
    this.el.style.height = height + "px";
    this.root.resize(width, height);
  };

  Grid.prototype.focus = function (leaf, tab) {
    if (this.focusedLeaf && this.focusedTab) {
      if (this.focusedLeaf === leaf && this.focusedTab === tab) return;
      this.defocus(this.focusedLeaf, this.focusedTab);
    }
    this.focusedLeaf = leaf;
    this.focusedTab = tab;
    leaf.focus();
  };

  Grid.prototype.defocus = function (leaf, tab) {
    if (!(this.focusedLeaf === leaf && this.focusedTab === tab)) return;
    this.focusedLeaf = undefined;
    this.focusedTab = undefined;
    leaf.defocus();
  };

  Grid.prototype.replace = function (newChild, oldChild) {
    this.el.replaceChild(newChild.el, oldChild.el);
    if (this.root === oldChild) this.root = newChild;
  };

  Grid.prototype.collapse = function (leaf) {
    var grandparent = leaf.parent.parent;
    if (!grandparent) return;
    var splitview = leaf.parent;
    var sibling;
    if (splitview.main === leaf) sibling = splitview.side;
    else sibling = splitview.main;
    var tab;
    while (tab = leaf.tabs[0]) {
      leaf.remove(tab, true);
      sibling.add(tab);
    }
  };

  Grid.prototype.kill = function (leaf) {
    var grandparent = leaf.parent.parent;
    if (!grandparent) return;
    var splitview = leaf.parent;
    var sibling;
    if (splitview.main === leaf) sibling = splitview.side;
    else sibling = splitview.main;
    sibling.el.style[splitview.orientation] = "";
    grandparent.replace(sibling, splitview);
    sibling.parent = grandparent;
    while (!sibling.focus) {
      sibling = sibling.side;
    }
    sibling.focus(sibling.tabs[sibling.tabs.length - 1]);
    this.resize();
  };

  Grid.prototype.split = function (orientation, oldLeaf, node, tab, size) {

    var splitview = new SplitView({size: size, orientation: orientation});

    node.parent.replace(splitview, node);

    // Make the old node the new main of the splitview
    splitview.setMain(node);
    splitview.parent = node.parent;
    node.parent = splitview;

    // Create a new node for the split half
    var newLeaf = new Leaf(this, splitview);
    splitview.setSide(newLeaf);

    // And move the focused tab there
    oldLeaf.remove(tab, true);
    newLeaf.add(tab);

    this.resize();
  };


  Grid.prototype.innerSplit = function (leaf, orientation) {
    var tab = leaf.selected;
    // Need a focused tab and leaf to work with
    if (!(tab && leaf)) return;
    // Can only split if there is more than one tab in the leaf
    if (leaf.tabs.length <= 1) return;

    // Find optimal size for new cell
    var size;
    if (orientation === "top" || orientation === "bottom") {
      size = Math.floor(leaf.height / 2);
    }
    else {
      size = Math.floor(leaf.width / 2);
    }
    this.split(orientation, this.focusedLeaf, this.focusedLeaf, this.focusedTab, size);
  };

  var inverses = {
    left: "right",
    right: "left",
    top: "bottom",
    bottom: "top"
  };

  Grid.prototype.outerSplit = function (orientation) {
    var leaf = this.focusedLeaf, tab = this.focusedTab;
    if (!(tab && leaf)) return;
    var node = leaf;
    var inverse = inverses[orientation];

    // Go up looking for a split in the right direction
    var split, isMain;
    do {
      split = node.parent;
      if (split === this) {
        // If we make it to the root, it's time to create a new split
        if (this.focusedLeaf.tabs.length > 1) {
          // Find the optimal size.  It's half the smallest main area.
          var size;
          var isHorizontal = orientation === "right" || orientation === "left";
          if (isHorizontal) {
            size = window.innerWidth;
          }
          else {
            size = window.innerHeight;
          }
          find(this.root);
          size = Math.floor(size / 2);
          return this.split(orientation, this.focusedLeaf, node, tab, size);
        }
        else {
          return;
        }
      }
      isMain = split.main === node;
      node = split;
    } while (node.orientation !== (isMain ? orientation : inverse));

    function find(node) {
      if (node.main) {
        if (node.orientation === "right" || node.orientation === "left") {
          if (isHorizontal) {
            size = Math.min(node.main.width, size);
          }
        }
        else {
          if (!isHorizontal) {
            size = Math.min(node.main.height, size);
          }
        }
        find(node.main);
      }
      if (node.side) {
        find(node.side);
      }
    }

    var target = isMain ? node.side : node.main;

    // Go down to the nearest leaf
    while (target.orientation) {
      if (target.orientation === inverse) target = target.side;
      else target = target.main;
    }

    leaf.remove(tab, true);
    target.add(tab);

  };

  Grid.prototype.newTab = function (content) {
    return (this.focusedLeaf || this.root).add(content);
  };

  function SplitView(options) {
    this.orientation = options.orientation || "left";
    this.size = options.size || 200;

    domBuilder([".splitview$el",
      [".slider$sliderEl"]
    ], this);

    if (this.orientation === "left" || this.orientation === "right") {
      this.el.classList.add("horizontal");
      this.horizontal = true;
    }
    else if (this.orientation === "top" || this.orientation === "bottom") {
      this.el.classList.add("vertical");
      this.horizontal = false;
    }
    else {
      throw new Error("options.orientation must be one of 'left', 'right', 'top', or 'bottom'");
    }

    var position = null;
    var self = this;
    var isTouch;
    var sliderEl = this.sliderEl;

    function onStart(evt) {
      if (position !== null) return;
      evt.preventDefault();
      evt.stopPropagation();
      if (evt.touches) {
        evt = evt.touches[0];
        isTouch = true;
      }
      else {
        isTouch = false;
      }
      if (self.horizontal) {
        position = evt.clientX;
      }
      else {
        position = evt.clientY;
      }
      if (isTouch) {
        window.addEventListener("touchmove", onMove, true);
        window.addEventListener('touchend', onEnd, true);
      }
      else {
        window.addEventListener("mousemove", onMove, true);
        window.addEventListener('mouseup', onEnd, true);
      }
    }

    function onMove(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      if (evt.touches) {
        evt = evt.touches[0];
      }
      var delta;
      if (self.horizontal) {
        delta = evt.clientX - position;
        position = evt.clientX;
        if (self.orientation === "left") {
          self.size += delta;
        }
        else {
          self.size -= delta;
        }
      }
      else {
        delta = evt.clientY - position;
        position = evt.clientY;
        if (self.orientation === "top") {
          self.size += delta;
        }
        else {
          self.size -= delta;
        }
      }
      if (self.savedSize) {
        self.savedSize = undefined;
      }

      self.resize();
    }

    function onEnd(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      if (isTouch) {
        window.removeEventListener("touchmove", onMove, true);
        window.removeEventListener('touchend', onEnd, true);
      }
      else {
        window.removeEventListener("mousemove", onMove, true);
        window.removeEventListener('mouseup', onEnd, true);
      }
      position = null;
      isTouch = null;
    }

    sliderEl.addEventListener("mousedown", onStart, true);
    sliderEl.addEventListener("touchstart", onStart, true);
  }

  SplitView.prototype.resize = function (width, height) {

    if (arguments.length === 0) {
      if (!isNumber(this.width) || !isNumber(this.height)) {
        return;
      }
      width = this.width;
      height = this.height;
    }
    else {
      if (!isNumber(width) || !isNumber(height)) {
        throw new TypeError("width and height must be numbers");
      }
      this.width = width;
      this.height = height;
    }

    this.el.style.width = width + "px";
    this.el.style.height = height + "px";

    if (this.horizontal) {
      if (this.size > this.width - 5) this.size = this.width - 5;
    }
    else {
      if (this.size > this.height - 5) this.size = this.height - 5;
    }
    if (this.size < 0) this.size = 0;

    this.sliderEl.style[this.orientation] = this.size + "px";
    if (this.side) {
      this.side.el.style[this.orientation] = 0;
      if (this.horizontal) {
        this.side.resize(this.size, height);
      }
      else {
        this.side.resize(width, this.size);
      }
    }
    if (this.main) {
      this.main.el.style[this.orientation] = (this.size + 5) + "px";
      if (this.horizontal) {
        this.main.resize(width - this.size - 5, height);
      }
      else {
        this.main.resize(width, height - this.size - 5);
      }
    }

  };

  SplitView.prototype.replace = function (newChild, oldChild) {
    oldChild.el.style[this.orientation] = "";
    this.el.replaceChild(newChild.el, oldChild.el);
    if (oldChild === this.main) this.main = newChild;
    if (oldChild === this.side) this.side = newChild;
  };

  SplitView.prototype.setSide = function (obj) {
    if (this.side) {
      this.el.removeChild(this.side.el);
    }
    this.side = obj;
    this.el.appendChild(obj.el);
    this.resize();
  };

  SplitView.prototype.setMain = function (obj) {
    if (this.main) {
      this.el.removeChild(this.main.el);
    }
    this.main = obj;
    this.el.appendChild(obj.el);
    this.resize();
  };

  function Leaf(grid, parent) {
    this.grid = grid;
    this.parent = parent;
    this.labels = [];
    this.tabs = [];
    this.selected = undefined;
    this.focused = false;
    var leaf = this;

    domBuilder([".leaf$el", {ondragover: onDragOver},
      [".tabview$tabviewEl",
        ["i.icon-reorder.leafmenu$menuButton", {onclick: onMainMenu}]
      ],
      [".switcher$switcherEl"]
    ], this);
    this.el.leaf = this;
    this.selected = null;
    this.width = null;
    this.height = null;

    function onDragOver(evt) {
      if (leaf.grid.drag.leaf === leaf) return;
      evt.preventDefault();
      leaf.grid.drag.targetLeaf = leaf;
    }

    function onMainMenu(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      leaf.mainMenu();
    }

    this.onkeydown = this.onkeydown.bind(this);
  }

  Leaf.prototype.add = function (tab) {
    // Build a label for this tab
    var label = {};
    domBuilder([".tab$el", {draggable: true, ondragstart: onDragStart, ondragend: ondragend},
      ["i$icon", {onclick: onTabMenu, class: tab.icon}],
      ["span$title", {onclick: onClick}, tab.title],
      ["i.icon-remove", {onclick: onClose }],
    ], label);
    label.el.tab = tab;

    tab.setIcon = function (className) {
      label.icon.className = className;
    };

    tab.setTitle = function (short, long) {
      label.title.textContent = short;
      if (long) label.el.setAttribute('title', long);
    };

    var leaf = this;

    function onDragStart(evt) {
      leaf.select(tab);
      leaf.grid.drag = {leaf:leaf,tab:tab};
      evt.dataTransfer.effectAllowed = "move";
    }

    function ondragend(evt) {
      var drag = leaf.grid.drag;
      delete leaf.grid.drag;
      if (evt.dataTransfer.dropEffect === "none") return;
      if (!drag.targetLeaf) return;
      drag.leaf.remove(drag.tab, true);
      drag.targetLeaf.add(drag.tab);
    }

    function onTabMenu(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      leaf.tabMenu(tab);
    }

    function onClick(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      leaf.select(tab);
    }

    function onClose(evt) {
      evt.preventDefault();
      evt.stopPropagation();
      leaf.remove(tab);
    }
    this.labels.push(label);
    this.tabviewEl.appendChild(label.el);

    // Attach the tab to this leaf
    tab.leaf = this;
    this.tabs.push(tab);

    // Select this tab.
    this.select(tab);
  };

  Leaf.prototype.mainMenu = function () {
    this.grid.focus(this, this.selected);
    this.renderMenu(this, this.menu, {
      right: 0,
      top: (this.menuButton.offsetTop + this.menuButton.offsetHeight) + "px"
    });
  };

  Leaf.prototype.tabMenu = function (tab) {

    this.select(tab);

    // Show the menu relative to the tab label that was clicked
    var label = this.labels[this.tabs.indexOf(tab)];
    this.renderMenu(tab, tab.menu, {
      left: label.el.offsetLeft + "px",
      top: (label.el.offsetTop + label.el.offsetHeight) + "px",
      minWidth: label.el.offsetWidth + "px"
    });
  };

  Leaf.prototype.remove = function (tab, move) {
    if (!move && tab.onclose && tab.onclose()) return;
    var index = this.tabs.indexOf(tab);
    if (index < 0) throw new Error("tab not in leaf");
    var wasSelected = this.selected === tab;
    if (wasSelected) {
      this.deselect(tab);
    }
    var label = this.labels[index];
    this.labels.splice(index, 1);
    this.tabs.splice(index, 1);
    tab.leaf = undefined;
    this.tabviewEl.removeChild(label.el);
    if (wasSelected) {
      if (index < this.tabs.length) {
        this.select(this.tabs[index]);
      }
      else if (index > 0) {
        this.select(this.tabs[index - 1]);
      }
    }
    if (!this.tabs.length && this.grid.root !== this) {
      this.grid.kill(this);
    }
  };

  Leaf.prototype.resize = function (width, height) {
    if (arguments.length === 0) {
      if (!isNumber(this.width) || !isNumber(this.height)) {
        return;
      }
      width = this.width;
      height = this.height;
    }
    else {
      if (!isNumber(width) || !isNumber(height)) {
        throw new TypeError("width and height must be numbers");
      }
      this.width = width;
      this.height = height;
    }

    this.el.style.width = width + "px";
    this.el.style.height = height + "px";

    if (this.selected) {
      this.selected.resize(width, height - 26);
    }

    var i, l = this.tabs.length;
    var space = width - l * 37 - 22;
    for (i = 0; i < l; i++) {
      var w = Math.round(space / (l - i));
      space -= w;
      this.labels[i].title.style.maxWidth = w + "px";
    }

  };

  Leaf.prototype.onkeydown = function (evt) {
    function handleMenu(obj) {
      var menu = obj.menu;
      loop: for (var i = 0, l = menu.length; i < l; i++) {
        var item = menu[i];
        var shortcut = item.shortcut;
        if (!shortcut) continue;
        if (!evt.shiftKey !== !shortcut.shiftKey ||
            !evt.altKey   !== !shortcut.altKey   ||
            !evt.ctrlKey  !== !shortcut.ctrlKey  ||
            !evt.metaKey  !== !shortcut.metaKey  ||
             evt.keyCode  !==  shortcut.keyCode) continue loop;
        evt.preventDefault();
        evt.stopPropagation();
        obj[item.action](item.param);
        return false;
      }
    }
    // Check for custom shortcuts in the leaf menu
    if (handleMenu(this) === false) return false;
    // And in the currently selected tab menu
    if (this.selected && handleMenu(this.selected) === false) return false;
    if (!evt.ctrlKey) return;
    if (this.selected) {

      // Control + W - close selected tab
      if (evt.keyCode === 87) {
        evt.preventDefault();
        evt.stopPropagation();
        this.remove(this.selected);
        return false;
      }

      // Control + Tab - cycle selected forward
      // Control + Shift + Tab - cycle selected backwards
      if (evt.keyCode === 9) {
        evt.preventDefault();
        evt.stopPropagation();
        var offset = this.tabs.indexOf(this.selected) + (evt.shiftKey ? -1 : 1);
        if (offset === -1) offset = this.tabs.length - 1;
        else if (offset === this.tabs.length) offset = 0;
        var tab = this.tabs[offset];
        this.select(tab);
        return false;
      }
    }
    // Control + Number - jump to tab
    if (evt.keyCode >= 0x30 && evt.keyCode < 0x3a) {
      var index = evt.keyCode === 0x30 ? 9 : evt.keyCode - 0x31;
      var tab = this.tabs[index];
      if (tab) {
        evt.preventDefault();
        evt.stopPropagation();
        this.select(tab);
        return false;
      }
    }
  };

  Leaf.prototype.focus = function () {
    if (this.focused) return;
    if (this.selected && this.selected.onfocus) this.selected.onfocus();
    this.focused = true;
    this.el.classList.add("focused");
    window.addEventListener('keydown', this.onkeydown, true);
    this.grid.focus(this, this.selected);
  };

  Leaf.prototype.defocus = function () {
    if (!this.focused) return;
    if (this.selected && this.selected.ondefocus) this.selected.ondefocus();
    this.focused = false;
    this.el.classList.remove("focused");
    window.removeEventListener('keydown', this.onkeydown, true);
    this.grid.defocus(this, this.selected);
  };


  Leaf.prototype.select = function (tab) {
    this.focus();
    if (this.selected) {
      if (this.selected === tab) return;
      this.deselect(this.selected);
    }
    this.selected = tab;
    if (tab.onselect) tab.onselect();
    var index = this.tabs.indexOf(tab);
    this.labels[index].el.classList.add("selected");
    this.grid.focus(this, tab);
    this.switcherEl.appendChild(tab.el);
    this.resize();
  };

  Leaf.prototype.deselect = function (tab) {
    if (this.selected !== tab) return;
    this.selected = undefined;
    if (tab.ondeselect) tab.ondeselect();
    var index = this.tabs.indexOf(tab);
    this.labels[index].el.classList.remove("selected");
    this.switcherEl.removeChild(tab.el);
    this.grid.defocus(this, tab);
  };

  Leaf.prototype.split = function (orientation) {
    this.grid.innerSplit(this, orientation);
  };

  Leaf.prototype.collapse = function () {
    this.grid.collapse(this);
  };

  Leaf.prototype.menu = [
    {action: "split", param: "bottom", name: "Vertical Split", description: "Split the panel in half vertically", shortcut: {ctrlKey: true, shiftKey: true, keyCode: 66}},
    {action: "split", param: "right", name: "Horizontal Split", description: "Split the panel in half horizontally", shortcut: {ctrlKey: true, shiftKey: true, keyCode: 72}},
    {action: "collapse", name: "Collapse", description: "Unsplit"},
  ];


  function stringifyShortcut(shortcut) {
    var parts = [];
    if (shortcut.ctrlKey) parts.push("Control");
    if (shortcut.shiftKey) parts.push("Shift");
    if (shortcut.altKey) parts.push("Alt");
    if (shortcut.metaKey) parts.push("Meta");
    if (shortcut.keyCode) parts.push(String.fromCharCode(shortcut.keyCode));
    return parts.join(" + ");
  }

  Leaf.prototype.renderMenu = function (obj, items, css) {
    var el = this.el;
    var menuEl;
    document.addEventListener("click", click, true);
    function click(evt) {
      document.removeEventListener("click", click, true);
      setTimeout(function () {
        el.removeChild(menuEl);
      }, 10);
    }
    menuEl = domBuilder(["ul.menu", {css:css}, items.map(function (item) {
      var attribs = {onclick: onclick};
      if (item.description) attribs.title = item.description;
      var json = ["li.item", attribs, item.name + " "];
      if (item.shortcut) json.push(["span.shortcut", stringifyShortcut(item.shortcut)]);
      return json;
      function onclick(evt) {
        evt.preventDefault();
        evt.stopPropagation();
        obj[item.action](item.param);
      }
    })]);
    el.appendChild(menuEl);
    return menuEl;
  };

  return Grid;

});

