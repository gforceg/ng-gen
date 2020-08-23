module.exports = function(cmd, object) {

  // fixme: i don't like relative imports
  // these should probably be node modules
  let appUtils = require('../../utils.js');
  let argv = require('../../argv.js').argv;
  
  let Templater = require('space-case-templates').Templater;
  let t = new Templater();

  let prefix = appUtils.getGlobalPrefix();
  let config = JSON.parse(appUtils.tryReadFile( prefix + '/templates/barrel/', '.json'));

  let className = appUtils.toFile(object);

  let _plugs = {
    className: className,
    fileName: className,
    exports: ''
  };

  let outFile = t.plug(config.outFileTemplate, _plugs) + '.ts';

  if (argv.d) { outFile = appUtils.toDir(object) + outFile }

  addExports = function(sPath, file){
    if (file !== outFile && !file.match(/\.spec\.ts/i) && file.match(/\.ts$/i)) {
      let content = appUtils.tryReadFile(sPath, file);

      if (content.match(/(?:export\s+class|exports)/)) {
        let exportFile = '';
        if (argv.d) {
          exportFile = './' + file;
          } else {
          exportFile = appUtils.toDir(sPath) + file
        }
        
        // chop the file extension off
        exportFile = exportFile.replace(/\.(ts|js)$/, '');
        _plugs.exports += `export * from '` + exportFile + `';
`;
        console.log('exported %s', sPath + file);
      }
    }
  }

  // the path to the directory containing the .ts files to be exported by this barrel
  let exportsPath = './' + object;
  if (appUtils.dirExists('./' + object))
  {
    let files = appUtils.getFiles(exportsPath);
    files.forEach(file => {
      addExports(exportsPath, file);
    })
    // console.log('export everything in ./%s', object);
  }

  return _plugs;
}
