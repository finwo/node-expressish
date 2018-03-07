var set = require('./set');

var decodeQuery = module.exports = function( encodedData, onResolve, onReject ) {
  if ( 'function' === typeof onResolve ) {
    try {
      onResolve(decodeQuery(encodedData));
    } catch (e) {
      if ( 'function' === typeof onReject ) {
        onReject(e);
      } else {
        throw "Object could not be decoded";
      }
    }
    return;
  }
  var output = {};
  if ( 'string' !== typeof encodedData ) throw "Object could not be decoded";
  decodeURIComponent(encodedData)                                                              // "a[b]=c&a[d]=e&f=g,h"
    .split('&')                                                                                // [ "a[b]=c", "a[d]=e', "f=g,h" ]
    .map(function (token) { return token.split('=',2); })                                      // [ ["a[b]","c"], ["a[d]","e"], ["f","g,h"] ]
    .map(function (token) { return [ (token[0] || '').replace(/]/g,''), token[1] || null ]; }) // [ ["a[b","c"], ["a[d","e"], ["f","g,h"] ]
    .map(function (token) { return [ token[0].split('[') , token[1] ]; })                      // [ [["a","b"],"c"], [["a","d"],"e"], [["f"],"g,h"] ]
    .forEach(function (token) { set(output,token[0],token[1]); });                             // { a: { b: "c", d: "e" }, f: "g,h" }
  return output;
};
