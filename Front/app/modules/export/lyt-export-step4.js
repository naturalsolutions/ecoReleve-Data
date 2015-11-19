define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'config',
	'ns_grid/model-grid',
	'sweetAlert',
	'moment',
	'i18n'
], function($, _, Backbone, Marionette, config, NsGrid, Swal, Moment
) {
  'use strict';
  return Marionette.LayoutView.extend({
    className: 'full-height export-layout',
    template: 'app/modules/export/templates/tpl-export-step4.html',

    name: 'File type',

    ui:  {
      'pdfTile': '#pdfTile',
      'csvTile': '#csvTile',
      'gpxTile': '#gpxTile',
    },

    events: {
      'change input': 'changeValue',
      'click #test': 'test'
    },

    initialize: function(options) {
      var _this = this;
      this.model = options.model;
      this.parent = options.parent;

      this.options.parent.finished = function() {
        _this.getFile();
      }
    },

    onShow: function() {
      this.$el.find('.exp-file:first input').prop('checked', true).change();
      this.$el.find('.exp-file:first').addClass('active');
    },

    changeValue: function(e) {
      this.$el.find('label.exp-file').each(function() {
        $(this).removeClass('active');
      });

      $(e.target).parent().addClass('active');
      this.model.set('fileType', $(e.target).val());
    },

    test: function() {
      var model = this.model;
      this.getFile();
    },

    validate: function() {
      return this.model;
    },

    check: function() {
      return true;
    },

    swal: function(opts) {
      Swal({
        title: opts.title || opts.responseText || 'error',
        text: opts.text || '',
        type: opts.type,
        showCancelButton: opts.showCancelButton,
        confirmButtonColor: opts.confirmButtonColor,
        confirmButtonText: opts.confirmButtonText,
        closeOnConfirm: opts.closeOnConfirm || true,
      },
			function(isConfirm) {
  //could be better
  if (opts.callback) {
    opts.callback();
  }
			});
    },

    getFile: function() {
      var _this = this;
      this.datas = {
        fileType: this.model.get('fileType'),
        viewId: this.model.get('viewId'),
        filters: this.model.get('filters'),
        columns: this.model.get('columns'),
      };

      var route = config.coreUrl + 'export/views/getFile';

      $.ajax({
        url: route,
        data: {criteria: JSON.stringify(this.datas)},
        contentType: 'application/json',
        type: 'GET',
        context: this,
      }).done(function(data) {
        var url = URL.createObjectURL(new Blob([data], {'type': 'application/' + this.model.get('fileType')}));
        var link = document.createElement('a');
        link.href = url;
        link.download = this.model.get('viewName') + '_' + new Moment().format('DD_MM_YY') + '.' + this.model.get('fileType');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        var _this = this;
        var opts = {
          title: 'Success!',
          text: 'Would you like to do an other export?',
          type: 'success',
          confirmButtonText: 'Yes',
          callback: function() {
            //_this.parent.displayStep(0);
          }
        };

        this.swal(opts);
      }).fail(function(msg) {

      });
    },

  });
});
