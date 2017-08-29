define([
  'backbone',
  'moment',
], function (
  Backbone, moment
) {
  'use strict';
  return {
    gpxParser: function (xml, fileName) {
      var _this = this;
      try {
        var waypointList = [];
        var errors = [];
        // id waypoint
        var id = 0; // used to get number of valid waypoint
        var nbWaypoints = 0; // used to get number of  waypoints in gpx file
        $(xml).find('wpt').each(function () {
          var waypoint = {};
          var lat = $(this).attr('lat');
          var lon = $(this).attr('lon');
          var ele = $(this).find('ele').text() || 0;
          ele = parseFloat(ele);
          // convert lat & long to number and round to 5 decimals
          var latitude = parseFloat(lat);
          var longitude = parseFloat(lon);
          var waypointName = $(this).find('name').text();
          var waypointTime, time;
          // ******* prepare to keep time balise only  ******
          // waypointTimeTag = $(this).find('time').text();
          // format =  _this.getDateFormat(waypointTimeTag);
          // dateStr = moment.utc(waypointTimeTag,format).format('DD/MM/YYYY HH:mm');

          // this code wil be removed 
          // *Start
          // if tag "cmt" exisits, take date from it, else use tag "time"
          var waypointTimeTag = $(this).find('cmt').text();
          var dateStr;
          var format = _this.getDateFormat(waypointTimeTag);
          if (format) {
            dateStr =  moment.utc(waypointTimeTag, format).format('DD/MM/YYYY HH:mm');
          } else {
            waypointTimeTag = $(this).find('time').text();
            format =  _this.getDateFormat(waypointTimeTag);
            dateStr = moment.utc(waypointTimeTag,format).format('DD/MM/YYYY HH:mm');
          }

          // *End
          var timestamp = moment.utc(dateStr, 'DD/MM/YYYY HH:mm').format('YYYY-MM-DD HH:mm');
          nbWaypoints += 1;
          if (lat != '' && lon != '' && dateStr != 'Invalid date' && time != 'Invalid date') {
            id += 1;
            waypoint.id = id;
            waypoint.name = waypointName;
            waypoint.latitude = latitude;
            waypoint.longitude = longitude;
            waypoint.elevation = ele;
            waypoint.waypointTime = dateStr;
            waypoint.displayDate = timestamp;
            waypoint.time = time;
            waypoint.fieldActivity = '';
            waypoint.Place = null;
            waypoint.timeZone = null;
            waypoint.import = false;
            waypoint.FieldWorkers = [];
            waypoint.precision = 10;
            waypoint.fileName = fileName;

            waypointList.push(waypoint);
          } else {
            errors.push(waypointName);
          }
        });
 
        if (id != nbWaypoints) {
          //alert("some waypoints are not imported, please check coordinates and date for each waypoint");
        }
        return [waypointList, errors];

      } catch (e) {
        alert('error loading gpx file');
        return [waypointList, 0];
      }
    },

    getDateFormat: function (val) {
      var formats = [
        'YYYY-MM-DD HH:mm:ss',
        'YYYY-MM-DD HH:mm',
        'DD/MM/YYYY HH:mm:ss',
        'DD/MM/YYYY HH:mm',
        'DD-MM-YYYY HH:mm:ss',
        'DD-MM-YYYY HH:mm',
        'DD-MM-YY HH:mm',
        'DD-MM-YY HH:mm:ss',
        'DD-MMM-YY HH:mm:ss',
        'DD-MMM-YY HH:mm'];
      var result = formats.filter(function (format) {
        return moment(val, format, true).isValid();
      });
      return result[0];
    },

    isValidDate: function (strDate) {
      if(this.getDateFormat(strDate)){
        return true;
      } else {
        return false;
      }
    },
  };
});
