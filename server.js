var WebSocketServer = require('ws').Server;
var send = require('send');
var http = require('http');
var urlParse = require('url').parse;
var fs = require('fs');
var msgpack = require('msgpack-js');

var server = http.createServer(function (req, res) {
  var url = urlParse(req.url);
  send(req, url.pathname)
    .root(__dirname)
    .pipe(res);
});
server.listen(8080, "127.0.0.1", function () {
  console.log("boxcode listening at", server.address());
});

var wsServer = new WebSocketServer({server: server});
wsServer.on("connection", function (socket) {
  socket.on("message", function (data) {
    var message = msgpack.decode(data).map(function (arg) {
      if (typeof arg === "object" && typeof arg.$ === "number") {
        var args = [arg.$];
        return function () {
          args.push.apply(args, arguments);
          socket.send(msgpack.encode(args), {binary:true});
        };
      }
      return arg;
    });
    var name = message.shift();
    actions[name].apply(null, message);
  });
});


var actions = {
  readFile: fs.readFile,
  writeFile: fs.writeFile,
  readdir: fs.readdir,
  stat: fs.stat
};