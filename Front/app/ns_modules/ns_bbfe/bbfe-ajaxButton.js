define([
  'jquery',
  'backbone_forms',
  'config'
], function(
  $, Form,config
){
  'use strict';
  return Form.editors.ajaxButtonEditor = Form.editors.Base.extend({


    
        previousValue: '',

        events: {
            'click button': "callback"
        },

        template: '<div>\
        <div class="input-group">\
            <button class="btn btn-success"><%=btnText%>&nbsp\
                <span class="<%=iconFont%>"></span>\
            </button>\
            </div>\
        </div>',
        initialize: function(options) {
            Form.editors.Base.prototype.initialize.call(this, options);
            this.options = options.schema.options;
            console.log(options)
        },

        callback: function() {
            var url = config.coreUrl+this.options.url;
            $.ajax({
                url: url,
                data: {toto:'coca Cola !!'}
            });
        },

        render: function(){
            var options = this.options;
            var _this = this;
           var $el = _.template(
                this.template, {btnText:this.options.btnText ,iconFont:this.options.iconFont
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
