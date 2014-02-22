var map;
function initializeMap() {
	var mapOptions = {
			zoom: 3,
			center: new google.maps.LatLng(59.930248,-142.03125),
			mapTypeControl: true,
		    mapTypeControlOptions: {
		      style: google.maps.MapTypeControlStyle.DROPDOWN_MENU
		    },
		    zoomControl: true,
		    zoomControlOptions: {
		      style: google.maps.ZoomControlStyle.SMALL
		    }
	};
	map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

	$('a[href="#geo"]').on('shown', function(e) {
		google.maps.event.trigger(map, 'resize');
	});
	$("#map_canvas").css("width", 400).css("height", 700);

}

google.maps.event.addDomListener(window, 'load', initializeMap);
