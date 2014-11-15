var tramControllers = angular.module('tramControllers', ['ngRoute']);

tramApp.config(function($routeProvider) {
  $routeProvider
    .when('/new', {
      controller:'EditCtrl',
      templateUrl:'edit.html'
    })
    .when('/view/:viewId', {
      controller:'TramCtrl',
      templateUrl:'tram.html'
    })

    .when('/edit/:viewId', {
      controller:'EditCtrl',
      templateUrl:'edit.html'
    })

    .otherwise({
      redirectTo:'/new'
    });
})

tramApp.controller('EditCtrl', ['$scope', '$location', '$routeParams', 'Tram', 'storage', function($scope, $location, $routeParams, Tram, storage) {
  // actually no need for much here yet

  $scope.viewId = $routeParams.viewId;
  $scope.view = _.clone(storage.getView($routeParams.viewId));

  $scope.save = function() {
    console.log("Saving ", $scope.view);
    storage.saveView($scope.view);
    $location.path('/view/' + $scope.view.id);
  }

  $scope.delete = function() {
    console.log("Deleting ", $scope.view);
    storage.deleteView($scope.view);
    $scope.view = null;
  }

  $scope.getStations = function(text) {
    console.log("Autocomplete: ", text);

    return Tram.autocomplete({query:text}).$promise.then(function(stations){
      console.log("Got stations: ", stations);
      
      var result = _.map(stations.stations, function(station){
        return {
          name: station.name,
          id: station.id
        };
      })
      console.log("Autocomplete: ", result);
      return result;
    });
  }

}]);

tramApp.controller('TramCtrl', ['$scope', '$routeParams', '$timeout', 'storage', 'Tram', function($scope, $routeParams, $timeout, storage, Tram) {

  $scope.viewId = $routeParams.viewId;
  $scope.refreshInterval = 10000;

  /**
   * We initialize the model with nothing
   */
  $scope.trams;

  /*$scope.hjs = HueJS({
            ipAddress:"10.10.0.195",
                devicetype:"test user",
                username: "newdeveloper"
            });*/

  /**
   * We regularly update the model with the new departures.
   */
  (function update() {
    $timeout(update, $scope.refreshInterval);
    console.log('Updating data. Current data, trams: ', $scope.trams);

    // if the view is set
    if ($scope.viewId) {
      var currentView = storage.getView($routeParams.viewId);

      Tram.queryStation({station: currentView.station.id}, function(trams) {
        console.log("Handling answer for station: ", currentView.station, ", answer: ", trams);

        // we get the trams that interest us 
        var filteredTrams = _.filter(trams, function(tram) {
          var keywords = currentView.keywords.trim().length == 0 ? [] : currentView.keywords.split(',')

          // we find any word in "contains" that matches the destination
          // if it's more than 0, then we know it matches
          var foundWords = _.find(keywords, function(word) {
            // console.log("Checking if ", tram.to, " contains ", word);

            return tram.to.toLowerCase().indexOf(word.trim().toLowerCase()) != -1
          });
          // console.log("Found words ", foundWords, " for ", tram.to)
          return keywords.length == 0 || (foundWords != undefined && foundWords.length > 0);
        })

        console.log("Found trams for station ", currentView.station, ": ", filteredTrams);

        // this is to initialize scope.trams if it's not done yet (first time this is executed)
        if (!$scope.trams) {
          $scope.trams = filteredTrams
        }

        // we extend the tram list with the new tram stuff
        _.each($scope.trams, function(element, index){
          _.extend(element, filteredTrams[index]);
        })

        // we set the light
        /*var firstTram;
        if ($scope.trams[$scope.viewId]) {
          var tramsBwn3and4Min = _.filter($scope.trams[$scope.viewId], function(tram) {
            return (tram.in_minutes <= 4 && tram.in_minutes >=3);
          })
          // we found a tram
          if (tramsBwn3and4Min.length > 0) {
            firstTram = tramsBwn3and4Min[0];
          }
        }
        if (firstTram && (firstTram.number == 10 || firstTram.number == 14)) {
          console.log("Setting lamp to colored");
          var hue = firstTram.number == 10 ? 62031 : 47124;
          $scope.hjs.setValue(2, {hue: hue})
        }
        else {
          console.log("Setting lamp to white");
          $scope.hjs.setValue(2, {ct: 330})
        }*/

      })
    }

  }())

}])