// # duster.js  
//
// Watch directory of dust.js templates and automatically compile them
// by Dan McGrady http://dmix.ca
// Modifications by Suresh Jayanty
// Additional modifications by Eddie Antonio Santos <easantos@ualberta.ca>
var fs = require('fs')
  , dust = require('dustjs-linkedin')
  , watch = require('watch')
  , growl = require('growl')
  , colors = require('colors')
  , childprocess = require('child_process')

  , file_options = {
    'input_path': './src.dust',
    'output_path': './dust'
  }
  , user_settings_file = process.env['HOME'] + '/.dusterjs',
  , ignoreRegexes = {
      'svn': /\.svn/
    , 'swp': /\.swp/,
    , 'git': /\.git/
    }
  , dustRegex = /\.dust$/
  ;


/**
 * Creates a Growl message.
 */
function growl(message, sticky) {
  var command = '/usr/local/env growlnotify -p 1 -m "' + message + '"', growlnotice;

  if (sticky) {
    command += ' -s';
  }

  growlnotice = childprocess.exec(command, function(error, stdout, stderr) {});
  growlnotice.on('exit', function(code) {});
}

/**
 * Determines whether the filename should be ignored, determined by the given
 * `ignore` object of regexes.
 */
function shouldIgnore(ignores, filename) {
  var regex;

  // Check the filename against EVERY regex.
  for (regex in ignores) {
    if (filename.match(regex)) {
      return true;
    }
  }

  // All have been checked. We're good to go!
  return false;
}

function compileDust(path, curr, prev) {

  // Check if we should ignore the file.
  if (shouldIgnore(ignoreRegexes, path)) {
    console.log(('Ignoring file: ' + path).red);
    return;
  }

  // Read the file.
  fs.readFile(path, function(err, data) {
    if (err) {

      growl('Error: ' + err + ' : ' + path , { sticky: true });
      throw err;
    }

    var filename = path.split("/").reverse()[0].replace(".dust", "");
    var filepath = file_options.output_path +  '/' + filename + ".js";
    var compiled = '';
    try {
      compiled = dust.compile(new String(data), filename);

      fs.writeFile(filepath, compiled, function(err) {
        if (err) {
          growl('Error: ' + err, { sticky: true });
          throw err;
        }
        console.log('Saved ' + filepath);
        growl('Saved ' + filepath);
      });
    } catch (err) {
      growl('Error: ' + err, { sticky: true });
    }
  });
}

function createMonitor() {
  try {
    watch.createMonitor(file_options.input_path, {
      'ignoreDotFiles': true
    }, function(monitor) {
      console.log("Watching " + file_options.input_path);
      monitor.files['*.dust', '*/*'];
      monitor.on("created", compileDust);
      monitor.on("changed", compileDust);
    });
  } catch (err) {
    growl('Error: ' + err, { sticky: true });
    console.log(err);
  }
}

function processCurrentFiles() {
  fs.readdir(file_options.input_path, function(err, files) {
    if(!err) {
      files.forEach(function(filename) {
        var dustFile;
        if(!dustRegex.exec(filename)) {
          return;
        }
        dustFile = filename.replace('.dust', '') + '.js';
        fs.stat(file_options.output_path + '/' + dustFile, function(err, props) {
          if(err) {
            console.log('file not found: ' + file_options.output_path + '/' + dustFile);
            compileDust(file_options.input_path + '/' + filename);
          }
        });
      });
    }
  });
}

function main() {
  fs.exists(user_settings_file, function(exists) {
    if (exists) {
      fs.readFile(user_settings_file, 'utf8', function(err, data) {
        if (err) {
          return;
        }

        try {
          // TODO: use JSON instead
          yaml.loadAll(data, function(doc) {
            if (doc.input_path) {
              file_options.input_path = doc.input_path;
            }
            if (doc.output_path) {
              file_options.output_path = doc.output_path;
            }

            growl('Watching ' + file_options.input_path + ' for changes');
            growl('Saving compiled templates to ' + file_options.output_path);

            processCurrentFiles();
            createMonitor();
          });
        } catch (err) {
          growl('Error: ' + err, { sticky: true });
        }
      });
    } else {
      growl('Watching ' + file_options.input_path + ' for changes');
      growl('Saving compiled templates to ' + file_options.output_path);

      processCurrentFiles();
      createMonitor();
    }
  });
}

main();
