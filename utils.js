// greg hedin
let fs = require('fs');
let path = require('path');
let fsExtra = require('fs-extra');
let hasProperties = require('has-properties');
let readlineSync = require('readline-sync');

exports.getGlobalPrefix = function () {
  let options = { encoding: 'utf8' };
  // if running on a sub-par operating system ... use a sub-par 'shell'
  let POS = /^win32/.test(process.platform);
  if (POS) { options.shell = 'cmd.exe' }
  let prefix = require('child_process').execFileSync('npm', ['config', 'get', 'prefix'], options);
  prefix = prefix.substring(0, prefix.length - 1);
  if (POS) { prefix += '/node_modules/ng-gen'; }
  else { prefix += '/lib/node_modules/ng-gen'; }
  return prefix;
  // return './';
}

let prefix = exports.getGlobalPrefix();
// something to place in a catch(ex) { }
exports.complain = function (msg, exception) {
  console.log('msg: %s\nexception.message %s', msg, exception.message);
  console.log(exception.message);
  console.log(msg);
  console.log(`halting`);
  throw exception;
}

exports.tryComplainHalt = function (expression, eMessage, message) {
  try {
    if (!expression) { throw eMessage; }
  } catch (ex) {
    exports.complain(message, ex);
    throw ex;
  }
}

exports.fileExists = function (path) { try { return fs.statSync(path).isFile(); } catch (ex) { return false; } };
exports.dirExists = function (path) { try { return fs.statSync(path).isDirectory(); } catch (ex) { return false; } };

// using node fs module, if a directory doesn't already exist create it.
// returns true if successfull and false if it fails
exports.tryMkDir = function (dir) {
  try {
    fs.accessSync(dir);
    // console.log('directory already exists: "%s"', dir);
    return true;
  } catch (ex) {
    if (ex.message.match('no such file or directory')) {
      console.log('creating directory: "%s"', dir);
      fs.mkdirSync(dir);
      try {
        fs.accessSync(dir);
        console.log('success');
        return true;
      } catch (ex2) {
        console.log('failed to create directory: "%s"', dir);
        return false;
      }
    }
  }
}

exports.tryReadFile = function (path, file) {
  try {
    if (path !== '') {
      path = exports.toDir(path);
    }
    file = exports.toFile(file);
    return fs.readFileSync(path + file, { encoding: 'utf8' });
  } catch (e) {
    console.log('failed to read %s', path + file);
    console.log('***%s ***', e.message);
    return false;
  }
}


exports.tryWriteFile = function (path, file, content, autoOverwrite) {
  try {
    path = exports.toDir(path);
    if (!exports.dirExists(path)) {
      exports.tryMkDir(path);
    }
    file = exports.toFile(file);
    if (exports.fileExists(path + file) && !autoOverwrite) {
      // console.log('%s already exists. overwriting k?: (k or y for yes)');
      let overwrite = readlineSync.question(file + ` already exists. overwriting k?:
k=overwrite
n=cancel
: `);
      if (!overwrite.match(/^[ky]$/i)) {
        console.log('canceling action');
        return;
      }
    }

    console.log('writing %s', file);
    fs.writeFileSync(path + file, content);
  } catch (ex) {
    console.log('failed to write to %s', file);
    console.log('*** %s ***', ex.message);
    return false;
  }
  return true;
}

// exports.tryAppendFile = function(path, name, content) {

// }

exports.getCustomPlugs = function (cmd, object) {
  let path = prefix + '/templates/' + exports.toDir(cmd);
  let file = cmd + '.js';
  let fPath = path + file;

  // see if the the 'templates/<cmd>/<cmd>.js' exists
  // fail if it does not
  let files = exports.getFiles(path);

  if (files.indexOf(file) === -1) {
    return null;
  }

  let cmdjs;
  let plugs;

  try {
    cmdjs = require(fPath);
    // console.log(typeof cmdjs);
  } catch (ex) {
    exports.complain(fPath + ` doesn't seem to be a module.`, ex);
  }

  exports.tryComplainHalt(typeof cmdjs === 'function', 'custom() is undefined)', fPath + ` doesn't export custom()`);
  plugs = cmdjs(cmd, object);
  // console.dir(customObj);
  // console.log(hasProperties(customObj, ['plugs', 'objects']))
  // throw 'error';
  exports.tryComplainHalt(hasProperties(plugs, ['className', 'fileName']),
    'custom() did not return the right object',
    'custom should return an object with the properties: objects, plugs');
  return plugs;
}

exports.getArgvCommands = function () {
  let argvString = '';
  let directories = exports.getDirectories('./templates');

  let cmds = [];
  directories.forEach(dir => {
    let path = prefix + '/templates/' + dir + '/';
    let files = exports.getFiles(path);
    files.forEach(file => {
      if (file === '.json') {
        // console.log(path + file);
        let cmd = JSON.parse((fs.readFileSync(path + file, { encoding: 'utf8' })));
        for (var prop in { command: '', description: '', example: '' }) {
          if (cmd[prop] === undefined) {
            console.log('error cmd does not contain property: %s', prop);
            return;
          }
        }
        cmds.push(cmd);
      }
      // console.log(file);
    });
  });
  return cmds;
}

