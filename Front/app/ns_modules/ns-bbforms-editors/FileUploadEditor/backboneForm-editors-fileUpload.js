define([
	'jquery',
	'backbone',
	'backbone_forms',
], function(
	$, Backbone, Form
){
	'use strict';
	return Form.editors.FileUploadEditor = Form.editors.Base.extend({
		previousValue: '',

		events: {
			'hide': "hasChanged",
			'change input[type=file]': 'testFile',
            'click .removeBtn': 'removeFile',
            'click .uploadBtn' : 'uploadFile'
		},

		hasChanged: function(currentValue) {
			if (currentValue !== this.previousValue){
				this.previousValue = currentValue;
				this.trigger('change', this);
			}
		},

		initialize: function(options) {
			Form.editors.Base.prototype.initialize.call(this, options);
			this.template = options.template || this.constructor.template;
			this.options = options;
			//Passer ça en template
			this._input = $('<input type="hidden" name="'+this.options.key+'" />');
			this._uploadInput = $('<input type="file" multiple="multiple" id="'+this.id+'"/>');
			this._loader = $('<p class="upload-status"><span class="loader"></span> Uploading&hellip;</p>');
			this._error = $('<p class="upload-error error">Error</p>');
			this._uploadBtn = $('<input type="button" class="uploadBtn" id="bbfUploadBtn_'+this.id+'" value="Upload"/>');
			this._removeBtn = $('<input type="button" class="removeBtn" id="bbfEmptyFile_'+this.id+'" value="Remove"/>');
		},

		getValue: function() {
			var fileName = this._input.val()
			return fileName ? JSON.stringify(fileName) : "";
		},

		setValue: function(value) {
			var str, files = value;
			if (_(value).isObject()) {
				str = JSON.stringify(value);
			} else {
				files = value ? JSON.parse(value) : [];
			}
			this._input.val(str);
		},

		render: function(){
			var options = this.options;
			var schema = this.schema;
			var $el = $($.trim(this.template()));

			this.$el.append(this._input);
			this.$el.append(this._uploadInput);
			this.$el.append(this._loader.hide());
			this.$el.append(this._error.hide());
			this.$el.append(this._uploadBtn.hide());
			return this;
		},
		uploadFile: function(eventType){
			//Tester la valeur de l'id
			var fd = new FormData();
			var fileUrl = 'http://localhost:57619/api/Files';
			var file = $(this._uploadInput)[0].files[0];
			fd.append("file", file);
			fd.append('field_name',this.options.key);
			var params = this.options.model.attributes;
			if (params) {
				for (var name in params) {
					fd.append('model_' + name, params[name]);
				}
			}
			$.ajax({
				type: 'POST',
				url: fileUrl,
				processData: false,
				contentType: false,
				data : fd
			})
		},
		testFile: function(eventType){
			var re = new RegExp(/.[a-zA-Z]+$/);
			var ext = $(this._uploadInput)[0].files[0].name.toLowerCase().match(re);
			if(this.options.schema.options.extensions){
				if(this.options.schema.options.extensions.indexOf(ext[0]) == -1){
					this._error.text('Error, extension non supported : ' + ext).show();
					this._uploadInput.val("");
				}else{
					this._uploadBtn.show();
					this._removeBtn.show();
				}
			}
		},
		removeFile: function(eventType){
			//Tester la valeur de l'id
			this._uploadInput.val("");
			this._error.text('The file uploader is now empty').show();
			this._removeBtn.hide();
		}
		}, {
		// STATICS
			template: _.template('<div></div>')
	});
});
