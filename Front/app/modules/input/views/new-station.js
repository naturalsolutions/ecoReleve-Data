//radio

define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'radio',

	'moment',
	'dateTimePicker',
	'sweetAlert',
	'backbone_forms',
	'config',

	'tmp/getUsers',
	'tmp/getFieldActivity',
	'tmp/getRegions',
	'models/station',
	'i18n'

], function($, _, Backbone, Marionette, Radio,
	moment, datetime, Swal, BbForms, config,
	getUsers, getFieldActivity, getRegions,
	Station
){
	'use strict';
	return Marionette.ItemView.extend({
		template: 'app/modules/input/templates/tpl-new-station.html',
		events : {
			'focusout input[name="Date_"]':'checkDate',
		},
		initialize: function(options) {
			var tmp = 'app/modules/input/templates/tpl-new-station.html';
			var station = new Station();
			var html = Marionette.Renderer.render('app/modules/input/templates/tpl-new-station.html');
			this.form = new BbForms({
				model: station,
				template: _.template(html)
			}).render();
			this.el =  this.form.el;
			$(this.el).i18n();
			this.radio = Radio.channel('input');
		},
		onShow : function(){
			
			var self = this;
			var datefield = $("input[name='Date_']");
			$(datefield).attr('placeholder', config.dateLabel);
			$('#stMonitoredSiteType').attr('disabled','disabled');
			$('#stMonitoredSiteName').attr('disabled','disabled');
			$(datefield).datetimepicker({
				defaultDate:"",
				maxDate : new Date()
			});

			$(datefield).data('DateTimePicker').format('DD/MM/YYYY HH:mm:ss');
			
			$(datefield).on('dp.show', function(e) {
				$(this).val('');
			});
			$(datefield).on('dp.change', function(e) {
				 self.checkDate();
			});
		
			this.generateSelectLists();
		},
		onBeforeDestroy: function() {
			$('div.bootstrap-datetimepicker-widget').remove();
		},
		generateSelectLists : function(){
			var content = getUsers.getElements('user');
			$('select[name^="FieldWorker"]').append(content);
			var fieldList = getFieldActivity.getElements('theme/list');
			$('select[name="FieldActivity_Name"]').append(fieldList);
			var regionList = getRegions.getElements('station/area_coord',true);
			$('select[name="Region"]').append(regionList);
			/*var sites  = getSitesTypes.getElements('monitoredSite/type');
			$('select[name="id_site"]').append(sites);*/
		},
		checkDate: function(){
			var siteType = $('#stMonitoredSiteType');
			var siteName = $('#stMonitoredSiteName');
			var datefield = $("input[name='Date_']");
			var date = $(datefield).val();
			var date = moment($(datefield).val(),"DD/MM/YYYY HH:mm:ss");    //28/01/2015 15:02:28
			var now = moment();
			if (now < date) {
			   //alert('Please input a valid date');
			   Swal({
				title: "Error in date value",
				text: 'Please input a valid date.',
				type: 'error',
				showCancelButton: false,
				confirmButtonColor: 'rgb(147, 14, 14)',
				confirmButtonText: "OK",
				closeOnConfirm: true,
				});
			   $(datefield).val('');
			   $(siteType).attr('disabled','disabled');
			   $(siteName).attr('disabled','disabled');
			} else {
				if(date){
					$(siteType).removeAttr('disabled');
					$(siteName).removeAttr('disabled');
				}
				this.radio.command('changeDate');
			}
		}
	});
});
