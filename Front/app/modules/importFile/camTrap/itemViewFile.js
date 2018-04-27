define([
    'jquery',
    'underscore',
    'backbone',
    'marionette',
    'config',
    'sweetAlert',
    'i18n',


], function ($, _, Backbone, Marionette, config, Swal

) {

    'use strict';

    return Marionette.ItemView.extend({

        events: {
            'click button#js-removeFile': 'removeFileToList'
        },
        className: 'full-height',
        model : new Backbone.Model(),
        template: 'app/modules/importFile/camTrap/templates/itemViewFile.html',
        

        initialize: function (options) {
            var _this = this;
        },


        removeFileToList: function (e) {
           // this.parent.collection.remove(this.model);
           // this.model.collection.remove(this.model);
           this.model.destroy();
        },

        check: function () {},

        onShow: function () {},   

        onDestroy: function () {},

        validate: function () {},

    });
});
