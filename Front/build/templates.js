this["JST"] = this["JST"] || {};

this["JST"]["app/base/header/tpl-header.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<nav class="navbar">\r\n\t<div class="container-fluid">\r\n\t\t<div class="navbar-header">\r\n\t\t\t<a class="navbar-brand after" href="#">\r\n\t\t\t\t<i class="glyphicon glyphicon-home"></i>&nbsp;\r\n\t\t\t\tecoReleve\r\n\t\t\t</a>\r\n\t\t</div>\r\n\t\t<ul class="nav navbar-nav navbar-right">\r\n\t\t\t<li>\r\n\t\t\t\t<a href="#">\r\n\t\t\t\t\t<i class="reneco-user"></i>&nbsp;\r\n\t\t\t\t\tuser\r\n\t\t\t\t</a>\r\n\t\t\t</li>\r\n\t\t\t<li>\r\n\t\t\t\t<a id="logout"> \r\n\t\t\t\t\tlogout&nbsp;\r\n\t\t\t\t\t<i class="glyphicon glyphicon-log-out"></i>\r\n\t\t\t\t</a>\r\n\t\t\t</li>\r\n\t\t</ul>\r\n\t</div>\r\n</nav>\r\n';

}
return __p
};

this["JST"]["app/base/home/tpl/tpl-home.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class="container">\r\n\t<div class="row">\r\n\t\t<div id="graph" class=" col-lg-6 hidden-md ">\r\n\t\t</div>\r\n\t\t<div id="info" class=" col-lg-6 col-lg-offset-0 hidden-md">\r\n\t\t</div>\r\n\t</div>\r\n\r\n\t<br><br>\r\n\r\n\t<div class="clearfix">\r\n\t\t<div class="col-lg-6 center-block ns-no-padding">\r\n\t\t\t<div class="wrapper">\r\n\r\n\t\t\t\t<a href="#" id="importTile" class="tile small_tile tile-pomegranate">\r\n\r\n\t\t\t\t\t<p>\r\n\t\t\t\t\t\t<i class="fa fa-3x huge icon reneco reneco-import"></i>\r\n\t\t\t\t\t\tManual import\r\n\t\t\t\t\t</p>\r\n\t\t\t\t</a>\r\n\r\n\t\t\t\t<a href="#input" id="manualTile" class="tile big_tile last tile-pumpkin">\r\n\t\t\t\t\t<p>\r\n\t\t\t\t\t\t<i class="icon reneco reneco-entrykey "></i> \r\n\t\t\t\t\tManual entry</p>\r\n\t\t\t\t</a>\r\n\r\n\t\t\t\t<a href="#" id="argosTile" class="tile small_tile tile-alizarin tile-locked">\r\n\t\t\t\t\t\r\n\t\t\t\t\t<p>\r\n\t\t\t\t\t\t<i class="fa fa-3x huge icon reneco reneco-sensorimport"></i>\r\n\t\t\t\t\t\tAutomatic import\r\n\t\t\t\t\t</p>\r\n\t\t\t\t</a>\r\n\r\n\t\t\t\t<a href="#" id="validate" class="tile big_tile last tile-carrot">\r\n\t\t\t\t\t<p>\r\n\t\t\t\t\t\t<i class="fa fa-3x huge icon reneco reneco-validate"></i>\r\n\t\t\t\t\t\tValidate\r\n\t\t\t\t\t</p>\r\n\t\t\t\t</a>\r\n\t\t\t</div>\r\n\t\t</div>\r\n\r\n\t\t<div class="col-lg-6 ns-no-padding">\r\n\t\t\t<div class="wrapper">\r\n\t\t\t\t<a href="#"  id="stationsTile" class="tile small_tile first tile-green">\r\n\t\t\t\t\t\r\n\t\t\t\t\t<p>\r\n\t\t\t\t\t\t<i class="fa fa-3x huge icon reneco reneco-stations"></i>\r\n\t\t\t\t\t\tStations\r\n\t\t\t\t\t</p>\r\n\t\t\t\t</a>\r\n\r\n\t\t\t\t<a href="#" id="indivTile" class="tile small_tile tile-lime">\r\n\t\t\t\t\t\r\n\t\t\t\t\t<p>\r\n\t\t\t\t\t\t<i class="fa fa-3x huge icon reneco reneco-individuals"></i>\r\n\t\t\t\t\t\tIndividuals\r\n\t\t\t\t\t</p>\r\n\t\t\t\t</a>\r\n\r\n\t\t\t\t<a href="#" class="tile small_tile last tile-teal tile-locked">\r\n\t\t\t\t\t<p>\r\n\t\t\t\t\t\t<i class="fa fa-3x huge icon reneco reneco-mydata"></i>\r\n\t\t\t\t\t\tMy data\r\n\t\t\t\t\t</p>\r\n\t\t\t\t</a>\r\n\r\n\t\t\t\t<a href="#" id="transmitterTile" class="tile small_tile first tile-emerald">\r\n\t\t\t\t\t\r\n\t\t\t\t\t<p>\r\n\t\t\t\t\t\t<i class="fa fa-3x huge icon reneco reneco-sensors"></i>\r\n\t\t\t\t\t\tObjects\r\n\t\t\t\t\t</p>\r\n\t\t\t\t</a>\r\n\r\n\t\t\t\t<a href="#" id="rfidTile" class="tile small_tile tile-nephritis">\r\n\t\t\t\t\t<p>\r\n\t\t\t\t\t\t<i class="fa fa-3x huge icon reneco reneco-sensors"></i>\r\n\t\t\t\t\t\tMonitored sites\r\n\t\t\t\t\t</p>\r\n\t\t\t\t</a>\r\n\r\n\t\t\t\t<a href="#" id="myDataTile" class="tile small_tile last tile-peter-river">\r\n\t\t\t\t\t\r\n\t\t\t\t\t<p>\r\n\t\t\t\t\t\t<i class="fa fa-3x huge icon reneco reneco-export"></i>\r\n\t\t\t\t\t\tExport\r\n\t\t\t\t\t</p>\r\n\t\t\t\t</a>\r\n\t\t\t</div>\r\n\t\t</div>\r\n\r\n\t</div>\r\n\r\n</div>\r\n';

}
return __p
};

this["JST"]["app/base/login/tpl/tpl-login.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class="login-form">\r\n\t<h1>RENECO</h1>\r\n\t<h2>For wildlife preservation</h2>\r\n\t<br>\r\n\t<form class="" autocomplete="off">\r\n\t\t<div class="wrapper">\r\n\t\t\t<div class="form-group" id="login-group">\r\n\t\t\t<input style="display:none">\r\n\t\t\t\t<input id="username" list="username_list" type="text"\r\n\t\t\t\t\tclass="form-control" placeholder="Username"\r\n\t\t\t\t\tautocomplete="off"/>\r\n\t\t\t\t<span class="help-block"></span>\r\n\t\t\t</div>\r\n\r\n\t\t\t<div class="form-group" id="pwd-group">\r\n\t\t\t<input style="display:none">\r\n\t\t\t\t<input id="password" type="password" class="form-control" placeholder="Password" autocomplete="off"/>\r\n\t\t\t\t<span id="help-password" class="help-block"></span>\r\n\t\t\t</div>\r\n\t\t</div>\r\n\t\t<button id="login-btn" type="submit" class="center-block form-control">Sign in</button>\r\n\t</form>\r\n</div>\r\n';

}
return __p
};

this["JST"]["app/base/rootview/tpl-rootview.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<header class="clearfix">\r\n</header>\r\n<main role="main" id="main" class="clearfix">\r\n</main>\r\n<footer>\r\n</footer>\r\n';

}
return __p
};

