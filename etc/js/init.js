// init.js
// Set up directories and the environment

// Paths are relative to current directory, would be better if node
// could pull the directory of the script itself, if the script is called
// from a parent directory, e.g.
var
    fs          = require('fs'),
    mkdirp      = require('mkdirp'),
    async       = require('async'),
    currentpath = process.env.PWD,
    paths       = {
        'rootpath'    : currentpath + "/../../",
        'apppath'     : currentpath + "/../../TEST/app/",
        'buildpath'   : currentpath + "/../../TEST/build/",
        'configpath'  : currentpath + "/../config"
    };
    dirs = [
        paths.apppath + 'base/images',
        paths.apppath + 'base/lib',
        paths.apppath + 'base/styles',
        paths.apppath + 'base/views',
        paths.apppath + 'modules',
        paths.buildpath + 'public/css',
        paths.buildpath + 'public/fonts',
        paths.buildpath + 'public/img',
        paths.buildpath + 'public/js',
    ];

// Check if config file exists
if (!fs.existsSync(paths.configpath)) {
    return console.log("ERROR: Config file not found. Please run node configure.js <profile>");
} else {
    // Make all the directories listed in dirs.
    // Uses async so that creating the index.less file doesn't happen
    // until all the parent directories are created.
    async.map(dirs, mkdirp, function (err, results) {
        // Create style.less file
        fs.open(paths.apppath + 'base/styles/index.less', 'w');
    });
}


