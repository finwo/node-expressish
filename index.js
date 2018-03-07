var decodeQuery = require('./lib/decode-query'),
    EE          = require('simple-ee'),
    http        = require('http'),
    io          = require('socket.io'),
    Route       = require('route-parser'),
    url         = require('url'),
    toLowerCase = require('./lib/tolowercase');

// Hint the global variables to scrutinizer
/** global: Buffer */

// The basic constructor
function App() {
  if (!(this instanceof App)) return new App();
  EE.call(this);

  var app = this;
  this.__middleware = [];
  this.__routes     = [];
  this.__wshandlers = [];
  this.fixedHeader  = {};

  // The request handler
  this.on('request', function(req, res) {
    var queue  = app.__middleware.slice().concat(app.__routes.slice()),
        probe  = req.method.toLowerCase() === 'options';
    Object.assign(req,url.parse(req.url));
    Object.keys(app.fixedHeader).forEach(function(key) {
      res.setHeader(key,app.fixedHeader[key]);
    });
    req.body = [];
    req.on('data', function(chunk) {
      req.body.push(chunk);
    }).on('end', function() {
      var params         = decodeQuery(req.query||''),
          handlerParams  = {},
          allowedMethods = [];
      if ( req.body.length ) {
        req.body = Buffer.concat.apply(new Buffer(''),req.body);
      } else {
        req.body = new Buffer('');
      }
      (function next() {
        var handler = queue.shift();
        if(!handler) {
          if ( probe ) {
            allowedMethods = [].concat.apply([],allowedMethods.map(String.prototype.toUpperCase.call));
            allowedMethods = allowedMethods.filter(function(item,pos) {
              return allowedMethods.indexOf(item) === pos;
            });
            res.setHeader('Access-Control-Allow-Method', allowedMethods);
            res.end();
          }
          return;
        }
        if ( 'function' === typeof handler ) handler = { callback: handler };
        if ( 'function' !== typeof handler.callback ) return next();
        if ( Array.isArray(handler.methods) && (!probe) ) {
          if ( handler.methods.indexOf(req.method.toLowerCase()) < 0 ) {
            return next();
          }
        }
        if ( handler.route ) {
          if ( handler.route instanceof Route ) {
            handlerParams = handler.route.match(req.pathname);
            if ( handlerParams === false ) return next();
          } else if ( handler.route instanceof RegExp ) {
            if ( !handler.route.test(req.pathname) ) return next();
          }
        }
        req.params = Object.assign({},params,handlerParams);
        if ( probe ) {
          allowedMethods.push( Array.isArray(handler.methods) ? handler.methods : ['get','post','put','delete'] );
        } else if (!res.finished) {
          var result = handler.callback( req, res, next );
          if ( result && result.then ) return result.then(next);
          return next();
        }
      })();
    });
  });

  // Act on new sockets
  // Attaches all event listeners to the socket
  this.on('websocket', function(socket) {
    app.__wshandlers.forEach(function( handler ) {
      socket.on(handler.event,handler.callback.bind(undefined,socket));
    });
  });
}

// Start listening on a port
App.prototype.listen = function( ports, callback ) {
  var app = this;
  if ( !Array.isArray(ports) ) ports = [ports];
  ports.forEach(function(port) {
    var server = http.createServer(app.emit.bind(app,'request')),
        ws     = io(server);
    ws.on('connection', app.emit.bind(app,'websocket'));
    server.listen(port, function() {
      if ( 'function' === typeof callback ) {
        callback();
      }
    });
  });
  return this;
};

// Add middleware
App.prototype.use = function( handler ) {
  this.__middleware.push(handler);
  return this;
};

// Add websocket handler
App.prototype.ws = function( eventName, callback ) {
  this.__wshandlers.push({
    event    : eventName,
    callback : callback
  });
  return this;
};

// Add any route
App.prototype.route = function( methods, path, callback ) {
  if ( 'string' === typeof methods ) {
    callback = path;
    path     = methods;
    methods  = undefined;
  }
  if ( 'function' === typeof path ) {
    callback = path;
    path     = undefined;
  }
  this.__routes.push({
    methods  : Array.isArray(methods) ? toLowerCase(methods) : undefined,
    route    : path && ( ( path instanceof RegExp ) ? path : new Route(path) ) || undefined,
    callback : callback
  });
  return this;
};

// Add specific methods
App.prototype.get = function( path, callback ) {
  return this.route(['get'],path,callback);
};
App.prototype.post = function( path, callback ) {
  return this.route(['post'],path,callback);
};
App.prototype.put = function( path, callback ) {
  return this.route(['put'],path,callback,['put']);
};
App.prototype.delete = function( path, callback ) {
  return this.route(['delete'],path,callback);
};

// export our module
module.exports = App;
