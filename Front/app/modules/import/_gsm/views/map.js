define([
    'jquery',
    'underscore',
    'backbone',
    'marionette',
    'moment',
    'radio',
    'models/point',
    'utils/datalist',
    'utils/map',
    'config',
    'text!templates/map.html'
], function($, _, Backbone, Marionette, Moment, Radio, Point, datalist, map, config, template) {

    'use strict';

    return Marionette.ItemView.extend({
        template: template,

        events: {
            'resize window' : 'updateSize',
            'click #showFilter': 'showFilter'
        },

        initialize: function(options) {
            this.radio = Radio.channel('alldata');
            $('#main-panel').addClass('no-padding');
            $(window).on('resize', $.proxy(this, 'updateSize'));
        },

        showFilter: function() {
            this.radio.trigger('show-filter');
        },

        onRemove: function() {
            $('#main-panel').removeClass('no-padding');
            $(window).off('resize', $.proxy(this, 'updateSize'));
        },

        updateSize: function() {
            if(this.map_view) {
                var height = $(window).height() - $('#header-region').height();
                this.$el.find("#map").height(height);
                this.map_view.updateSize();
            }
        },

        onShow: function() {
            var mapUrl = config.coreUrl + '/individuals/stations?id=' +this.indivId ;
            var point = new Point({
                    latitude: 34,
                    longitude: 44,
                    label: ''
            });
            var mapView = map.init('bird', this.$el.find('#map'), point, 3);
            this.map_view = mapView;
            /*var url = config.coreUrl + 'individuals/stations?id=' + this.indivId;
            this.map_view.loadGeoJSON(url, 'Positions');*/
        },
    });
});
