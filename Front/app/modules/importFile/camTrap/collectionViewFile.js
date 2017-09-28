define([
    'jquery',
    'underscore',
    'backbone',
    'marionette',
    'config',
    'sweetAlert',
    './itemViewFile',
    'i18n'
], function ($, _, Backbone, Marionette, config, Swal, ItemViewFile) {
    'use strict';

    return Marionette.CollectionView.extend({
        childView : ItemViewFile
    });
});
