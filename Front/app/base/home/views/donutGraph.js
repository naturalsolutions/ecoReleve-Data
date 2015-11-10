define([
    'jquery',
    'chart',
    'config',
    'marionette',
    'moment'
], function($, Chart, config, Marionette, moment) {
    'use strict';
    return Marionette.ItemView.extend( {
        template: 'app/base/home/tpl/tpl-dounutGraph.html',

        onShow: function() {
            console.log('render DINUTgraph')
            this.drawGraph();
        },

        drawGraph: function() {
            var canvasLoc = this.$el.find('#locations');
            var canvasValid = this.$el.find('#validate');
            //caching graph data for a day
            var dataGraph = localStorage.getItem("ecoreleveChart");
            // get current day and compare it with stored day
            var d = (new Date() + '').split(' ');
            // ["Mon", "Feb", "1", "2014"....
            var day = d[2];
            var storedDay = localStorage.getItem("ecoreleveChartDay");
       /*     if (dataGraph && (day == storedDay)) {
                var gData = JSON.parse(dataGraph);
                this.chart = new Chart(canvas[0].getContext("2d")).Line(gData, {scaleShowLabels: false, scaleFontColor: "transparent"});
            } else {*/
                var url = config.coreUrl + "individuals/location/graph";
                $.ajax({
                    context: this,
                    url: url,
                    dataType: "json"
                }).done( function(data) {
                    var colors = ["#F7464A","#46BFBD","#FFCC00","#33CC33"];
                    var highlights = ["#FF5A5E","#5AD3D1","#FFFF66","#66FF66"];
                    var legend = "<div id='graphLegend' style='text-align: left;'><b>stations number per month</b><br/>";
                    
                    for (var i = 0; i < data.length; i++) {
                        data[i]['color'] = colors[i];
                        data[i]['highlight'] = highlights[i];
                    }

   /*                 var strData = JSON.stringify(gData);
                    // store data in localstorage
                    localStorage.setItem("ecoreleveChart", strData);
                    // store month in localstrorage to update data every month
                    var d = (new Date() + '').split(' ');
                    // ["Mon", "Feb", "1", "2014"....
                    var day_ = d[2];
                    localStorage.setItem("ecoreleveChartDay", day_);*/
                    this.chart = new Chart(canvasLoc[0].getContext('2d')).Doughnut(data);
                }).fail( function(msg) {
                    console.error(msg);
                });

                var url = config.coreUrl + "sensor/uncheckedDatas/graph";
                $.ajax({
                    context: this,
                    url: url,
                    dataType: "json"
                }).done( function(data) {
                    var colors = ["#F7464A","#46BFBD","#FFCC00","#33CC33"];
                    var highlights = ["#FF5A5E","#5AD3D1","#FFFF66","#66FF66"];
                    var legend = "<div id='graphLegend' style='text-align: left;'><b>stations number per month</b><br/>";
                    
                    for (var i = 0; i < data.length; i++) {
                        data[i]['color'] = colors[i];
                        data[i]['highlight'] = highlights[i];
                    }

   /*                 var strData = JSON.stringify(gData);
                    // store data in localstorage
                    localStorage.setItem("ecoreleveChart", strData);
                    // store month in localstrorage to update data every month
                    var d = (new Date() + '').split(' ');
                    // ["Mon", "Feb", "1", "2014"....
                    var day_ = d[2];
                    localStorage.setItem("ecoreleveChartDay", day_);*/
                    this.chart = new Chart(canvasValid[0].getContext('2d')).Doughnut(data);
                }).fail( function(msg) {
                    console.error(msg);
                });
            //}
        },

        onDestroy: function() {
            if(this.chart) {
                this.chart.destroy();
            }
        }
    });
});
