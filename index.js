var hue = require("node-hue-api");
var github = require('octonode');
var HueApi = hue.HueApi;
var lightState = hue.lightState;
var Q = require('q');

var lightId = parseInt(process.env.HUE_LIGHT_ID);

var githubClient = github.client({
  username: process.env.GITHUB_USERNAME,
  password: process.env.GITHUB_PASSWORD
});

var greenState = lightState.create().on().rgb(0,255,0).saturation(100).brightness(40);
var yellowState = lightState.create().on().rgb(255,165,0).saturation(100).brightness(50);
var redState = lightState.create().on().rgb(255,0,0).saturation(100).brightness(100);

function numberOfOpenPrs() {
  var deferred = Q.defer();
  githubClient.search().issues({
    q: 'user:' + process.env.GITHUB_ORG + '+is:open+no:label',
  }, function(err, result) {
    if (err) {
      deferred.reject(new Error(err));
    } else {
      deferred.resolve(result.total_count);
    }
  });
  return deferred.promise;
}

function bridge() {
  return hue.nupnpSearch().then(function(bridges) {
    return new HueApi(bridges[0].ipaddress, process.env.HUE_PASSWORD);
  });
}

function check() {
  console.log('Checking for PRs');
  Q.spread([bridge(), numberOfOpenPrs()], function (bridge, openPrs) {
    if (openPrs > 4) {
      console.log('Set red state');
      bridge.setLightState(lightId, redState).done();
    } else if (openPrs > 1) {
      console.log('Set yellow state');
      bridge.setLightState(lightId, yellowState).done();
    } else {
      console.log('Set green state');
      bridge.setLightState(lightId, greenState).done();
    }
  });
};

check();
setInterval(check, 1000 * 60 * 1);