this["JST"]["app/modules/input/templates/individual-filter.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '\r\n\t<div class="panel-group" id="filter-accordion">\r\n\t<div class="panel panel-default">\r\n\t\t<div class="panel-heading top-level">\r\n\t\t\t<h1 class="panel-title">\r\n\t\t\t<a data-toggle="collapse" data-parent="#filter-accordion" href="#filter-collapse">\r\n\t\t\t\tFILTERS\r\n\t\t\t</a>\r\n\t\t\t</h1>\r\n\t\t</div>\r\n\t<div id="filter-collapse" class="panel-collapse collapse in">\r\n\t<form role="form">\r\n\t\t<div class="row-fluid">\r\n\t\t\t<div class="panel-group" id="accordion">\r\n\t\t\t\t<div class="panel panel-default">\r\n\t\t\t\t\t<div class="panel-heading">\r\n\t\t\t\t\t\t<span class="panel-title">\r\n\t\t\t\t\t\t<a data-toggle="collapse" data-parent="#accordion" href="#collapseOne">\r\n\t\t\t\t\t\t\tPopulation criteria\r\n\t\t\t\t\t\t</a>\r\n\t\t\t\t\t\t</span>\r\n\t\t\t\t\t</div>\r\n\t\t\t\t\t<div id="collapseOne" class="panel-collapse collapse in">\r\n\t\t\t\t\t\t<div class="panel-body">\r\n\t\t\t\t\t\t\t<div class="input-group">\r\n\t\t\t\t\t\t\t\t<div class="input-group-addon">\r\n\t\t\t\t\t\t\t\t\t<select id="select-species">\r\n\t\t\t\t\t\t\t\t\t\t<option>is</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>is not</option>\r\n\t\t\t\t\t\t\t\t\t</select>\r\n\t\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t\t<input id="species" list="species_list" type="text"\r\n\t\t\t\t\t\t\t\t\tclass="form-control" placeholder="Species"/>\r\n\t\t\t\t\t\t\t\t<datalist id="species_list"/>\r\n\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t<div class="input-group">\r\n\t\t\t\t\t\t\t\t<div class="input-group-addon">\r\n\t\t\t\t\t\t\t\t\t<select id="select-origin">\r\n\t\t\t\t\t\t\t\t\t\t<option>is</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>is not</option>\r\n\t\t\t\t\t\t\t\t\t</select>\r\n\t\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t\t<input id="origin" list="origin_list" type="text"\r\n\t\t\t\t\t\t\t\t\tclass="form-control" placeholder="Origin"/>\r\n\t\t\t\t\t\t\t\t<datalist id="origin_list"/>\r\n\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t<div class="input-group">\r\n\t\t\t\t\t\t\t\t<div class="input-group-addon">\r\n\t\t\t\t\t\t\t\t\t<select id="select-release_area">\r\n\t\t\t\t\t\t\t\t\t\t<option>is</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>is not</option>\r\n\t\t\t\t\t\t\t\t\t</select>\r\n\t\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t\t<input id="release_area" list="release_area_list" type="text"\r\n\t\t\t\t\t\t\t\t\tclass="form-control" placeholder="Release area"/>\r\n\t\t\t\t\t\t\t\t<datalist id="release_area_list"/>\r\n\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t<div class="input-group">\r\n\t\t\t\t\t\t\t\t<div class="input-group-addon">\r\n\t\t\t\t\t\t\t\t\t<select id="select-release_year">\r\n\t\t\t\t\t\t\t\t\t\t<option>is</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>is not</option>\r\n\t\t\t\t\t\t\t\t\t</select>\r\n\t\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t\t<input id="release_year" list="release_year_list" type="text"\r\n\t\t\t\t\t\t\t\t\tclass="form-control" placeholder="Release year"/>\r\n\t\t\t\t\t\t\t\t<datalist id="release_year_list"/>\r\n\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t</div>\r\n\t\t\t\t\t</div>\r\n\t\t\t\t</div>\r\n\t\t\t</div>\r\n\t\t\t<div class="panel-group " id="accordion2">\r\n\t\t\t\t<div class="panel panel-default">\r\n\t\t\t\t\t<div class="panel-heading">\r\n\t\t\t\t\t\t<span class="panel-title">\r\n\t\t\t\t\t\t<a data-toggle="collapse" data-parent="#accordion2" href="#collapseTwo">\r\n\t\t\t\t\t\tIndividual characteristics\r\n\t\t\t\t\t\t</a>\r\n\t\t\t\t\t\t</span>\r\n\t\t\t\t\t</div>\r\n\t\t\t\t\t<div id="collapseTwo" class="panel-collapse collapse">\r\n\t\t\t\t\t\t<div class="panel-body">\r\n\t\t\t\t\t\t\t<div class="input-group">\r\n\t\t\t\t\t\t\t\t<div class="input-group-addon">\r\n\t\t\t\t\t\t\t\t\t<select id="select-age">\r\n\t\t\t\t\t\t\t\t\t\t<option>is</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>is not</option>\r\n\t\t\t\t\t\t\t\t\t</select>\r\n\t\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t\t<input id="age" list="age_list" type="text"\r\n\t\t\t\t\t\t\t\t\tclass="form-control" placeholder="Age"/>\r\n\t\t\t\t\t\t\t\t<datalist id="age_list"/>\r\n\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t<div class="input-group">\r\n\t\t\t\t\t\t\t\t<div class="input-group-addon">\r\n\t\t\t\t\t\t\t\t\t<select id="select-sex">\r\n\t\t\t\t\t\t\t\t\t\t<option>is</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>is not</option>\r\n\t\t\t\t\t\t\t\t\t</select>\r\n\t\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t\t<input id="sex" list="sex_list" type="text"\r\n\t\t\t\t\t\t\t\t\tclass="form-control" placeholder="Sex"/>\r\n\t\t\t\t\t\t\t\t<datalist id="sex_list"/>\r\n\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t</div>\r\n\t\t\t\t\t</div>\r\n\t\t\t\t</div>\r\n\t\t\t</div>\r\n\t\t</div> <!-- End of 1st row -->\r\n\t\t<div class="row-fluid">\r\n\t\t\t<div class="panel-group" id="accordion3">\r\n\t\t\t\t<div class="panel panel-default">\r\n\t\t\t\t\t<div class="panel-heading">\r\n\t\t\t\t\t\t<span class="panel-title">\r\n\t\t\t\t\t\t<a data-toggle="collapse" data-parent="#accordion3" href="#collapseThree">\r\n\t\t\t\t\t\tSurvey criteria\r\n\t\t\t\t\t\t</a>\r\n\t\t\t\t\t\t</span>\r\n\t\t\t\t\t</div>\r\n\t\t\t\t\t<div id="collapseThree" class="panel-collapse collapse">\r\n\t\t\t\t\t\t<div class="panel-body">\r\n\t\t\t\t\t\t\t<div class="input-group">\r\n\t\t\t\t\t\t\t\t<div class="input-group-addon">\r\n\t\t\t\t\t\t\t\t\t<select id="select-status">\r\n\t\t\t\t\t\t\t\t\t\t<option>is</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>is not</option>\r\n\t\t\t\t\t\t\t\t\t</select>\r\n\t\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t\t<input id="status" list="status_list" type="text"\r\n\t\t\t\t\t\t\t\t\tclass="form-control" placeholder="Individual status"/>\r\n\t\t\t\t\t\t\t\t<datalist id="status_list"/>\r\n\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t<div class="input-group">\r\n\t\t\t\t\t\t\t\t<div class="input-group-addon">\r\n\t\t\t\t\t\t\t\t\t<select id="select-survey_type">\r\n\t\t\t\t\t\t\t\t\t\t<option>is</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>is not</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>null</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>not null</option>\r\n\t\t\t\t\t\t\t\t\t</select>\r\n\t\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t\t<input id="survey_type" list="survey_type_list" type="text"\r\n\t\t\t\t\t\t\t\t\tclass="form-control" placeholder="Type of survey"/>\r\n\t\t\t\t\t\t\t\t<datalist id="survey_type_list"/>\r\n\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t<div class="input-group">\r\n\t\t\t\t\t\t\t\t<div class="input-group-addon">\r\n\t\t\t\t\t\t\t\t\t<select id="select-monitoring_status">\r\n\t\t\t\t\t\t\t\t\t\t<option>is</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>is not</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>null</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>not null</option>\r\n\t\t\t\t\t\t\t\t\t</select>\r\n\t\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t\t<input id="monitoring_status" list="monitoring_status_list" type="text"\r\n\t\t\t\t\t\t\t\t\tclass="form-control" placeholder="Monitoring status"/>\r\n\t\t\t\t\t\t\t\t<datalist id="monitoring_status_list"/>\r\n\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t</div>\r\n\t\t\t\t\t</div>\r\n\t\t\t\t</div>\r\n\t\t\t</div>\r\n\t\t\t<div class="panel-group" id="accordion4">\r\n\t\t\t\t<div class="panel panel-default">\r\n\t\t\t\t\t<div class="panel-heading">\r\n\t\t\t\t\t\t<span class="panel-title">\r\n\t\t\t\t\t\t<a data-toggle="collapse" data-parent="#accordion4" href="#collapseFour">\r\n\t\t\t\t\t\tIdentifiers\r\n\t\t\t\t\t\t</a>\r\n\t\t\t\t\t\t</span>\r\n\t\t\t\t\t</div>\r\n\t\t\t\t\t<div id="collapseFour" class="panel-collapse collapse">\r\n\t\t\t\t\t\t<div class="panel-body">\r\n\t\t\t\t\t\t\t<div class="input-group">\r\n\t\t\t\t\t\t\t\t<div class="input-group-addon">\r\n\t\t\t\t\t\t\t\t\t<select id="select-frequency">\r\n\t\t\t\t\t\t\t\t\t\t<option>is</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>is not</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>null</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>not null</option>\r\n\t\t\t\t\t\t\t\t\t</select>\r\n\t\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t\t<input id="frequency" list="frequency_list" type="text"\r\n\t\t\t\t\t\t\t\t\tclass="form-control" placeholder="Frequency"/>\r\n\t\t\t\t\t\t\t\t<datalist id="frequency_list"/>\r\n\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t<div class="input-group">\r\n\t\t\t\t\t\t\t\t<div class="input-group-addon">\r\n\t\t\t\t\t\t\t\t\t<select id="select-ptt">\r\n\t\t\t\t\t\t\t\t\t\t<option>is</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>is not</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>null</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>not null</option>\r\n\t\t\t\t\t\t\t\t\t</select>\r\n\t\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t\t<input id="ptt" list="ptt_list" type="text"\r\n\t\t\t\t\t\t\t\t\tclass="form-control" placeholder="PTT"/>\r\n\t\t\t\t\t\t\t\t<datalist id="ptt_list"/>\r\n\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t<div class="input-group">\r\n\t\t\t\t\t\t\t\t<div class="input-group-addon">\r\n\t\t\t\t\t\t\t\t\t<select id="select-chip_code">\r\n\t\t\t\t\t\t\t\t\t\t<option>is</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>is not</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>null</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>not null</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>begin with</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>not begin with</option>\r\n\t\t\t\t\t\t\t\t\t</select>\r\n\t\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t\t<input id="chip_code" list="chip_code_list" type="text"\r\n\t\t\t\t\t\t\t\t\tclass="form-control" placeholder="Chip code"/>\r\n\t\t\t\t\t\t\t\t<datalist id="chip_code_list"/>\r\n\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t<div class="input-group">\r\n\t\t\t\t\t\t\t\t<div class="input-group-addon">\r\n\t\t\t\t\t\t\t\t\t<select id="select-breeding_ring">\r\n\t\t\t\t\t\t\t\t\t\t<option>is</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>is not</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>null</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>not null</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>begin with</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>not begin with</option>\r\n\t\t\t\t\t\t\t\t\t</select>\r\n\t\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t\t<input id="breeding_ring" list="breeding_ring_list" type="text"\r\n\t\t\t\t\t\t\t\t\tclass="form-control" placeholder="Breeding ring"/>\r\n\t\t\t\t\t\t\t\t<datalist id="breeding_ring_list"/>\r\n\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t<div class="input-group">\r\n\t\t\t\t\t\t\t\t<div class="input-group-addon">\r\n\t\t\t\t\t\t\t\t\t<select id="select-release_ring">\r\n\t\t\t\t\t\t\t\t\t\t<option>is</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>is not</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>null</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>not null</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>begin with</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>not begin with</option>\r\n\t\t\t\t\t\t\t\t\t</select>\r\n\t\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t\t<input id="release_ring" list="release_ring_list" type="text"\r\n\t\t\t\t\t\t\t\t\tclass="form-control" placeholder="Release ring"/>\r\n\t\t\t\t\t\t\t\t<datalist id="release_ring_list"/>\r\n\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t<div class="input-group">\r\n\t\t\t\t\t\t\t\t<div class="input-group-addon">\r\n\t\t\t\t\t\t\t\t\t<select id="select-mark1">\r\n\t\t\t\t\t\t\t\t\t\t<option>is</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>is not</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>null</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>not null</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>begin with</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>not begin with</option>\r\n\t\t\t\t\t\t\t\t\t</select>\r\n\t\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t\t<input id="mark1" list="mark1_list" type="text"\r\n\t\t\t\t\t\t\t\t\tclass="form-control" placeholder="Mark 1 code"/>\r\n\t\t\t\t\t\t\t\t<datalist id="mark1_list"/>\r\n\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t<div class="input-group">\r\n\t\t\t\t\t\t\t\t<div class="input-group-addon">\r\n\t\t\t\t\t\t\t\t\t<select id="select-mark2">\r\n\t\t\t\t\t\t\t\t\t\t<option>is</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>is not</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>null</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>not null</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>begin with</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>not begin with</option>\r\n\t\t\t\t\t\t\t\t\t</select>\r\n\t\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t\t<input id="mark2" list="mark2_list" type="text"\r\n\t\t\t\t\t\t\t\t\tclass="form-control" placeholder="Mark 2 code"/>\r\n\t\t\t\t\t\t\t\t<datalist id="mark2_list"/>\r\n\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t<div class="input-group">\r\n\t\t\t\t\t\t\t\t<div class="input-group-addon">\r\n\t\t\t\t\t\t\t\t\t<select id="select-id">\r\n\t\t\t\t\t\t\t\t\t\t<option>is</option>\r\n\t\t\t\t\t\t\t\t\t\t<option>is not</option>\r\n\t\t\t\t\t\t\t\t\t</select>\r\n\t\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t\t<input id="id" list="id_list" type="text"\r\n\t\t\t\t\t\t\t\t\tclass="form-control" placeholder="ID"/>\r\n\t\t\t\t\t\t\t\t<datalist id="id_list"/>\r\n\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t</div>\r\n\t\t\t\t\t</div>\r\n\t\t\t\t</div>\r\n\t\t\t</div>\r\n\t\t</div> <!-- End of 2nd row -->\r\n\t\t<div class="row-fluid">\r\n\t\t\t<div class="container-fluid form-group">              \r\n\t\t\t<div class="spacer"/>\r\n\t\t\t<div class="row-fluid">\r\n\t\t\t\t\t<button id="clear-btn"\r\n\t\t\t\t\t\tclass="small btn pull-left" style="margin-right:15px">\r\n\t\t\t\t\t\tCLEAR\r\n\t\t\t\t\t</button>\r\n\t\t\t\t\t<button id="filter-btn" type="submit"\r\n\t\t\t\t\t\t\tclass="small btn btn-labeled btn-success pull-right">\r\n\t\t\t\t\t\t\t FILTER\r\n\t\t\t\t\t\t\t<span class="btn-label">\r\n\t\t\t\t\t\t\t\t<i class="icon reneco reneco-search "/>\r\n\t\t\t\t\t\t\t</span>\r\n\t\t\t\t\t</button>\r\n\t\t\t</div>\r\n\t\t\t<div class="spacer"></div>\r\n\t\t\t</div>\r\n\t\t\t</div>\r\n\t\t</div> <!-- End of 3th row -->\r\n\t</form>\r\n\t</div>\r\n\t</div>\r\n\t</div>\r\n\t<div class="panel-group" id="saved-accordion">\r\n\t<div id="indivModalQuery"></div>\r\n';

}
return __p
};

