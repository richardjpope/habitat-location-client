$(document).ready( function(){

  //helpers
  var is_authorized = function(){
    return localStorage.getItem("access_token") === null;
  }

  var report_location = function(coordinates){
    occured_at = new Date()
    lnglat =  { "type": "Point", "coordinates": [coordinates.longitude, coordinates.latitude] }
    data = {latlng: lnglat, occured_at: occured_at};

    $.ajax({
      type: "POST",
      url: localStorage.getItem('habitat_server_url') + '/locations',
      contentType: 'application/json',
      processData: false,
      dataType: "json",
      data: JSON.stringify(data),
      beforeSend: function (xhr) {
        xhr.setRequestHeader('Authorization', "Bearer " + localStorage.getItem("access_token"));
        xhr.setRequestHeader('Accept', "application/json");
      },

      success: function (response) {
        alert('worked')
      },
      error: function (response) {
        alert('failed')
      }

    });
  }

  //views
  var SettingsView = Backbone.View.extend({

    el: $('#main'),

    initialize:function () {
      this.render();
    },

    template:_.template($('#tpl-settings').html()),

    events: {
     "click .reset button"   : "reset",
    },

    render:function (eventName) {
      $(this.el).html(this.template());
    },

    reset: function (){
      localStorage.clear();
      window.location = '/';
      return false;
    },

  });

  var AuthorizeView = Backbone.View.extend({

    el: $('#main'),

    initialize:function () {
      this.render();
    },

    template:_.template($('#tpl-authorize').html()),

    events: {
     "click .authorize button"   : "authorize",
    },

    render:function (eventName) {
      $(this.el).html(this.template());
    },

    authorize: function (){

      //get server url and store for later
      var url = $('.authorize input').val();
      localStorage.setItem("habitat_server_url", url)

      //build auth url
      var redirect_uri = '' + window.location;
      var auth_url = localStorage.getItem('habitat_server_url') +
      "/oauth/authorize" +
      "?response_type=token" +
      "&client_id=" + client_id +
      "&scope=" + encodeURIComponent('location:add') +
      "&redirect_uri=" + encodeURIComponent(redirect_uri);

      window.location.assign(auth_url);
      return false;
    },

  });

  var MapView = Backbone.View.extend({

    el: $('#main'),

    initialize:function () {
      this.render();
    },

    template:_.template($('#tpl-map').html()),

    events: {
     "click #controls button"   : "report",
    },

    render:function (eventName) {

      //template
      $(this.el).html(this.template());

      //map
      var map = L.map('map');
      L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://mapbox.com">Mapbox</a>',
          maxZoom: 18
      }).addTo(map);

      map.locate({setView: true, maxZoom: 16});
      map.dragging.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
      if (map.tap){
          map.tap.disable();
      }
      map.on('locationfound', function(e){
        var radius = e.accuracy / 2;
        L.circle(e.latlng, radius).addTo(map);
      });

    },

    report: function (){
      navigator.geolocation.getCurrentPosition(function(position) {
          report_location(position.coords);
      });
    },

  });

  var AppRouter = Backbone.Router.extend({

      routes:{
          "":"map",
          "settings":"settings"
      },

      initialize:function() {

      },

      map:function () {
          if (is_authorized()) {
            this.authorizeView = new AuthorizeView();
          }else{
            this.mapView = new MapView();
          }
      },

      settings:function () {
          this.authorizeView = new SettingsView();
      }
  });

  var client_id = 'fjdklsfoidus7f8ds9fdnjksnm342';

  hash = document.location.hash
  var match = hash.match(/access_token=(\w+)/);
  if (!!match){
    localStorage.setItem("access_token", match[1])
    window.location = '/';
  }

  var app = new AppRouter();
  Backbone.history.start();

});
