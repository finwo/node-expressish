var toUpperCase = module.exports = function( subject ) {
  if ( Array.isArray(subject) ) return subject.map(toUpperCase);
  if ( 'string' !== typeof subject ) return '';
  return subject.toUpperCase();
};
