define([
], function() {

  'use strict';

  return {
    resetInput: function(input) {
      input.wrap('<form>').parent()[0].reset();
      input.unwrap();
    }
  };
});