this["JST"]["app/modules/input/templates/individual-list.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '\r\n<div class="container-fluid">\r\n\t<div class="">\r\n\t\t<div class="clearfix">\r\n\t\t\t<span id="indiv-count" class="medium">-</span>\r\n\t\t</div>\r\n\t</div>\r\n\t<div class="spacer"/>\r\n\t<div class="spacer"/>\r\n\t<div id="grid-row" class="">\r\n\t\t<div id="gridContainer" class="backgrid-container grid-list"></div>\r\n\t</div>\r\n</div>\r\n';

}
return __p
};

this["JST"]["app/modules/input/templates/input-grid.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class="wrapper">\r\n\t<h3>Please, select a station on the grid</h3>\r\n\t<br>\r\n\t<div class=\'col-sm-12 masqued\' id=\'inputImpStFieldContainer\' >\r\n\t\t<label>Please select a field activity for the selected station</label>\r\n\t</div>\r\n\t<div id="locations" class=\'backgrid-container\'/>\r\n</div>\r\n';

}
return __p
};

this["JST"]["app/modules/input/templates/modalIndivSelect.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class="modal fade full-modal" id="myModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">\r\n\t\t<div class="modal-dialog">\r\n\t\t\t<div class="modal-content">\r\n\t\t\t\t<div class="modal-header">\r\n\t\t\t\t\t<button type="button" class="close filterClose blackFont" data-dismiss="modal" aria-hidden="true">X</button>\r\n\t\t\t\t\t<h4 class="modal-title">Identify individual</h4>\r\n\t\t\t\t</div>\r\n\t\t\t\t<div class="modal-body">\r\n\t\t\t\t\t\t<div id="filter-left-panel" class="col-lg-4 col-md-6 col-sm-6 no-padding modal-panel-left"></div>\r\n\t\t\t\t\t\t<div id="filter-main-panel" class="col-lg-8 col-md-6 col-sm-6 no-padding modal-main-panel"></div>\r\n\t\t\t\t</div>\r\n\t\t\t\t<div class="modal-footer">\r\n\t\t\t\t\t<button type="button" class="btn btn-default filterCancel" data-dismiss="modal">cancel</button>\r\n\t\t\t\t\t<button type="button" class="btn btn-primary filterClose">finish</button>\r\n\t\t\t\t</div>\r\n\t\t\t</div>\r\n\t\t</div>\r\n</div>\r\n';

}
return __p
};

