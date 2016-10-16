/* libs vars */
var fs = require('fs');
var casper = require('casper').create();
var _ = require(fs.absolute(fs.workingDirectory + '/includes/underscore.js'));
var helpers = require(fs.absolute(fs.workingDirectory + '/shared/helpers'))(casper, _);
var utils = require('utils');
/* job vars */
var url = casper.cli.options.url;
var contentList = [];
// var linkList = [];
var episode_num = casper.cli.options.data;
/* job functions */

function createMeunFile(_contentlist) {
  var contentText = '';
  //var cp = _contentlist;
  if (typeof(episode_num) === 'boolean') {
    episode_num = _contentlist.length;
  }
  casper.echo('episode_num: ' + episode_num);
  casper.echo('Elixirsips Episode List: ');
  _contentlist.map(function(obj, index) {
    var list = obj.number + ': ' + obj.name + '.   Files Attached: ' + obj.file_number + '. link: ' + obj.link + '\n';
    casper.echo(obj.number + ':    ' + obj.name + '. Files Attached: ' + obj.file_number);
    contentText += list;
  });
  var fname = 'Episodelist.txt';
  var file_path = fs.pathJoin(fs.workingDirectory, 'files', fname);
  fs.write(file_path, contentText, 'w');
}



function getContentList(_this) {
  _this.wait(3000, function() {
    contentList = _this.evaluate(function(mainUrl) {
      var blogEntries = $('.blog-entry');
      list = [];
      $.each(blogEntries, function(section_i, sectionDiv) {
        var blog = {};
        var name = $(sectionDiv).find('h3').text();
        blog.content = $(sectionDiv).find('p').text().trim();
        blog.number = name.split(' - ')[0];
        blog.name = name.split(' - ')[1];
        blog.link = mainUrl + $(sectionDiv).find('.content-post-meta a').attr('href').replace("#files", '');
        blog.file_number = $(sectionDiv).find('.content-post-meta a').text().split(' ')[0];
        list.push(blog);
      });
      return list;
    }, url);
    _this.then(function() {
      createMeunFile(contentList);
    });
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

function downloadLastNClip(_this, episode_num) {
  _this.then(function() {
    var s = 0;
    _this.echo(episode_num + ' Episodes To download... ');
    _this.repeat(episode_num, function() {
      var link = contentList[s].link;
      var number = contentList[s].number;
      // _this.echo('link: ' + link + ' number: ' + number);
      checkEpisode(_this, link, number);
      s++;
    });
  });
}

/* start job */

helpers.login();

casper.then(function() {
  this.then(function() {
    getContentList(this);
  });
  this.then(function() {
    downloadLastNClip(this, episode_num);
  });
  this.then(function() {
    helpers.complete();
  });
});

casper.run();