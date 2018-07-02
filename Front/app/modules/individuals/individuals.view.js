define([
  'modules/objects/manager.view',
  './individual.model',
], function(ManagerView, IndividualModel) {

  'use strict';

  return ManagerView.extend({
  	ModelPrototype: IndividualModel,

    filterOnKeyPress: function(e){
        if(e.keyCode === 13){
          e.preventDefault();
          e.stopPropagation();
          this.filter();
        }
    },

  	toggleTab: function(e) {
  	  if(!$(e.currentTarget).hasClass('active')){
  	    this.$el.find('.tab-ele').each(function(){
  	      $(this).toggleClass('active');
  	    });

        var typeObj = this.availableTypeObj.filter(function(obj){
          if (obj.label.toLowerCase() === $(e.currentTarget).attr('id').toLowerCase()){
            return obj;
          }
        })[0];
        
        this.model.set('defaultTypeObj',typeObj.val);
        this.model.set('objectType',typeObj.val);
        this.model.set('objectTypeLabel',typeObj.label);

        if(typeObj.label.toLowerCase() === 'standard'){
          this.$el.find('.js-link-new').html('<span class="reneco reneco-entrykey"></span> &nbsp; New individual');
        } else {
          this.$el.find('.js-link-new').html('<span class="reneco reneco-entrykey"></span> &nbsp; Save from criteria');
        }
        this.setDefaultOperatorFilter();
				this.onShow();
  	  }
  	},

    setDefaultOperatorFilter: function(){
      // to extend
    },

    afterShow: function(){
      var _this = this;
      this.$chk = this.$el.find('.js-checkbox-history');
      this.$date = this.$el.find('.js-date-history');

      this.$el.find('.js-datetimepicker-history')
        .datetimepicker({format : "DD/MM/YYYY HH:mm:ss"})
        .on('dp.change', function(){
          if(_this.$chk.prop('checked'))
            _this.$chk.prop('checked', false);
      });
      
      this.$el.find('.js-checkbox-history')
        .on('click', function(){
          if(_this.$chk.prop('checked'))
            _this.$date.val(null);
      });

      this.$el.on('keypress', _this.filterOnKeyPress.bind(_this));
    },

    filter: function() {
      this.gridView.dataSource.startDate = this.$date.val();

      if (this.$chk.prop('checked')){
        this.gridView.dataSource.history = 1;
      } else {
        this.gridView.dataSource.history = 0;
      }
      this.filters.update();
    },

    new: function(){
      var url = '#' + this.model.get('type') + '/new/'+this.availableTypeObj[0].val;
      Backbone.history.navigate(url, {trigger: true});
    }
  });
});
