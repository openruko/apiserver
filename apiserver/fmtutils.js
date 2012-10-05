module.exports = {
  fromPostgres: function(arg) {
    arg = arg.replace(/^p_/g,'').replace(/_(\w)/g, function(match, startLetter) { 
      return startLetter.toUpperCase(); 
    });
    return arg;
  },
  toPostgres: function(arg) {
    arg = arg.replace(/[a-z0-9][A-Z]/g, function(match) { 
      return match.toLowerCase().substring(0,1) + '_' + match.toLowerCase().substring(1);
    });
    return arg;
  }
};
