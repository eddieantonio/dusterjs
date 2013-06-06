Duster.js 
==========
_Node script to watch & precompile directory of dustjs templates_

Based on the original script by Dan McGrady <http://dmix.ca>

A simple Node script `duster.js` to watch a directory of .dust templates and compile them into .js files which can be included into an HTML file.

Why? The dust.js documentation does not mentioned a clear way to work with dust templates in a purely client-side approach, instead focusing on server-side node.js applications.

For my backbone.js app, the only option was to include the dust-full.js file and compile the templates on each browser load. The file is much larger than the normal dust-core.js and this approach provides no extra value over other templating solutions (performance, browser caching, external file management etc).

So I wrote a script to pre-compile dust.js files whenever they are modified in a folder.

## Install

Clone this repository
    
```sh
git clone
```

Run the installation 

```sh
npm install
```

Optional:

OS X users can use Growl or [terminal-notifier](https://github.com/alloy/terminal-notifier).

## Usage

Create a file named `.dusterjs` in your current working directory and add the input and output paths to it. The format is a simple JSON file

Example: 

```json
{
  "input_path": "./test/src",
  "output_path": "./test/dest"
}
```

Create dust.js templates in the `input_path` directory with the file extension `.dust` and create `output_path` directory where files will be compiled to.  Then run the watcher script:

```sh
node duster.js
```

## Example:

    <input_path>/tweet.dust
    <input_path>/user.dust

Compiles to:

    <output_path>/tweet.js
    <output_path>/user.js

## Changes by Suresh Jayanty

 * Added support for growl notifications
 * Added support for settings file
 * Ignoring .swp files created when some one uses vim to edit the dust files

## Changes by eddieantonio

 * Hilariously undermined Suresh's contributions:
    - Changed built-in growl to [node-growl](https://github.com/visionmedia/node-growl)
    - Changed YAML format to JSON format. Not quite sure why I did this. :/
    - Changed settings file to the current working directory (as opposed to
      home directory).

