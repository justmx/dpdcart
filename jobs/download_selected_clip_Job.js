/* libs vars */
var fs = require('fs');
var casper = require('casper').create();
var _ = require(fs.absolute(fs.workingDirectory + '/includes/underscore.js'));
var helpers = require(fs.absolute(fs.workingDirectory + '/shared/helpers'))(casper, _);
var utils = require('utils');
/* job vars */
//var data = casper.cli.options.data.split('@@');
var selected_episode = casper.cli.options.data;
var url = casper.cli.options.url;
var content = {};
content.number = selected_episode;
// var linkList = [];
// var episode_num = 2;

function getEpisodeInfo(_this) {
  _this.wait(3000, function() {
    content.link = _this.evaluate(function(mainUrl, episode_num) {
      var css = 'h3:contains("' + episode_num + ' - ")';
      var blogEntries = $(css).parent();
      return mainUrl + $(blogEntries).find('a:last').attr('href');
    }, url, selected_episode);
    casper.echo(content.link);
  });
}

function getFilesInfo(_this) {
  var list = [];
  // _this.then(function() {
  list = _this.evaluate(function() {
    var blogEntries = $('a#files +ul a');
    var _list = [];
    $.each(blogEntries, function(section_i, sectionDiv) {
      var file = {};
      file.name = $(sectionDiv).text().trim();
      file.link = $(sectionDiv).attr('href');
      _list.push(file);
    });
    return _list;
  });
  //_this.echo('list: ' + JSON.stringify(list));
  return list;
  //  });
}

function checkEpisode(_this, _link, _num) {
  _this.then(function() {
    helpers.navigateTo(_link);
  });
  _this.waitForSelector('#files', function() {
    _this.wait(4000, function() {
      var c_episoe_list = [];
      c_episoe_list = getFilesInfo(_this);

      _this.then(function() {
        //_this.echo('c_episoe_list: ' + JSON.stringify(c_episoe_list));
        var i = 0;
        _this.echo('Files to download: ' + c_episoe_list.length + ' in Episode ' + _num);
        _this.repeat(c_episoe_list.length, function() {
          downloadClip(_this, c_episoe_list[i], _num)
          i++;
        });
      });
    });
  });
}

function downloadClip(_this, _clip, _num) {
  _this.then(function() {
    var target = url + _clip.link;
    //_this.echo('file_url: ' + target);
    var fname = _clip.name;
    var _genfile_path = fs.pathJoin(fs.workingDirectory, 'files', _num);
    if (fs.makeDirectory(_genfile_path + '/')) {
      casper.echo('New Path Created!');
    }
    var fpath = fs.pathJoin(_genfile_path, fname);
    _this.then(function() {
      if (!fs.exists(fpath)) {
        _this.echo('Start to download file ' + fname + ' to folder ' + _genfile_path);
        _this.download(target, fpath);
      } else {
        _this.echo(fname + ' exists, skip downloading!');
      }
    });
  });
}
/* start job */

helpers.login();


//h.navigateTo(video_url);
casper.then(function() {
  this.then(function() {
    getEpisodeInfo(this);
  });
  this.then(function() {
    checkEpisode(this, content.link, content.number);
  });
  this.then(function() {
    helpers.complete();
  });
});

casper.run();