// find the next file up that ends with '.module.ts';
// 1. find all files in the current directory that end with '.module.ts'
// 2. if a single file is found return it, if multiple files are found, prompt to choose a file
// 3. if no files are found and 'package.json' exists in this directory, return null.
// 4. otherwise, move up one directory'
exports.getNextModule = function (baseDir) {
  let dir = baseDir;
  let i = 0;
  let hasPackageDotJson = false;
  if (dir) {
    do {
      // console.log('checking in: %s', dir);
      let files = exports.getFiles(dir);
      // 3.
      hasPackageDotJson = (files.filter(value => !!value.match(/^package.json$/i)).length > 0);
      // if (hasPackageDotJson) { console.log('found %s', path.join(dir, 'package.json')) }

      // 1.
      let modules = files.filter(value => !!value.match(/\.module\.ts$/i));

      if (modules.length > 0) {
        // fixme: ask them which module they want to be a part of
        // console.log('found module: %s', modules[0]);
        // console.log('found in %s', dir);
        return path.join(dir, modules[0]);
      }
      let pathArr = dir.split(path.sep);
      pathArr.pop();
      dir = pathArr.join(path.sep);
      i++;
      // dir = '';
    } while (dir !== '' && i < 10 && !hasPackageDotJson);
  }
  return null;
}

