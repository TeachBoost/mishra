// init.js
// Set up directories and the environment

// Paths are relative to current directory, would be better if node
// could pull the directory of the script itself, if the script is called
// from a parent directory, e.g.
var
    fs          = require('fs'),
    mkdirp      = require('mkdirp'),
    async       = require('async'),
    currentPath = process.env.PWD,
    paths       = {
        'rootPath'    : currentPath + "/../../",
        'appPath'     : currentPath + "/../../TEST/app/",
        'buildPath'   : currentPath + "/../../TEST/build/",
        'configPath'  : currentPath + "/../config"
    };
    dirs = [
        paths.appPath + 'base/images',
        paths.appPath + 'base/lib',
        paths.appPath + 'base/styles',
        paths.appPath + 'base/views',
        paths.appPath + 'modules',
        paths.buildPath + 'public/css',
        paths.buildPath + 'public/fonts',
        paths.buildPath + 'public/img',
        paths.buildPath + 'public/js',
    ];

// Check if config file exists
if (!fs.existsSync(paths.configPath)) {
    return console.log("ERROR: Config file not found. Please run node configure.js <profile>");
} else {
    // Make all the directories listed in dirs.
    // Uses async so that creating the index.less file doesn't happen
    // until all the parent directories are created.
    async.map(dirs, mkdirp, function (err, results) {
        // Create style.less file
        if (!fs.existsSync(paths.appPath + 'base/styles/index.less')) {
            fs.open(paths.appPath + 'base/styles/index.less', 'w');
        }
    });
}


