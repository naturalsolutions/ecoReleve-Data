/*
  backgrid-autocomplete-cell
  https://github.com/PeterDowdy/backgrid-autocomplete-cell

  Copyright (c) 2013 Peter Dowdy and contributors
  Licensed under the MIT @license.
*/
define([
  'jquery',
  'underscore',
  'backgrid',
  'config'
], function(
  $,_, Backgrid,config
){
  'use strict';
    /**
     AutocompleteCellEditor is a cell editor that renders an <input> element and initializes it as an autocomplete widget

     See:

       - [Autocomplete](http://jqueryui.com/autocomplete/)

     @class Backgrid.Extension.AutocompleteCellEditor
     @extends Backgrid.InputCellEditor
   */
    var AutocompleteCellEditor = Backgrid.Extension.AutocompleteCellEditor = Backgrid.InputCellEditor.extend({
        formatter: Backgrid.StringFormatter,
        tagName: "input",
        attributes: {
            type: "text"
        },

        /** @property */
/*        autocompleteOptions: null,

        *
           Sets the options for `autocomplete`. Called by the parent AutocompleteCell during edit mode.
         
        setAutocompleteOptions: function (options) {
            this.autocompleteOptions = options;
        },*/
        events: {},
        initialize: function (options) {
            Backgrid.InputCellEditor.prototype.initialize.apply(this, arguments);
/*            this.autocompleteUrl = options.column.get("autocompleteUrl");
            ///if (this.autocompleteUrl[this.autocompleteUrl.length] != '/') this.autocompleteUrl += '/';
            this.minTermLength = options.column.get("minTermLength");
            this.resultsFormatter = options.column.get("resultsFormatter");
            this.labelProperty = options.column.get("labelProperty");
            */
            var _this = this;
                this.autocompleteSource = JSON.parse(JSON.stringify(options.column.attributes.options));
                this.autocompleteSource.source = config.coreUrl + options.column.attributes.options.source;
                this.key = options.column.attributes.name
                this.autocompleteSource.select = function(event,ui){
                    event.preventDefault();
                    _this.model.set(_this.key,ui.item.label);
                    if (options.column.attributes.options.refer_name) {
                        _this.model.set(options.column.attributes.options.refer_name,ui.item.value);
                    }
                    _this.$el.val(ui.item.label);
                    _this.saveOrCancel(event,ui.item.label);
                    _this.$el.focus();
                };
                this.autocompleteSource.focus = function(event,ui){
                    event.preventDefault();
                };

               //_.bindAll(this, 'render', 'saveOrCancel');
                this.autocompleteSource.change = function(event,ui){
                    event.preventDefault();
/*                    if (ui.item) {
                        _this.model.set(_this.key,ui.item.value).change();
                        _this.$el.val(ui.item.label);
                    } else {

                        if (!_this.$el.find('#' + _this.id ).attr('initValue') && _this.$el.find('#' + _this.id ).attr('data_value') != _this.$el.find('#' + _this.id ).val()){
                            _this.$el.find('#' + _this.id ).attr('data_value',_this.$el.find('#' + _this.id ).val()).change();
                        }
                    }*/
                    _this.saveOrCancel(event);
                };
        },

        render: function () {
            var value = this.model.get(this.key);
            var data_value;
            var _this = this;

            /*//if (value && this.options.schema.options.label != this.options.schema.options.value && this.options.schema.options.object) {
            if (true) {
                value = null; 
                var initValue = this.model.get(this.key);
                $.ajax({
                    url : config.coreUrl+this.optionsd.object+'/'+this.model.get(this.key),
                    success : function(data){
                        _this.$el.find('#' + _this.id ).val(data[_this.options.schema.options.label]);
                    }
                })
            } */
            /*var $el = _.template(
                this.template, { id: this.id,value: value,data_value :_this.model.get(_this.key), initValue:initValue,iconFont:_this.iconFont
            });*/

            this.setElement(this.$el);
/*            if(this.options.schema.validators && this.options.schema.validators[0] == "required"){
              this.$el.find('input').addClass('required');
            }*/
            _(function () {
                
                _this.$el.autocomplete(_this.autocompleteSource);
                //_this.$el.find('#' + _this.id).addClass(_this.options.schema.editorClass) ;
                /*if (_this.options.schema.editorAttrs && _this.options.schema.editorAttrs.disabled) {
                    _this.$el.find('#' + _this.id).prop('disabled', true);
                }*/
            }).defer();
            return this;
        },
        /**
           Renders an <input> element and then initializes an autocomplete widget off of it

           @chainable
         */
        /*render: function () {
            var thisView = this;
            this.$el.autocomplete({
                source: thisView.getAutocompleteCustomers,
                select: function (event, ui) {
                    if (!ui.item.value) {
                        return;
                    } else {
                        console.log(event)
                        event.target.val(ui.item.label)
                        thisView.model.set(thisView.column.attributes.name, ui.item.value);
                    }
                    thisView.saveOrCancel(event);
                },
                close: function (event) {
                    thisView.saveOrCancel(event);
                }
            });
            return this;
        },*/
/*        getAutocompleteCustomers: function (request, response) {
            var thisView = this;
            var term = request.term;
            if (term.length < this.minTermLength) {
                response([]);
                return;
            }
            $.ajax({
                url: thisView.autocompleteUrl +'?term='+term,
                contentType: 'application/json',
                type: 'GET',
                success: function (data) {
                    var results = [];
                    for (var i = 0; i < data.length; i++) {
                        if (typeof thisView.resultsFormatter == 'function')
                            results.push(thisView.resultsFormatter(data[i]));
                        else if (thisView.labelProperty) results.push({
                            label: data[i][thisView.labelProperty], value : data[i]['value']
                        });
                        else results.push({
                            label: data[i]
                        });
                    }
                    results = _.compact(results);
                    if (results.length == 0) {
                        results.push({
                            label: "No results found",
                            value: ""
                        });
                    }
                    response(results);
                    return;
                },
                error: function (err) {
                    results.push({
                            label: "No results found",
                            value: ""
                        });
                    response(results);
                    return;
                }
            });
        },*/
        saveOrCancel: function (e,displayVal) {
            var model = this.model;
            var column = this.column;

            var command = new Backgrid.Command(e);
            if (e.type == "autocompleteselect") {
                e.stopPropagation();
                model.trigger("backgrid:edited", model, column, command);
                this.$el.val(displayVal);
            }
        },
        postRender: function (model, column) {
            if (column == null || column.get("name") == this.column.get("name")) {
                // move the cursor to the end on firefox if text is right aligned
                if (this.$el.css("text-align") === "right") {
                    var val = this.$el.val();
                    this.$el.focus().val(null).val(val);
                } else this.$el.focus();
            }
            return this;
        }
    });

    /**
     AutocompleteCell is a cell class that renders a jQuery autocomplete widget during edit mode.

     @class Backgrid.Extension.Select2Cell
     @extends Backgrid.SelectCell
   */
    return Backgrid.Extension.AutocompleteCell = Backgrid.StringCell.extend({
        initialize: function (options) {
            Backgrid.StringCell.prototype.initialize.apply(this, arguments);
            /*this.listenTo(this.model, "backgrid:edit", function (model, column, cell, editor) {
                if (column.get("name") == this.column.get("name")) {
                    editor.setAutocompleteOptions(this.autocompleteOptions);
                }
            });*/
        },
        className: "autocomplete-cell",
        editor: AutocompleteCellEditor
    });
});