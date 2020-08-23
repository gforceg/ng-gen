#!/usr/bin/env node

// Greg Hedin
// rebuid.js  rebuilds args.js
// the idea here is that a yargs.argv object can be generated using 'reflection' via the file system.
// for each 'templates/<command>/.json' file, 
// generate a argv.command().example()

let appUtils = require('./utils.js');
let fs = require('fs');
let Templater = require('space-case-templates').Templater;

let t = new Templater();

let yargsTemplate = `
// Greg Hedin
// generated with ./rebuild.js

exports.argv = require('yargs')
  .usage('Usage: ng-gen <command> file-name-prefix [options]')
  ~commands! ~
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
  `;

  let cmds = appUtils.getArgvCommands();

  let commandsPlug = { 'commands': ''};

  let commands = {};

  cmds.forEach(c => { 
    commands[c.command] = c;
    commandsPlug['commands'] += t.plug(
    `// ~command~ command
  .command('~command! ~', '~description! ~')
  .example('~example! ~')
    `, c); });

  argvStr = t.plug(yargsTemplate, commandsPlug);

appUtils.tryWriteFile('./', 'argv.js', argvStr);
appUtils.tryWriteFile('./', 'cmd.json', JSON.stringify(commands, null, '\t'));