define([
	'backbone'
], function(Backbone) {

  'use strict';

  return Backbone.Model.extend({
    schema: {
      file: {
        type: 'FileUploadEditor',
        title: 'File',
        editorClass: 'form-control',
        validators: ['required'],
        options: {extensions: null}
      }
    }
  });
});

