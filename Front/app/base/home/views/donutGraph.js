define([
    'jquery',
    'chart',
    'config',
    'marionette',
    'moment'
], function($, Chart, config, Marionette, moment) {
    'use strict';
    return Marionette.ItemView.extend( {
        //template: 'app/base/home/tpl/tpl-dounutGraph.html',

        initialize:function(options) {
            var model = options.model;
            this.url = model.get('url'); //config.coreUrl + 'individuals/location/graph';
            this.storageName = 'ecoreleveChartDonuts' + model.get('title');
            this.storedData = model.get('stored');
            this.ele = model.get('ele');
            this.template = model.get('template');
        },
        onRender: function() {
            console.log('render DINUTgraph')
            this.initGraph();
        },

        initGraph: function(){
            var _this = this;
            var dataGraph = localStorage.getItem(this.storageName);
            var d = (new Date() + '').split(' ');
            var day = d[2];
            var storedDay = localStorage.getItem(this.storageName + 'Day');
            if (this.storedData && dataGraph && (day == storedDay)) {
                var gData = JSON.parse(dataGraph);
            } else {
                $.ajax({
                    context: this,
                    url: _this.url,
                    dataType: "json"
                }).done( function(data) {
                    var strData = JSON.stringify(gData);
                    localStorage.setItem(_this.storageName, strData);
                    var d = (new Date() + '').split(' ');
                    var day_ = d[2];
                    localStorage.setItem(_this.storageName + 'Day', day_);
                    _this.drawGraph(data);
                }).fail( function(msg) {
                    console.error(msg);
                });
            }
        },

        drawGraph: function(data) {
            var canvas = this.$el.find(this.ele);
            console.log(canvas);
           // var canvasValid = this.$el.find('#validate');
            var colors = ["rgba(0,0,0,0.5)","rgba(0,0,0,0.4)","rgba(0,0,0,0.3)","rgba(0,0,0,0.2)"];


            var highlights = ["rgba(0,0,0,0.1)","rgba(0,0,0,0.1)","rgba(0,0,0,0.1)","rgba(0,0,0,0.1)"];

            for (var i = 0; i < data.length; i++) {
                data[i]['color'] = colors[i];
                data[i]['highlight'] = highlights[i];
            }
            this.chart = new Chart(canvas[0].getContext('2d')).Doughnut(data);
        },

        onDestroy: function() {
            if(this.chart) {
                this.chart.destroy();
            }
        }
    });
});