this["JST"]["app/modules/input/templates/stations-filter.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '\r\n<div id="filter-collapse" class="panel-collapse collapse in cleafix">\r\n\t<form role="form">\r\n\t\t<fieldset>\r\n\t\t\t<legend>Select station(s)</legend>\r\n\t\t\t<span class="col-xs-3">\r\n\t\t\t\t<label >Id</label>\r\n\t\t\t\t<input name="allSt-PK" class="form-control"  type="text" id="PK"/>\r\n\t\t\t</span>\r\n\t\t\t<span class="col-xs-9" id="allSt-Monitored">\r\n\t\t\t\t\t<label>Monitored site type</label><br/>\r\n\t\t\t\t\t<select name="allSt-monitoredSiteType" class="form-control">\r\n\t\t\t\t\t\t<option></option>\r\n\t\t\t\t\t</select>\r\n\t\t\t</span>\r\n\t\t\t<span class="allSt-name col-xs-4">\r\n\t\t\t\t<label >Name</label>\r\n\t\t\t\t<select id="allSt-Name-op" class="form-control" >\r\n\t\t\t\t\t<option>Is</option>\r\n\t\t\t\t\t<option>Is not</option>\r\n\t\t\t\t\t<option>Contains</option>\r\n\t\t\t\t</select>\r\n\t\t\t</span>\r\n\t\t\t<span id="stationType" class=\'col-xs-8 allSt-name\'>\r\n\t\t\t\t<label>&nbsp;</label>\r\n\t\t\t\t<input name="allSt-Name" id ="st-station" class="form-control" type="text"/>\r\n\t\t\t</span> \r\n\t\t\t<div class="clear"></div>\r\n\t\t\t<span class=\'col-xs-12\' id=\'allSt-SitesNameCont\'>\r\n\t\t\t\t<label >Name</label>\r\n\t\t\t\t<select class="form-control" id="stMonitoredSiteName" name=\'allSt-siteName\'/>\r\n\t\t\t</span>\r\n\t\t</fieldset>\r\n\t\t<fieldset>\r\n\t\t\t<legend>date</legend>\r\n\t\t\t<div class="col-xs-4">\r\n\t\t\t\t<select id="allSt-beginDate-op" class="form-control" >\r\n\t\t\t\t\t<option>=</option>\r\n\t\t\t\t\t<option>&lt;</option>\r\n\t\t\t\t\t<option>&lt;=</option>\r\n\t\t\t\t\t<option>&gt;</option>\r\n\t\t\t\t\t<option>&gt;=</option>\r\n\t\t\t\t</select>\r\n\t\t\t</div>\r\n\t\t\t<div class=" date col-xs-8">\r\n\t\t\t\t<input type="text" name="allSt-beginDate" class="form-control pickerDate" type="text" placeholder="dd/mm/yyyy">\r\n\t\t\t</div>\r\n\t\t\t<div class="clear"></div>\r\n\t\t\t<div class="col-xs-4">\r\n\t\t\t\t\t<select id="allSt-endDate-op" class="form-control">\r\n\t\t\t\t\t\t<option>&lt;</option>\r\n\t\t\t\t\t\t<option>&lt;=</option>\r\n\t\t\t\t\t</select>\r\n\t\t\t</div>\r\n\t\t\t<div class="col-xs-8">\r\n\t\t\t\t<input type="text" name="allSt-endDate" class="form-control pickerDate" type="text" placeholder="dd/mm/yyyy">\r\n\t\t\t</div>\r\n\t\t </fieldset>\r\n\t\t <fieldset>\r\n\t\t\t<legend>field caracteristics</legend>\r\n\t\t\t\t<div class="col-xs-12 col-lg-4">\r\n\t\t\t\t\t<label>Fieldworker</label><br/>\r\n\t\t\t\t\t<select name="allSt-fieldWorker" class="form-control">\r\n\t\t\t\t\t\t<option></option>\r\n\t\t\t\t\t</select>\r\n\t\t\t\t</div>\r\n\t\t\t\t<div class="col-xs-12 col-lg-4">\r\n\t\t\t\t\t<label>Field activity</label><br/>\r\n\t\t\t\t\t<select name="allSt-fieldActivity" class="form-control">\r\n\t\t\t\t\t\t<option></option>\r\n\t\t\t\t\t</select>\r\n\t\t\t\t</div>\r\n\t\t\t\t<div class="col-xs-12 col-lg-4">\r\n\t\t\t\t\t<label>Region</label><br/>\r\n\t\t\t\t\t<select name="allSt-region" class="form-control">\r\n\t\t\t\t\t\t<option></option>\r\n\t\t\t\t\t</select>\r\n\t\t\t\t</div>\r\n\r\n\t\t</fieldset>\r\n\t\t <fieldset>\r\n\t\t\t<legend>Coordinates</legend>\r\n\t\t\t<div class="col-xs-3">\r\n\t\t\t\t<label >min lat</label>\r\n\t\t\t\t<input name="allSt-minLat" class="form-control  coords coord-min"  type="text" />\r\n\t\t\t</div>\r\n\t\t\t<div class="col-xs-3">\r\n\t\t\t\t<label>min lon</label>\r\n\t\t\t\t<input name="allSt-minLon" class="form-control coords coord-min" type="text" />\r\n\t\t\t</div>\r\n\t\t\t<div class="col-xs-3">\r\n\t\t\t\t<label>max lat</label>\r\n\t\t\t\t<input name="allSt-maxLat" type="text" class="form-control coords coord-max"/>\r\n\t\t\t</div>\r\n\t\t\t <div class="col-xs-3">\r\n\t\t\t\t<label>max lon</label>\r\n\t\t\t\t<input name="allSt-maxLon" type="text" class="form-control coords coord-max"/>\r\n\t\t\t</div>\r\n\t\t</fieldset>\r\n\t\t<div class="col-xs-12">\r\n\t\t<label>Individual</label><br/>\r\n\t\t\t<div class="input-group  picker">\r\n\t\t\t\t<input class="form-control pickerInput required" name="allSt-indivId" type="text">\r\n\t\t\t\t<span class="input-group-addon picker"><span class="glyphicon-plus"></span></span> \r\n\t\t\t</div>\r\n\t\t</div>\r\n\t\t<div class="allSt-btn-group col-xs-12">\r\n\r\n\t\t\t<button id="allSt-filter-btn" type="submit"\r\n\t\t\t\t\tclass="small btn btn-labeled btn-success pull-right">\r\n\t\t\t\t\t FILTER\r\n\t\t\t\t<span class="btn-label">\r\n\t\t\t\t\t<i class="icon reneco reneco-search "/>\r\n\t\t\t\t</span>\r\n\t\t\t</button>\r\n\t\t\t<button id="allSt-clear-btn" class="small btn btn-labeled">\r\n\t\t\t\tCLEAR\r\n\t\t\t</button>\r\n\t\t</div>\r\n\t</form>\r\n</div>\r\n\r\n';

}
return __p
};

