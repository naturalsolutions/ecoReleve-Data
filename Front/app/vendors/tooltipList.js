(function ( $ ) {

    $.fn.tooltipList = function(options) {

        //  -----------------------------------------------
        //  Settings
        //
        this.settings = $.extend({
            //  Default position : top
            position : 'top',
            //  Default animation : fade
            animation: 'fade',
            //  By default when we click out of tooltip, it close itself automaticly
            autoClose: true,
            //  Allow to add a class to the tooltipster element
            tooltipClass : 'tooltipList',
            //  We create a default option with negative value
            availableOptions : [{
                label   : 'default option',
                val     : -1
            }],

            //  Callbacks

            //  We set an useless default li click event callback
            liClickEvent : function(liValue, origin, tooltip) {
                console.log ("Li clicked, value : ", liValue);
            }
        }, options);

        //  -----------------------------------------------
        //  Bind li click event and run specified callback
        //
        this.bindLiClick = function() {
            this.tooltip.find('li').bind('click', $.proxy(function(e) {
                //  Run specified callback
                this.settings.liClickEvent($(e.target).data('value'), this.origin, this.tooltip);
            }, this));
        };

        //  -----------------------------------------------
        //  Update List function when input value changed
        //
        this.updateLiList = function(inputValue, origin, tooltip) {
            //  When input text value change (we used keyup because we change the list in real time)
            //  We change list options

            //  First we clear the last list
            tooltip.find('ul').html('');

            $.map(this.settings.availableOptions, $.proxy(function(val, index) {
                if (val.label.indexOf( inputValue ) >= 0) {
                    //  Append element on the list
                    tooltip.find('ul').append('<li data-value="' + val.val + '" >' + val.label + '</li>');
                }
            }, this));

            this.bindLiClick();
        };

        //  -----------------------------------------------
        //  Tooltip HYML element
        //
        this.tooltipHTMLContent = $.proxy(function() {
            var html = '';

            $.map(this.settings.availableOptions, $.proxy(function(val, index) {
                html += '<li data-value="' + val.val + '" >' + val.label + '</li>';
            }, this));

            return $('\
                <div class="">\
                    <input type="text" />\
                    <i class="reneco search"></i>\
                    <br /> \
                    <ul>' +  html + '</ul>\
                </div>\
            ')
        }, this);

        //  -----------------------------------------------
        //  Create tooltip with tooltipster library
        //
        $(this).tooltipster({
            //  Plugin HTML content
            content: this.tooltipHTMLContent ,
            //  animation
            animation : this.settings.animation,
            //  position
            position : this.settings.position,
            //  autoclose options
            autoClose : this.settings.autoClose,
            //  Allow HTML content
            contentAsHTML: true,
            //  Allow interative tooltip (for search functionnality)
            interactive: true,
            //  Add class
            theme: 'tooltipster-default ' + this.settings.tooltipClass,

            //  Callbacks

            functionReady : $.proxy(function(origin, tooltip) {

                this.origin     = origin;
                this.tooltip    = tooltip;

                $(tooltip).find('input').bind('keyup', $.proxy(function(e) {
                    this.updateLiList( $(e.target).val(), origin, tooltip );
                }, this));

                this.updateLiList("", origin, tooltip);
            }, this),

            functionAfter: function (origin, tooltip) {
                // When the mouse move out of the tooltip we destroy otherwise the tooltip is trigger when we hover the button
                $(origin).tooltipster('destroy');
            }

        });

        //  Show tooltipster
        $(this).tooltipster('show');
    };

}( jQuery ));
