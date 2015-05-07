define([
    'jquery',
    'underscore',
    'backbone',
    'marionette',
    'ns_form/NSFormsModuleGit',
    'config'

], function ($, _, Backbone, Marionette,NsForm,config) {
    'use strict';

    return Marionette.LayoutView.extend({

        template: 'app/Demo/tpl-Sta.html',
        nsform: null,
        nsgrid: null,
        model: null,
        displayMode: "display",
        nseventform: null,
        id: null,
        currentEvent: null,

        initialize: function (options) {
            console.log(options);
            /*$.ajax({
            	url : config.coreUrl+'stations/forms',
            	data : {ObjectType : 1},
            	success : function(data) {
            		console.log(data)
            	}
            })*/
            // TODO à récupérer depuis options
            this.objtype = 1;
            
            if (options.id) {
                this.id = options.id;
            }

            if (!this.id && this.objtype) {
                this.displayMode = "edit";
            }
            console.log(this.id) ;
            var _this = this;
            /*this.nsform = new NsForm({
                name: 'StaForm',
                modelurl: '/ecoReleve-Core/stations/',
                buttonRegion: ['StaFormButton'],
                formRegion: 'StaForm',
                displayMode: this.displayMode,
                objecttype: options.objtype,
                id: this.id,
            });
*/
			var NSFormAMoi = NsForm.extend({
				onSavingModel: function () {
	            	if (_this.objtype) {
	            		this.model.set('FK_StationType',_this.objtype) ;
	            	}
            		this.model.set('creationDate',new Date()) ;
        		},
        		
			});
			
            this.nsform = new NSFormAMoi({
                name: 'StaForm',
                modelurl: '/ecoReleve-Core/stations/',
                buttonRegion: ['StaFormButton'],
                formRegion: 'StaForm',
                redirectAfterPost : window.location + '/@id' ,
                displayMode: this.displayMode,
                objecttype: this.objtype,
                id: this.id,
            });

        },
 
        getBaseURL: function () {
            return window.location.origin + window.location.pathname;

        },

        
    });

});
