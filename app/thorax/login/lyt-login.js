define([
    'jquery',
    'underscore',
    'backbone',
    'config',
    'marionette',
    'sha1',
    'collections/users',
    './tpl-login.ejs'
], function($, _, Backbone, config, Marionette, sha1, Users, tpl) {

    'use strict';

    return Marionette.LayoutView.extend({
        collection: new Backbone.Collection(),
        template: tpl,

        events: {
            'submit': 'login',
            'change #username': 'checkUsername',
            'focus input': 'clear'
        },

        // Cache Jquery selector.
        ui: {
            err: '#help-password',
            pwd: '#pwd-group'
        },

        initialize: function() {
            console.log('passed');
            /*
            var url = config.coreUrl + 'user';
            this.listenTo(this.collection, 'reset', this.render)
            $.ajax({
                context: this,
                url: url,
                dataType: 'json'
            }).done( function(data) {
                this.collection.reset(data);
            });*/
        },

        /*
        onRender: function() {
            $('#username').trigger('focus');
            $('body').addClass('login-page');

            jQuery.ajax({
                url: '//freegeoip.net/json/', 
                type: 'POST', 
                dataType: 'jsonp',
                success: function(location) {
                        $('body').addClass(location.country_code);
                }
            });
        },

        checkUsername: function() {
            var user = this.collection.findWhere({fullname: $('#username').val()});
            if (!user) {
                this.fail('#login-group', 'Invalid username');
            }

        },

        login: function(elt) {
            console.log('login');
            elt.preventDefault();
            elt.stopPropagation();
            var user = this.collection.findWhere({fullname: $('#username').val()});
            console.log(user);
            var url = config.coreUrl + 'security/login';
            if (user) {
                $.ajax({
                    context: this,
                    type: 'POST',
                    url: url,
                    data:{
                        user_id: user.get('PK_id'),
                        password: sha1.hash($('#password').val())
                    }
                }).done( function() {


                    $('.login-form').addClass('rotate3d');
                    
                    setTimeout(function() {
                        Radio.channel('route').trigger('login:success');
                    },500);
                    
                }).fail( function () {
                    this.fail('#pwd-group', 'Invalid password');
                    this.shake();
                });
            }   
            else {
                this.fail('#login-group', 'Invalid username');
                this.shake();
            }
        },

        onDestroy: function(){
            
            $('body').removeClass('login-page');
        },

        fail: function(elt, text) {
            $(elt).addClass('has-error');
            $(elt + ' .help-block').text(text);
        },

        clear: function(evt) {
            var group = $(evt.target).parent();
            group.removeClass('has-error');
            group.find(".help-block").text('');
        },

        shake: function(){
            $('.login-form').addClass('animated shake');
            setTimeout(function() {
                $('.login-form').removeClass('animated shake');
            },1000);
        }*/
    });
});

