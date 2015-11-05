/**

	TODO:
	- Paginated Server Side -> Ok
	- Paginated Client Side -> Ok
	- Not Paginated -> Not ok
	- Refact, can be easier -> Not ok

 */

define(['marionette', 'config'],
function(Marionette, config) {
	'use strict';
	return Marionette.LayoutView.extend({
		template: 'app/ns_modules/ns_navbar/tpl-navbar.html',
		className: '',

		events: {
			'click #prev' : 'navigatePrev',
			'click #next' : 'navigateNext',
		},

		ui: {
			'totalRecords': '#totalRecords',
			'recordIndex': '#recordIndex'
		},

		initialize: function(options){
			this.parent = options.parent;
			this.model = options.model;
			this.grid = options.globalGrid;
			this.coll = this.grid.grid.collection;
			this.modelIndex = this.coll.indexOf(this.model);
			this.pagingServerSide = this.grid.pagingServerSide;
		},

		setRecordIndex: function(){
			var state = this.grid.grid.collection.state;

			var indexInColl = this.grid.grid.collection.indexOf(this.model)+1;

			var currentPage = state.currentPage-1;
			//var pageSize = state.pageSize;
			var pageSize = this.grid.pageSize;

			this.recordIndexNbr = pageSize * currentPage + indexInColl;

			this.totalRecords = state.totalRecords;
		},

		onShow: function(){
			this.setRecordIndex();
			this.updateIndexState();
		},

		updateIndexState: function(){
			this.ui.recordIndex.html(this.recordIndexNbr);
			this.ui.totalRecords.html(this.totalRecords);
		},

		navigateNext: function(){
			/*backgrid grid issue : https://github.com/backbone-paginator/backbone-pageable/issues/158*/
			this.coll.size();
			if(this.modelIndex < this.coll.size()-1){
				//noNeed 2 fetch
				this.modelIndex++;
				this.upClientSide();
			}else{
				//need 2 fetch first
				this.modelIndex = 0;
				if(this.coll.state.currentPage != this.coll.state.lastPage){
					var tmp = this.coll.state.currentPage;
					tmp++;
				}else{
					//last page
					tmp = 0;
				}
				if(this.pagingServerSide){
					/*===================================
					=            Server Side            =
					===================================*/
					this.upRowServerSide('next');

					if(tmp == 0){
						this.coll.setPageSize(this.grid.grid.collection.state.pageSize, {first: true});
					}else{
						this.coll.getPage(tmp);
					}
					/*=====  End of Server Side  ======*/
				}else{
					/*===================================
					=            Client Side            =
					===================================*/
					if(tmp == this.coll.state.lastPage){
						this.coll.getPage(tmp);
					}else{
						this.coll.setPageSize(this.grid.grid.collection.state.pageSize, {first: true});
					}
					this.upRowClientSide('next');
					/*=====  End of Client Side  ======*/
				}
			}
		},

		navigatePrev: function(){
			if(this.modelIndex != 0){
				//noNeed 2 fetch
				this.modelIndex--;
				this.upClientSide();
			}else{
				//need 2 fetch first
				if(this.coll.state.currentPage > 1){
					var tmp = this.coll.state.currentPage;
					tmp--;

				}else{
					//first page
					tmp = this.coll.state.lastPage;
				}
				if(this.pagingServerSide){

					this.upRowServerSide('prev');
					this.coll.getPage(tmp);

				}else{

					this.coll.getPage(tmp);
					this.upRowClientSide('prev');
				}
			}
		},




		upRowServerSide: function(from){
			var _this = this;
			if(from == 'next'){
				this.grid.upRowServerSide = function(){
					this.currentRow = this.grid.body.rows[0];
					this.upRowStyle();

					_this.updateModelEtc(this.currentRow);
					_this.modelIndex=0;
					_this.resetGridFunction();
				}
			}
			if(from == 'prev'){
				this.grid.upRowServerSide = function(){
					this.currentRow = this.grid.body.rows[this.grid.body.rows.length-1];
					this.upRowStyle();

					_this.modelIndex=this.grid.body.rows.length-1;
					_this.updateModelEtc(this.currentRow);
					_this.resetGridFunction();
				}
			}
		},

		updateModelEtc: function(row){
			this.model=row.model;
			this.setRecordIndex();
			this.updateIndexState();
			this.parent.reloadFromNavbar(row.model);
		},

		//weird I know........... :D
		resetGridFunction: function(){
			this.grid.upRowServerSide = function(){
				this.currentRow = this.currentRow;
				this.upRowStyle();
			}
		},


		upClientSide: function(){

			this.model = this.coll.at(this.modelIndex);

			this.grid.currentRow = this.grid.grid.body.rows[this.modelIndex];

			this.grid.upRowStyle();
			this.setRecordIndex();
			this.updateIndexState();

			this.parent.reloadFromNavbar(this.model);
		},

		upRowClientSide: function(from){
			if(from == 'next'){
				this.modelIndex = 0;
			}
			if(from == 'prev'){
				this.modelIndex = this.grid.grid.body.rows.length-1;
			}

			this.model = this.coll.at(this.modelIndex);

			this.grid.currentRow = this.grid.grid.body.rows[this.modelIndex];
			this.grid.upRowStyle();
			this.setRecordIndex();
			this.updateIndexState();
			this.parent.reloadFromNavbar(this.model);
		},

	});
});
