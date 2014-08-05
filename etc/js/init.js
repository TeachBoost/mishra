// init.js
// Set up directories and the environment

// Paths are relative to current directory, would be better if node
// could pull the directory of the script itself, if the script is called
// from a parent directory, e.g.
var
    fs              = require('fs'),
    mkdirp          = require('mkdirp'),
    async           = require('async'),
    scriptPath      = __dirname + "/",
    defaults        = JSON.parse(fs.readFileSync(scriptPath + '/../defaults.json', 'utf8')),
    paths           = defaults.paths,
    appPath         = scriptPath + paths.appPath,
    buildPath       = scriptPath + paths.buildPath,
    configPath      = scriptPath + "/../config.json",
    // should move these to defaults
    dirs            = [
        appPath + 'base/images',
        appPath + 'base/lib',
        appPath + 'base/styles',
        appPath + 'base/views',
        appPath + 'modules',
        buildPath + 'css',
        buildPath + 'fonts',
        buildPath + 'img',
        buildPath + 'js',
    ];


// Check if config file exists
if (!fs.existsSync(configPath)) {
    console.log(configPath);
    return console.log("ERROR: Config file not found. Please run node configure.js <profile>");
} else {
    // Make all the directories listed in dirs.
    // Uses async so that creating the index.less file doesn't happen
    // until all the parent directories are created.
    async.map(dirs, mkdirp, function (err, results) {
        // Create style.less file
        if (!fs.existsSync(appPath + 'base/styles/index.less')) {
            fs.open(appPath + 'base/styles/index.less', 'w');
        }
    });
}


