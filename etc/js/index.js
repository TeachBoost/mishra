// Runs all files required below
// to run:
// $ node index.js [module(s)]

var 
    defaults  = require('../defaultjs'),
    build     = require('./build'),
    fs        = require('fs'),
    mkdirp    = require('mkdirp'),
    currentpath = process.env.PWD,
    paths     = {
        'rootpath'    : currentpath + "/../../",
        'basepath'    : currentpath + "app/base",
        'modulepath'  : currentpath + "app/modules",
        'buildpath'   : currentpath + "build/public",
        'vendorpath'  : currentpath + "vendor"
    },
    modules   = [];

// If the user has entered options, read them into a nicer array
// First two are always "node" and the filename that's being run
if (process.argv.length > 2){
    for (i=2; i < process.argv.length; i++) {
        modules.push(process.argv[i]);
    }
}
console.log (modules);

// Make build directories if they don't already exist
mkdirp(paths.buildpath + '/js');
mkdirp(paths.buildpath + '/css');

build.browserify(paths, defaults.dependencies(paths.vendorpath));