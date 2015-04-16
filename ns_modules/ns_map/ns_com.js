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

            addModule: function(m){
                this.components.push(m);
            },

            action: function(action, params){
                
                for (var i = 0; i < this.components.length; i++) {
                    this.components[i].action(action, params);
                };
            },

 
        };
 
 
        // -------------------------------------------------- //
        // -------------------------------------------------- //
 
 
        return( Com );
 
 
    }
);