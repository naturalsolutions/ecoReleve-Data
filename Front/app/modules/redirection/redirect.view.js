define([
    'jquery',
    'underscore',
    'backbone',
    'marionette',
    'sweetAlert',
    'translater',

], function ($, _, Backbone, Marionette, Swal, Translater) {

    'use strict';

    return Marionette.LayoutView.extend({

        template: 'app/modules/redirection/redirect.tpl.html',
        className: 'full-height animated layer',

        initialize: function (options) {
            this.idToFetch = options.idToFetch
            this.obj;
            this.urlTarget;
        },

        fetchRessource: function () {
            var _this = this;
            $.ajax({
                url: '/observations/' + this.idToFetch.toString(),
                method: 'GET',
                context: this
            }).done(function (resp) {
                _this.obj = resp;
                _this.buildUrl();
                _this.navigateTo();
            }).fail(function (resp) {
                _this.urlTarget = '/';
                _this.navigateTo();
            });

        },
        
        buildUrl: function() {
            var idStation = this.obj['FK_Station'];
            var idProtoType = this.obj['FK_ProtocoleType'];

           this.urlTarget = ''.concat(
                'stations',
                '/',
                idStation.toString(),
                '/',
                '?',
                'proto',
                '=',
                idProtoType.toString(),
                '&',
                'obs',
                '=',
                this.idToFetch.toString()
            )

        },

        navigateTo: function() {
            Backbone.history.navigate(this.urlTarget, {
                trigger: true
            });
        },

        onRender: function () {
            var _this = this;
            this.$el.i18n();
            setTimeout(() => {
                this.fetchRessource();
            }, 500);
            
        },
    });
});