this["JST"]["app/modules/input/templates/stations-list.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '\r\n\t<div class="">\r\n\t\t<div class="clearfix">\r\n\t\t\t<span id="stations-count" class="medium">-</span>\r\n\t\t</div>\r\n\t</div>\r\n\t<div class="spacer"/>\r\n\t\t<div id="" class="">\r\n\t\t\t<div id="stationsGridContainer" class="backgrid-container grid-list ns-full-height"></div>\r\n\t\t</div>\r\n\t</div>\r\n\r\n';

}
return __p
};

this["JST"]["app/modules/input/templates/tpl-entry.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '\t<div class="ns-full-height">\r\n\t\t<div id="stepper" class="ns-full-height"></div>\r\n\t</div>\r\n';

}
return __p
};

this["JST"]["app/modules/input/templates/tpl-new-station.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<form id="newStForm">\r\n\t<!--<div class="col-xs-12"><h3 id="input-station-title">New station</h3></div>\r\n\t<div class="clear"></div>\r\n\t\t<!--<div id="stationType">\r\n\t\t\t<div class="radio-inline">\r\n\t\t\t\t  <label><input type="radio" name="position" value ="1" checked>coordinates</label>\r\n\t\t\t</div>\r\n\t\t\t<div class="radio-inline">\r\n\t\t\t\t  <label><input type="radio" name="position" value ="0">without coordinates</label>\r\n\t\t\t</div>\r\n\t\t\t<div class="radio-inline">\r\n\t\t\t\t  <label><input type="radio" name="position" value ="2">from monitored site</label>\r\n\t\t\t</div>\r\n\t\t</div>-->\r\n\r\n\t<fieldset>\r\n\t\t<legend>identification</legend>\r\n\t\t<div class=\'col-xs-5\'>\r\n\t\t\t<label>station name*</label>\r\n\t\t\t<div data-editors="Name"></div>\r\n\t\t\t<div id=\'error-Name\' class=\'error\'></div>\r\n\t\t</div>\r\n\t\t<div class=\'col-xs-6\'>\r\n\t\t\t<label>date*</label>\r\n\t\t\t<div class="input-group date" data-editors="Date_">\r\n\t\t\t</div>\r\n\t\t\t<div id=\'error-Date_\' class=\'error\'></div>\r\n\t\t</div>\r\n\t</fieldset>\r\n\t<fieldset>\r\n\t\t<legend>location</legend>\r\n\r\n\t\t\t<div class=\'col-xs-10 masqued\' id="stRegion">\r\n\t\t\t\t<label>region*</label>\r\n\t\t\t\t<div data-editors="Region"></div>\r\n\t\t\t\t<div id=\'error-Region\' class=\'error\'></div>\r\n\t\t\t</div>\r\n\t\t\t<div id="stCoordinates">\r\n\t\t\t\t<div class=\'col-xs-4\'>\r\n\t\t\t\t<label>latitude*</label>\r\n\t\t\t\t<div data-editors="LAT"></div>\r\n\t\t\t\t<div id=\'error-LAT\' class=\'error\'></div>\r\n\r\n\t\t\t\t</div>\r\n\t\t\t\t<div class=\'col-xs-4\'>\r\n\t\t\t\t\t<label>longitude*</label>\r\n\t\t\t\t\t<div data-editors="LON"></div>\r\n\t\t\t\t\t<div id=\'error-LON\' class=\'error\'></div>\r\n\t\t\t\t</div>\r\n\t\t\t\t<div class=\'col-xs-3\'>\r\n\t\t\t\t\t<label>accuracy(m)*</label>\r\n\t\t\t\t\t<div data-editors="Precision"></div>\r\n\t\t\t\t\t<div id=\'error-Precision\' class=\'error\'></div>\r\n\t\t\t\t</div>\r\n\r\n\t\t\t\t<div class=\'col-xs-1\'>\r\n\t\t\t\t\t<br>\r\n\t\t\t\t\t<i class="icon-action icon mini reneco reneco-site" id="getPosition"></i>\r\n\t\t\t\t</div>\r\n\t\t\t</div>\r\n\t\t\t<div id="stMonitoredSite" class="masqued">\r\n\t\t\t\t<div class=\'col-xs-5\'>\r\n\t\t\t\t<label>site type*</label>\r\n\t\t\t\t<select class="form-control" id="stMonitoredSiteType" name=\'type_site\'>\r\n\t\t\t\t\t<option></option>\r\n\t\t\t\t</select>\r\n\t\t\t\t</div>\r\n\t\t\t\t<div class=\'col-xs-5\'>\r\n\t\t\t\t\t<label>site name*</label>\r\n\t\t\t\t\t<select class="form-control" id="stMonitoredSiteName" name=\'id_site\'>\r\n\t\t\t\t\t\t<option></option>\r\n\t\t\t\t\t</select>\r\n\t\t\t\t</div>\r\n\t\t\t</div>\r\n\t</fieldset>\r\n\t<fieldset id=\'station-fieldWorkers\' insertedWorkersNb="1">\r\n\t<legend>field caracteristics</legend>\r\n\t<div>\r\n\t\t<div class=\'col-xs-11\'>\r\n\t\t\t<label>field activity*</label>\r\n\t\t\t<div data-editors="FieldActivity_Name"></div>\r\n\t\t\t<div id=\'error-FieldActivity_Name\' class=\'error\'></div>\r\n\t\t</div>\r\n\r\n\t\t<div class="col-xs-6">\r\n\t\t\t<label>observer 1*</label><br/>\r\n\t\t\t<div data-editors="FieldWorker1"></div>\r\n\t\t\t<div id=\'error-FieldWorker1\' class=\'error\'></div>\r\n\t\t</div>\r\n\t\t<div class="col-xs-5">\r\n\t\t\t<label>total observers*</label><br/>\r\n\t\t\t<div data-editors="NbFieldWorker"></div>\r\n\t\t\t<div id=\'error-NbFieldWorker\' class=\'error\'></div>\r\n\t\t</div>\r\n\r\n\t\t<div id="addFieldWorkerInput" class=\'col-xs-1\'>\r\n\t\t\t<br>\r\n\t\t\t<a><i class="icon-action icon mini reneco reneco-add"></i></a>\r\n\t\t</div>\r\n\r\n\r\n\t\t<div class=\'col-xs-5 masqued\' id=\'FieldWorker2-field\'>\r\n\t\t\t<label>observer 2</label>\r\n\t\t\t<div data-editors="FieldWorker2"></div>\r\n\t\t</div>\r\n\t\t<div class=\'col-xs-5 masqued\' id=\'FieldWorker3-field\'>\r\n\t\t\t<label>observer 3</label>\r\n\t\t\t<div data-editors="FieldWorker3"></div>\r\n\t\t</div>\r\n\t\t<div id="removeFieldWorkerInput" class=\'col-xs-2 masqued\'>\r\n\t\t\t<br>\r\n\t\t\t<i class="icon-action icon mini reneco reneco-close"></i>\r\n\t\t</div>\r\n\t\t<div class=\'col-xs-5 masqued\' id=\'FieldWorker4-field\'>\r\n\t\t\t<label>observer 4</label>\r\n\t\t\t<div data-editors="FieldWorker4"></div>\r\n\t\t</div>\r\n\t\t<div class=\'col-xs-5 masqued\' id=\'FieldWorker5-field\'>\r\n\t\t\t<label>observer 5</label>\r\n\t\t\t<div data-editors="FieldWorker5"></div>\r\n\t\t</div>\r\n\t\t<!--<div class="masqued">\r\n\t\t\t<div data-editors="id_site"></div>\r\n\t\t\t<div data-editors="precision"></div>\r\n\t\t\t<div data-editors="name_site"></div>\r\n\t\t</div>  -->\r\n\r\n\r\n\t\t\r\n\t</div>\r\n\t<br>\r\n  </fieldset>\r\n  <br><br><br>\r\n</form>\r\n';

}
return __p
};

