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
                'sum': this.operationListRule,
                'minus': this.operationListRule,
                'times': this.operationListRule,
                'context': this
            };

        },
        addRule: function (target, operator, source) {
            var _this = this;
            var realSource = source ;
            this.sourceFields = {};
            if (!(source instanceof Array)){
                source=[source] ;
            }
            if (!this.dictRule[operator]){
                return {message: 'unknown operator', error:'', object: target};
            }
            try {
                _.each(source,function(curSource){
                    if (_this.sourceFields[curSource] == null) {
                        _this.sourceFields[curSource] = [{source:source, target: target, operator: operator }];
                    } else {
                        _this.sourceFields[curSource].push({source:source, target: target, operator: operator });
                    }
                    _this.form.$el.find(('#' + _this.getEditor(curSource).id)).on('change keyup paste', function (evt) {
                        _this.ApplyRules(evt);
                    });
                });
                return null;
            } catch (e) {
                console.log('totot',e);
                return {message: 'invalid configuration', error:e, object: target};
            }
        },

        getEditor: function (name) {
            return this.form.fields[name].editor;
        },

        ApplyRules: function (evt) {
            var sourceName = $(evt.currentTarget).attr('name');
            var ruleList = this.sourceFields[sourceName];
            for (var i = 0; i < ruleList.length; i++) {
                var targetName = ruleList[i].target;
                var operator = ruleList[i].operator;
                this.dictRule[operator](ruleList[i]);
            //this.form.$el.find(('#' + this.getEditor(ruleList[i].target).id)).val(this.getEditor(sourceName).getValue());
            }
        },

        countRule : function(curRule){
            var _this = this.context;
            var result = _this.getEditor(curRule.source).getValue().length; 
            _this.form.$el.find('#' + _this.getEditor(curRule.target).id).val(result);
            return result; 
        },

        equalRule : function(curRule){
            var _this = this.context;
            var result = this.getEditor(curRule.source).getValue(); 
            this.form.$el.find('#' + this.getEditor(curRule.target).id).val(result);
            return result; 
        },

        operationListRule : function(curRule){
            var _this = this.context;
            var result = 0;
            if (curRule.operator == 'times') {
                result = 1;
            }
            if (curRule.source instanceof Array) {
                _.each(curRule.source,function(curSource){
                    var sourceValue = parseFloat(_this.form.$el.find('#' + _this.getEditor(curSource).id).val());
                    if (sourceValue == '' || isNaN(sourceValue)){
                        sourceValue = 0;
                        //_this.form.$el.find('#' + _this.getEditor(curSource).id).val(0);
                    }
                    switch (curRule.operator) {
                        case 'sum': 
                            result += sourceValue;
                            break;
                        case 'minus': 
                            result -=sourceValue;
                            break;
                        case 'times': 
                            result = result * sourceValue;
                            break;
                    }
                });
            }
            _this.form.$el.find('#' + _this.getEditor(curRule.target).id).val(result);
            return result; 
        },
    });



    return (NsRuler);

}));