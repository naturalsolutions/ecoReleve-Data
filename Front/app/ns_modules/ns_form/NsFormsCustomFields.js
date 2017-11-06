define([
	'jquery',
	'backbone',
	'dateTimePicker',
	'moment'
], function ($,Backbone,bbforms,dateTimePicker,moment){

	var Form = Backbone.Form,
    editors = Form.editors,
    validators = Form.validators;
		validators.errMessages['StateBox'] = 'Cannot be null';

	// validators
	validators.StateBox = function(options) {
		options = _.extend({
			type: 'StateBox',
			message: this.errMessages.StateBox
			}, options);
		return function StateBox(value,formValues) {
			if (!options.nullable && value === null) {
				return {
					type: options.type
					//message: _.isFunction(options.message) ? options.message(options) : options.message
				}
			}
		};
	};
	validators.number = function(options) {
		options = _.extend({
		  type: 'number',
		  message: this.errMessages.number,
		  regexp: /^\-?[0-9]*\.?[0-9]*?$/
		}, options);

		return validators.regexp(options);
	};
	validators.min = function(options) {

		if (options.value != 0 && !options.value) throw new Error('Missing required "value" options for "min" validator');

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

	  validators.requiredSelect = function(options) {
	    options = _.extend({
	      type: 'required',
	      message: this.errMessages.required
	    }, options);

	    return function required(value) {
	      options.value = value;

	      var err = {
	        type: options.type,
	        message: _.isFunction(options.message) ? options.message(options) : options.message
	      };

	      if (value === null || value === undefined || value === false || value === '' || value === '-1') return err;
	    };
	  };

		// new fields
		editors.StateBox = Form.editors.Base.extend({
			defaultValue: false,
			template: '<span data-editor>\
								<input id="<%=id%>" name="<%=name%>" class="form-control statebox" type="checkbox" disabled />\
								<label for="<%=id%>" data-toggle="tooltip" ></label>\
								<div data-error></div>\
								<div></div>\
						</span>',

			events: {
				'click label':  function(e) {
					if (this.schema.editable) {
						this.change(e);
					} else {
						e.preventDefault();
						e.stopPropagation();
					} 
				// this.trigger('change', this);
				},
				'keydown label' : function(e) {
					if (this.schema.editable) {
						this.keyup(e);
					} else {
						e.preventDefault();
						e.stopPropagation();
					} 
				},
				'focus label':  function(e) {
				if (this.schema.editable) {
					this.trigger('focus', this);
					} else {
						e.preventDefault();
						e.stopPropagation();
					} 
				},
				'blur label':   function(e) {
					if (this.schema.editable) {
					this.trigger('blur', this);
					} else {
						e.preventDefault();
						e.stopPropagation();
					} 
				}
			},

			initialize: function(options) {
				Form.editors.Base.prototype.initialize.call(this, options);
		
				this.$el.attr('type', 'checkbox');
				if ( options.schema.defaultValue === '0' || options.schema.defaultValue === '1' ) { // get defaulValue possible undefined,NULL,0,1
					this.value = parseInt(options.schema.defaultValue);
				}
				else {
					this.value = null;
				}
		
				this.nullable = true;//default nullable so 3 state
				if (options.schema && options.schema.options && 'nullable' in options.schema.options) {
					this.nullable = options.schema.options.nullable
				}

				if ( typeof(this.model.get(this.key)) != 'undefined') { // get old value 
					this.value = this.model.get(this.key);
				}
				if( typeof(this.value) === 'string' ) {
					this.value = parseInt(this.value);
				}
			},

			/**
			 * Adds the editor to the DOM
			 */
			render: function() {
				var _this = this;
				var $el = _.template( this.template, {
								id: this.id || this.cid,
								name : this.key
				});
				this.setElement($el);
				this.$input =this.$el.find('input') 
				this.$label = this.$el.find('label');
				this.$label.on('blur' , function () {
				// _this.form.fields[_this.key].validate();
			//	_this.validate();
				});
				/*this.$label.tooltipster({
										theme : "js-custom-tooltipster",
										//parent: this.$el,
										autoclose : true,
										//trigger : "custom",
										position :"bottom",
										trigger: 'custom',
										triggerOpen: {
											//mouseenter: true
										},
										triggerClose: {
											click: true,
											//scroll: true
										},
										trackOrigin : true,
										interactive : true
										});*/
				if( this.schema.editable) {
					this.$label.prop('tabindex',"0");
				}
				else {
					this.$label.addClass('disabled');
				}
				this.setValue(this.value);
				setTimeout(function() {
					_this.validate();
				},0); 
			//	this.validate();
				return this;
			},

			getValue: function() {
				return this.value;
			},

			setValue: function(value) {
				switch(value) {
					case 1 : {
						this.$input.prop('checked', true);
						this.$label.prop('title' , 'True')
						break;
					}
					case 0 : {
						this.$input.prop('checked', false);
						this.$label.prop('title' , 'False')
						break;
					}
					default : {
						this.$input.prop('indeterminate', true);
						this.$label.prop('title' , 'Null')
						break;
					}

				}			
			},

			validate: function() {
				var $el = this.$el,
						error = null,
						value = this.getValue(),
					// formValues = this.form ? this.form.getValue(this.key) : {},
						formValues = {},
						validators = this.validators,
						_this = this,
						getValidator = this.getValidator;

				if (validators) {
					//Run through validators until an error is found
					_.every(validators, function(validator) {
						error = getValidator(validator)(value, formValues);
						if (typeof(error) != 'undefined') {
						_this.$input.addClass('error');
					/*	_this.$label.tooltipster('content',"Cannot be null");
						_this.$label.tooltipster('open');*/
						}
					else {
						if (_this.$input.hasClass('error')  ) {
							_this.$input.removeClass('error');
							//_this.$label.tooltipster('destroy')
							//_this.$label.tooltipster('close');
						}
					}
						return error ? false : true;
					});
				}
				return error;
			},
			

			keyup : function (e) {
				if(e.keyCode == 32){ //spacebar
					this.change(e);
				}
			},

			change: function(e) {
				e.preventDefault();
				e.stopPropagation();

				//TODO if was in error and tooltip show we gonna close the tooltip and remove class error
				if (!this.schema.editable) {
					return;
				}
				// ... => false => indeterminate => true => ...
				if( this.nullable ) {
						switch(this.value) {
							case 1 : { //de true on passe a false
							
								this.$input.prop('indeterminate', false);
								this.$input.prop('checked', false);
								this.$label.prop('title' , 'False')
								this.value = 0;
								break;
							}
							case 0 : {//de false on passe a indeterminate
								this.$input.prop('checked', false);
								this.$input.prop('indeterminate', true);
								this.$label.prop('title' , 'Null')
								this.value = null
								break;
							}
							default : {// de indeterminate on passe a true
								this.$input.prop('checked', true); 
								this.$input.prop('indeterminate', false);
								this.$label.prop('title' , 'True')
								this.value = 1;
								break;
							}
						}
					}
					else {
						switch(this.value) {
							case 1 : { //de true on passe a false
							
								this.$input.prop('indeterminate', false);
								this.$input.prop('checked', false);
								this.value = 0;
								break;
							}
							default : {// de false on passe a true
								this.$input.prop('indeterminate', false);
								this.$input.prop('checked', true); 
								this.value = 1;
								break;
							}
						}
					}
				this.validate();
			},

			focus: function() {
				if (this.hasFocus) return;
				this.$input.focus();
			},

			blur: function() {
				if (!this.hasFocus) return;
				this.$input.blur();
			}
		});


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

		editors.Number = Backbone.Form.Number.extend({

			defaultValue: '',

			events: _.extend({}, editors.Number.prototype.events, {
			//'keypress': 'onKeyPress',
			//'change': 'onKeyPress',
			'keyup': 'onKeyUp'
			}),

			initialize: function(options) {
				Backbone.Form.Number.prototype.initialize.call(this, options);

				var schema = this.schema;

				this.$el.attr('type', 'number');

					// provide a default for `step` attr,
					// but don't overwrite if already specified
				if (!schema || !schema.editorAttrs || !schema.editorAttrs.step) {
						// provide a default for `step` attr,
						// but don't overwrite if already specified
						this.min = 0;
						this.$el.attr('min','0');
						this.$el.attr('step', 'any');
					}
				if(schema.options) {
					if( schema.options.min ) {
						this.$el.attr('min', schema.options.min);
						this.min =  parseInt(schema.options.min);
					}
					if( schema.options.max ) {
						this.$el.attr('max', schema.options.max);
						this.max =  parseInt(schema.options.max);

					}
					if( schema.options.step ) {
						this.$el.attr('step', schema.options.step);
					}
				}
			},

			onKeyUp: function(event) {
				if (typeof this.min === 'number' && (parseInt(this.$el.val()) < this.min)){
						this.$el.val('');
				}
				if (typeof this.max === 'number' && (parseInt(this.$el.val()) > this.max)){
					this.$el.val('');
					}
				if (this.$el.val() == ''){ //abort value if not a number ex : 99--9
					this.$el.val('');
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

				Backbone.Form.Number.prototype.setValue.call(this, value);
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


	return Backbone;
});
