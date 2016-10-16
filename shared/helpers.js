module.exports = function(casper, _) {

  casper.options.clientScripts = [
    'includes/underscore.js',
    'includes/jquery.min.js'
  ];
  casper.options.viewportSize = {
    width: 1024,
    height: 768
  };
  casper.options.pageSettings = {
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_2) AppleWebKit/537.11 (KHTML, like Gecko) Chrome/23.0.1271.97 Safari/537.11",
    loadImages: false, // The WebPage instance used by Casper will
    loadPlugins: false // use these settings
  };
  casper.options.logLevel = "error"; // Only "info" level messages will be logged
  casper.options.verbose = true;


  function login() {
    var username = casper.cli.options.username;
    var password = casper.cli.options.password;
    var domain = casper.cli.options.domain;
    var url = casper.cli.options.url;

    casper.start(url, function() {
      this.page.clearCookies();
      this.then(function() {
        this.fill('form', {
          'username': username,
          'password': password
        }, true);
      });
      this.waitForSelector('#blog-container', function() {
        //this.echo('successful longin: ' + this.getCurrentUrl());
      });
    });
  }

  function navigateTo(url) {
    casper.thenOpen(url, {}, function() {
      //this.capture('navigateTo.png');
      //this.echo('navigateTo : ' + this.getCurrentUrl());
    });
  }

  function str(val) {
    return val.toString().trim().replace(/[^a-zA-Z0-9]/g, "_");
  }

  function num(number, size) {
    size = size || 2
    return ('0000' + number).substr(-size);
  }

  function complete() {
    casper.then(function() {
      casper.echo('Job Completed!');
      casper.exit();
    });
  }

  function error() {
    var start = new Date();
    waitForever(start);
  };

  function waitForever(start) {
    if ((new Date() - start) < 3600000) {
      casper.waitForSelector('.never-happen', function() {}, function() {
        waitForever(start);
      }, 60000);
    } else {
      casper.echo('ERROR: Exit stucked job after 1h');
      exit();
    }
  }


  function exit() {
    casper.then(function() {
      casper.echo('force_error');
      casper.exit();
    });
  }



  return {
    login: login,
    navigateTo: navigateTo,
    str: str,
    num: num,
    complete: complete,
    error: error,
    exit: exit
  };
};