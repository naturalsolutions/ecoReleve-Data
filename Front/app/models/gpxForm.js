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
      },
      fieldActivity: {
        type: 'Select' ,
        title: 'Global field activity',
        editorClass: 'form-control',
        options: [],
        editorAttrs: {'disabled': 'disabled'},
        fieldClass: 'fieldactivity',
        validators: ['required']
      },
      FieldWorkers: {
        'subschema': {
          'FieldWorker': {
            'title': 'FieldWorker',
            'editable': true,
            'validators': [],
            'options': {"source": "autocomplete/users/Login", "minLength":3},
            'editorClass':
            'form-control',
            'Name': 'FieldWorker',
            'type': 'AutocompleteEditor',
            'fieldClass': 'None col-md-6'
          }
        },
        title : "Field Workers *",
        'editable': null,
        'validators': [],
        'options': [],
        'editorClass': 'listOfChildSample,col-md-11',
        'Name': 'FieldWorkers',
        'type': 'ListOfNestedModel',
        'fieldClass': 'fieldworkers',
        "editorAttrs": {"disabled": false},
        "defaultValue" : {"FK_ProtocoleType" : 1000}
      }
    }
  });
});

