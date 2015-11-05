define([
    'jquery',
    'underscore',
    'backbone',
    'marionette',    
], function ($, _, Backbone, Marionette) {
    'use strict';

    return Marionette.LayoutView.extend({
        
        initialize: function (options) {
            this.opt = options;
            this.template = options.template;
            console.log(this.template);
        },
        SetPage: function (curPage) {
            this.curPage = curPage;
        },
        onShow: function () {
            this.$el.find('.nav-bar-text').attr('style', 'display:none');
            var pageList = this.curPage.split('->');
            for (var i = 0; i < pageList.length; i++) {
                this.$el.find('.nav-bar-' + pageList[i]).attr('style', 'display:visible');
            }
            this.$el.find('.nav-bar-' + pageList[pageList.length - 1] + ' a' ).addClass('disabledlink');

            
        },

    });
});