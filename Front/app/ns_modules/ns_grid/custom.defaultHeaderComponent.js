
define([
  'i18n'
], function() {
  'use strict';

  function DefaultHeaderComponent() {

  };
  DefaultHeaderComponent.prototype.init = function (agParams){
    //console.log(agParams);
    this.agParams = agParams;
    this.eGui = document.createElement('div');
    this.eGui.innerHTML = ''+
        '<div class="customHeaderMenuButton"><span class="reneco ' + this.agParams.menuIcon + '"></span></div>' +
        '<div class="customHeaderLabel">' + this.agParams.displayName + '</div>' +
        '<div class="customSortDownLabel inactive"><span class="reneco reneco-chevron_top"></span></div>' +
        '<div class="customSortUpLabel inactive"><span class="reneco reneco-chevron_bottom"></span></div>' +
        '<div class="customSortRemoveLabel inactive"><span class="reneco reneco-close"></span></div>';

    this.eMenuButton = this.eGui.querySelector(".customHeaderMenuButton");
    this.eSortDownButton = this.eGui.querySelector(".customSortDownLabel");
    this.eSortUpButton = this.eGui.querySelector(".customSortUpLabel");
    this.eSortRemoveButton = this.eGui.querySelector(".customSortRemoveLabel");
    this.eHeaderLabel = this.eGui.querySelector(".customHeaderLabel");


    if (this.agParams.enableMenu){
        this.onMenuClickListener = this.onMenuClick.bind(this);
        this.eMenuButton.addEventListener('click', this.onMenuClickListener);
    }else{
        this.eGui.removeChild(this.eMenuButton);
    }

    if (this.agParams.enableSorting){
        this.onSortAscRequestedListener = this.onSortRequested.bind(this, 'asc');
        this.eSortDownButton.addEventListener('click', this.onSortAscRequestedListener);
        this.onSortDescRequestedListener = this.onSortRequested.bind(this, 'desc');
        this.eSortUpButton.addEventListener('click', this.onSortDescRequestedListener);
        this.onRemoveSortListener = this.onSortRequested.bind(this, '');
        this.eSortRemoveButton.addEventListener('click', this.onRemoveSortListener);

        //this.eHeaderLabel.addEventListener('click',this.)


        this.onSortChangedListener = this.onSortChanged.bind(this);
        this.agParams.column.addEventListener('sortChanged', this.onSortChangedListener);
        this.onSortChanged();
    } else {
        this.eGui.removeChild(this.eSortDownButton);
        this.eGui.removeChild(this.eSortUpButton);
        this.eGui.removeChild(this.eSortRemoveButton);
    }
  };

  DefaultHeaderComponent.prototype.onSortChanged = function (){
      function deactivate (toDeactivateItems){
          toDeactivateItems.forEach(function (toDeactivate){toDeactivate.className = toDeactivate.className.split(' ')[0]});
      }

      function activate (toActivate){
          toActivate.className = toActivate.className + " active";
      }

      if (this.agParams.column.isSortAscending()){
          deactivate([this.eSortUpButton, this.eSortRemoveButton]);
          activate (this.eSortDownButton)
      } else if (this.agParams.column.isSortDescending()){
          deactivate([this.eSortDownButton, this.eSortRemoveButton]);
          activate (this.eSortUpButton)
      } else {
          deactivate([this.eSortUpButton, this.eSortDownButton]);
          activate (this.eSortRemoveButton)
      }
  };

  DefaultHeaderComponent.prototype.getGui = function (){
      return this.eGui;
  };

  DefaultHeaderComponent.prototype.onMenuClick = function () {
      this.agParams.showColumnMenu (this.eMenuButton);
  };

  DefaultHeaderComponent.prototype.onSortRequested = function (order, event) {
      this.agParams.setSort (order, event.shiftKey);
  };

  DefaultHeaderComponent.prototype.destroy = function () {
      if (this.onMenuClickListener){
          this.eMenuButton.removeEventListener('click', this.onMenuClickListener)
      }
      this.eSortDownButton.removeEventListener('click', this.onSortRequestedListener);
      this.eSortUpButton.removeEventListener('click', this.onSortRequestedListener);
      this.eSortRemoveButton.removeEventListener('click', this.onSortRequestedListener);
      this.agParams.column.removeEventListener('sortChanged', this.onSortChangedListener);
  };

  return DefaultHeaderComponent;
});
