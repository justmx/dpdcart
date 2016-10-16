var config = require('config');
var Job = require('./jobs/job');
var Q = require('q');
var prompt = require('prompt');

//var domains = config.get('domains');
var domain = config.get('domains')[0];
// domains.map(function(domain, _i){
// var job = new Job('down_load_clips_Job', domain, Q, ['253']);
// job.run().then(function() {
//   console.log('ok');
// });
// });
function getUserEnter() {
  //console.log('Lists DownLoad Completed. Please Select following Options: ');
  console.log('1. DownLoad All Episodes With All Files.');
  console.log('2. DownLoad Selected Episode: ');
  console.log('3. DownLoad Latest Three Episodes: ');
  var deferred = Q.defer();
  prompt.start();
  var received = '';
  prompt.get(['Option'], function(err, result) {
    console.log('Command-line input received:');
    console.log('  Option: ' + result.Option);
    switch (result.Option) {
      case '1':
        deferred.resolve('all');
        break;
      case '2':
        deferred.resolve('selected');
        break;
      case '3':
        deferred.resolve('lastThree');
        break;
    }
  });
  return deferred.promise;
}

function getEpisodeNumber() {
  console.log('Lists DownLoad Completed. Please Select Episode Number: ');
  var deferred = Q.defer();
  prompt.start();
  //var received = '';
  prompt.get(['episodeNumber'], function(err, result) {
    console.log('Command-line input received:');
    console.log('Episode Number: ' + result.episodeNumber);
    deferred.resolve(result.episodeNumber);
  });
  return deferred.promise;
}

function startJob() {
  getUserEnter().then(function(select) {
    if (select === 'all') {
      console.log('DownLoad All Episodes!! This will take a while...');
      downloadAllEpisode();
      // run srape all jobs
    } else if (select === 'selected') {
      console.log('DownLoading Episode list, Please Wait...');
      getEpisodeList().then(function() {
        getEpisodeNumber().then(function(episodeNumber) {
          downLaodSeletedEpisode(episodeNumber);
        })
      }).fail(function(err) {
        console.error('err');
      });
    } else if (select === 'lastThree') {
      console.log('DownLoading Latest Three Episodes, Please Wait...');
      downloadLastestThreeEpisode();
    }
  }).fail(function(error) {
    console.error(error);
  })
}

function downloadAllEpisode() {
  var deferred = Q.defer();
  var job = new Job('download_all_Job', domain, Q);
  job.run().then(function() {
    console.log('OK. All Episodes are downloaded!!');
  }).fail(function(error) {
    console.error('Trouble with DownLoading Selected File. Error ' + error);
  });
};


function downloadLastestThreeEpisode() {
  var deferred = Q.defer();
  var job = new Job('download_all_Job', domain, Q, ['3']);
  job.run().then(function() {
    console.log('OK. All Episodes are downloaded!!');
  }).fail(function(error) {
    console.error('Trouble with DownLoading Selected File. Error ' + error);
  });
};


function downLaodSeletedEpisode(episodeNumber) {
  var deferred = Q.defer();
  var job = new Job('download_selected_clip_Job', domain, Q, [episodeNumber]);
  job.run().then(function() {
    console.log('ok');
  }).fail(function(error) {
    console.error('Trouble with DownLoading Selected File. Error ' + error);
  });
};

function getEpisodeList() {
  var deferred = Q.defer();
  var job = new Job('scrape_episode_list_job', domain, Q);
  return job.run();
}

startJob();
//getEpisodeList();