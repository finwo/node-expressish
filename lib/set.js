// Set (deep) property by key
var set = module.exports = function (obj,key,value,separator) {
  separator = separator || '.';
  if ( 'string' === typeof key ) {
    key = key.split(separator);
  }
  if (!Array.isArray(key)) {
    return;
  }
  var token;
  while(key.length) {
    token = key.shift();
    if ( key.length ) {
      obj = obj[token] = obj[token] || {};
    } else {
      if ( obj[token] && ( 'object' === typeof value ) ) {
        var insert = {};
        insert[token] = value;
        Object.assign(obj,insert);
      } else {
        obj[token] = value;
      }
    }
  }
};