this["JST"]["app/modules/input/templates/tpl-station-details.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '\r\n<div id="stationPanel">\r\n\r\n\t<div class="clearfix" id="stationHeader">\r\n\t\t<span class="col-md-12 col-lg-6">\r\n\t\t\t\r\n\t\t\t<span class="navigation">\r\n\t\t\t\t\t<a class="arrow-left-station glyphicon pointer  glyphicon-triangle-left" nav="prev"></a> \r\n\t\t\t</span>\r\n\t\t\t<span class="navigation">\r\n\t\t\t\t\t<a class="arrow-right-station glyphicon pointer glyphicon-triangle-right" nav="next"></a>\r\n\t\t\t</span> \r\n\t\t</span>\r\n\t\t<div class="col-md-12 col-lg-6">\r\n\t\t\t<button id="editSt-btn" type="submit" class="small btn btn-labeled btn-success pull-right">\r\n\t\t\t\t\tEdit\r\n\t\t\t\t\t<span class="btn-label">\r\n\t\t\t\t\t\t\t<i class="icon reneco reneco-edit "></i>\r\n\t\t\t\t\t</span>\r\n\t\t\t</button>\r\n\t\t</div>\r\n\r\n\t</div>\r\n\t<div class="separator"></div>\r\n\t<div class="clearfix stationName col-xs-12">\r\n\r\n\t\t <h3 class="break" id="stDetailsTitle">Station: ' +
((__t = ( Name )) == null ? '' : __t) +
'</h3>\r\n\r\n\t</div>\r\n\r\n\t<div class="separator"></div>\r\n\r\n\r\n\t<div class="clearfix">\r\n\t\t<div class="col-lg-4 col-md-12" id="">\r\n\t\t\t<label>id</label>\r\n\t\t\t<div>' +
((__t = ( PK )) == null ? '' : __t) +
'</div>\r\n\t\t</div>\r\n\t\t<div class="col-lg-4 col-md-12" id="">\r\n\t\t\t<label>latitude</label>\r\n\t\t\t<div>' +
((__t = ( LAT )) == null ? '' : __t) +
'</div>\r\n\t\t</div>\r\n\t\t<div class="col-lg-4 col-md-12" id="">\r\n\t\t\t<label>longitude</label>\r\n\t\t\t<div>' +
((__t = ( LON )) == null ? '' : __t) +
'</div>\r\n\t\t</div>\r\n\t\t<!--<div class="col-lg-4 col-md-12" id="">\r\n\t\t\t <label>elev</label>\r\n\t\t\t\t\t<div>_</div>\r\n\t\t</div> -->\r\n\t</div>\r\n\r\n\t<div class="separator"></div>\r\n\r\n\t<div class="clearfix">\r\n\t\t<div class="col-lg-4 col-md-12" id="">\r\n\t\t\t<label>region</label>\r\n\t\t\t<div>' +
((__t = ( Region )) == null ? '' : __t) +
'</div>\r\n\t\t</div>\r\n\t\t<div class="col-lg-8 col-md-12" id="">\r\n\t\t\t<label>place</label>\r\n\t\t\t<div>\r\n\t\t\t\t<input class=\'autocompTree_st blackFont form-control editField\' disabled name=\'stPlace\' startId=\'1000265\' type=\'text\' id=\'stPlace\'>\r\n\t\t\t</div> \r\n\t\t</div>\r\n\t</div>\r\n\t<div class="separator"></div>\r\n\t<div class="clearfix" >\r\n\t\t<div class="col-md-12 col-lg-5" id="">\r\n\t\t\t<label>accuracy(m)</label>\r\n\t\t\t<div><input name="stAccuracy" class="blackFont form-control editField" disabled type="number"></div>\r\n\t\t</div>\r\n\t\t<div class="col-xs-12" id="">\r\n\t\t\t<label>distance from obs</label>\r\n\t\t\t<div>\r\n\t\t\t\t<select id="stDistFromObs" class="blackFont form-control editField" disabled name="stDistance">\r\n\t\t\t\t\t<option value="NULL"></option>\r\n\t\t\t\t\t<option value="1000004">&lt;100m</option>\r\n\t\t\t\t\t<option value="1000005">100m&lt; x &lt;500m</option>\r\n\t\t\t\t\t<option value="1000006">&gt;500m</option>\r\n\t\t\t\t</select>\r\n\t\t\t</div>\r\n\t\t</div>\r\n\t</div>\r\n\t<br>\r\n\t<div class="clearfix" id="stNameSite" >\r\n\t\t<div class="col-sm-3">\r\n\t\t\t<i class="icon small reneco reneco-site" id="icon-age"></i> \r\n\t\t</div>\r\n\t\t<div class="col-sm-9">\r\n\t\t\t<label>site</label>\r\n\t\t\t<div>' +
((__t = ( id_site )) == null ? '' : __t) +
'</div>\r\n\t\t</div>\r\n\t</div>\r\n\t<div class="clearfix" >\r\n\t\t<div class="col-xs-3">\r\n\t\t\t<i class="icon small reneco reneco-time" id="icon-age"></i> \r\n\t\t</div>\r\n\t\t<div class="col-xs-9">\r\n\t\t\t<label>time</label>\r\n\t\t\t<div>' +
((__t = ( Date_ )) == null ? '' : __t) +
'</div>\r\n\t\t</div>\r\n\t</div>\r\n\t<br>\r\n\t<div class="clearfix" >\r\n\t\t<div class="col-xs-3">\r\n\t\t\t<i class="icon small reneco reneco-fieldactivity" id="icon-age"></i> \r\n\t\t</div>\r\n\t\t<div class="col-xs-9">\r\n\t\t\t<label>field activity</label>\r\n\t\t\t<div>\r\n\t\t\t\t<select  name="st_FieldActivity_Name" disabled class="blackFont form-control editField">\r\n\t\t\t\t\t<option></option>\r\n\t\t\t\t</select>\r\n\t\t\t</div>\r\n\t\t</div>\r\n\t</div>\r\n\r\n\t<div class="separator"></div>\r\n\r\n\t<div class="clearfix" >\r\n\t\t<div class="col-xs-12">\r\n\t\t\t<i class="icon small reneco reneco-users" id="icon-age"></i> \r\n\t\t</div>\r\n\t\t<div class="col-xs-12 no-padding">\r\n\t\t\t<div class="panel-group" id="accordionFW">\r\n\t\t\t\t<div class="panel panel-default">\r\n\t\t\t\t\t<div class="panel-heading">\r\n\t\t\t\t\t\t\t<span class="panel-title">\r\n\t\t\t\t\t\t\t<a data-toggle="collapse" data-parent="" href="#collapseThree" class="collapsed">\r\n\t\t\t\t\t\t\t<label>Field workers</label>\r\n\t\t\t\t\t\t\t<i class="glyphicon pull-right"></i>\r\n\t\t\t\t\t\t\t</a>\r\n\t\t\t\t\t\t\t</span>\r\n\t\t\t\t\t</div>\r\n\t\t\t\t\t<div id="collapseThree" class="panel-collapse collapse">\r\n\t\t\t\t\t\t<div class="panel-body">\r\n\t\t\t\t\t\t\t<label>field worker 1</label>\r\n\t\t\t\t\t\t\t<select  class="blackFont form-control fieldworker editField" disabled name="detailsStFW1" >\r\n\t\t\t\t\t\t\t\t<option></option>\r\n\t\t\t\t\t\t\t</select>\r\n\t\t\t\t\t\t\t<label>field worker 2</label>\r\n\t\t\t\t\t\t\t<select  class="blackFont form-control fieldworker editField" disabled name="detailsStFW2">\r\n\t\t\t\t\t\t\t\t<option></option>\r\n\t\t\t\t\t\t\t</select>\r\n\t\t\t\t\t\t\t<label>field worker 3</label>\r\n\t\t\t\t\t\t\t<select  class="blackFont form-control fieldworker editField" disabled name="detailsStFW3">\r\n\t\t\t\t\t\t\t\t\t<option></option>\r\n\t\t\t\t\t\t\t</select>\r\n\r\n\t\t\t\t\t\t\t<label>field worker 4</label>\r\n\t\t\t\t\t\t\t<select class="blackFont form-control fieldworker editField" disabled name="detailsStFW4">\r\n\t\t\t\t\t\t\t\t<option></option>\r\n\t\t\t\t\t\t\t</select>\r\n\r\n\t\t\t\t\t\t\t<label>field worker 5</label>\r\n\t\t\t\t\t\t\t<select  class="blackFont form-control fieldworker editField" disabled name="detailsStFW5">\r\n\t\t\t\t\t\t\t\t<option></option>\r\n\t\t\t\t\t\t\t</select>\r\n\t\t\t\t\t\t\t<label>total</label>\r\n\t\t\t\t\t\t\t<input id="stDtailsNbFW" class="blackFont form-control editField" disabled name="detailsStFWTotal">\r\n\t\t\t\t\t\t</div>\r\n\t\t\t\t\t</div>\r\n\t\t\t\t</div>\r\n\t\t\t</div>\r\n\t\t</div>\r\n\t</div>\r\n\t</div>\r\n</div>\r\n\r\n';

}
return __p
};

