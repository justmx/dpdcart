function Job(job_type, domain, Q, arglist) {
  this.job_type = job_type;
  this.username = domain.username;
  this.password = domain.password;
  this.url = domain.url;
  this.domain = domain.domain;
  this.Q = Q;
  this.arglist = arglist;
}

Job.prototype.handleStadoutData = function(data, deferred) {
  if (data.indexOf('Completed') !== -1) {
    console.log(this.job_type + ' Completed!');
    deferred.resolve('ok');
  } else {
    console.log(data.replace('\n', ''));
  }
}



Job.prototype.run = function() {
  var that = this;
  var exec = require('child_process').exec;
  var deferred = this.Q.defer();

  var args = this.arglist ? this.arglist[0] : ''; //doggy

  var command = [
    'casperjs',
    './jobs/' + this.job_type + '.js',
    '--verbose',
    //'--log-level=debug',
    '--disk-cache=true',
    '--engine=slimerjs',
    '--ssl-protocol=any',
    '--data=' + args,
    // '--ignore-ssl-errors=true',
    '--domain=' + this.domain,
    '--username="' + this.username + '"',
    '--password=' + this.password,
    '--url="' + this.url + '"'
  ].join(' ');

  var ci = exec(command, function(err, stdout, stderr) {
    //if (err){
    //console.error('Error: ' + err);
    //}
    // if (stdout) {
    //   deferred.resolve('ok');
    //   console.log(stdout);
    // }
    // if (stderr) {
    //   deferred.reject(stderr);
    //   console.log('stderr ' + stderr);
    // }
  });

  ci.stdout.on('data', function(data) {
    try {
      that.handleStadoutData(data, deferred);
      //console.log('stdout ' +  data + ' end');
    } catch (e) {
      // logger.log(e);
    }
  });
  return deferred.promise;
};
module.exports = Job;