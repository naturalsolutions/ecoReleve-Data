(function (root, factory) {

    // Set up Backbone appropriately for the environment. Start with AMD.
    if (typeof define === 'function' && define.amd) {
        console.log('amd');
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



        /*var brfs = require('brfs')
        var tpl = brfs('./Templates/NsFormsModule.html');*/


        module.exports = factory(root, exports, $, _, Backbone, BbForms, moment);
        //return Retour ;
        // Finally, as a browser global.
    } else {
        //TODO
        //root.Backbone = factory(root, {}, root._, (root.jQuery || root.Zepto || root.ender || root.$));
    }

}(this, function (root, NsFilter, $, _, Backbone, BbForms, moment) {

    var tpl = '<form class="filter form-horizontal filter-form-<%=fieldname%>">'
        + '<div   class="filterdiv" >'
    + '<br><span data-editors="Column"></span>'
        + '<span class="col-xs-3"><b><%= filterName %>&nbsp:</b></span>'
       + '<span data-editors="ColumnType"></span>'

       + '<span class="col-xs-3" data-editors="Operator"></span>'
        + '<span class="col-xs-6 filter" data-editors="Value"></span>'
    + '</div>'
    + '<div class="clear"></div>'
    + '</form>'
    + '<div class="clear"></div>';


    var tplcheck =
    '<form class="filter form-horizontal filter-form-<%=fieldname%>" style="position:relative">'
    + '<br><div   style="margin-bottom: 30px;">'
        + '<span data-editors="Column"></span>'
        + '<span class="col-xs-3"><b><%= filterName %>&nbsp:</b></span>'
        + '<span data-editors="ColumnType"></span>'

        + '<span class="hidden col-xs-4" data-editors="Operator"></span>'
        + '<span class="col-xs-9" data-editors="Value"></span>'
    + '</div>'
    + '<div class="clear"></div>'
    + '</form>'
    + '<div class="clear"></div>'

    var tplinterval =
   '<form class="filter form-horizontal filter-form-<%=fieldname%>" style="position:relative">'
   + '<br><div   style="margin-bottom: 30px;">'
       + '<span data-editors="Column"></span>'
       + '<span class="col-xs-3"><b><%= filterName %>&nbsp:</b></span>'
       + '<span data-editors="ColumnType"></span>'
       + '<span class="hidden col-xs-4" data-editors="Operator"></span>'
       + '<span class="col-xs-3">From</span><span class="col-xs-6 filterinterval" data-editors="From"></span>'
       + '<span class="col-xs-3"></span>'
       + '<span class="col-xs-3">To</span><span class="col-xs-6 filterinterval" data-editors="To"></span>'
   + '</div>'
   + '<div class="clear"></div>'
   + '</form>'
   + '<div class="clear"></div>'


    var tplAdded = '<div class="filter clearfix">'
      + '<div class="clearfix">'
        + '<div class="legend">'
         + '<label class="col-xs-12"><%= filterName %>:</label>'
          + '<span data-editors="Column"></span>'
          + '<span data-editors="ColumnType"></span>'
        + '</div>'
        + '<div class="col-xs-12">'
          + '<span class="col-xs-4 no-padding" data-editors="Operator"></span>'
          + '<span class="col-xs-6 no-padding-left" data-editors="Value"></span>'
          + '<span class="pull-right">'
            + '<button class="btn btn-warning" id="removeFilter">'
              + '<span class="reneco reneco-close"></span>'
            + '</button>'
          + '</span>'
        + '</div>'
      + '</div>'
    + '</div>';

    /*
    
    define([
        'jquery',
        'underscore',
        'backbone',
        'backbone_forms',
        'moment',
        'requirejs-text!./Templates/tpl-filters.html',
        'requirejs-text!./Templates/tpl-CheckBoxes.html',
        'requirejs-text!./Templates/tpl-filters-added.html',
    ], function ($, _, Backbone, BbForms, moment, tpl, tplcheck,tplAdded) {
        'use strict';*/
    NSFilter = Backbone.View.extend({

        events: {
            "click input": 'clickedCheck'
        },
        ToggleFilter: null,
        filterContainer: null,
        channel: null,
        clientSide: null,
        filterFromAJAX: true,
        name: null,
        com: null,
        url: null,
        datas: null,
        forms: [],
        filtersValues: null,
        /*=====================================
        =            Filter Module            =
        =====================================*/

        initialize: function (options) {
            this.filterContainer = options.filterContainer;

            this.channel = options.channel;

            this.clientSide = options.clientSide;
            this.name = options.name || '';
            this.com = options.com;
            this.typeObj = options.typeObj;
            this.url = options.url;
            this.datas = {};

            this.url = options.url + 'getFilters';
            this.forms = [];
            if (options.filtersValues) {
                this.filtersValues = this.getValuesAsDic(options.filtersValues);
            }
            // If filters are given we use them
            if (!options.custom) {
                if (options.filters) {
                    this.filters = options.filters;
                    this.filterFromAJAX = false;
                    this.initFilters(this.filters);
                }
                else {
                    // Otherwise initialized from AJAX call
                    this.getFilters();
                }
            }
            this.ToggleFilter = options.ToggleFilter;

            // If filters are given we use them
            this.criterias = {};
            if (options.filterLoaded) {
                this.filterLoaded = options.filterLoaded;
            }
        },
        getContainer: function () {
            if (typeof (this.filterContainer) === 'string') {
                return $('#' + this.filterContainer);
            } else {
                return this.filterContainer;
            }

        },
        getValuesAsDic: function (filterArray) {

            var filterValues = {};

            for (var i = 0 ; i < filterArray.length; i++) {
                curFiltre = filterValues[filterArray[i].Column];
                if (curFiltre == null) {
                    curFiltre = {}
                    curFiltre.operatorValue = filterArray[i].Operator;
                }
                else {
                    curFiltre.operatorValue = 'between';
                }
                curFiltre.value = filterArray[i].Value;
                if (filterArray[i].Operator == '>=') {
                    curFiltre.From = filterArray[i].Value;
                }
                if (filterArray[i].Operator == '<=') {
                    curFiltre.To = filterArray[i].Value;
                }
                filterValues[filterArray[i].Column] = curFiltre;
            }
            return filterValues;
        },
        getFilters: function () {
            var _this = this;
            this.forms = [];
            var jqxhr = $.ajax({
                url: _this.url,
                data: {
                    'FilterName': _this.name,
                    'typeObj': _this.typeObj,
                },
                contentType: 'application/json',
                type: 'GET',
                context: this,
            }).done(function (data) {
                this.initFilters(data);
                this.datas = data;
            }).fail(function (msg) {
                console.log(msg);
            });
        },

        filterLoaded: function () {

        },

        initFilters: function (data) {
            var form;
            var _this = this;
            for (var key in data) {
                form = this.initFilter(data[key]);
                this.getContainer().append(form.el);

                if (data[key].type == 'Checkboxes') {
                    if (!this.filtersValues || !this.filtersValues[data[key].name]) {
                        this.getContainer().find("input[type='checkbox']").each(function () {
                            $(this).prop('checked', true);
                        });
                    }
                }
                this.getContainer().find("input[type='checkbox']").on('click', this.clickedCheck);
                /*
                this.getContainer().find("#dateTimePicker").each(function () {
                    console.log('THGIS', this);
                    $(this).datetimepicker();
                });*/

                this.forms.push(form);
                this.filterLoaded();
            };

            $(this.filterContainer).find('input').on('keypress', function(e) {
                if( e.keyCode == 13  ){
                    e.preventDefault();
                    _this.update();
                }
            });

            if (this.ToggleFilter) {
                for (var i = 0; i < this.forms.length; i++) {

                    if (this.forms[i].model.get('Value') != null || this.forms[i].model.get('Value') == 0) {
                        if (
                            (this.forms[i].model.get('ColumnType') == 'Select' && this.forms[i].model.get('Value') == '-1')
                            || (this.forms[i].model.get('ColumnType') == 'Checkboxes' && this.forms[i].model.get('Value')[0] == '-1')
                            || (this.forms[i].model.get('Value') != '0' && this.forms[i].model.get('Value') == '')
                            ) {
                            // pas de saisie
                        }
                        else {
                            $('.filter-form-' + this.forms[i].model.get('Column') + ' .filter').addClass(this.ToggleFilter.classBefore);
                            var toggleInfo = {
                                columnName: this.forms[i].model.get('Column'),
                                classAfter: this.ToggleFilter.classAfter,
                                classBefore: this.ToggleFilter.classBefore,
                            }
                            setTimeout(function (toggleInfo) {
                                $('.filter-form-' + toggleInfo.columnName + ' .filter').removeClass(toggleInfo.classBefore);
                                $('.filter-form-' + toggleInfo.columnName + ' .filter').addClass(toggleInfo.classAfter);
                                //}
                            }, 0, toggleInfo);
                        }
                    }
                }
            };
       
        },

        addFilter: function (data) {
            var _this = this;
            var form;
            var index = 0;
            for (var key in data) {
                index++;
                form = this.initFilter(data[key], true);
                this.getContainer().append(form.el);

                $(form.el).find('select').focus();
                if (data[key].type == 'Checkboxes') {
                    this.getContainer().find('input[type="checkbox"]').each(function () {
                        $(this).prop('checked', true);
                    });
                }

                form.$el.find('button#removeFilter').on('click', function () {
                    _this.getContainer().find(form.el).remove();
                    var i = _this.forms.indexOf(form);
                    if (i > -1) {
                        _this.forms.splice(i, 1);
                    }
                    return;
                });

                this.forms.push(form);
            };
        },

        initFilter: function (dataRow, added) {
            var form;
            var type = dataRow['type'];
            
            var template = tpl;
            var template = (added) ? tplAdded : tpl;
            var options = this.getValueOptions(dataRow);
            var isInterval = false;
            var operators = null;
            if (dataRow.options) {
                var operators = dataRow.options.operators;
                if (dataRow.options.isInterval) {
                    isInterval = true;
                }
            }

            var editorClass = (dataRow['editorClass'] || '') + ' form-control filter';

            if (type == 'Select' || type == 'Checkboxes' || type == 'AutocompTreeEditor') {
                editorClass += ' list-inline ';
                options = dataRow['options'];

                if (type == 'Checkboxes') {
                    options.splice(0, 0, { label: 'All', val: -1, checked: true });
                    template = tplcheck;
                    editorClass = editorClass.split('form-control').join('');
                }
                else if (type == 'Select') {
                    dataRow['options'].splice(0, 0, { label: ' ', val: -1 });
                }
            }

            editorClass += ' ' + dataRow['name'];
            if (isInterval) {
               
                form = this.getBBFormFromInterval(dataRow, editorClass, type,tplinterval);
            }
            else {
                
                form = this.getBBFormFromFilter(dataRow, editorClass, type, operators,template);
            }



            
            /*
            form.$el.find(".dateTimePicker").each(function () {
                console.log('THGIS', this);
                $(this).datetimepicker();
            });*/
            //console.log(form.model);
            return form;
        },
        getBBFormFromFilter: function (dataRow, editorClass, type, operators,template) {
            
            var fieldName = dataRow['name'];
            var schm = {
                Column: { name: 'Column', type: 'Hidden', title: dataRow['label'], value: fieldName },
                ColumnType: { name: 'ColumnType', title: '', type: 'Hidden', value: type },
                Operator: {
                    type: 'Select', title: dataRow['label'], options: operators || this.getOpOptions(type), editorClass: 'form-control ',//+ classe,
                },

                //Value: dataRow
                Value: {
                    type: type,
                    title: dataRow['label'],
                    editorClass: editorClass,
                    options: this.getValueOptions(dataRow),
                    validators: []
                }
            }

            var valeur = null;

            if (this.filtersValues && this.filtersValues[fieldName]) {
                valeur = this.filtersValues[fieldName].value;
                operatorValue = this.filtersValues[fieldName].operatorValue;
            }
            else {
                operatorValue = schm.Operator.options[0];
            }

            var Formdata = {
                ColumnType: type,
                Column: fieldName,
                Operator: operatorValue
            };

            var operatorValue = schm['Operator'].options[0].val;

            var md = Backbone.Model.extend({
                schema: schm,
                defaults: {
                    Column: fieldName,
                    ColumnType: type,
                    // For FireFox, select first option
                    Operator: operatorValue,
                    Value: valeur
                }
            });
            var mod = new md();
            //console.log(mod);
            //mod.set('Value',valeur);
            var form = new BbForms({
                template: _.template(template),
                model: mod,
                data: Formdata,
                templateData: { filterName: dataRow['title'], ColumnType: type, fieldname: fieldName }
            }).render();
            return form;

        },
        getBBFormFromInterval: function (dataRow, editorClass,type,template) {
            
            var fieldName = dataRow['name'];
            
            var schm = {
                Column: { name: 'Column', type: 'Hidden', title: dataRow['label'], value: fieldName },
                ColumnType: { name: 'ColumnType', title: '', type: 'Hidden', value: type },
                Operator: {
                    //type: 'Select', title: dataRow['label'], options: operators || this.getOpOptions(type), editorClass: 'form-control ',//+ classe,
                    type: 'Select', title: dataRow['label'], options: [{ label: 'beetwenn', val: 'between' }], editorClass: 'form-control ',//+ classe,
                },
                From: {
                    name: 'From',
                    type: type,
                    title: dataRow['label'],
                    editorClass: editorClass,
                    options: this.getValueOptions(dataRow),
                    validators: []
                },
                To: {
                    name: 'To',
                    type: type,
                    title: dataRow['label'],
                    editorClass: editorClass,
                    options: this.getValueOptions(dataRow),
                    validators: []
                },
                Value: {
                    type: type,
                    title: dataRow['label'],
                    editorClass: 'Text',
                    options: this.getValueOptions(dataRow),
                    validators: []
                }
            }
            var ValeurFrom = '', ValeurTo = '';
            var valeur = null;
            if (this.filtersValues && this.filtersValues[fieldName]) {
                ValeurFrom = this.filtersValues[fieldName].From || '';
                ValeurTo = this.filtersValues[fieldName].To;

            }
            var Formdata = {
                ColumnType: type,
                Column: fieldName,
                Operator: schm['Operator'].options[0]
            };


            var operatorValue = schm['Operator'].options[0].val;

            var md = Backbone.Model.extend({
                schema: schm,
                defaults: {
                    Column: fieldName,
                    ColumnType: type,
                    // For FireFox, select first option
                    Operator: operatorValue,
                    Value: valeur,
                    From: ValeurFrom,
                    To: ValeurTo
                }
            });

            var mod = new md();
            //console.log(mod);
            //mod.set('Value',valeur);
            var form = new BbForms({
                template: _.template(template),
                model: mod,
                data: Formdata,
                templateData: { filterName: dataRow['title'], ColumnType: type, fieldname: fieldName }
            }).render();

            return form;

        },
        changeInput: function (options) {
        },

        clickedCheck: function (e) {
            // Keep the new check value
            var IsChecked = e.target.checked;
            if (e.target.value != -1) {
                //'Not checkall', We change the checkall if new target value is uncheked
                $(this).parent().parent().find('input:checkbox').each(function () {
                    if (this.value == -1 && !IsChecked) {
                        $(this).prop('checked', IsChecked);
                    }
                });
            }
            else {
                // CheckAll, all check input affected to checkAll Value
                //console.log('checkall');
                $(this).parent().parent().find('input:checkbox').each(function () {
                    $(this).prop('checked', IsChecked);
                });
            }
        },

        displayFilter: function () {
        },

        getValueOptions: function (DataRow) {

            var valueOptions;
            switch (DataRow['type']) {
                case "Select": case 'Checkboxes':
                    return DataRow['options']
                    break;
                case 'AutocompTreeEditor':
                    return DataRow['options']
                    break;
                case 'AutocompleteEditor':
                    return DataRow['options']
                    break;
                case "DATETIME":
                    return valueOptions = [{
                        dateFormat: 'd/m/yyyy',
                        defaultValue: new Date().getDate() + "/" + (new Date().getMonth() + 1) + "/" + new Date().getFullYear()
                    }];
                    break;
                default:
                    return valueOptions = '';
                    break;
            }
        },

        getOpOptions: function (type) {
            var operatorsOptions;
            switch (type) {
                case "Text": case "AutocompTreeEditor": case "AutocompleteEditor":
                    return operatorsOptions = [{ label: 'Equals', val: 'Is' }, { label: 'Does Not Equal', val: 'Is not' }, { label: 'Begins with', val: 'begins' }, { label: 'Does not Begin with', val: 'not begin' }, { label: 'Ends with', val: 'ends' }, { label: 'Does not end with', val: 'not end' }, { label: 'Contains', val: 'Contains' }, { label: 'Does not Contain', val: 'Not Contains' }, { label: 'In', val: 'IN' }, ];
                    break;
                case "DateTimePickerEditor":
                    //return operatorsOptions = [{ label: '<', val: '<' }, { label: '>', val: '>' }, { label: '=', val: '=' }, { label: '<>', val: '<>' }, { label: '<=', val: '<=' }, { label: '>=', val: '>=' }];
                    return operatorsOptions = ['=', '<', '>', '<>', '<=', '>='];
                    break;
                case "Select":
                    return operatorsOptions = [{ label: 'Is', val: 'Is' }, { label: 'Is not', val: 'Is not' }];
                    break;
                case "Checkboxes":
                    return operatorsOptions = [{ label: 'Checked', val: 'Checked' }];
                    break;
                    break;
                default:
                    return operatorsOptions = ['=', '<', '>', '<>', '<=', '>=', 'IN'];
                    break;
            }
        },

        update: function () {
            this.criterias = [];
            var currentForm, value;
            for (var i = 0; i < this.forms.length; i++) {
                currentForm = this.forms[i];
                //var type = typeof currentForm.getValue().Value;
                var Validation = currentForm.validate();
                //console.log(Validation);
                currentForm.$el.find('input.filter').removeClass('active')
                if (!currentForm.validate()) {
                    value = currentForm.getValue();

                    if (value.Operator == 'between') {
                        var ValueFrom = { Operator: '>=', ColumnType: value.ColumnType, Column: value.Column, Value: null };
                        var ValueTo = { Operator: '<=', ColumnType: value.ColumnType, Column: value.Column, Value: null };
                        if (value.From) {
                            ValueFrom.Value = value.From;
                            this.criterias.push(ValueFrom);
                            currentForm.$el.find('input.filter').addClass('active');
                        }

                        if (value.To) {
                            ValueTo.Value = value.To;
                            this.criterias.push(ValueTo);
                            currentForm.$el.find('input.filter').addClass('active');
                        }

                    }
                    else {
                        if (value.Value) {
                            this.criterias.push(value);
                            currentForm.$el.find('input.filter').addClass('active');
                        }
                    }
                    // TODO Gestion interval



                }
            }
            if (this.clientSide != null) {
                this.clientFilter(this.criterias);
            } else {
                this.filters = this.criterias;
                this.interaction('filter', this.criterias);
            }
            return this.criterias;
        },

        reset: function () {
            this.getContainer().empty();
            this.filtersValues = null;
            if (this.clientSide != null) {
                this.initFilters(this.filters);
            }
            else {
                if (this.filterFromAJAX) {
                    // Otherwise initialized from AJAX call
                    this.getFilters();
                }
                else {
                    this.initFilters(this.filters);
                }
            }
            this.update();
        },


        ///////////////////////// FILTRE CLIENT //////////////////////////////

        clientFilter: function (filters) {
            var tmp = this.com.getMotherColl();
            var mod = [];
            var filter;
            var col, op, val;
            var result = [];
            var ctx = this;


            var pass, rx, objVal;
            if (filters.length) {
                var coll = _.clone(tmp);
                _.filter(coll.models, function (obj) {
                    pass = true;

                    for (var i = filters.length - 1; i >= 0; i--) {
                        if (pass) {
                            filter = filters[i];
                            col = filter['Column'];
                            op = filter['Operator'];
                            val = filter['Value'];

                            objVal = obj.attributes[col];

                            //date
                            if (moment.isMoment(val)) {
                                pass = ctx.testDate(val, op, objVal);
                            } else {
                                pass = ctx.testMatch(val, op, objVal);
                            };
                        }
                    };
                    if (pass) {
                        mod.push(obj);
                    };
                });
                coll.reset(mod);
                this.com.action('filter', coll);
            } else {
                this.com.action('filter', tmp);
            }
        },


        testMatch: function (val, op, objVal) {
            var rx;
            switch (op.toLowerCase()) {
                case 'is':
                    val = val.toUpperCase();
                    rx = new RegExp('^' + val + '$');
                    if (!rx.test(objVal.toUpperCase())) {
                        return false;
                    };
                    break;
                case 'is not':
                    val = val.toUpperCase();
                    rx = new RegExp('^(^' + val + ')$'); //todo : not sure
                    if (!rx.test(objVal.toUpperCase())) {
                        return false;
                    };
                    break;
                case 'contains':
                    val = val.toUpperCase();
                    rx = new RegExp(val);
                    if (!rx.test(objVal.toUpperCase())) {
                        return false;
                    };
                    break;
                case '=':
                    if (!(objVal == val)) {
                        return false;
                    };
                    break;
                case '<>':
                    if (!(objVal != val)) {
                        return false;
                    };
                    break;
                case '>':
                    if (!(objVal > val)) {
                        return false;
                    };
                    break;
                case '<':
                    if (!(objVal < val)) {
                        return false;
                    };
                    break;
                case '>=':
                    if (!(objVal >= val)) {
                        return false;
                    };
                    break;
                case '<=':
                    if (!(objVal <= val)) {
                        return false;
                    };
                    break;
                default:
                    console.warn('wrong opperator');
                    return false;
                    break;
            };
            return true;
        },

        testDate: function (val, op, objVal) {
            var dateA = moment(val);
            var dateB = moment(objVal);

            switch (op.toLowerCase()) {
                case '=':
                    if (!(dateB.isSame(dateA))) {
                        return false;
                    };
                    break;
                case '!=':
                    if (dateB.isSame(dateA)) {
                        return false;
                    };
                    break;
                case '>':
                    if (!(dateA.isAfter(dateB))) {
                        return false;
                    };
                    break;
                case '<':
                    if (!(dateA.isBefore(dateB))) {
                        return false;
                    };
                    break;
                    //todo : verify those 2
                case '>=':
                    if (!(dateA.isAfter(dateB)) || !(dateB.isSame(dateA))) {
                        return false;
                    };
                    break;
                case '<=':
                    if (!(dateA.isBefore(dateB)) || !(dateB.isSame(dateA))) {
                        return false;
                    };
                    break;
                default:
                    console.log('wrong opperator');
                    return false;
                    break;

            };
            return true;

        },

        interaction: function (action, id) {
            if (this.com) {
                this.com.action(action, id);
            } else {
                this.action(action, id);
            }
        },

        action: function (action, params) {
            // Rien à faire
            return;
        },

        updateQuery: function (e) {
            if (e.keyCode === 13) {
                e.preventDefault();
                this.update();
                return false;
            }
        }

    });
    return NSFilter;

}));
