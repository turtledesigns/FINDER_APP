var App = angular.module('ngapp', ['ngCordova','ngSanitize']);

App.controller('FinderApp', main);

App.directive('onFinishRender', function ($timeout) {
    return {
        restrict: 'A',
        link: function (scope, element, attr) {
            if (scope.$last === true) {
                $timeout(function () {
                    scope.$emit(attr.onFinishRender);
                });
            }
        }
    };
});


App.filter('split_to_breaks', ['$sce', function($sce){
    return function(text) {
        if(text){
            text = (text).split('.').join("<br/>");
        }
        return $sce.trustAsHtml(text);
    };
}]);

App.filter('timeconversion', function () {
    return function (input) {
        if (input) {
            input = input.split(' hours').join('h');
            input = input.split(' hour').join('h');
            input = input.split(' mins').join('m');
            input = input.split(' min').join('m');
            input = input.split(' days').join('d');
            input = input.split(' day').join('d');
        }
        return input;
    };
});

App.filter('removeday', function () {
    return function (input) {
        if (input) {
            input = input.split('Monday: ').join('');
            input = input.split('Tuesday: ').join('');
            input = input.split('Wednesday: ').join('');
            input = input.split('Thursday: ').join('');
            input = input.split('Friday: ').join('');
            input = input.split('Saturday: ').join('');
        }
        return input;
    };
});
    
