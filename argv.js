
// Greg Hedin
// generated with ./rebuild.js

exports.argv = require('yargs')
  .usage('Usage: ng-gen <command> file-name-prefix [options]')
  // barrel command
  .command('barrel', 'create an angular 2 barrel')
  .example('ng-gen barrel subDirectory1 subDirectory2 subDirectoryN')
    // component command
  .command('component', 'create an angular 2 component')
  .example('ng-gen component component1 component2 componentN -d')
    // inlinecomponent command
  .command('inline-component', 'create an angular 2 component with inline html and css')
  .example('ng-gen inline-component component1 component2 componentN -d')
    // module command
  .command('module', 'create an angular 2 module')
  .example('ng-gen module module1 module2 moduleN')
    // service command
  .command('service', 'create an angular 2 service')
  .example('ng-gen service service1 service2 serviceN -d')
    
  .help('h')
  .alias('h', 'help')
  .option('directory', {
    alias: 'd',
    describe: 'create file(s) in a subdirectory'
  })
  .option('verbose', {
    alias: 'v',
    describe: 'show file contents on output'
  })
  .epilog('have a nice day')
  .argv;
  