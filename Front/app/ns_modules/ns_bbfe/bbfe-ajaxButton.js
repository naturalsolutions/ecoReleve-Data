define([
  'jquery',
  'backbone_forms',
  'sweetAlert',
  'config',
], function(
  $, Form,Swal,config
){
  'use strict';
  return Form.editors.ajaxButtonEditor = Form.editors.Base.extend({


    
        previousValue: '',

        events: {
            'click button': "actionOnBtn"
        },

        template: '<div>\
        <div class="input-group">\
            <button class="btn btn-success" <%=editable%> ><%=btnText%>&nbsp\
                <span class="<%=iconFont%>"></span>\
            </button>\
            </div>\
        </div>',
        initialize: function(options) {
            Form.editors.Base.prototype.initialize.call(this, options);
            this.options = options.schema.options;
            this.editable = '';
            if (options.schema.fieldClass.indexOf('hide') != -1 ) {
              this.editable = 'disabled';
            }
            var params = this.options.target_params;
            this.parentModel = options.model;
            this.dataToSend = {};
            var _this = this;
            /*params.forEach(function(params){
                this.dataToSend[params] = this.parentModel.get(params);
            },this);
            console.log(this.parentModel.toJSON())*/

        },

        actionOnBtn: function(e){
            var _this = this;
            e.preventDefault();
             Swal({
              title: 'Warning',
              text: 'Monitored Site coordinates will be updated, are you sure ? ',
              type: 'warning',
              showCancelButton: true,
              CancelButtonColor:'red',
              CancelButtonText: 'No',
              confirmButtonColor: 'green',
              confirmButtonText: 'Yes',
              closeOnConfirm: true
              },
              function(isConfirm) {
                  if (isConfirm){
                    _this.callback();
                  }
              });
        },

        callback: function() {
            var _this = this;
            var url = config.coreUrl+this.options.url;
            $.ajax({
                url: url,
                context: this,
                data:this.parentModel.toJSON(),
                success: function(data){
                    _this.ajaxAlert(data);
                },
                error: function(data){
                    console.log(data)
                }
            });
        },

        ajaxAlert: function(data){
            setTimeout(function() {
                Swal({
                  title: 'Site position',
                  text: data,
                  type: 'info',
                  showCancelButton: false,
                  confirmButtonColor: 'rgb(201, 218, 225)',
                  confirmButtonText: 'OK',
                  closeOnConfirm: true,
                });
            }, 500);
        },

        render: function(){
            var options = this.options;
            var _this = this;
           
            var $el = _.template(
                this.template, {btnText:this.options.btnText ,iconFont:this.options.iconFont, editable: _this.editable
            });
           this.setElement($el);
            //tmp solution ? datetimepicker remove the value
/*            if(this.options){
                var value = this.options.model.get(this.options.key);
                $el.find('input').val(value);
            }*/

            return this;
        }
    });
});
