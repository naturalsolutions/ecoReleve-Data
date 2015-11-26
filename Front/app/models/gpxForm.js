define([
	'backbone'
], function(Backbone) {

  'use strict';

  return Backbone.Model.extend({
    schema: {
<<<<<<< HEAD
      file:    {type: 'FileUploadEditor', title: 'File', editorClass: 'form-control',validators: ['required'],options: {extensions: null}},
      //test : { type : 'IndividualPickerEditor', title : 'test indiv picker' },
      fieldActivity:   {type: 'Select' , title: 'Global field activity', editorClass: 'form-control', options: [],editorAttrs: {'disabled': 'disabled'}, fieldClass: 'fieldactivity'},
=======
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
>>>>>>> c736a1259dfed9e43e5cf39f2f5799e74964caca
      FieldWorkers: {
        'subschema': {
          'FieldWorker': {
            'title': 'FieldWorker',
            'editable': true,
            'validators': [],
            'options': [],
            'editorClass':
            'form-control',
            'Name': 'FieldWorker',
            'type': 'Select',
            'fieldClass': 'None col-md-6'
          }
        },
        'title': null,
        'editable': null,
        'validators': [],
        'options': [],
        'editorClass': 'listOfChildSample,col-md-11',
        'Name': 'FieldWorkers',
        'type': 'ListOfNestedModel',
        'fieldClass': 'fieldworkers'
      }
    }
  });
});

