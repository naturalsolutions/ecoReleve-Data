define([
  'modules/objects/manager.view',
  './individual.model',
], function(ManagerView, IndividualModel) {

  'use strict';

  return ManagerView.extend({
  	model: new IndividualModel(),

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

        this.model.set('objectType',typeObj.val);
        this.model.set('objectTypeLabel',typeObj.label);

        if(typeObj.label.toLowerCase() === 'standard'){
          this.$el.find('.js-link-new').html('<span class="reneco reneco-entrykey"></span> &nbsp; New individual');
        } else {
          this.$el.find('.js-link-new').html('<span class="reneco reneco-entrykey"></span> &nbsp; Save from criteria');
        }
				this.onShow();
  	  }
  	},

    new: function(){
      var url = '#' + this.model.get('type') + '/new/'+this.availableTypeObj[0].val;
      Backbone.history.navigate(url, {trigger: true});
    }
  });
});
