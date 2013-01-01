define('fs', function () {
  var msgpack = load('msgpack');

  var url = document.location.origin.replace(/^http/, "ws") + "/";
  var ws = new WebSocket(url);
  ws.binaryType = 'arraybuffer';

  var nextId = 1;
  var callbacks = {};

  ws.onmessage = function (evt) {
    var message = msgpack.decode(evt.data);
    var id = message.shift();
    var fn = callbacks[id];
    delete callbacks[id];
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

  return {
    readFile: wrap("readFile"),
    writeFile: wrap("writeFile"),
    readdir: wrap("readdir"),
    stat: wrap("stat")
  };
});