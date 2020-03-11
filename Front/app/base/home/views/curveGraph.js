define([
    'jquery',
    'chart',
    'config',
    'marionette',
    'moment'
], function($, Chart, config, Marionette, moment) {
  'use strict';
  return Marionette.ItemView.extend({
    template: 'app/base/home/tpl/tpl-graph.html',

    onShow: function() {
      this.initChart();
    },
    initChart: function() {
      var _this = this;
      //caching graph data for a day
      var dataGraph = localStorage.getItem('ecoreleveChart');
      // get current day and compare it with stored day
      var d = (new Date() + '').split(' ');
      // ["Mon", "Feb", "1", "2014"....
      var day = d[2];
      var storedDay = localStorage.getItem('ecoreleveChartDay');
      if (dataGraph && (day == storedDay)) {
        var gData = JSON.parse(dataGraph);
        _this.drawGraph(gData);
      } else {
        var url = config.erdApiUrl + 'stations/graph';
        $.ajax({
          context: this,
          url: url,
          dataType: 'json'
        }).done(function(data) {
          var strData = JSON.stringify(data);
          // store data in localstorage
          localStorage.setItem('ecoreleveChart', strData);
          var d = (new Date() + '').split(' ');
          var day_ = d[2];
          localStorage.setItem('ecoreleveChartDay', day_);
          _this.drawGraph(data);
        }).fail(function(msg) {
          console.error(msg);
        });
      }
    },
    drawGraph: function(data) {
      var canvas = this.$el.find('canvas');
      var labels = [];
      var lineData = [];

      var colors = ['#F38630', '#E0E4CC', '#69D2E7', '#3F9F3F', '#A4A81E', '#F0F70C', '#0CF7C4', '#92D6C7', '#2385b8', '#E0C8DD', '#F38630', '#E0E4CC'];

      var i = 0;
      for (var key in data) {
        var dataObj = {};
        var month = new moment(key,'MMM YYYY').format('MM/YY');
        var value = data[key] || 0;
        labels.push(month);
        lineData.push(parseInt(value));
      }
      var gData = {
        labels: labels,
        datasets: [{
          fillColor: 'transparent',
          strokeColor: 'rgba(100,100,100,0.7)',
          data: lineData
        }]
      };
      this.chart = new Chart(canvas[0].getContext('2d')).Line(gData,{scaleShowLabels: true});
    },

    onDestroy: function() {
      if (this.chart) {
        this.chart.destroy();
      }
    }
  });
});
