define([
	'jquery',
	'underscore',
	'backbone',
	'marionette',
	'ns_stepper/lyt-newStepper',
	'./lyt-export-step1',
	'./lyt-export-step2',
	'./lyt-export-step3',
	'./lyt-export-step4',

], function($, _, Backbone, Marionette, NewStepper,
	Step1, Step2, Step3, Step4
) {

  'use strict';

  return NewStepper.extend({

    initSteps: function() {
      this.steps = [Step1, Step2, Step3, Step4];
    },

    //the action on the finished
    finished: function() {
<<<<<<< HEAD
      console.log('finished');
=======
      console.info('finished');
>>>>>>> c736a1259dfed9e43e5cf39f2f5799e74964caca
    },

  });
});
