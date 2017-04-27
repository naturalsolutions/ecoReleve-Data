/**
 * 
 * Provides support for binding Mousetrap key shortcuts in a Marionette view 
 * Simply add a "keyShortcuts" has to the view object.
 * "keyShortcuts": {
 *    "command+s":"save", 
 *    "up up down left" : function() { console.log("you win") }
 *    "up up down left:keydown" : function() { console.log("triggers on key down") }
 * }
 * 
 */


(function (root, factory) {
   if (typeof define === "function" && define.amd) {
      // AMD. Register as an anonymous module.
      define(["underscore","backbone", "marionette", "mousetrap"], function(_, Backbone, Marionette, Mousetrap) {
        // Use global variables if the locals are undefined.
        return factory(_ || root._, Backbone || root.Backbone, Marionette || root.Marionette, Mousetrap || root.Mousetrap);
      });
   } else if (typeof exports === 'object') {
     module.exports = factory(require("underscore"), require("backbone"), require("marionette"), require("mousetrap"));
   } else {
      // RequireJS isn't being used. Assume underscore and backbone are loaded in <script> tags
      factory(_, Backbone, Marionette, Mousetrap);
   }
}(this, function(_, Backbone, Marionette, Mousetrap) {
    'use strict';

    
    /**
     * We cant override the Behavior construcutor methods in Marionette due to private vars
     * so here we mimic the logic just for our keyShortcuts..
     */
    var wrapBehaviorShortcuts = function(view) {
      var methods = {
        behaviorKeyShortcuts:function() {
          var _behaviorKeyShortcuts={};
          _.each(view._behaviors, function(b) {

            var _keyShortcuts = {};
            var behaviorKeyShortcuts = _.clone(_.result(b, 'keyShortcuts')) || {};
            _.each(behaviorKeyShortcuts, function(behavior, key) {
                var handler   = _.isFunction(behavior) ? behavior : b[behavior];
                _keyShortcuts[key]=handler;
            }, view);

            _behaviorKeyShortcuts = _.extend(_behaviorKeyShortcuts, _keyShortcuts); ;
          }, view);

          return _behaviorKeyShortcuts;
        }
      }
        
      //mimic the Behavior.wrap method..
      var methodName=  'behaviorKeyShortcuts';
      view[methodName] = _.partial(methods[methodName], view[methodName], view._behaviors);
    } 

    /**
     * Get the merged combination of behaviour shortcuts and view shortcuts
     */
    var getCombinedKeyShortcuts = function(view, keyShortcuts) {
      keyShortcuts || (keyShortcuts = _.result(view, 'keyShortcuts'));
      var behaviorKeyShortcuts = _.result(view, 'behaviorKeyShortcuts', {});
      return _.extend({}, keyShortcuts, behaviorKeyShortcuts);
    }
    

    var proto = Backbone.Marionette.View.prototype;

    /**
     * Extend the View with the bind and unbind shortcut methods, 
     * and execute them from Marionettes delegate and undelegate event methods.
     */
    _.extend(proto, {
        delegateEvents:_.wrap(proto.delegateEvents, function(delegate, events) {
            delegate.call(this, events);
            wrapBehaviorShortcuts(this); 
            this.bindShortcuts(); 
        }),

        undelegateEvents:_.wrap(proto.undelegateEvents, function(undelegate, events) {
            undelegate.call(this, events);
            this.unbindShortcuts();   
        }),

        destroy:_.wrap(proto.destroy, function(destroy) {
            destroy.call(this);
            this.unbindShortcuts(); 
        }),

        bindShortcuts:function(keyShortcuts){
            var events = getCombinedKeyShortcuts(this,keyShortcuts);

            if (!events) return this;
            this.mousetrap = this.mousetrap || new Mousetrap(document);
            for (var key in events) {
                var method = events[key];
                if (!_.isFunction(method)) method = this[method];
                if (!method) continue;
                var match = key.split(":");
                this.mousetrap.bind(match[0], _.bind(method, this), match[1]);
            }
        },

        unbindShortcuts:function(keyShortcuts) {
            var events = getCombinedKeyShortcuts(this,keyShortcuts);

            if (!events || !this.mousetrap) return this;
            for (var key in events) {
                var match = key.split(":");
                this.mousetrap.unbind(match[0], match[1]);
            }
        }
    });

}));
