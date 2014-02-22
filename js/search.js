var requestTerm = "";

$.widget( "custom.catcomplete", jQuery.ui.autocomplete, {
	_renderMenu: function( ul, items ) {
		var that = this,
        currentCategory = "";
		jQuery.each( items, function( index, item ) {
			if ( item.category != currentCategory ) {
				ul.append( "<li class='ui-autocomplete-category'>" + item.category + "</li>" );
				currentCategory = item.category;
			}
			that._renderItem( ul, item );
		});
	},
	_renderItem: function( ul, item ) {
		//var itemStyle = ((item.category === "") ? ("<b>" + item.label + "</b>") : (item.label));
		var renderedString = updateHaystack(item.label, requestTerm);
	    return jQuery( "<li>" )
	      .append( "<a>" + renderedString + "</a>" )
	      .data("item.autocomplete", item)
	      .appendTo( ul );
	}
});

function updateHaystack(input, needle) {
    return input.replace(new RegExp('(^|)(' + needle + ')(|$)','ig'), '$1<b>$2</b>$3');
}

function initSearchMenu(autoCompleteMenu) {
	jQuery( "#autoComSearchBox" ).catcomplete({
		source: function( request, response ) {
			requestTerm = request.term;
			jQuery.ajax({
				url: "https://maulikkamdar.cloudant.com/linkedtcga/_design/alltitles/_search/titleSearch?stale=ok&limit=15&q=title:" +request.term + "*",
				dataType: "jsonp",
				success: function( data ) {
				//	data.rows = unique(data.rows);
					data.rows.sort(function(a, b) {
						return a.fields.entity.localeCompare(b.fields.entity);
					});
					
					response( jQuery.map( data.rows, function( item ) {
						var categoryTerms = item.fields.entity.split(/[:#\/]/);
						return {
							label: item.fields.title,
							category: categoryTerms[categoryTerms.length-1],
							value: item.fields.title,
							entity: item.fields.entityId
						}
					}));
				},
				error: function( error ) {
					var data = {};
					data.rows = [];
					
					response( jQuery.map( data.rows, function( item ) {
						var categoryTerms = item.value.entity.split(/[:#\/]/);
						return {
							label: item.key,
							category: categoryTerms[categoryTerms.length-1],
							value: item.key,
							entity: item.value.entityId
						}
					}));
				}
			});
	    },
	    minLength: 2,
	    select: function( event, ui ) {
	    	if(ui.item.category == "MeshTerm") {
	    		click(ui.item.label);
	    	} else {
	    		var entityTerms = ui.item.entity.split(/[:#\/]/);
		    	updateInterface(entityTerms[entityTerms.length-1]);
	    	}
	    },
	  	open: function() {
	   		jQuery( this ).removeClass( "ui-corner-all" ).addClass( "ui-corner-top" );
	  	},
	   	close: function() {
	   		jQuery( this ).removeClass( "ui-corner-top" ).addClass( "ui-corner-all" );
	   	}
	 });
}

initSearchMenu();