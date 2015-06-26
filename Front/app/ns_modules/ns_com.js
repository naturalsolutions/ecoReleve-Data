define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',


], function($, _, Backbone , Marionette) {

	'use strict';
	// I am the internal, static counter for the number of Coms
	// that have been created in the system. This is used to
	// power the unique identifier of each instance.
	var instanceCount = 0;


	// I get the next instance ID.
	var getNewInstanceID = function(){

		// Precrement the instance count in order to generate the
		// next value instance ID.
		return( ++instanceCount );

	};


	// -------------------------------------------------- //
	// -------------------------------------------------- //


	// I return an initialized object.
	function Com(){
		// Store the private instance id.
		this._instanceID = getNewInstanceID();
		this.components= [];
		this.motherColl = new Backbone.Collection();
		// Return this object reference.
		return( this );

	}


	// I return the current instance count. I am a static method
	// on the Com class.
	Com.getInstanceCount = function(){

		return( instanceCount );

	};


	// Define the class methods.
	Com.prototype = {
		// I return the instance ID for this instance.
		getInstanceID: function(){
			return( this._instanceID );
		},

		setMotherColl: function(coll){
			this.motherColl = coll;
		},

		getMotherColl: function(){
			return this.motherColl;
		},

		updateMotherColl: function(ids){
			for (var i = ids.length - 1; i >= 0; i--) {
				this.motherColl.where({id : ids[i]}, function(m){
					m.attributes.import = true; 
				});
				
			};
		},

		addModule: function(m){
			this.components.push(m);
		},



		action: function(action, ids){
			if(action === 'selection' || action === 'selection'){
				this.updateMotherColl(ids);
			}
			for (var i = 0; i < this.components.length; i++) {
				this.components[i].action(action, ids);
			};
		},
	};


	// -------------------------------------------------- //
	// -------------------------------------------------- //


	return( Com );

});
