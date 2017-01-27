//waypoints?

define([
  'jquery',
  'underscore',
  'backbone',
  'marionette',
  'config',
  'sweetAlert',
  'ns_form/NSFormsModuleGit',
  'i18n',


], function($, _, Backbone, Marionette, config, Swal, NsForm) {

  'use strict';

  return Marionette.LayoutView.extend({
    className: 'full-height',
    template: 'app/modules/importFile/excel/templates/tpl-step1-excel.html',

    name: 'Protocol selection',

    events: {

      'change select[name="protocols"]': 'setProtocol',
      'change input[name="newproto"]': 'setNewProto',
      'enterKey input[name="newproto"]': 'setNewProto',
      'click button.tplbtn' : 'getExcelTpl'
    },

    ui: {
      'newproto': '#newproto'
    },

    initialize: function() {
      // get current list of existing protocols
      this.protocols = [];
      this.model = new Backbone.Model();
    },

    onShow: function() {
      this.loadCollection(config.coreUrl + 'protocolTypes', 'select[name="protocols"]');
      //
      // var ws = new WebSocket("ws://127.0.0.1:6545/ecoReleve-Websockets/fileImport/2");
      // // var ws2 = new WebSocket("ws://127.0.0.1:6545/jobs/2/");
      // // var ws3 = new WebSocket("ws://127.0.0.1:6545/ecoReleve-Core/run/jobs");
      //   ws.onmessage = function(msg) {
      //   console.log("<run>" + msg.data + "</p>");
      // };

      // ws2.onmessage = function(msg) {
      //   console.log("<p>" + msg.data + "</p>");
      // };

      // ws2.onopen = function(){
      //   console.log(' websocket is open')
      // };
      // //   ws2.onopen = function(){
      //   console.log(' websocket 222 is open')
      // };


    },
    loadCollection: function(url, element) {
      var _this = this;
      var collection =  new Backbone.Collection();
      collection.url = url;
      var elem = $(element);
      elem.append('<option></option>');
      collection.fetch({
        success: function(data) {
          //could be a collectionView
          for (var i in data.models) {
            var current = data.models[i];
            var value = current.get('ID') ;
            var label = current.get('Name') ;
            elem.append('<option value =' + value + '>' + label + '</option>');
            $('#btnNext').attr('disabled','disabled');
            _this.protocols.push(label);
          }
        }
      });
    },


    setProtocol: function(e) {
      var protocolID = $(e.target).val();
      var protocoleName = $('select option:selected').text();
      if(protocolID) {
          $('#btnNext').removeAttr('disabled');
          $(this.ui.newproto).val('');
          $('.selectedProto').text(protocoleName);
          $('.template').removeClass('hidden');

          this.model.set('protoName',protocoleName);
          this.model.set('protoID',protocolID);
      } else {
        $('#btnNext').attr('disabled','disabled');
        $('.template').addClass('hidden');
      }


    },
    setNewProto : function(){
      var name = $(this.ui.newproto).val();
      if(name) {
        // check if nalme don't exists
        for(var i=0;i<this.protocols.length;i++){
          if(this.protocols[i].toUpperCase() == name.toUpperCase()) {
            alert('name exists !');
            $(this.ui.newproto).val('');
            $('.template').addClass('hidden');
            return ;
          }
        }
        $('select[name="protocols"]').val('');
        $('.selectedProto').text(name);
        $('#btnNext').removeAttr('disabled');
        $('.template').removeClass('hidden');

        this.model.set('protoName',name);
        this.model.set('protoID',0);
      }

    },
    onDestroy: function() {
    },
    getExcelTpl : function(){
      var _this = this;
      var protoId = this.model.get('protoID');
      var protoName = this.model.get('protoName');
      var url =  config.coreUrl + 'file_import/getTemplate?' + 'id=' + protoId + '&name=' + protoName ;
      var link = document.createElement('a');
      link.classList.add('DowloadLinka');
      link.href = url;
      link.onclick = function () {
            var href = $(link).attr('href');
            window.location.href = link;
            document.body.removeChild(link);

             Swal({
                title: 'Loading file succeeded!',
                text:  '',
                type:'success',
                showCancelButton: false,
                confirmButtonColor: false,
                confirmButtonText:'ok',

            });
        };

        document.body.appendChild(link);
        link.click();

        // end 


    },
    validate: function() {
      return true;
    }


  });
});
