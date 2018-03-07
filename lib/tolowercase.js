var toLowerCase = module.exports = function( subject ) {
  if ( Array.isArray(subject) ) return subject.map(toLowerCase);
  if ( 'string' !== typeof subject ) return '';
  return subject.toLowerCase();
};
