var semver = require('semver');
var child_process = require('child_process');
var path = require('path');
var Promise = require('bluebird');

var args = process.argv.reduce(function(prev, arg, idx){
  if(idx === 1){
    prev['date'] = new Date(arg);
  } else {
    prev['args'].push(arg)
  }
  return prev
}, {args:[]});

function view(dep, args){
  var defer = Promise.defer();
  var ver = dep.version;

  var proc = child_process.spawn('npm', ['view', dep.name]);
  var outBuffer = '';

  proc.stdout.setEncoding('utf8');
  proc.stdout.on('data', function(data){
    outBuffer += data
  });

  proc.stderr.setEncoding('utf8');
  proc.stderr.on('data', function(data){
    console.log(data);
  });

  proc.on('close', function(code){
    var out = null;

    eval('out = ' + outBuffer)

    var versions = null;
    if(out.versions instanceof Array){
      versions = out.versions
    } else {
      versions = [out.versions]
    }

    var versionsFiltered = versions.filter(function(version){
      return semver.satisfies(version, ver)
    });

    var times = [];
    for(var version in out.time){
      if(new Date(out.time[version]) < args.date){
        times.push({version:version, time: out.time[version]});
      }
    }

    times = times.sort(function(a,b){
      return new Date(a.time) - new Date(b.time)
    }).filter(function(verTime){
      for(var idx in versionsFiltered){
        if(versionsFiltered[idx] === verTime.version){
          return true;
        }
      }

      return false;
    });

    var last = times[times.length - 1]
    if(!last){
      defer.reject()
      return
    }
    install(dep.name + '@' + last.version, args)
    .then(function(){defer.resolve()})
  });

  return defer.promise;
}

function install(module, args){
  var defer = Promise.defer();
  var proc = child_process.spawn('npm', ['install', module]);

  proc.stdout.setEncoding('utf8');
  proc.stdout.on('data', function(data){
    process.stdout.write(data);
  });

  proc.stderr.setEncoding('utf8');
  proc.stderr.on('data', function(data){
    process.stderr.write(data);
  });

  proc.on('close', function(code){
    if(code === 0){
      //Go into node_modules
      //Find Module
      //Execute flashback at root

      var child = child_process.spawn('flashback', [ args.date.toString(), module.split('@')[0]]
        , {cwd:path.join(process.cwd(), 'node_modules/' + module.split('@')[0])}
      );

      child.stdout.setEncoding('utf8');
      child.stdout.on('data', function(data){
        process.stdout.write(data)
      });

      child.stderr.setEncoding('utf8');
      child.stderr.on('data', function(data){
        process.stderr.write(data);
      });

      child.on('close', function(code){
        if(code === 0){
          defer.resolve();
        } else {
          defer.reject();
        }
      })

    } else {
      defer.reject();
    }
  });

  return defer.promise;
}

var packageJson = require(path.join(process.cwd(), 'package.json'));
var deps = [];
for (var dep in packageJson.dependencies){
  deps.push({name:dep, version:packageJson.dependencies[dep]})
}

Promise.reduce(deps, function(prev, dep){
  return view(dep, args)
}, null)
