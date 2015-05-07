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

		onDestroy: function(){

		},

		initialize: function(options){
			this.name=options.name;
			this.template=options.tpl;

			this.model=options.model; //global model
			this.stepAttributes=[]; //all attributes per step
			this.initModel();

		},
		initModel: function(){
			this.parseOneTpl(this.template);
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


		parseOneTpl: function(myTpl){// Initialisation du model à partir du template

			var tpl= $.parseHTML(myTpl);

			var ctx = this;
			var elemIndex = 0;
			$(tpl).find('input:not(:checkbox,:radio)').each(function(){

				var name= ctx.name+'_' + this.name;

				var rq = $(this).hasClass('required');
				var obj={name : name, required : rq, };
				var val ;
				if ($(this).attr('value'))
				{
					val = $(this).attr('value');
				}
				else {val = null;}
				ctx.stepAttributes.push(obj);
				//var val=ctx.model.get(obj.name); //get val
				ctx.model.set(name, val);
			});
			$(tpl).find('select').each(function(){

				var name= ctx.name+'_' + this.name;
				//$(this).attr('StepperModelName', name);

				
				var obj={name : name};

				ctx.stepAttributes.push(obj);
				//var val=ctx.model.get(obj.name);
				ctx.model.set(name, $(this).find(':selected').val());
			});
			//add radio & checkbox
			var radioCreated = [] ;
			$(tpl).find('input:radio').each(function(){
			//$(myTpl).find('input:radio').each(function(){
				var name= ctx.name+'_' + this.name;
				
				
				if (radioCreated.indexOf(this.name)==-1){
					radioCreated.push(this.name);
					
					var obj={name : name};
					ctx.stepAttributes.push(obj);
					var val=null;
					elemIndex++;
					ctx.model.set(obj.name, val);
					
					}
				if ($(this).attr('checked')){
						val = $(this).attr('value') ;
						ctx.model.set(obj.name, val);
   
					}
			 
			});
		},

		onShow: function(){
		},

		onRender: function(){
			//this.view1=new View1();
			//this.main.show(this.view1, {preventDestroy: true});
			//this.parseOneTpl(this.template);
			this.feedTpl();
		},

		feedTpl: function(){

			var ctx=this;

			this.$el.find('input:not(:checkbox,:radio,:submit)').each(function(){
				var id = ctx.name + '_' + $(this).attr('name');
				//for (var i = 0; i < ctx.stepAttributes.length; i++) {
				//    if(id==ctx.stepAttributes[i].name)
						$(this).attr('value', ctx.model.get(id));                        
				//};
			});

			this.$el.find('input:checkbox').each(function(){
				var id = ctx.name + '_' + $(this).attr('name');
				var tmp=ctx.model.get(id);
				if(tmp){ $(this).attr('checked', 'checked') }
			});
			this.$el.find('input:radio').each(function(){
				var id = ctx.name + '_' + $(this).attr('name');
				var tmp=ctx.model.get(id);
				if($(this).val() == tmp){ $(this).attr('checked', 'checked') }
			});
			this.$el.find('select').each(function(){
				var id = ctx.name + '_' + $(this).attr('name');
				var val=ctx.model.get(id);  
				if(val)
					$(this).val(val);
			});



		},


		/*==========  Method with default behavior to be extended if needed ==========*/

		/* Default behavior, set value to "" to all input elements */
		reset: function(){
			//this.initModel() ;
			//this.render();
			this.displayErrors();

		},
		
		/* Default behavior, no check, nextEnable will do the job */
		nextOK: function(){
			var ajax=true;
			if(ajax && this.validate()){
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
