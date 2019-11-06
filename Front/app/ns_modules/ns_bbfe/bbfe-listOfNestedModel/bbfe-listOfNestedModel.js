define([
  'jquery',
  'underscore',
  'backbone',
  'backbone-forms',
  'sweetAlert'

  ], function ($, _, Backbone, Form, Swal) {

    'use strict';
    return Form.editors.ListOfNestedModel = Form.editors.Base.extend({
        events: {
            'click #addFormBtn' : 'addEmptyForm',
        },
        initialize: function(options) {

            Form.editors.Base.prototype.initialize.call(this, options);

            this.template = options.template || this.constructor.template;
            this.options = options;
            this.options.schema.fieldClass = 'col-xs-12';
            this.forms = [];
            this.disabled = options.schema.editorAttrs.disabled;

            this.hidden = '';
            if(this.disabled) {
                this.hidden = 'hidden';
            }
            this.hasNestedForm = true;

            this.key = this.options.key;

            //if required nbdefault = 1
            if( this.validators.indexOf('required') > -1 ) {
                this.nbByDefault = 1;
            }
            //check if exist and convert it to int
            if ( this.options.model.schema[this.key]['nbByDefault'] ) {
                var nbDef = Number(this.options.model.schema[this.key]['nbByDefault']);
            }
            //nbDef overload nbByDefault if sup
            if (nbDef > this.nbByDefault) {
                this.nbByDefault = nbDef;
            }
            // this.nbByDefault = Number(this.options.model.schema[this.key]['nbByDefault']);
            this.addButtonClass = 'pull-right';
            if (this.options.schema.editorClass == 'nested-unstyled'){
                this.addButtonClass = '';
            }
            this.subProto = false;


        },
        deleteForm: function() {
            this.$el.trigger('change');
        },

        addEmptyForm: function() {
            // addEmptyForm
            // two case if no form we add or if instanciate forms are valid
            if (this.getValue() || this.forms.length === 0 ){
                var mymodel = Backbone.Model.extend({
                    defaults : this.options.schema.subschema.defaultValues
                });
    
                var model = new mymodel();
                model.schema = this.options.schema.subschema;
                model.fieldsets = this.options.schema.fieldsets;
                this.addForm(model);

            }
        },

        indexPresent : function (elem, index, array) {
          var cpt = -1
          while (index < array.length ) {
            if (array[index].cid === elem.cid ) {
               cpt = index;
            }
            index+=1;
          }
          return cpt;
        },
        subFormChange: function(){
            this.$el.change();
        },

        bindChanges: function(form){
          var _this = this;
          form.$el.find('input').on("change", function(e) {
              _this.formChange = true;
              _this.subFormChange();

          });
          form.$el.find('select').on("change", function(e) {
              _this.formChange = true;
              _this.subFormChange();
          });
          form.$el.find('textarea').on("change", function(e) {
              _this.formChange = true;
              _this.subFormChange();

          });
        },

        addForm: function(model){
            var _this = this;
            model.set('FK_Station',this.options.model.get('FK_Station'));
            var form = new Backbone.Form({
                model: model,
                fieldsets: model.fieldsets,
                schema: model.schema
            }).render();
            this.forms.push(form);
            var labels = form.$el.find('label');

            if (this.options.schema.editorClass.indexOf("form-control")==-1 ){

                form.$el.addClass(this.options.schema.editorClass);
            }
            _.each(labels, function(label){
                if(label.innerText.trim().replace('*','') == ''){
                    $(label).remove();
                }
            });

            setTimeout( function() { //
              if (_this.schema.editorClass.indexOf("form-control") != -1 ) {
                _this.form.$el.find(".js_badge").css({'display': '','margin-left': '5px'});

                _this.form.$el.find(".js_subproto_wrapper").css({'display' : ''});
                _this.subProto = true;
              }
              _this.form.$el.find(".js_badge").html('(' + _this.forms.length + ')');
            },0);

            if (this.schema.editorClass.indexOf("form-control") != -1 ) {
                var fieldsetElem = form.$el.find('fieldset')[0]
                fieldsetElem.insertAdjacentHTML('beforebegin','\
                <div class="col-md-1 js_container_index_subForm">\
                    <div class="js_index_subForm" >\
                        <span class="indexSubForm">'+ parseInt(this.indexPresent(form,0,this.forms)+1) +'</span>\
                        /\
                        <span class="totalSubForm">'+ (this.forms.length) +'</span>\
                    </div>\
                </div>\
                <div class="js_checkbox_subform">\
                    <input type="checkbox" class="js_subform_selected" value="'+ parseInt(this.indexPresent(form,0,this.forms)+1) +'" >\
                </div>')
                fieldsetElem.className = fieldsetElem.className + ' ' + 'col-md-11'
                form.$el[ 0 ].onclick = function() {
                    var checkboxStatus = this.getElementsByClassName('js_subform_selected') [0].checked;
                    this.getElementsByClassName('js_subform_selected') [0].checked = !checkboxStatus;
                }
            }

            


            var buttonClass = 'pull-right';
            if (form.$el.hasClass('nested-unstyled')){
                buttonClass = '';
            }
            /* form.$el.find('fieldset').append('\
                <div class="' + this.hidden + ' control">\
                    <button type="button" class="btn btn-warning '+buttonClass+'" id="remove">-</button>\
                </div>\
            '); */

            form.$el.find('button#remove').on('click', function() {
              _this.$el.find('#formContainer').find(form.el).remove();
              var i = _this.forms.indexOf(form);
              if (i > -1) {
                _this.forms.splice(i, 1);
                _this.form.$el.find(".js_badge").html('(' + _this.forms.length + ')');
              }
              _this.subFormChange();
              if(!_this.forms.length){
                _this.addEmptyForm();
              }

              var tabBtn = $('.js_index_subForm');
              var tmp = i;
              while( tmp <= tabBtn.length) {
                $(tabBtn[tmp]).text(tmp+1)
                tmp+=1;
              }
              return;
            });

            this.$el.find('#formContainer').append(form.el);
            this.bindChanges(form);
            form.$el.find('input:enabled,select:enabled,textarea:enabled').first().focus();
            this.renumberSubObsAndCheckboxValue();
        },

        removeSubProto: function(tab) {

            var newFormsTab = []
            for( var i = 0 ; i < this.forms.length ; i ++ ) {
                if ( !( i in tab ) ) {
                    newFormsTab.push( this.forms[ i ] )
                }
                else {
                    this.forms[ i ].remove()           
                }
            }
            this.forms = newFormsTab;
            this.form.$el.find(".js_badge").html('(' + this.forms.length + ')');
            this.subFormChange();
            if(!this.forms.length){
              this.addEmptyForm();
            }

        },

        renumberSubObsAndCheckboxValue : function() {
            var indexSubForm = this.el.getElementsByClassName('indexSubForm');
            for (var i = 0 ; i < indexSubForm.length ; i ++) {
                indexSubForm[i].innerHTML = i + 1;
            }
            var totalSubForm = this.el.getElementsByClassName('totalSubForm');
            for( var i = 0 ; i < totalSubForm.length ; i ++ ){
                totalSubForm[i].innerHTML = this.forms.length;
            }
            var checkboxValue = this.el.getElementsByClassName('js_subform_selected');
            for ( var i = 0 ; i < checkboxValue.length ; i ++ ) {
                checkboxValue[i].value = parseInt ( i );
            }
        },

        selectPrev : function() {
            var curIndex = parseInt(this.js_record_index.value);
            var maxIndex = this.forms.length;
            if(  1 <= curIndex - 1 ) {
                this.js_record_index.value = parseInt(curIndex - 1) ;
            }
            else {
                this.js_record_index.value = parseInt(maxIndex) ;
            }

        },

        scrollToSubProto : function() {

            var index = this.js_record_index.value - 1 ;
            this.forms[ index ].$el[ 0 ].scrollIntoView();
            this.selectedClassOnly(index);
        },

        selectedClassOnly: function(value) {
            for ( var i = 0 ; i < this.forms.length ; i ++ ) {
                if( i != value ) {
                    this.forms[ i ].$el[ 0 ].getElementsByClassName('js_subform_selected') [0].checked = false;
                }
            }
            this.forms[ value ].$el[ 0 ].getElementsByClassName('js_subform_selected') [0].checked = true;
        },

        selectNext : function() {
            var curIndex = parseInt(this.js_record_index.value);
            var maxIndex = this.forms.length;
            if( curIndex + 1  <= maxIndex ) {
                this.js_record_index.value = parseInt(curIndex + 1) ;
            }
            else {
                this.js_record_index.value = 1 ;
            }


        },

        getListSelected: function() {

            var allCheckboxElem = this.$el[0].getElementsByClassName("js_subform_selected");
            var arrCheckbox = Array.from(allCheckboxElem);
            var tabIndexReturned = []

            for( var i = 0 ; i < arrCheckbox.length ; i ++ ) {
                var item = arrCheckbox[i]
                if( item.checked == true ) {
                    tabIndexReturned.push(i)
                }
            }
            return tabIndexReturned
        },

        bindPagination : function() {
            var _this = this;

            var listKeys = [
                'js_prev_sub_proto',
                'js_next_sub_proto',
                'js_record_index',
                'js_total_records',
                'js_delete_sub_proto'
            ]

            if( this.subProto) {
                //find and bind elem in dom just once
                for ( var i = 0 ; i < listKeys.length ; i++ ) {
                    var key = listKeys[i];
                    if ( !(key in this) ) {
                        this[key] = this.form.el.getElementsByClassName(key)[0];
                        
                        if ( this[key] ) {
                            switch(key) {

                                case 'js_prev_sub_proto': {
                                    this.js_prev_sub_proto.onclick = function(event) {
                                        console.log(event)
                                        _this.selectPrev();
                                        _this.scrollToSubProto();
                                    }
                                    break;
                                }

                                case 'js_next_sub_proto': {
                                    this.js_next_sub_proto.onclick = function(event) {
                                        console.log(event)
                                        _this.selectNext();
                                        _this.scrollToSubProto();
                                    }
                                    break;
                                }

                                case 'js_record_index' : {
                                    this.js_record_index.value = 1;
                                    this.js_record_index.onfocus = function(event) {
                                        console.log(event)
                                        this.oldValue = this.value;
                                    }
                                    this.js_record_index.onfocusout = function(event) {
                                        console.log(event)
                                        console.log("focus out ")
                                    };
                                    this.js_record_index.onchange = function(event) {
                                        console.log(event)
                                        if (this.value > _this.forms.length || this.value <= 0) {
                                            this.value = parseInt(this.oldValue);
                                        }
                                        else {
                                            _this.scrollToSubProto();
                                        }
                                    }
                                    break;
                                }

                                case 'js_total_records' : {
                                    this.js_total_records.innerHTML = this.forms.length ; 
                                    break;
                                }

                                case 'js_delete_sub_proto' : {
                                    this.js_delete_sub_proto.onclick = function() {

                                        var tabIndexToDelete = _this.getListSelected();
                                        _this.displayAlert(tabIndexToDelete);

                                    }
                                    break;
                                }

                                default : {
                                    //do nothing
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        },

        displayAlert: function(tab) {
            var _this = this;
            var tabDisplay = [];
            for( var i = 0 ; i < tab.length ; i ++ ) {
                tabDisplay[i] = tab[i] + 1;
            }             
            if(!tab.length){
                Swal({
                    heightAuto: false,
                    title: 'Delete Sub protocol',
                    text: 'No sub protocol seleted',
                    type: 'info',
                    showCancelButton: false,
                    confirmButtonColor: 'rgb(218, 146, 15)',
                    confirmButtonText: 'OK'
                  });
            }
            else {
                var title = 'Delete sub protocol'
                var text =  'You will delete sub protocol number :' + tabDisplay[0] 
                if (tab.length > 1 ) {
                    var title = 'Delete sub protocols'
                    var text =  'You will delete sub protocols number :' + tabDisplay.join(',') 
                }
                Swal({
                    heightAuto: false,
                    title: title,
                    text: text,
                    showCancelButton: true,
                    confirmButtonColor: 'rgb(218, 146, 15)',
                    confirmButtonText: 'Ok',
                    cancelButtonText: 'No'
                  }).then((result) => {
                    if('value' in result) {
                        _this.removeSubProto(tab)
                      console.log("on supprime")
                    }
                  });
            }
        },

        render: function() {
            //Backbone.View.prototype.initialize.call(this, options);
            var _this= this;
            var $el = $($.trim(this.template({
                hidden: this.hidden,
                id: this.id,
                name: this.key,
                addButtonClass: this.addButtonClass
            })));
            this.setElement($el);
            var data = this.options.model.attributes[this.key];
            if (data && typeof(data) === 'object' && data.length) {
                //data
                if (data.length) {
                    for (var i = 0; i < data.length; i++) {
                        var model = new Backbone.Model();
                        model.schema = this.options.schema.subschema;
                        model.fieldsets = this.options.schema.fieldsets;
                        model.attributes = data[i];
                        this.addForm(model);
                    }

                    if (data.length < this.nbByDefault) {
                        for (var i = 0; i < data.length; i++) {
                          this.addForm(model);
                        }
                    }
                }
            } else {
                //no data
                if (this.nbByDefault >= 1) {
                    for (var i = 0; i < this.nbByDefault; i++) {
                        this.addEmptyForm();
                    }
                }
            }
            setTimeout(function() {
                _this.bindPagination();
            },0)
            return this;
        },

        feedRequiredEmptyForms: function() {
        },

        getValue: function() {
            var errors = false;
            if( this.forms.length === 0 && this.validators.indexOf('required') > -1 ) {
                return true;
            }
            for (var i = 0; i < this.forms.length; i++) {
                if (this.forms[i].commit()) {
                    errors = true;
                }
            }
            if (errors) {
                return false;
            } else {
                var values = [];
                for (var i = 0; i < this.forms.length; i++) {
                    var tmp = this.forms[i].getValue();
                    var empty = true;
                    for (var key in tmp) {
                        if(tmp[key]){
                            empty = false;
                        }
                    }
                    if(!empty){
                       /* if (this.defaultValue) {
                            tmp['FK_ProtocoleType'] = this.defaultValue;
                        }*/
                        values[i] = tmp;
                    }
                }
                return values;
            }
        },
        }, {
          //STATICS
                //<button type="button" id="addFormBtn" class="<%= hidden %> btn pull-right" style="margin-bottom:10px">+</button>\
          //
          template: _.template('\
            <div id="<%= id %>" name="<%= name %>" class="required nested clearfix">\
                <div class="clear"></div>\
                <div id="formContainer"   class="clearfix"></div>\
                <div>\
                    <div id="addDiv" class="col-md-6" ></div>\
                    <button type="button" id="addFormBtn" class="<%= hidden %> btn <%= addButtonClass %>" style="margin-top:10px"><span class="reneco reneco-add"></span></button>\
                </div>\
            </div>\
            ', null, Form.templateSettings),
      });

});
