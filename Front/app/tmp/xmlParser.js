define([
	'backbone',
	'moment',
	'collections/waypoints',
], function(
	Backbone, moment, Waypoints
){
	'use strict';
	return {
		gpxParser: function(xml) {
			try {
					var Waypoint =  Backbone.Model.extend();
					var waypointList = new Waypoints();
					var errors = [];
					// id waypoint
					var id = 0;  // used to get number of valid waypoint
					var nbWaypoints = 0; // used to get number of  waypoints in gpx file
					$(xml).find('wpt').each(function() {
						var waypoint = new Waypoint();
						var lat = $(this).attr('lat');
						var lon = $(this).attr('lon');
						// convert lat & long to number and round to 5 decimals
						var latitude = parseFloat(lat);// parseFloat(lat).toFixed(5);
						var longitude = parseFloat(lon);
						var waypointName = $(this).find('name').text();
						var waypointTime, time;
						// if tag "cmt" exisits, take date from it, else use tag "time"
						var waypointTimeTag = moment($(this).find('cmt').text());
						// check if date is valid, else use time tag to get date
						if(waypointTimeTag.isValid()){
							waypointTime = moment(waypointTimeTag);

							time = moment(waypointTimeTag).format("HH:mm:ss") ; 
						} else {
							var dateValue = $(this).find('time').text();
							waypointTime = moment(dateValue);
							time = moment(dateValue).format("HH:mm:ss"); 
						}
						var tm = moment(waypointTime, moment.ISO_8601);
						var dateStr = (moment(waypointTime).format("YYYY-MM-DD"));  
						var dateTimeStr = dateStr + ' ' + time;
						// check if data is valid
						nbWaypoints +=1;
						if (lat !='' && lon !='' && dateStr != 'Invalid date' && time !=' Invalid date'){
							id += 1;
							//var idwpt = id;
							waypoint.set("id", id);
							waypoint.set("name", waypointName);
							waypoint.set("latitude", latitude);
							waypoint.set("longitude", longitude);
							waypoint.set("waypointTime", dateTimeStr);
							waypoint.set("time", time);
							waypoint.set("fieldActivity", '');
							waypoint.set("import", false);
							waypointList.add(waypoint);
						} 
						else {
							errors.push(waypointName);
						}
					});
					// check if all wayponits are imported
					if(id!=nbWaypoints){
						//alert("some waypoints are not imported, please check coordinates and date for each waypoint");
					}
					return [waypointList , errors];

				} catch (e) {
					alert("error loading gpx file");
					//waypointList.reset();
					return [waypointList,0];
				}
		},
		protocolParser: function(xml) {

		}
	};
});

	




