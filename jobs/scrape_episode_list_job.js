/* libs vars */
var fs = require('fs');
var casper = require('casper').create();
var _ = require(fs.absolute(fs.workingDirectory + '/includes/underscore.js'));
var helpers = require(fs.absolute(fs.workingDirectory + '/shared/helpers'))(casper, _);
var utils = require('utils');
/* job vars */
var url = casper.cli.options.url;
var contentList = [];
var linkList = [];
var episode_num = 2;
var contentTextToWrite = '';
var contentTextToShow = '';

/* job functions */
function getCourseTitle(_this) {
  _this.then(function() {
    var title = _this.evaluate(function() {
      var titleDiv = $('#side-menu #course-title h1');
      return titleDiv.html();
    });
    courseTitle = helpers.str(title);
    _this.echo('Title :' + courseTitle + '__==__');
  });

  // expending all clips
  _this.then(function() {
    _this.evaluate(function() {
      $('#side-menu section.module').not('.open').find('header').click()
    });
  });

  // create folder if not existed
  _this.then(function() {

  });
}


function fileName(section, clip) {
  return [
    helpers.num(section.index),
    section.header,
    helpers.num(clip.index),
    clip.header
  ].join('_');
}

function fileLink(clip) {
  return ('#side-menu section.module li h3.title[data-reactid="' + clip.reactId + '"]')
}

function createMeunFile(_contentlist) {
  casper.echo('Elixirsips Episode List: ')
  _contentlist.map(function(obj, index) {
    var list = obj.number + ': ' + obj.name + '.   Files Attached: ' + obj.file_number;
    contentTextToShow += list + '\n';
    contentTextToWrite += list + ' link: ' + obj.link + '\n';
  });
  var fname = 'Episodelist.txt';
  var file_path = fs.pathJoin(fs.workingDirectory, 'files', fname);
  fs.write(file_path, contentTextToWrite, 'w');
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

/* start job */

helpers.login();

casper.then(function() {
  this.then(function() {
    getContentList(this);
  });
  this.then(function() {
    casper.echo(contentTextToShow.trim());
  });
  this.then(function() {
    helpers.complete();
  });
});

casper.on('resource.received', function(resource) {
  "use strict";
  if ((resource.url.indexOf("mp4") !== -1)) {
    this.echo(resource.url);
    var url, file;
    url = resource.url;
    file = "clip.mp4";
    try {
      this.echo("Attempting to download file " + file);
      var fs = require('fs');
      casper.download(resource.url, fs.workingDirectory + '/' + file);
    } catch (e) {
      this.echo(e);
    }
  }
});

casper.run();