this["JST"]["app/modules/input/templates/tpl-step1.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class="wrapper">\r\n\t<div class="ui segment">\r\n\t\t<div class="ui fluid basic large form segment"> \r\n\t\t\t<div class="grouped fields">\r\n\t\t\t\t<legend for="male">select an action</legend>\r\n\t\t\t\t<div class="tile-inside-container">\r\n\r\n\t\t\t\t\t<div class="new tile-inside">\r\n\t\t\t\t\t\t\t<h4>Create a new station</h4>\r\n\t\t\t\t\t\t\t<div class="center">\r\n\t\t\t\t\t\t\t\t<i class="fa fa-3x huge icon reneco reneco-stations "></i>\r\n\t\t\t\t\t\t\t\t<i class="fa fa-3x icon reneco reneco-add"></i>\r\n\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t<div class="radio">\r\n\t\t\t\t\t\t\t\t<label for="st10">\r\n\t\t\t\t\t\t\t\t\t<input type="radio" name="stationtype" value="new" checked class="stationtype" id ="st10">\r\n\t\t\t\t\t\t\t\t\tnew station with coordinates\r\n\t\t\t\t\t\t\t\t</label>\r\n\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t<div class="radio">\r\n\t\t\t\t\t\t\t\t  <label>\r\n\t\t\t\t\t\t\t\t\t\t<input type="radio" name="stationtype" value="newSc">\r\n\t\t\t\t\t\t\t\t\t\tnew station without coordinates\r\n\t\t\t\t\t\t\t\t  </label>\r\n\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t\t<div class="radio">\r\n\t\t\t\t\t\t\t\t  <label>\r\n\t\t\t\t\t\t\t\t\t<input type="radio" name="stationtype" value="newSt">\r\n\t\t\t\t\t\t\t\t\tnew station from monitored site\r\n\t\t\t\t\t\t\t\t</label>\r\n\t\t\t\t\t\t\t</div>\r\n\t\t\t\t\t</div>\r\n\r\n\t\t\t\t\t<div class="field tile-inside radio-select">\r\n\t\t\t\t\t\t<h4>Last imported station(s)</h4>\r\n\t\t\t\t\t\t<div class="center">\r\n\t\t\t\t\t\t\t<i class="fa fa-3x huge icon reneco reneco-stations "></i>\r\n\t\t\t\t\t\t\t<i class="fa fa-3x icon reneco reneco-import"></i>\r\n\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t<div class="radio">\r\n\t\t\t\t\t\t\t<label for="st2">\r\n\t\t\t\t\t\t\t\t<input type="radio" name="stationtype" class="stationtype" value="imported" id ="st2" >    \r\n\t\t\t\t\t\t\t\tlast imported station(s)\r\n\t\t\t\t\t\t\t</label>\r\n\t\t\t\t\t\t</div>\r\n\t\t\t\t\t</div>\r\n\r\n\r\n\r\n\r\n\r\n\r\n\t\t\t\t\t<div class="field tile-inside radio-select">\r\n\t\t\t\t\t\t<h4>Existing station(s)</h4>\r\n\t\t\t\t\t\t<div class="center">\r\n\t\t\t\t\t\t\t<i class="fa fa-3x huge icon reneco reneco-stations "></i>\r\n\t\t\t\t\t\t\t<i class="fa fa-3x icon reneco reneco-search"></i>\r\n\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t<div class="radio">\r\n\t\t\t\t\t\t\t<label for="st3">\r\n\t\t\t\t\t\t\t\t<input type="radio" name="stationtype" value="old" id ="st3" class="stationtype">\r\n\t\t\t\t\t\t\t\tfrom existing stations\r\n\t\t\t\t\t\t\t</label>\r\n\t\t\t\t\t\t</div>\r\n\t\t\t\t\t\t<div class="radio">\r\n\t\t\t\t\t\t\t<label>\r\n\t\t\t\t\t\t\t<input type="radio" name="stationtype" value="monitoredSite">\r\n\t\t\t\t\t\t\tfrom monitored site\r\n\t\t\t\t\t\t\t</label>\r\n\t\t\t\t\t\t</div>\r\n\t\t\t\t\t</div>\r\n\r\n\r\n\r\n\r\n\r\n\r\n\t\t\t\t</div>\r\n\t\t\t</div>\r\n\t\t</div> \r\n\t</div>\r\n</div>\r\n';

}
return __p
};