exports.getExportedClassname = function (buffer) {
  let result = /export\s+class\s+([^{\s]+)[\s{]/.exec(buffer);
  if (result) {
    return result[1];
  }
  return null;
}

exports.getModuleMetaRange = function (meta, buffer) {
  meta = meta.toLowerCase();

  let metaRangeExpr = new RegExp(`${meta}\\s*:\\s*\\[[^\\]]*\\]`);
  let result = metaRangeExpr.exec(buffer);
  // let result = /declarations\s*:\s*\[[^\]]/.exec(buffer);  
  if (result) {
    return { start: result.index, end: result.index + result[0].length };
  }
  return null;
}

exports.parseModuleMetaArr = function (meta, buffer) {
  let range = exports.getModuleMetaRange(meta, buffer);
  buffer = buffer.substring(range.start, range.end);
  buffer = buffer.replace(new RegExp(`${meta}\\s*:\\s*\\[`), '');
  buffer = buffer.replace(']', '');
  let declarationsArr = buffer.trim().replace(/\n/g, '').split(',');
  return declarationsArr;
}

// replace 'a/b/c' with ['a', 'b', 'c']
exports.splitPath = function (p) {
  return p.split(path.sep);
}
// replace ['a', 'b', 'c'] with 'a/b/c'
exports.joinPath = function (pArr) {
  return pArr.join(path.sep);
}
// replace a/b/c/ with a/b/
// replace a/b/c.txt with a/b/
exports.popPath = function (p) {
  let pathArr = exports.splitPath(p);
  pathArr.pop();
  return exports.joinPath(pathArr);
}

//replace a/b/c with b/c
// replace a/b/c.txt with b/c.txt
exports.shiftPath = function (p) {
  let pathArr = exports.splitPath(p);
  pathArr.shift();
  return exports.joinPath(pathArr);
}

// if  p1 = /etc/bin
// and p2 = /etc/bin/oh/dang/bro
// the inverse is also true
exports.pathDiff = function (p1, p2, bool_unix) {
  if (p1 && p2) {
    let p1Arr = exports.splitPath(p1);
    let p2Arr = exports.splitPath(p2);

    let supDirArr, subDirArr;
    p1Arr.length < p2Arr.length ? supDirArr = p1Arr : supDirArr = p2Arr;
    p1Arr.length > p2Arr.length ? subDirArr = p1Arr : subDirArr = p2Arr;

    let diffArr = subDirArr.filter((value, index) => {
      if (index >= supDirArr.length) { return true; }
      if (supDirArr[index] != value) { return true; }
      return false;
    });

    if (diffArr.length === 0) { return './'; }

    let pathDiff;
    if (bool_unix) {
      pathDiff = diffArr.join('/');
    }
    else {
      pathDiff = exports.joinPath(diffArr);
    }

    return pathDiff;
  }
  return null;
}

// 1. resolve the import path of the .ts class file
// 2. resolve the exported classname from the .ts class file
// 3. append the import statement to the moduleBuffer
// 4. update the declares array to include the new file
exports.autoModuleMeta = function (nextModuleFileAboveMe, classFile) {
  let moduleBuffer = exports.tryReadFile('', nextModuleFileAboveMe);
  let moduleDir = exports.popPath(nextModuleFileAboveMe);
  let moduleFileName = nextModuleFileAboveMe.split(path.sep).pop();

  let classBuffer = exports.tryReadFile('', classFile);
  let classDir = exports.popPath(classFile);

  let path_diff = path.posix.join(
    exports.pathDiff(moduleDir, classDir, true),
    classFile.split(path.sep).pop().replace(/\.ts$/i, '')
  );

  // console.log('path_diff: "%s"', path_diff);
  path_diff = './' + path_diff;

  let meta;
  if (!path_diff) {
    console.log(' unable to determine import path');
    return;
  }

  let class_name = exports.getExportedClassname(classBuffer);

  if (!class_name) {
    console.log(' no exported class found in %s', classFile);
    return;
  }

  let importStatement = `import { ${class_name} } from '${path_diff}';`;

  let moduleBufferArray = moduleBuffer.split('\n');

  if (moduleBufferArray.indexOf(importStatement) !== -1) {
    console.log(`${moduleFileName} already imports ${class_name}. skipping auto-import`);
    return;
  }
  moduleBuffer = importStatement + '\n' + moduleBuffer;

  // if your class ends with Component or Pipe
  // automatically declare it in the module
  if (class_name.match(/(?:Component|Pipe)$/)) {
    meta = 'declarations';
  } else if (class_name.match(/(?:Service)$/)) {
    meta = 'providers';
  } else if (class_name.match(/(?:Module)$/)) {
    meta = 'imports';
  }

  if (!meta) {
    console.log('could not find any meta for the class: %s', class_name);
    return;
  }

  let metaRange = exports.getModuleMetaRange(meta, moduleBuffer);
  if (!metaRange) {
    console.log('failed to find a declaration range in %s', nextModuleFileAboveMe);
    return;
  }

  let metaArr = exports.parseModuleMetaArr(meta, moduleBuffer);
  if (metaArr.length === 1 && metaArr[0].match(/^\s*$/)) {
    metaArr.pop();
  }

  if (metaArr.indexOf(class_name) === -1) {

    metaArr.push(class_name);
    let metaStatement = `${meta}: [\n` + metaArr.join(',\n') + '\n]';

    moduleBuffer = moduleBuffer.substring(0, metaRange.start)
      + metaStatement
      + moduleBuffer.substring(metaRange.end);

  } else {
    console.log(`${meta} in ${moduleFileName} already contains ${class_name}`);
  }

  let outPath = exports.popPath(nextModuleFileAboveMe);
  let outfile = nextModuleFileAboveMe.split(path.sep).pop();
  exports.tryWriteFile(outPath, outfile, moduleBuffer, true);
}

// returns a dictionary of {fileExtension: buffer} e.g. {'ts': 'export class ~myClass^^^~ { }', 'html': '<h1>~myClass ~ works!</h1>', ... }
// 1. find out what files are in the directory
// 2. for each extension, check to see if the cmd.[ext] exists
// 3. if it does then add it to the dictionary of templates: templates[ext] = buffer;
// 4. return the template dictionary.
exports.getTemplateBundle = function (cmd) {
  let argvPlugs = ``;

  let templatePath = prefix + '/templates/' + cmd + '/';
  let templateDirectories = exports.getTemplateDirectories();

  let templatesBundle = {};
  let templateFiles = exports.getFiles(templatePath);

  let filePath = '';

  try {
    templateFiles.forEach(file => {
      // only the following file types are actually considered to be templates.
      if (file.match(/^\.(?:ts|js|html|css)$/)) {
        filePath = templatePath + file;
        templatesBundle[file] = fs.readFileSync(filePath, { encoding: 'utf8' });
      }
    });
  } catch (e) {
    console.log('failed to load %s', filePath);
    console.log('*** %s ***', e.message);
    return;
  }

  return templatesBundle;
}

exports.getFsObjects = function (path, callback) {
  try {
    let allObjs = fs.readdirSync(path);
    let objs = [];;
    if (callback) {
      allObjs.forEach((obj, index) => {
        if (callback(obj)) {
          objs.push(obj);
        }
      });
    }
    return objs;
  } catch (ex) {
    console.log(ex.message);
    throw ex;
  }
}

exports.toDir = function (path) {
  if (path) {
    if (!path.match(/\/$/)) {
      path += '/';
    }
    return path;
  }
}

exports.toFile = function (file) {
  if (file) {
    // console.log('toFile(%s)', file);
    // console.dir(file);
    if (file.match(/\/$/)) {
      file = file.substring(0, file.length - 1);
    }
    return file;
  }
}

// fixme: in typescript this should be a fsObject
exports.getDirectories = function (path) {
  path = exports.toDir(path);
  let directories = exports.getFsObjects(path, function (obj) {
    if (fs.statSync(path + obj).isDirectory()) {
      return true;
    }
    return false;
  });
  return directories;
}

// fixme: in typescript this should be a fsObject
exports.getFiles = function (path) {
  path = exports.toDir(path);
  let directories = exports.getFsObjects(path, function (obj) {
    if (fs.statSync(path + obj).isFile()) {
      return true;
    }
    return false;
  });
  return directories;
}

// 1. add each subdirectory in 'templates/' to the list of templates
exports.getTemplateDirectories = function () {
  let templatesPath = prefix + '/templates/';
  let directories = [];
  let files = fs.readdirSync(templatesPath);

  files.forEach(f => {
    if (fs.statSync(templatesPath + f).isDirectory()) {
      directories.push(f);
    }
  });

  return directories;
}
