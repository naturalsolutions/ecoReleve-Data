define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'radio',

	'moment',
	'dateTimePicker',
	'sweetAlert',
	'config',

	'ns_form/NSFormsModuleGit',

	'i18n'

], function($, _, Backbone, Marionette, Radio,
	moment, datetime, Swal, config, NsForm
){

	'use strict';

	return Marionette.LayoutView.extend({

		className: 'full-height', 

		template: 'app/modules/stations/manager/templates/tpl-station-manager.html',

		name : 'Protocol managing',

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
			'click #prevStation' : 'prevStation',
			'click #nextStation' : 'nextStation'
		},


		initialize: function(options){
			if(options.id){
				this.stationId = options.id;
			}else{
				this.stationId = options.model.get('ID');
			}
		},

		check: function(){

		},

		validate: function(){

		},

		getStepOptions: function(){

		},

		onDestroy: function(){
		},


		prevStation: function(e){
			this.stationId--;
			this.displayStation(this.stationId);
		},

		nextStation: function(e){
			this.stationId++;
			this.displayStation(this.stationId);
		},


		displayStation: function(stationId){

			var stationType = 1;
			var _this = this;
			this.nsForm = new NsForm({
				name: 'StaForm',
				modelurl: config.coreUrl+'stations/',
				buttonRegion: ['stationFormBtns'],
				formRegion: 'stationForm',
				displayMode: 'display',
				objecttype: stationType,
				id: stationId,
				reloadAfterSave : true,
			});

			this.nsForm.savingSuccess = function(){
				_this.parent.protos.fetch({reset: true});
			};

		},



		initModel: function(myTpl){
			this.activeProtcolsObj = []; 
			this.protosToRemove = [];
		},

		onShow: function(){
			var _this = this;
			this.displayStation(this.stationId);
			
			var ProtoColl = Backbone.Collection.extend({
				url: config.coreUrl+'stations/'+this.stationId+'/protocols',
				fetch: function(options) {
					var that = this; 
					if(!options){
						var options= {};
					}
					_this.ui.accordion.empty();
					options.data = {
						FormName: 'ObsForm',
						DisplayMode : 'edit'
					};
					options.success = function(protos){
						that.fetchSuccess(protos);
					};
					return Backbone.Collection.prototype.fetch.call(this, options);
				},
				fetchSuccess: function(protos){
					var obsList = [];
					var name;
					var first = true;
					var objectType;
					_.each(protos.models,function( model ){
						obsList = model.get('obs');
						name = model.get('Name');
						objectType = model.get('ID');
						console.log()
						this.createProtoPatern(obsList, name, first, objectType);
						first=false;
					}, _this);
				},
			})

			this.protos = new ProtoColl();
			this.protos.fetch();

			this.protoList4Add();

			this.protocols = {};
			
			this.Proto = Backbone.Model.extend({
				template : false,

				initialize: function(options){
					this.parent = options.parent;
					this.first = options.first;
					this.name = options.name;
					this.obsList = options.obsList;
					this.type = options.type;
					this.stationId = options.stationId;

					this.nbObs = this.obsList.length;

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

					var NSForm = NsForm.extend({
						afterDelete: function(){
							_this.deleteProto(index, this);
						},
					});


					if(obs != 0){
						var Md = Backbone.Model.extend({
							schema : obs.schema,
							fieldsets: obs.fieldsets,
							urlRoot : config.coreUrl+'stations/'+this.stationId+'/protocols/'
						});
						var model = new Md(obs.data);

						var mode = 'edit';
						if(obs.data.id!=0){
							mode = 'display';
						}

						var nsform = new NSForm({
							name: this.type,
							unique : index,
							model: model,
							id : model.get('id'),
							modelurl : config.coreUrl+'stations/'+this.stationId+'/protocols',
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
							modelurl : config.coreUrl+'stations/'+this.stationId+'/protocols',
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

				deleteProto: function(i, form){

					var jqxhr = $.ajax({
						url: config.coreUrl+'stations/'+this.stationId+'/protocols/'+form.model.get('ID'),
						method: 'DELETE',
						context: this,
						contentType:'application/json'
					}).done(function(resp) {
						console.log('deleted');
					}).fail(function(resp) {
						console.log(resp);
					});


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
			/*
			this.$el.i18n();
			this.translater = Translater.getTranslater();
			*/
		},


		createProtoPatern: function(obsList, name, first, objectType){
			var type = '_'+objectType+'_';
			var nbObs = obsList.length; 
			var collapseBody = ''; var collapseTitle = 'collapsed';
			if(first){collapseBody='in'; collapseTitle = '';}

			var tpl = JST['app/modules/input/templates/tpl-accordion.html']({
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
				type : type,
				obsList : obsList,
				stationId: this.stationId
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
