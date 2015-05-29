define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'radio',
	'config',
	'swiper',
	'sweetAlert',
	
	'simplePagination',

	'ns_stepper/lyt-step',

	'ns_form/NSFormsModuleGit',

	'../views/view-step3-station-details',
	// 'tmp/getProtocolsList',
	// 'tmp/getUsers',

	// 'models/station',
	'translater'

], function($, _, Backbone, Marionette, Radio, config, Swiper,
	Swal, simplePagination,
	Step, NsFormsModule,
	ViewStationDetail,
	/*
	getProtocolsList, getUsers,
	*/
	Station, Translater
){

	'use strict';

	return Step.extend({
		/*===================================================
		=            Layout Stepper Orchestrator            =
		===================================================*/



		regions: {
			rgStation: '#rgStation',
			rgProtos : '#rgProtos'
		},

		ui: {
			accordion : '#accordion',
			protoList : '#protoList'
		},

		events : {
			'click #addProto' : 'addProto',
		},

		/*
		ui:{
			addProto : 'select[name="add-protocol"]',
			 protosList : '#tabProtsUl'
		},*/

		initModel: function(myTpl){
			//this.parseOneTpl(this.template);
			this.activeProtcolsObj = []; 
			this.protosToRemove = [];
		},

		onShow: function(){

			var stationType = this.model.get('start_stationtype');
			this.stationId = this.model.get('station');
			this.stationId = 1;
			
			this.rgStation.show(new ViewStationDetail({
				stationId: this.stationId,
				stationType: stationType
			}));

			var jqxhr = $.ajax({
				url: config.coreUrl+'stations/'+this.stationId+'/protocols',
				method: 'GET',
				context: this,
				data : {
					FormName: 'ObsForm',
					DisplayMode : 'display'
				},
				contentType:'application/json'
			}).done(function(resp) {
				console.log(resp);
				this.initProtos(resp);
			}).fail(function(resp) {
				console.log(resp);
			});

			this.protoList4Add();
			this.protos = new Backbone.Collection();


			this.protocols = {};


			/*
			this.$el.i18n();
			this.translater = Translater.getTranslater();
			*/

			this.Proto = Marionette.LayoutView.extend({
				template : false,

				initialize: function(options){
					this.parent = options.parent;
					this.first = options.first;
					this.name = options.name;
					this.obsList = options.obsList;

					this.nbObs = this.obsList.length;
					this.type = this.name.replace(/ /g,'');


					this.model = new Backbone.Model({
						name : this.name,
						type : this.type,
						nbObs: this.nbObs,
						collapseBody : this.collapseBody,
						collapseTitle : this.collapseTitle
					});

					this.indexPageList = [];

					this.initProto();
				},

				onShow : function(){
					
				},

				initProto: function(){
					for (var i = 0; i < this.nbObs; i++) {
						this.addObs(this.obsList[i], i);
					}
					this.paginateObs();
				},

				addObs: function(obs, index, objectType){
					var _this = this;

					var key = this.type+index;
					this.indexPageList.push('#page'+key);

					var classes;
					(index==0)? classes="" : classes = "hidden";

					$('#'+this.type+'Collapse > .panel-body').append('<div id="page'+key+'" class="'+classes+'"> <div id="'+key+'"></div><div id="stationFormBtns'+key+'"></div></div>');

					var NSForm = NsFormsModule.extend({
						afterDelete: function(){
							_this.deleteProto(index);
						},
					});


					if(obs != 0){
						var Md = Backbone.Model.extend({
							schema : obs.schema,
							fieldsets: obs.fieldsets,
						});

						var model = new Md(obs.data);
						var mode = 'edit';

						model.urlRoot = config.coreUrl+'stations/'+this.stationId+'/protocols/';

						var nsform = new NSForm({
							name: this.type,
							unique : index,
							model: model,
							id : model.get('id'),
							modelurl : config.coreUrl+'stations/'+this.stationId+'/protocols/',
							buttonRegion: ['stationFormBtns'+key],
							formRegion: key,
							displayMode: mode,
							reloadAfterSave : true,
						});
					}else{
						var nsform = new NSForm({
							name: this.type,
							unique : index,
							id : 0,
							modelurl : config.coreUrl+'protocols/',
							buttonRegion: ['stationFormBtns'+key],
							formRegion: key,
							displayMode: 'edit',
							reloadAfterSave : true,
							objecttype: objectType
						});

						$('#'+this.type+'Pagination').pagination('updateItems', this.nbObs);
					}
					this.updateNbObs();
				},

				paginateObs: function(){
					var _this = this;

					this.current = $('#'+this.type).find(this.indexPageList[0]);

					$('#'+this.type+'Pagination').pagination({
						items: this.nbObs,
						cssStyle: 'light-theme',
						hrefTextPrefix: '',
						onPageClick: function(pageNumber){
							_this.current.addClass('hidden');


							_this.current = $('#'+_this.type).find(_this.indexPageList[pageNumber-1]);

							_this.current.removeClass('hidden');
						},
					});
				},

				deleteProto: function(i){

					if(this.indexPageList.length>1){
						var index= this.indexPageList.indexOf('#page'+this.type+i);

						$('#'+this.type).find(this.indexPageList[index]).remove();
						
						this.indexPageList.splice(index, 1);

						/*
						if(index !=0){
							this.current = $('#'+this.type).find(this.indexPageList[index-1]);
						}else{
							this.current = $('#'+this.type).find(this.indexPageList[index]);
						}*/

						this.current = $('#'+this.type).find(this.indexPageList[0]);

						this.current.removeClass('hidden');
						this.nbObs--;

						$('#'+this.type).find('#'+this.type+'Pagination').pagination('updateItems', this.nbObs);
						$('#'+this.type).find('#'+this.type+'Pagination').pagination('selectPage', 1);
						this.updateNbObs();
					}else{
						$('#'+this.type).remove();
						delete this.parent.protocols[this.name];
					}
				},

				updateNbObs: function(){
					$('#'+this.type).find('.badge').html(this.nbObs);
				},
			});
		},


		initProtos: function(protos){
			var first = true;


			var objectType;
			for(var name in protos){
				this.createProtoPatern(protos[name], name, first, objectType);
				first=false;
			}


		},

		createProtoPatern: function(obsList, name, first, objectType){
			var type = name.replace(/ /g,'');
			var nbObs = obsList.length; 
			var collapseBody = ''; var collapseTitle = 'collapsed';
			if(first){collapseBody='in'; collapseTitle = '';}

			var tpl = Marionette.Renderer.render('app/modules/input/templates/tpl-accordion.html', {
					name : name,
					type : type,
					nbObs: nbObs,
					collapseBody : collapseBody,
					collapseTitle : collapseTitle
			});
			this.ui.accordion.append(tpl);

			var protocol = new this.Proto({
				parent: this,
				first: first,
				name : name,
				obsList : obsList
			});

			this.protocols[name] = protocol;
			return protocol;
		},


		addProto: function(){
			var name = this.ui.protoList.find(":selected").text();
			var objectType = this.ui.protoList.val();

			var proto =this.protocols[name];

			if(proto){
				proto.nbObs++;
				proto.addObs(0, proto.nbObs, objectType);
			}else{
				proto = this.createProtoPatern([], name, false, objectType);
				proto.nbObs++;
				proto.addObs(0, 0, objectType);
				proto.current = $('#'+proto.type).find(proto.indexPageList[0]);
			}
		},


		protoList4Add: function(){
			var _this = this;
			this.protoSelectList = new Backbone.Collection();
			this.protoSelectList.fetch({
				url: config.coreUrl+'/protocolTypes',
				reset: true,
				success: function(){
					_.each(_this.protoSelectList.models,function( model ){
						_this.ui.protoList.append(new Option(model.get('Name'), model.get('ID')));
					},this);
				},
			});
		},

		sweetAlert : function(title,type,message){

			Swal({
				title: title,
				text: message,
				type: type,
				showCancelButton: false,
				confirmButtonColor: 'rgb(147, 14, 14)',
				confirmButtonText: "OK",
				closeOnConfirm: true,
			});
		}
	});
});