function main($scope, $http, $cordovaLaunchNavigator) {
    $scope.$on('ngRepeatFinished', function (ngRepeatFinishedEvent) {
        // code when ng-repeat is finished
    });
    
    document.addEventListener('deviceready',function(){
        $scope.navigateTo = function (lat, lng) {
            $cordovaLaunchNavigator.navigate([lat, lng]);
        };
    });
    $scope.startZIndex = 1000;
    $scope.dayInt = (new Date().getDay() === 0) ? 6 : (new Date().getDay() === 1) ? 0 : (new Date().getDay() === 2) ? 1 : (new Date().getDay() === 3) ? 2 : (new Date().getDay() === 4) ? 3 : (new Date().getDay() === 5) ? 4 : (new Date().getDay() === 6) ? 5 : '';
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition, showError, { enableHighAccuracy: true, timeout : 3000 });
    } else {
        document.getElementById('splash_screen').innerHTML = '<div id="errorMessage">Please enable your location services<img src="img/refresh-black.png" onclick="location.reload()"></div>';
    }

    $scope.updateLocation = function (position) {
        var longitude = position.coords.longitude;
        var latitude = position.coords.latitude;
        $scope.myLocation = {
            long: longitude,
            lat: latitude
        };
        
        $scope.currentLocationMarker = new google.maps.Marker({
            position: {
                lat: $scope.myLocation.lat,
                lng: $scope.myLocation.long
            },
            icon: 'img/pointer.png',
            zIndex: 999999
        });
        
        $scope.currentLocationMarker.setMap($scope.map);
    };

    $scope.focusOnMarker = function (markerId) {
        var iconNumber = Number(markerId.split('marker_').join(''))-1;
        var selectedMarker = $('.selectedMarker');
        if (selectedMarker.length > 0) {
            for (var marker in $scope.markers) {
                if ($scope.markers[marker].id == selectedMarker[0].id) {
                    $scope.markers[marker].setIcon('modules/' + $scope.settings.module + '/markers/' + (Number($scope.markers[marker].iconID) + 1) + '.png');
                }
            }
        }
        $('.selectedMarker').removeClass('selectedMarker');
        $('#' + markerId).addClass('selectedMarker');
        $scope.markers[iconNumber].setIcon('modules/default/markers/' + (Number(iconNumber) + 1) + '.png');
        $scope.map.setCenter($scope.markers[iconNumber].getPosition());
        $scope.startZIndex++;
        $scope.markers[iconNumber].setZIndex($scope.startZIndex);
    };

    function showPosition(position) {
        $scope.error = false;
        $scope.markers = [];
        var longitude = position.coords.longitude;
        var latitude = position.coords.latitude;
		
//		the dell southamton
//		latitude = 50.909698;
//		longitude = -1.404351;
		
        $scope.myLocation = {
            long: longitude,
            lat: latitude
        };
        $http.get('settings.json').then(function (res) {
            $scope.settings = res.data;
            $http.get('modules/' + $scope.settings.module + '/module.json').then(function (res) {
                $scope.moduleSettings = res.data;
				var searchUrl = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=' + $scope.myLocation.lat + ',' + $scope.myLocation.long + '&rankby=distance&' + (($scope.moduleSettings.types.length > 1) ? 'types' : 'type') + '=' + $scope.moduleSettings.types.join('|') + (($scope.moduleSettings.keywords.length > 0) ? '&keyword="' + $scope.moduleSettings.keywords.join('|') + '"' : '') + '&key=' + $scope.settings.webServiceAPI;


                $http.get(searchUrl).then(function (res) {

                    $scope.results = res.data.results;
                    $scope.resultsLength = res.data.results.length;
					

					if ($scope.resultsLength === 0 && !$scope.error) {
						$scope.error = true;
						document.getElementById('splash_screen').innerHTML = '<div id="errorMessage">Sorry, we can not find anything in your area.<img src="img/refresh-black.png" onclick="location.reload()"></div>';
						return;
					} else if (res.data.error_message === "You have exceeded your daily request quota for this API." && !$scope.error) {
						$scope.error = true;
						document.getElementById('splash_screen').innerHTML = '<div id="errorMessage">Server is updating.<img src="img/refresh-black.png" onclick="location.reload()"></div>';
						return;
					}

                    for (var place in res.data.results) {
                        $http.get('https://maps.googleapis.com/maps/api/place/details/json?placeid=' + res.data.results[place].place_id + '&key=' + $scope.settings.webServiceAPI, {
                            param: place
                        }).then(function (res) {
							
							if (res.data.error_message === "You have exceeded your daily request quota for this API." && !$scope.error) {
								$scope.error = true;
								document.getElementById('splash_screen').innerHTML = '<div id="errorMessage">Server is updating.<img src="img/refresh-black.png" onclick="location.reload()"></div>';
								return;
							}
							
                            $scope.results[res.config.param].placeidinfo = res.data.result;

                            $scope.currentTime = new Date().getTime();

                            $http.get('https://maps.googleapis.com/maps/api/distancematrix/json?origins=' + $scope.myLocation.lat + ',' + $scope.myLocation.long + '&destinations=place_id:' + $scope.results[res.config.param].place_id + '&mode=driving&departure_time=' + $scope.currentTime + '&traffic_model=best_guess&key=' + $scope.settings.distanceMatrixAPI, {
                                param: res.config.param
                            }).then(function (res) {
								
                                if (res.data.error_message === "You have exceeded your daily request quota for this API." && !$scope.error) {
									$scope.error = true;
									document.getElementById('splash_screen').innerHTML = '<div id="errorMessage">Server is updating.<img src="img/refresh-black.png" onclick="location.reload()"></div>';
                                    return;
                                }

                                $scope.results[res.config.param].driving = res.data.rows[0].elements[0];


                                $http.get('https://maps.googleapis.com/maps/api/distancematrix/json?origins=' + $scope.myLocation.lat + ',' + $scope.myLocation.long + '&destinations=place_id:' + $scope.results[res.config.param].place_id + '&mode=walking&departure_time=' + $scope.currentTime + '&key=' + $scope.settings.distanceMatrixAPI, {
                                    param: res.config.param
                                }).then(function (res) {
                                    
                                    if (res.data.error_message === "You have exceeded your daily request quota for this API." && !$scope.error) {
										$scope.error = true;
										document.getElementById('splash_screen').innerHTML = '<div id="errorMessage">Server is updating.<img src="img/refresh-black.png" onclick="location.reload()"></div>';
                                        return;
                                    }
                                    $scope.results[res.config.param].walking = res.data.rows[0].elements[0];

                                    if ($scope.markers.length === 0) {
                                        $scope.map = new google.maps.Map(document.getElementById('map'), {
                                            center: {
                                                lat: $scope.myLocation.lat,
                                                lng: $scope.myLocation.long
                                            },
                                            scrollwheel: false,
                                            zoom: 10,
                                            disableDefaultUI: true,
                                            styles: [{"featureType":"poi","elementType":"all","stylers":[{"hue":"#000000"},{"saturation":-100},{"lightness":-100},{"visibility":"off"}]},{"featureType":"poi","elementType":"all","stylers":[{"hue":"#000000"},{"saturation":-100},{"lightness":-100},{"visibility":"off"}]},{"featureType":"administrative","elementType":"all","stylers":[{"hue":"#000000"},{"saturation":0},{"lightness":-100},{"visibility":"off"}]},{"featureType":"road","elementType":"labels","stylers":[{"hue":"#ffffff"},{"saturation":-100},{"lightness":100},{"visibility":"off"}]},{"featureType":"water","elementType":"labels","stylers":[{"hue":"#000000"},{"saturation":-100},{"lightness":-100},{"visibility":"off"}]},{"featureType":"road.local","elementType":"all","stylers":[{"hue":"#ffffff"},{"saturation":-100},{"lightness":100},{"visibility":"on"}]},{"featureType":"water","elementType":"geometry","stylers":[{"hue":"#ffffff"},{"saturation":-100},{"lightness":100},{"visibility":"on"}]},{"featureType":"transit","elementType":"labels","stylers":[{"hue":"#000000"},{"saturation":0},{"lightness":-100},{"visibility":"off"}]},{"featureType":"landscape","elementType":"labels","stylers":[{"hue":"#000000"},{"saturation":-100},{"lightness":-100},{"visibility":"off"}]},{"featureType":"road","elementType":"geometry","stylers":[{"hue":"#bbbbbb"},{"saturation":-100},{"lightness":26},{"visibility":"on"}]},{"featureType":"landscape","elementType":"geometry","stylers":[{"hue":"#dddddd"},{"saturation":-100},{"lightness":-3},{"visibility":"on"}]}]
                                        });

                                    }

                                    $scope.results[res.config.param].markerImg = 'modules/' + $scope.settings.module + '/markers/' + (Number(res.config.param) + 1) + '.png';
                                    $scope.results[res.config.param].markerID = 'marker_' + (Number(res.config.param) + 1);

                                    $scope.markers[res.config.param] = new google.maps.Marker({
                                        position: {
                                            lat: $scope.results[res.config.param].geometry.location.lat,
                                            lng: $scope.results[res.config.param].geometry.location.lng
                                        },
                                        map: $scope.map,
                                        title: $scope.results[res.config.param].name,
                                        icon: 'modules/' + $scope.settings.module + '/markers/' + (Number(res.config.param) + 1) + '.png',
                                        id: $scope.results[res.config.param].markerID,
                                        iconID: Number(res.config.param)
                                    });



                                    $scope.markers[res.config.param].addListener('click', function () {
                                        // TODO: SCROLL TO CORRECT PLACE
                                        if ($('.selectedMarker').length > 0) {
                                            for (var marker in $scope.markers) {
                                                if ($scope.markers[marker].id == $('.selectedMarker')[0].id) {
                                                    $scope.markers[marker].setIcon('modules/' + $scope.settings.module + '/markers/' + (Number($scope.markers[marker].iconID) + 1) + '.png');
                                                }
                                            }
                                        }
                                        $('.selectedMarker').removeClass('selectedMarker');
                                        document.getElementById(this.id).scrollIntoView();
										$('#location_wrapper').scrollTop($('#location_wrapper').scrollTop()+2);
                                        $('#' + this.id).addClass('selectedMarker');
                                        this.setIcon('modules/default/markers/' + (Number(this.iconID) + 1) + '.png');
                                        $scope.startZIndex++;
                                        this.setZIndex($scope.startZIndex);
                                    });


									if ($scope.markers.length === $scope.resultsLength) {
                                        $scope.currentLocationMarker = new google.maps.Marker({
                                            position: {
                                                lat: $scope.myLocation.lat,
                                                lng: $scope.myLocation.long
                                            },
                                            map: $scope.map,
                                            icon: 'img/pointer.png',
                                            zIndex: 999999
                                        });

                                        var newBoundary = new google.maps.LatLngBounds();

                                        for (var index in $scope.markers) {
                                            var position = $scope.markers[index].position;
                                            newBoundary.extend(position);
                                        }

                                        $scope.map.fitBounds(newBoundary);

                                        setInterval(function () {
                                            navigator.geolocation.getCurrentPosition($scope.updateLocation, null);
                                        }, 5000);

                                        setTimeout(function(){
                                              $( "#splash_screen" ).animate({
                                                right: "100%"
                                              }, 800, function() {
                                                    $('#splash_screen').hide();
                                                  
                                                  $( "#splash_screen" ).animate({
                                                        right: "0%"
                                              }, 20, function() {
                                                    // do nothing as animation has reset
                                              });

											  if (cordova.platformId == 'android') {
												  StatusBar.backgroundColorByHexString("#000000");
											  }
                                              });
                                        },1000)
                                    }
                                });

                            });
                        });
                    }
                });
            });
        });

    }

    function showError(error) {
        switch (error.code) {
        case error.PERMISSION_DENIED:
            document.getElementById('splash_screen').innerHTML = '<div id="errorMessage">User denied the request for Geolocation.<img src="img/refresh-black.png" onclick="location.reload()"></div>';
            break;
        case error.POSITION_UNAVAILABLE:
            document.getElementById('splash_screen').innerHTML = '<div id="errorMessage">Location information is unavailable.<img src="img/refresh-black.png" onclick="location.reload()"></div>';
            break;
        case error.TIMEOUT:
            document.getElementById('splash_screen').innerHTML = '<div id="errorMessage">The request to get user location timed out. Please enable your location services.<img src="img/refresh-black.png" onclick="location.reload()"></div>';
            break;
        case error.UNKNOWN_ERROR:
            document.getElementById('splash_screen').innerHTML = '<div id="errorMessage">An unknown error occurred.<img src="img/refresh-black.png" onclick="location.reload()"></div>';
            break;
        }
    }
}