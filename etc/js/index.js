// Runs all files required below
// to run:
// $ node index.js [module(s)]

var 
    // defaults     = require('../defaultsjs'),
    // build        = require('./build'),
    terminal-menu   = require('terminal-menu'),
    fs              = require('fs'),
    mkdirp          = require('mkdirp'),
    childProcess    = require('child_process'),
    modules         = [];

// If the user has entered options, read them into a nicer array
// First two are always "node" and the filename that's being run
if (process.argv.length > 2){
    for (i=2; i < process.argv.length; i++) {
        modules.push(process.argv[i]);
    }
}



// Prompt for user input so user only ever has to run index.js

var menu = terminalMenu({
  width: 60,
  bg: 10,
  fg: 15,
  x: 4,
  y: 2
});

menu.reset();
menu.write('What would you like to do?\n');
menu.write('-------------------------\n');

menu.add('Full Setup (Configure, Init, Routing');
menu.add('Configure');
menu.add('Init');
menu.add('Routing');
menu.add('Build');
menu.add('Watch');

menu.on('select', function (label, index) {
    menu.close();
    console.log('Running: ' + label);
    setup(menu.selected);
});
menu.createStream().pipe(process.stdout);

function setup(choice) {
    switch (choice) {
        case 0:
            // Full setup
            break;
        case 1:
            // Configure
            runFile(__dirname + '/configure');
            break;
        case 2:
            // Init
            runFile(__dirname + '/init');
            break;
        case 3:
            // Routing
            break;
        case 4:
            // Build
            runFile(__dirname + '/build');
            break;
        case 5:
            // Watch
            break;
        default:
            // nada
            break;
    }
}

function runFile(fileName) {
    // fork specifically runs a Node process, so the "node"
    // part of the command is unnecessary
    var setupProcess = childProcess.fork(fileName + ".js", function (error, stdout, stderr) {
        console.log(stdout);
        console.log(stderr);
        if (error !== null) {
            console.log('exec error: ' + error);
        }
    });

    setupProcess.on('close', function (code) {
      console.log('Completed ' + fileName);
    });
}
// Make build directories if they don't already exist
// mkdirp(paths.buildPath + '/js');
// mkdirp(paths.buildPath + '/css');

