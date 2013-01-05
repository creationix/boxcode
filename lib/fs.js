define('fs', function () {

  try {
    // When running in node-webkit, use the native node fs module directly.
    return require('fs');
  } catch (err) {
    // Otherwise use RPC fs module over msgpack encoded websockets.
  }

  var msgpack = load('msgpack');
  var url = document.location + "";
  url = url.replace(/^http/, "ws");
  var ws = new WebSocket(url);
  ws.binaryType = 'arraybuffer';

  var nextId = 1;
  var callbacks = {};

  ws.onmessage = function (evt) {
    var message = msgpack.decode(evt.data);
    var id = message.shift();
    var fn = callbacks[id];
    delete callbacks[id];
    if (message[0]) {
      var e = message[0];
      var err = new Error(e.value);
      if (e.errno) err.errno = e.errno;
      if (e.code) err.code = e.code;
      if (e.path) err.path = e.path;
      message[0] = err;
    }
    fn.apply(null, message);
  };

  // Encode array messaes
  function encode(message) {
      // Scrub out callback functions and replce with placeholders
      return msgpack.encode(message.map(function (arg) {
        if (typeof arg !== "function") return arg;
        var id = nextId++;
        callbacks[id] = arg;
        return {$:id};
      }));
  }

  var queue = [];
  var connected = false;
  ws.onopen = function () {
    connected = true;
    var q = queue;
    queue = [];
    q.forEach(function (fn) {
      fn();
    });
  };

  function wrap(name) {
    return function () {
      console.log("fs." + name + "(" + JSON.stringify(arguments[0]) + ", ...)");
      var args = [name];
      // Push the call arguments onto the list
      args.push.apply(args, arguments);
      var chunk = encode(args);
      if (connected) {
        ws.send(chunk);
      }
      else {
        queue.push(function () {
          ws.send(chunk);
        });
      }
    };
  }

  var wrappedStat = wrap("stat");
  return {
    readFile: wrap("readFile"),
    writeFile: wrap("writeFile"),
    readdir: wrap("readdir"),
    unlink: wrap("unlink"),
    realpath: wrap("realpath"),
    stat: function (path, callback) {
      wrappedStat(path, function (err, stat) {
        if (err) return callback(err);
        stat.mtime = new Date(stat.mtime);
        stat.atime = new Date(stat.atime);
        stat.ctime = new Date(stat.ctime);
        callback(null, stat);
      });
    }
  };
});