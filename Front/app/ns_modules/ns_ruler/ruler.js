(function (root, factory) {

    // Set up Backbone appropriately for the environment. Start with AMD.
    if (typeof define === 'function' && define.amd) {

     define(['jquery',
    'underscore',
    'backbone',
    'backbone_forms',
    'moment',
        ], function ($, _, Backbone, BbForms, moment, exports) {
            // Export global even in AMD case in case this script is loaded with
            // others that may still expect a global Backbone.
            var Retour = factory(root, exports, $, _, Backbone, BbForms, moment);

            return Retour;
        });

        // Next for Node.js or CommonJS. jQuery may not be needed as a module.
    } else if (typeof exports !== 'undefined') {

        var $ = require('jquery');
        var _ = require('underscore');
        var Backbone = require('backbone');
        require('backbone-forms');
        var moment = require('moment');
        var BbForms = Backbone.Form;
        Backbone.$ = $;


        module.exports = factory(root, exports, $, _, Backbone, BbForms, moment);
        //return Retour ;
        // Finally, as a browser global.
    } else {
        //TODO
        //root.Backbone = factory(root, {}, root._, (root.jQuery || root.Zepto || root.ender || root.$));
    }

}(this, function (root, NsRuler, $, _, Backbone, BbForms, moment) {

    var instanceCount = 0;


    // I get the next instance ID.
    var getNewInstanceID = function () {
        // Precrement the instance count in order to generate the
        // next value instance ID.
        return (++instanceCount);

    };

    NsRuler = Backbone.View.extend({
        form: null,
        sourceFields:{},

        initialize: function (options) {
            this.form = options.form;
            this.option = options;
            this.sourceFields = {};
            this.dictRule = {
                'count':this.countRule,
                'equal': this.equalRule,
                'context': this
            };

        },
        addRule: function (target, operator, source) {
            var _this = this;
            var realSource = source ;
            if (!source.isArray()){
                source=[source] ;
            }
            if (source.isArray()){
                _.each(source,function(curSource){
                    _this.sourceFields[curSource].push({source:source, target: target, operator: operator });
                });
            }
            var _this = this;
            if (this.sourceFields[source] == null) {
                this.sourceFields[source] = [{ target: target, operator: operator }];
            }
            else {
                this.sourceFields[source].push({ target: target, operator: operator });
            }
            //console.log('ADD Rule', this.sourceFields, this.sourceFields[source], this.sourceFields[source].length);
            console.log(this.form.$el.find(('#' + this.getEditor(source).id)));

            this.form.$el.find(('#' + this.getEditor(source).id)).on('change keyup paste', function (e) {
                _this.ApplyRules(e);
            });
            
            //this.form.$el.find(('#' + this.getEditor(source).id)).keypress(this.ApplyRules);

            
            //console.log('Editor', this.form.$el.find(('#' + this.getEditor(source).id)), this.getEditor(source).id,this.sourceFields);
            
        },

        getEditor: function (name) {
            return this.form.fields[name].editor;
        },

        ApplyRules: function (evt) {
            console.log('Apply Rule');
            var sourceName = $(evt.currentTarget).attr('name');
            var ruleList = this.sourceFields[sourceName];
            for (var i = 0; i < ruleList.length; i++) {
                var targetName = ruleList[i].target;
                var operator = ruleList[i].operator;
                this.dictRule[operator](sourceName,targetName);
            //this.form.$el.find(('#' + this.getEditor(ruleList[i].target).id)).val(this.getEditor(sourceName).getValue());
            }
        },

        countRule : function(sourceName, targetName){
            var _this = this.context;
            var result = _this.getEditor(sourceName).getValue().length; 
            console.log(result);
            _this.form.$el.find('#' + _this.getEditor(targetName).id).val(result);
            return result; 
        },

        equalRule : function(sourceName, targetName){
            var result = this.getEditor(sourceName).getValue(); 
            console.log(result);
            this.form.$el.find('#' + this.getEditor(targetName).id).val(result);
            return result; 
        },
    });



    return (NsRuler);

}));