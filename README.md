# Mishra

Mishra is a front-end project template for building applications
with Browserify and Node modules. It is an opinionated structure
that allows great flexibility and easy compilation. 

## Installation

Get the node and bower packages:

```bash
npm install
bower install
```

Next, set up an environment profile in the `etc/env/` directory.
There's a sample file in there to get you started. Run the init
scripts to set up your environment. The syntax for
this command, using the 'local' environment is:

```bash
node etc/js/configure.js local
node etc/js/init.js
```

Routing is handled through server rewrites and those need to be
copied to your nginx/apache config. Both nginx and Apache have
examples here. The configuration is specified in `etc/nginx.conf`
or `etc/htaccess` respectively, and the `root` should point to
the `build/` directory of this application. If you're using Apache,
put the `.htaccess` file in `build/`.

## Building

To build your modules, the syntax is:

```bash
node etc/js/build.js [options] [module|base|all]
```

You can run `build.js` with the -h or --help option to see info
about the script. The build script will:

1. Copy all vendor javascript files to the build path
2. Copy all vendor stylesheets to the build path
3. Run browserify for the specified modules, creating a module
   bundle in the build path

## CSS Compilation

CSS is compiled using `lessc`. All of your module stylesheets
should exist in `app/modules/<module>/styles/` and you should
`@import` all of your module stylesheets in an `index.less` within
that directory.

## Watching

Currently, CSS watching isn't set up. The plan is to set up
a gulpfile for css watching that you would run separately.

## Working Demo

To see an application using Mishra in action, check out
[https://github.com/TeachBoost/mox](Mox). This application uses
Mishra to build a bundle of all common JavaScript, CSS, image,
and font assets for other applications to use.