/*
  backgrid-autocomplete-cell
  options :
        source : your WS Url or Array({label:'label',value:yourValLabel}),
        minLength : number of characters to trig autocomplete,
        target: the target attributes to set the model with value according selected label

*/
define([
  'jquery',
  'underscore',
  'backgrid',
], function(
  $,_, Backgrid
){
  'use strict';

var AutocompleteCellEditor = Backgrid.InputCellEditor.extend({
    formatter: Backgrid.StringFormatter,
    tagName: "input",
    attributes: {
        type: "text"
    },

    events: {"blur": "saveOrCancel", "keydown": "saveOrCancel"},

    initialize: function (options) {
        Backgrid.InputCellEditor.prototype.initialize.apply(this, arguments);
        var _this = this;
        this.autocompleteSource = JSON.parse(JSON.stringify(options.column.attributes.options));
        this.autocompleteSource.source = options.column.attributes.options.source;
        this.key = options.column.attributes.name
        this.target = options.column.attributes.options.target;
        this.autocompleteSource.select = function(event,ui){
            event.preventDefault();

            _this.model.set(_this.key,ui.item.label);
            if (this.target) {
                _this.model.set(this.target,ui.item.value);
            }
            _this.$el.val(ui.item.label);
            _this.saveOrCancel(event,ui.item);
            _this.$el.focus();
        };
        /*this.autocompleteSource.focus = function(event,ui){
            event.preventDefault();
            console.log('focus')
            //$('.ui-autocomplete-input').blur();
        };*/

        this.autocompleteSource.change = function(event,ui){
            event.preventDefault();
          if (!ui.item) {
                if (_this.$el.val() == ''){
                    _this.saveOrCancel(event,ui.item);
                }
             } else {
             }
        };
    },
    render: function () {
        var value = this.model.get(this.key);
        var data_value;
        var _this = this;
        this.setElement(this.$el);
        _(function () {
            _this.$el.autocomplete(_this.autocompleteSource);
        }).defer();
        this.$el.val(value);
        return this;
    },
 
    saveOrCancel: function (e,item) {
        var model = this.model;
        var column = this.column;
        var command = new Backgrid.Command(e);
        model.set('error',false);
        if (e.type == "autocompleteselect") {
            e.stopPropagation();
            model.set(this.key,item.label);
            if (this.target) {
                model.set(this.target,item.value);
            }
            model.trigger("backgrid:edited", model, column, command);
            model.trigger("backgrid:autocompEdited", model, column, command);
            this.$el.val(item.value);
            model.set('error',false);
        }
        if (e.type == "blur") {
            model.set('error',false);
            model.trigger("backgrid:edited", model, column, command);
            model.trigger("backgrid:autocompEdited", model, column, command);

        }
        if (e.type == "autocompletechange" && !item) {
            
            if (this.$el.val()=='') {
                model.set(column.get("name"),null);
                model.set(this.target,null);
                model.set('error',false);
                this.$el.change();
                model.trigger("backgrid:autocompEdited", model, column, command);

            } else {
                if (model.get(column.get("name")) != this.$el.val()){
                    model.trigger("backgrid:error", model, column, command);
                    model.set(column.get("name"),this.$el.val());
                    model.set(this.target,null);
                    model.set('error',true);
                }
            }
        }
    },
});


    return Backgrid.Extension.AutocompleteCell = Backgrid.StringCell.extend({
        initialize: function (options) {
            Backgrid.StringCell.prototype.initialize.apply(this, arguments);
        },
        className: "autocomplete-cell",
        editor: AutocompleteCellEditor,
    });
});