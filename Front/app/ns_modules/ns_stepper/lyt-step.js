define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',	
], function($, _, Backbone, Marionette) {

	'use strict';

	return Marionette.LayoutView.extend({
		/*===================================================
		=            Layout Stepper Orchestrator            =
		===================================================*/
		parent:null,
		className: 'ns-full-height',
		events : {
			'click #reset' : 'reset',
		},
		
		/*
		regions:{
			main : '#main',
		},
		*/

		elemIndex:0,
		ajax: true,

		onDestroy: function(){

		},

		initialize: function(options){

			this.name=options.name;
			this.template=options.tpl;

			this.model=options.model; //global model

		},
		initModel: function(tpl){
			this.parseOneTpl(tpl);
		},


		animateIn: function() {
			this.$el.animate(
				{ left: 0 },
				ANIMATION_DURATION,
				_.bind(this.trigger, this, 'animateIn')
			);
		},

		animateOut: function() {
			this.$el.animate(
				{ left: -500 },
				ANIMATION_DURATION,
				_.bind(this.trigger, this, 'animateOut')
			);
		},


		parseOneTpl: function(tpl){// Initialisation du model à partir du template
			var _this = this;
			var elemIndex = 0;+



			$(tpl).find('input:not(:checkbox,:radio)').each(function(){
				var name= _this.name+'_' + this.name;
				var rq = $(this).hasClass('required');
				var obj={name : name, required : rq, };
				var val = $(this).val();
				_this.stepAttributes.push(obj);
				//var val=_this.model.get(obj.name); //get val
				_this.model.set(name, val);
			});
			$(tpl).find('select').each(function(){

				var name= _this.name+'_' + this.name;

				var obj={name : name};

				_this.stepAttributes.push(obj);
				_this.model.set(name, $(this).find(':selected').val());
			});
			//add radio & checkbox
			var radioCreated = [] ;
			$(tpl).find('input:radio').each(function(){
				var name= _this.name+'_' + this.name;
				
				if (radioCreated.indexOf(this.name)==-1){
					radioCreated.push(this.name);
					
					var obj={name : name};
					_this.stepAttributes.push(obj);
					var val=null;
					elemIndex++;
					_this.model.set(obj.name, val);
					
					}
				if ($(this).attr('checked')){
						val = $(this).attr('value') ;
						_this.model.set(obj.name, val);
					}
			});
		},

		onShow: function(){
		},

		onRender: function(){
			this.feedTpl();
			this.stepAttributes=[]; //all attributes per step
			//this.initModel();
		},

		feedTpl: function(){

			var _this=this;

			this.$el.find('input:not(:checkbox,:radio,:submit)').each(function(){
				var id = _this.name + '_' + $(this).attr('name');
				$(this).attr('value', _this.model.get(id));
			});
			this.$el.find('input:checkbox').each(function(){
				var id = _this.name + '_' + $(this).attr('name');
				var tmp=_this.model.get(id);
				if(tmp){ $(this).attr('checked', 'checked') }
			});
			this.$el.find('input:radio').each(function(){
				var id = _this.name + '_' + $(this).attr('name');
				var tmp=_this.model.get(id);
				if($(this).val() == tmp){ $(this).attr('checked', 'checked') }
			});
			this.$el.find('select').each(function(){
				var id = _this.name + '_' + $(this).attr('name');
				var val=_this.model.get(id);  
				if(val)
					$(this).val(val);
			});
		},


		/*==========  Method with default behavior to be extended if needed ==========*/

		/* Default behavior, set value to "" to all input elements */
		reset: function(){
			this.displayErrors();
		},
		
		/* Default behavior, no check, nextEnable will do the job */
		nextOK: function(){
			this.trigger('ns_modules__step_nextOk');
			if(this.ajax && this.validate()){
				return true;
			}else{
				return false;
			}
		},

		displayErrors: function(){
			for(var rq in this.stepAttributes ){
				var o = this.stepAttributes[rq];
				if(o.required && !this.model.get(o.name)){
					this.$el.find('#'+o.name).addClass('incorrect');
				}
				else{
					this.$el.find('#'+o.name).removeClass('incorrect');
				}
			}
		},

		validate: function(){
			this.displayErrors();
			for(var rq in this.stepAttributes ){
				var o = this.stepAttributes[rq];
				if(o.required && !this.model.get(o.name)){
					return false;
				}
			}
			return true;
		},
		
		datachanged_text: function(e){
			var target= $(e.target);
			var val=target.val();
			this.model.set(this.name + '_' + target.attr('name')  , val);
		},

		datachanged_checkbox: function(e){
			var target= $(e.target);
			
			var val=target.val();

			if(target.is(':checked')){
				
				this.model.set(this.name + '_' + target.attr('name') , val);
			}else{
				this.model.set(this.name + '_' + target.attr('name') , null);                
			}
		},

		datachanged_radio: function(e){
			var target= $(e.target);
			var val=$(target).attr('value');
			this.model.set(this.name + '_' + target.attr('name') , val);
		}, 

		datachanged_select: function(e){
			var target= $(e.target);
			
			var val=target.val();
			this.model.set(this.name + '_' + target.attr('name') , val);
		},
		datachanged_file  : function(e){
			var target= $(e.target);
			var val=target.val();
			this.model.set(this.name + '_' + target.attr('name') , val);
		}

	});

});
