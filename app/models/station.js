define([
	'backbone',
], function(Backbone){
	'use strict';
	return Backbone.Model.extend(
		{
			schema: {
				PK: { type: 'Text', title:'id', editorClass : 'form-control', validators: []}, 
				Name: { type: 'Text', title:'station name', editorClass : 'form-control', validators: ['required']}, 
				LAT : { type: 'Text', title:'latitude', editorClass : 'form-control',validators: ['required'] },  //, validators: ['required']
				LON : { type: 'Text', title:'longitude', editorClass : 'form-control',validators: ['required'] },
				Region : { type: 'Select', options: [''], editorClass : 'form-control',validators: [] },
				FieldActivity_Name: { type: 'Select', options: [''], title:'field activity', editorClass : 'form-control', validators: ['required']},
				Date_: { type: 'Text', title:'date' , editorClass : 'form-control',validators: ['required'] }, //,validators: ['required']
				//time_:{ type: 'Text', title:'time', editorClass : 'form-control'},
				FieldWorker1: { type: 'Select', options: [''] , title:'field worker 1', editorClass : 'form-control fiedworker' ,validators: ['required']},  //type: 'Select' , title:'field Worker 1', options: this.usersList , required : true
				FieldWorker2: { type: 'Select', options: [''], title:'field worker 2' , editorClass : 'form-control fiedworker'},  
				FieldWorker3: {type: 'Select', options: [''] , title:'field worker 3' , editorClass : 'form-control fiedworker' },
				FieldWorker4: { type: 'Select', options: [''] , title:'field worker 4' , editorClass : 'form-control fiedworker' },
				FieldWorker5: { type: 'Select', options: [''] , title:'field worker 5' , editorClass : 'form-control fiedworker' },
				NbFieldWorker : {type: 'Number' , title:'field workers number', editorClass : 'form-control', validators: ['required'], 'editorAttrs': { "min": "1" }},
				type_site : { type: 'Select', options: [''], title:'id site', editorClass : 'form-control', validators: []},
				id_site : { type: 'Text', title:'name site', editorClass : 'form-control', validators: []},
				Precision : { type: 'Number', title:'id site', editorClass : 'form-control', validators: ['required']}
			},
			defaults: {
				FieldWorker4: '',
				FieldWorker5: '',
				type_site :'',
				id_site : null
			},
			verboseName : "station"
		}
	);
});
