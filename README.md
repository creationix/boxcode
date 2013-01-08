# BoxCode

BoxCode is a tiling code editor.

## Running locally

BoxCode can run out-of-the-box as either a traditional node.js web app or a node-webkit desktop app.

In either case you want to download the code (using git clone or github's tarball downloads)

    git clone https://github.com/creationix/boxcode.git
    cd boxcode

Then you need to install it's dependencies using npm (If you don't already have node.js installed, do that too)

    npm install

### As webapp

Now at this point, you can run the server and point a browser to it.

    node server.js
    # Point a browser to http://localhost:8080/

I'm trying to work in the latest versions of the major browsers, but not everything works perfectly.  In Chrome, for example, there is no way a web app can intercept Control/Command + W, it will always close the browser tab.  If you open the page in app mode however, it will work fine. (See Tools -> Create Application Shortcut)

In this mode the fs module is implemented as an RPC system over binary websockets to the node server using msgpack for data serialization.

### As a desktop app

Download the latest node-webkit from <https://github.com/rogerwang/node-webkit>.  Unzip this and place the `nw` executable and it's other files in the root of the `boxcode` folder.  Then execute `nw` to start the app.

In this version, the fs module *is* the node.js fs module running in the same context as the browser code.  There is no websocket/msgpack bridge needed.
