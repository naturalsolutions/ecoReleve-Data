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
<<<<<<< HEAD
      'click #test': 'test'
=======
>>>>>>> c736a1259dfed9e43e5cf39f2f5799e74964caca
    },

    initialize: function(options) {
      var _this = this;
      this.model = options.model;
      this.parent = options.parent;

      this.options.parent.finished = function() {
        _this.getFile();
<<<<<<< HEAD
      }
    },

    onShow: function() {
      this.$el.find('.exp-file:first input').prop('checked', true).change();
      this.$el.find('.exp-file:first').addClass('active');
    },

    changeValue: function(e) {
      this.$el.find('label.exp-file').each(function() {
=======
      };
    },

    onShow: function() {
      this.$el.find('.tile-inside:first input').prop('checked', true).change();
      this.$el.find('.tile-inside:first').addClass('active');
    },

    changeValue: function(e) {
      this.$el.find('label.tile-inside').each(function() {
>>>>>>> c736a1259dfed9e43e5cf39f2f5799e74964caca
        $(this).removeClass('active');
      });

      $(e.target).parent().addClass('active');
      this.model.set('fileType', $(e.target).val());
    },

<<<<<<< HEAD
    test: function() {
      var model = this.model;
      this.getFile();
    },

=======
>>>>>>> c736a1259dfed9e43e5cf39f2f5799e74964caca
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
<<<<<<< HEAD
			function(isConfirm) {
  //could be better
  if (opts.callback) {
    opts.callback();
  }
			});
=======
      function(isConfirm) {
        //could be better
        if (opts.callback) {
          opts.callback();
        }
      });
>>>>>>> c736a1259dfed9e43e5cf39f2f5799e74964caca
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
<<<<<<< HEAD
        /*
        				xhrFields: {
        					onprogress: function (e) {
        						if (e.lengthComputable) {
        								var progress = Math.floor( e.loaded / e.total * 100 ) + '%';
        								$('#progress > div').html(progress);
        								$('#progress > div').width(progress);
        							}
        						}
        					},
        					*/
=======
>>>>>>> c736a1259dfed9e43e5cf39f2f5799e74964caca
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
<<<<<<< HEAD
            _this.parent.displayStep(0);
=======
            //_this.parent.displayStep(0);
>>>>>>> c736a1259dfed9e43e5cf39f2f5799e74964caca
          }
        };

        this.swal(opts);
      }).fail(function(msg) {

      });
    },

  });
});