this["JST"]["app/modules/input/templates/tpl-step2.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class="wrapper">\r\n\t<div id="inputStLeft"  class="col-xs-12 col-md-5 col-border ns-full-height">\r\n\t\t\r\n\t</div>\r\n\t<div id="inputStRight" class=" no-padding col-xs-12 col-md-7 ns-full-height">\r\n\r\n\t</div>\r\n</div>\r\n';

}
return __p
};

this["JST"]["app/modules/input/templates/tpl-step3.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += ' <div>\r\n\t<div id="stContainer"  class="scroll-auto col-xs-12 col-md-3 col-border ns-full-height"> \r\n\t</div>\r\n\t<div class="col-xs-12 col-md-9 ns-full-height no-padding">\r\n\r\n\r\n\t<div class="clearfix swiper">\r\n\t\t<div class="swiper-header">\r\n\r\n\r\n\t\t\t<div class="col-xs-12 addProto clearfix">\r\n\t\t\t\t<div class="pull-right">\r\n\t\t\t\t\t<div id="add-proto" class="pull-left">\r\n\t\t\t\t\t\t<select  class="add-protocol form-control col-xs-11" name="add-protocol" placeholder="add a protocol">\r\n\t\t\t\t\t\t\t<option></option>\r\n\t\t\t\t\t\t</select>\r\n\t\t\t\t\t</div>\r\n\t\t\t\t\t<button id="addInstance" type="submit" class="small btn btn-labeled btn-success pull-left add">\r\n\t\t\t\t\t\tadd\r\n\t\t\t\t\t\t<span class="btn-label">\r\n\t\t\t\t\t\t\t <i class="icon reneco-add "></i>\r\n\t\t\t\t\t\t</span>\r\n\t\t\t\t\t </button>\r\n\t\t\t\t</div>\r\n\r\n\t\t\t</div>\r\n\t\t\t<div class="clear"></div>\r\n\t\t\t<br>\r\n\t\t\t<div id="formsIdList" class="col-xs-12"></div>\r\n\r\n\t\t</div>\r\n\r\n\r\n\r\n\r\n\r\n\t\t<div class="arrow arrow-left" >\r\n\t\t\t<a id="proto_name-left"  class="glyphicon pointer glyphicon-chevron-left left"></a>\r\n\t\t</div> \r\n\t\t<div id="protosListContainer" class="swiper-container">\r\n\t\t\t<div class="swiper-wrapper" id="tabProtsUl" name="tabProtsUl">\r\n\t\t\t</div>\r\n\t\t</div>\r\n\t\t<div  class="arrow arrow-right" >\r\n\t\t\t<a id="proto_name-right" class="glyphicon pointer glyphicon-chevron-right right" ></a>\r\n\t\t</div>\r\n\t</div>\r\n\r\n\r\n\r\n\t<div class="clear"></div>\r\n\r\n\r\n\t<div class="tab-content" id="tabProtsContent">\r\n\t\t<div class="tab-pane active" id="formsContainer"></div>\r\n\t\t<div id="formButtons"></div>\r\n\t</div>\r\n\r\n\r\n\r\n\r\n\r\n\r\n\t\t</div>\r\n\t</div>\r\n\t<div class=\'masqued\'>\r\n\t\t<select id=\'usersList\'></select>\r\n\t</div>\r\n</div>\r\n';

}
return __p
};

this["JST"]["app/modules/input/templates/tpl-step4.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div></div>\t';

}
return __p
};

this["JST"]["app/ns_modules/ns_filter/tpl-filters.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '\t<div id="' +
((__t = ( filterName )) == null ? '' : __t) +
'" class="filter-row form-horizontal">\r\n\t\t<br>\r\n\t\t\t\t<span data-editors="Column" ></span>\r\n\t\t<span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;' +
((__t = ( filterName )) == null ? '' : __t) +
' :</span>\r\n\t\t<br>\r\n\t\t<span class="col-xs-4" data-editors="Operator"></span>\r\n\t\t<span class="col-xs-8" data-editors="Value"></span>\r\n\r\n\t\t<div class="clear"></div>\r\n\t</div>\r\n\t<div class="clear"></div>\r\n';

}
return __p
};

this["JST"]["app/ns_modules/ns_form/NsFormsModule.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class="btn-group" id="NsFormButton">\r\n  <button type="button" class="btn btn-success btn-lg" id="NsFormModuleSave">Save</button>\r\n  <button type="button" class="btn btn-success btn-lg" id="NsFormModuleEdit">Edit</button>\r\n  <button type="button" class="btn btn-default btn-lg" id="NsFormModuleClear">Clear</button>\r\n</div>\r\n';

}
return __p
};

this["JST"]["app/ns_modules/ns_grid/demo/tpl-demo.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<script type="text/template">\r\n<div class="container">\r\n\tDemo Grid\r\n\r\n\t<br><br>\r\n\t<div id="grid"></div>\r\n\t<div id="paginator"></div>\r\n\t<br><br>\r\n</div>\r\n</script>';

}
return __p
};

this["JST"]["app/ns_modules/ns_map/demo/tpl-demo.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<script type="text/template">\r\n\t<div id="rg_map" class="col-sm-6"></div>\r\n\t<div class="col-sm-6">\r\n\t\t<div id="rg_grid"></div>\r\n\t</div>\r\n</script>\r\n';

}
return __p
};

this["JST"]["app/ns_modules/ns_map/tpl-legend.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class="legend-ctrl">\r\n\t<i class="reneco reneco-info icon small"></i>\r\n\t<div class="legend-info">\r\n\t\t<span class="custom-marker pull-left"></span> &nbsp; <span class="caption"> Unselected</span>\r\n\t\t<br>\r\n\t\t<div class="clear"></div>\r\n\t\t<div class="custom-marker selected pull-left"></div> &nbsp;\r\n\t\t<span class="caption"> Selected</span>\r\n\t\t<div class="clear"></div>\r\n\t\t<br>\r\n\t\t<div class="marker-cluster marker-cluster-small pull-left"><span>0/6</span></div>&nbsp;<span class="caption"> Selected / Total</span> \r\n\t\t<div class="clear"></div>\r\n\t</div>\r\n</div>\r\n\r\n';

}
return __p
};

this["JST"]["app/ns_modules/ns_stepper/tpl-stepperOrchestrator.html"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '\r\n<div id="StepManager" class="StepManager fuelux ns-full-height">\r\n\r\n\t<div class="wizard" id="wizard">\r\n\t\t<ul id="step-nav" class="step-nav"></ul>\r\n\t\t<div class="clear"></div>\r\n\t\t<div class="step-content" id="step-content"></div>\r\n\t</div>\r\n\r\n\t<div class="actions" id="actions">\r\n\t\t<button class="btn btn-lg btn-prev btn-custom " id="btnPrev">\r\n\t\t<i class="icon small reneco reneco-leftarrow white action-picto"></i>\r\n\t\t<span class="ctrl">Prev</span>\r\n\t\t</button>\r\n\t\t<button class=" pull-right btn btn-lg btn-next btn-custom " id="btnNext" disabled>\r\n\t\t<span class="ctrl">Next</span>\r\n\t\t<i class="icon small reneco reneco-rightarrow white action-picto"></i>\r\n\t\t</button>\r\n\t</div>\r\n\r\n</div>\r\n';

}
return __p
};