module.exports = function(cmd, object) {
  // fixme: i don't like relative imports
  // these should probably be node modules
  let appUtils = require('../../utils.js');
  let argv = require('../../argv.js').argv;
  
  let Templater = require('space-case-templates').Templater;
  let t = new Templater();

  let prefix = appUtils.getGlobalPrefix();
  let config = JSON.parse(appUtils.tryReadFile( prefix + '/templates/component/', '.json'));

  let className = appUtils.toFile(object);
  let _plugs = {
    className: className,
  };
  // define _plugs.fileName
  config.fileName ? _plugs.fileName = config.fileName : _plugs.fileName = className;
  // define _plugs.selector
  _plugs.selector = t.plug(`~className-\\~`, _plugs);
  if (_plugs.selector.indexOf('-') === -1) { _plugs.selector += '-component'}

  return _plugs;
}
