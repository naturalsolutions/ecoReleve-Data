define([
 'underscore',
 'jquery',
 'backbone',
 'backbone_forms',
 'config',
 'AutocompleteEditorOrignal',
 'jqueryui',
], function (
 _, $, Backbone, Form, config, AutocompleteEditorOrignal
) {
    'use strict';
    return Form.editors.AutocompleteEditor = AutocompleteEditorOrignal.extend({

        initialize: function (options) {
            Form.editors.Base.prototype.initialize.call(this, options);
            this.template = options.template || this.template;
            if (options.schema.options) {
                if (typeof options.schema.options.source === 'string'){
                    options.schema.options.source = config.coreUrl+options.schema.options.source;
                }
                this.autocompleteSource = options.schema.options;
            }
            this.options = options;
        },

    });
});
