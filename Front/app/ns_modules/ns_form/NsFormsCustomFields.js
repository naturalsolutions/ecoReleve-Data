define([
	'jquery',
	'backbone',
	'backbone_forms',
	'dateTimePicker',
	'moment'
], function ($,Backbone,bbforms,dateTimePicker,moment){

	var Form = Backbone.Form,
    editors = Form.editors,
    validators = Form.validators;

    // new fields
    editors.Picker = editors.Text.extend({
		initialize: function(options) {
			Form.editors.Base.prototype.initialize.call(this, options);
			this.template = _.template('\
			<div class="input-group  picker" >\
				<input class ="form-control pickerInput">\
				<span class="input-group-addon picker">\
			      <span class="glyphicon-plus"></span>\
			    </span>\
				<span ></span>\
			</div>\
			', null, Form.templateSettings);
			var $el = $($.trim(this.template()));
			this.setElement($el);
			this.$el.find('input').attr('id', this.id);
			var editorClass = this.schema.editorClass;
			if(editorClass){
				this.$el.find('input').addClass(editorClass);
			}
			this.$el.find('input').attr('name', this.key);
		},
		getValue: function() {
		    return this.$el.find('input').val();
		},
		setValue: function(value) {
		    this.$el.find('input').val(value);
		}
	});
	editors.Number = editors.Text.extend({

		defaultValue: '',

		events: _.extend({}, editors.Text.prototype.events, {
		'keypress': 'onKeyPress',
		'change': 'onKeyPress'
		}),

		initialize: function(options) {
		editors.Text.prototype.initialize.call(this, options);

		var schema = this.schema;

		this.$el.attr('type', 'number');

		if (!schema || !schema.editorAttrs || !schema.editorAttrs.step) {
		  // provide a default for `step` attr,
		  // but don't overwrite if already specified
		  this.$el.attr('step', 'any');
		}
		},

		/**
		* Check value is numeric
		*/
		onKeyPress: function(event) {
		var self = this,

		    delayedDetermineChange = function() {
		      setTimeout(function() {
		        self.determineChange();
		      }, 0);
		    };

		//Allow backspace
		if (event.charCode === 0) {
		  delayedDetermineChange();
		  return;
		}

		//Get the whole new value so that we can prevent things like double decimals points etc.
		var newVal = this.$el.val()
		if( event.charCode != undefined ) {
		  newVal = newVal + String.fromCharCode(event.charCode);
		}
		console.log('regex number');
		var numeric = /^-?[0-9]*\.?[0-9]*?$/.test(newVal);

		if (numeric) {
		  delayedDetermineChange();
		}
		else {
		  event.preventDefault();
		}
		},

		getValue: function() {
		var value = this.$el.val();

		return value === "" ? null : parseFloat(value, 10);
		},

		setValue: function(value) {
		value = (function() {
		  if (_.isNumber(value)) return value;

		  if (_.isString(value) && value !== '') return parseFloat(value, 10);

		  return null;
		})();

		if (_.isNaN(value)) value = null;

		editors.Text.prototype.setValue.call(this, value);
		}

	});
	editors.BackboneDatepicker = Form.editors.Base.extend({
	 
	  previousValue: '',
	 
	  events: {
	    'hide': "hasChanged"
	  },
	 
	  hasChanged: function(currentValue) {
	    if (currentValue !== this.previousValue){
	      this.previousValue = currentValue;
	      this.trigger('change', this);
	    }
	  },
	 
	  initialize: function(options) {
	    editors.Base.prototype.initialize.call(this, options);
	    this.template = options.template || this.constructor.template;
	  },
	 
	  getValue: function() {
	    var date =  moment(this.el.children['Date_'].value, "DD-MM-YYYY HH:mm");
	    return date
	  },
	  render: function(){
	    var $el = $($.trim(this.template({
	      dateFormat: this.schema.options[0]["dateFormat"],
	      value: this.schema.options[0]["defaultValue"]
	    })));
	    this.setElement($el);
	    
	    return this;
	  },
	 
	}, {
	  // STATICS
	  template: _.template('<div class="input-group date" id="dateTimePicker" data-editors="Date_"><span class="input-group-addon"><span class="glyphicon-calendar glyphicon"></span></span><input id="c24_Date_" name="Date_" class="form-control dateTimePicker" type="text" placeholder="jj/mm/aaaa hh:mm" data-date-format="DD/MM/YYYY HH:mm"></div>', null, Form.templateSettings)
	});

	// validators
	validators.number = function(options) {
		options = _.extend({
		  type: 'number',
		  message: this.errMessages.number,
		  regexp: /^[0-9]*\.?[0-9]*?$/
		}, options);

		return validators.regexp(options);
	};
	validators.min = function(options) {
		if (!options.value) throw new Error('Missing required "value" options for "min" validator');

		options = _.extend({
		  type: 'min',
		  message: this.errMessages.min
		}, options);

		return function min(value, attrs) {
		  options.value <= value;
		  
		  var err = {
		    type: options.type,
		    message: "min value is " +  options.value//_.isFunction(options.message) ? options.message(options) : options.message
		  };
		  
		  //Don't check empty values (add a 'required' validator for this)
		  if (value === null || value === undefined || value === '') return;
		  
		  if (value < options.value) return err;
		};
	};
	validators.max = function(options) {
		if (!options.value) throw new Error('Missing required "value" options for "max" validator');

		options = _.extend({
		  type: 'max',
		  message: this.errMessages.max
		}, options);

		return function max(value, attrs) {
		  options.value >= value;
		  
		  var err = {
		    type: options.type,
		    message: "max value is " +  options.value//_.isFunction(options.message) ? options.message(options) : options.message
		  };
		  
		  //Don't check empty values (add a 'required' validator for this)
		  if (value === null || value === undefined || value === '') return;
		  
		  if (value > options.value) return err;
		};
	};
	return Backbone;
});
