function showDiv(divId){
	$('.helpDivs').hide();
	$('#'+divId).show();
	goToByScroll(divId);
}

function goToByScroll(id){
  jQuery('html,body').animate({
      scrollTop: jQuery("#"+id).offset().top},
      'slow');
}
