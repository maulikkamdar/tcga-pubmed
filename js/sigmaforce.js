var lookUpTable = [];
var tumorInfo = [];

var totalTumors = 0;
var extractedNodes = [], extractedLinks = [], meshTerms = [];
var nodeLocator = [], linkLocator = [], clusterLocator = [], meshTermLocator = [];
var pubmedGraphCounter = 0;

var popUp;

$.ajax({
	url: "data/tcgaCancerGraphs.json",
    aync: true,
    success: function (json) {
    	tumorInfo = json;
    	totalTumors = tumorInfo.length;
    	for(i in json){
    		lookUpTable[json[i].id] = json[i]; 
    	}
    }, 
    dataType: "json"
});

$.ajax({
	url: "makeRequest.php?dataset=pubmed",
    aync: true,
    success: function (json) {
    	var dataParts = json.split('<body>');
    	var data = JSON.parse(dataParts[dataParts.length-1].split('</body>')[0]);
    	buildGraph(data);
    }, 
    dataType: "text"
});

$.ajax({
	url: "makeRequest.php?dataset=pubmedMeshTerms",
	aync: true,
	success: function (json) {
		var dataParts = json.split('<body>');
	    var data = JSON.parse(dataParts[dataParts.length-1].split('</body>')[0]);
	    var meshInterval = setInterval(function(){
	    	if(pubmedGraphCounter){
	    		buildMeshGraph(data);
	    		clearInterval(meshInterval);
	    	}
	    }, 1000);
	}, 
	dataType: "text"
});

function buildGraph(data) {
	var count = 0;
	var linkCount = 0;
	
	for (i in data.results.bindings) {
		var binding = data.results.bindings[i];
		
		var tumorIdentifierParts = binding["o"].value.split(/[:#\/]/);
		var tumorId = tumorIdentifierParts[tumorIdentifierParts.length-1];
		var tumorUri = binding["o"].value;
		var tumorName = lookUpTable[tumorId].name;
		
		var pubmedIdentifierParts = binding["s"].value.split(/[:#\/]/);
		var pubmedId = pubmedIdentifierParts[pubmedIdentifierParts.length-1];
		var pubmedUri = binding["s"].value;
		
		if(nodeLocator[tumorName] == null) {
			var newTumor = {"id": count, "type": "tumor", "name" : tumorName, "cluster":tumorId, "label": tumorName, "description": tumorName, "size": 100, "url": tumorUri, "children": []};
			nodeLocator[tumorName] = count++;
			extractedNodes.push(newTumor);
		} else {
			var newTumor = extractedNodes[nodeLocator[tumorName]];
		}
		if(nodeLocator[pubmedId] == null) {
			var newPage = {"id": count, "type": "publication", "name": "", "cluster":tumorId, "description": binding["title"].value, "size": 16, "url": pubmedUri, "children": [], "meshTerms": [], "label": pubmedId};
			nodeLocator[pubmedId] = count++;
			extractedNodes.push(newPage);
		} else {
			var newPage = extractedNodes[nodeLocator[pubmedId]];
		}
		if(linkLocator[tumorId + "-" + pubmedId] == null) {
			var newLink = {"id": linkCount, "source": newTumor.id, "target": newPage.id, "value": 8, "color": "aaa", "opacity": "0.4"};
			extractedLinks.push(newLink);
			newTumor.children.push(pubmedId);
			newPage.children.push(tumorId);
			newTumor.size = newTumor.size + 5;
			newPage.size = newPage.size*2;
			linkLocator[tumorId + "-" + pubmedId] = linkCount++;
		}
		
	}
	pubmedGraphCounter = 1;
	initVisualization(extractedNodes, extractedLinks);
}

function initVisualization(transformedNodes, transformedLinks) {
  // Instanciate sigma.js and customize it :
//	console.log(transformedNodes);
//	console.log(transformedLinks);
	var sigInst = sigma.init(document.getElementById('sigmaViz')).drawingProperties({
		"borderSize": 1,//Something other than 0
        "nodeBorderColor": "default",//exactly like this
        "defaultNodeBorderColor": "#000",//Any color of your choice
        "defaultBorderView": "always",//apply the default color to all nodes always (normal+hover)
		"defaultEdgeType": 'curve',
		"labelThreshold": 9,
	//	"minEdgeSize": 5,
		"defaultLabelColor": '#000'		
	});
 
	var i, N = transformedNodes.length, E = transformedLinks.length, C = totalTumors, d = 0.5, clusters = [];
	for(i = 0; i < C; i++){
		clusters.push({
			'id': tumorInfo[i].id,
			'nodes': [],
			'color': 'rgb('+tumorInfo[i].color+')'
		});
		clusterLocator[tumorInfo[i].id] = i;
	}
 
	clusters.push({
		'id': "meshCat",
		'nodes': [],
		'color': 'rgb(135,206,235)'
	});
	clusterLocator["meshCat"] = C;
	
	if(storage.getItem('pubmedId') != null && storage.getItem('pubmedId') != '') {
		var entity = storage.getItem('pubmedId');
		storage.removeItem('pubmedId');
	} else {
		var entity = 0;
	}
	
	for(i = 0; i < N; i++){
		var size = (Math.sqrt(transformedNodes[i].size))*3/4;
		var cluster = clusters[clusterLocator[transformedNodes[i].cluster]];
		if(entity > 0 && transformedNodes[i].label == entity)
			size = 20;
		sigInst.addNode(transformedNodes[i].id,{
			'x': Math.random(),
			'y': Math.random(),
			'size': size,
			'color': cluster['color'],
			'cluster': cluster['id'],
			'label': transformedNodes[i].label,
			'attributes': transformedNodes[i].description
		});
		cluster.nodes.push(transformedNodes[i].id);
	}
 
	for(i = 0; i < E; i++){
		sigInst.addEdge(transformedLinks[i].id, transformedLinks[i].source, transformedLinks[i].target);
	}
 
  // Start the ForceAtlas2 algorithm
  // (requires "sigma.forceatlas2.js" to be included)
	sigInst.startForceAtlas2();
 
	setTimeout(function(){
		sigInst.stopForceAtlas2();
		sigInst
		.bind('overnodes',function(event){
			var nodes = event.content;
			var node;
		    var neighbors = {};
		    sigInst.iterEdges(function(e){
		    	if(nodes.indexOf(e.source)>=0 || nodes.indexOf(e.target)>=0){
		    		neighbors[e.source] = 1;
		    		neighbors[e.target] = 1;
		    	}
		    }).iterNodes(function(n){
		    	node = n;
		    	if(!neighbors[n.id]){
		    		n.hidden = 1;
		    	}else{
		    		n.hidden = 0;
		    	}
		    }).draw(2,2,2);
		  //  showPopup(node);
		})
		.bind('outnodes',function(){
			sigInst.iterEdges(function(e){
				e.hidden = 0;
		    }).iterNodes(function(n){
		    	n.hidden = 0;
		    }).draw(2,2,2);
		//	hidePopup();
		})
		.bind('downnodes',function(event){
			var node;
			sigInst.iterNodes(function(n){
				node = n;
			},[event.content[0]]);
			clearCanvas();
			click(node["label"]);
		});
	},5000);
 
}

function showPopup(node){
	console.log(node['attributes']);
	popUp && popUp.remove();
	popUp = $('').append(node['attributes']).css({
	        'display': 'inline-block',
	        'border-radius': 3,
	        'padding': 5,
	        'background': '#fff',
	        'color': '#000',
	        'box-shadow': '0 0 4px #666',
	        'position': 'absolute',
	        'left': node.displayX,
	        'top': node.displayY+15
	      });
	console.log(popUp);
	 $('#sigmaViz').append(popUp);
}

function hidePopup(){
	popUp && popUp.remove();
	popUp = false;
}

function updateInterface(entityId){
	clearCanvas();
	click(entityId);
}

function updateTable(jsonTable, selector) {
	$(selector).append("<table id='extraDetailTable'></table>");
	for(i in jsonTable){
		d = jsonTable[i];
		$("#extraDetailTable").append('<tr class="detailRows"><th>'+d.name+'</th><td>'+d.content+'</td></tr>');
	}	
}

function reduceGraph(pubmedId){
	var reducedGraphNodes = [], reducedGraphLinks = [];
	var reducedGraphNodeLocator = [], reducedGraphLinkLocator = [];
	var count = 0, linkCount = 0;
	
	var pubmedNode = extractedNodes[nodeLocator[pubmedId]];
	reducedGraphNodes.push(pubmedNode);
	reducedGraphNodeLocator[pubmedId] = count++;
	
	for(i in pubmedNode.meshTerms){
		var meshTerm = pubmedNode.meshTerms[i];
		var meshSourceNo = meshTermLocator[meshTerm];
		var meshNode = {"id": meshSourceNo, "label": meshTerm, "type": "meshTerm", "size": 200, "cluster": "meshCat"};
		reducedGraphNodes.push(meshNode);
		
		var meshLink = {"id": "l"+linkCount++, "source": meshSourceNo, "target": pubmedNode.id};
		reducedGraphLinks.push(meshLink);
		//console.log(meshNode);
		
		for(j in meshTerms[meshSourceNo.substring(1,meshSourceNo.length)].pubmedIdsLinked){
			var linkedPubmedId = meshTerms[meshSourceNo.substring(1,meshSourceNo.length)].pubmedIdsLinked[j];
			
			if(reducedGraphNodeLocator[linkedPubmedId] == null){
				reducedGraphNodes.push(extractedNodes[nodeLocator[linkedPubmedId]]);
				reducedGraphNodeLocator[linkedPubmedId] = count++;
				var meshLink = {"id": "l"+linkCount++, "source": meshSourceNo, "target": extractedNodes[nodeLocator[linkedPubmedId]].id};
				reducedGraphLinks.push(meshLink);
			} else {
				var meshLink = {"id": "l"+linkCount++, "source": meshSourceNo, "target": extractedNodes[nodeLocator[linkedPubmedId]].id};
				reducedGraphLinks.push(meshLink);
			}
		}
	}
	initVisualization(reducedGraphNodes, reducedGraphLinks);
}

function meshReduce(meshText){
	clearCanvas();
	var meshTerm = meshTerms[parseInt(nodeLocator[meshText].substring(1,nodeLocator[meshText].length))];
	var reducedGraphNodes = [], reducedGraphLinks = [];
	var reducedGraphNodeLocator = [], reducedGraphLinkLocator = [];
	var count = 0, linkCount = 0;
	
	var meshSourceNo = meshTerm.id;
	var meshNode = {"id": meshSourceNo, "label": meshTerm.description, "type": "meshTerm", "size": 200, "cluster": "meshCat"};
	reducedGraphNodes.push(meshNode);
	
	for(j in meshTerm.pubmedIdsLinked){
		var linkedPubmedId = meshTerm.pubmedIdsLinked[j];
		
		if(reducedGraphNodeLocator[linkedPubmedId] == null){
			reducedGraphNodes.push(extractedNodes[nodeLocator[linkedPubmedId]]);
			reducedGraphNodeLocator[linkedPubmedId] = count++;
			var meshLink = {"id": "l"+linkCount++, "source": meshSourceNo, "target": extractedNodes[nodeLocator[linkedPubmedId]].id};
			reducedGraphLinks.push(meshLink);
		} else {
			var meshLink = {"id": "l"+linkCount++, "source": meshSourceNo, "target": extractedNodes[nodeLocator[linkedPubmedId]].id};
			reducedGraphLinks.push(meshLink);
		}
	}
	initVisualization(reducedGraphNodes, reducedGraphLinks);
}

function tumorReduce(tumorId){
	var tumorNode = extractedNodes[nodeLocator[tumorId]];
	var reducedGraphNodes = [], reducedGraphLinks = [];
	var reducedGraphNodeLocator = [], reducedGraphLinkLocator = [];
	var count = 0, linkCount = 0;
	reducedGraphNodes.push(tumorNode);
	var sourceNo = nodeLocator[tumorId];
	
	for(i in tumorNode.children){
		var linkedPubmedId = tumorNode.children[i];
		if(reducedGraphNodeLocator[linkedPubmedId] == null){
			reducedGraphNodes.push(extractedNodes[nodeLocator[linkedPubmedId]]);
			reducedGraphNodeLocator[linkedPubmedId] = count++;
			var tumorLink = {"id": "l"+linkCount++, "source": sourceNo, "target": extractedNodes[nodeLocator[linkedPubmedId]].id};
			reducedGraphLinks.push(tumorLink);
		} else {
			var tumorLink = {"id": "l"+linkCount++, "source": sourceNo, "target": extractedNodes[nodeLocator[linkedPubmedId]].id};
			reducedGraphLinks.push(tumorLink);
		}
	}
	initVisualization(reducedGraphNodes, reducedGraphLinks);
	
}

function click(pubmedId) {
	var pos = nodeLocator[pubmedId];
	var d = (pos.toString().substring(0,1) != "m") ? extractedNodes[pos] : meshTerms[parseInt(pos.substring(1,pos.length))];	
	var selector = "#extraDetailPanel";
	$(selector).html("<h4 align='center'>" + d.description + "</h4>");
	var jsonTable = [];  
	if(d.type == "publication") {
		 // var convertedJSON = subUpdate(d.url);
		storage.setItem("pubmedId", pubmedId);
		var jsonStr = "";
		for (i in d.meshTerms) {
			if(i == 0)
				jsonStr += "<a href='javascript:meshReduce(\"" + d.meshTerms[i] + "\")'>" + d.meshTerms[i] + "</a>";
			else
				jsonStr += ", " + "<a href='javascript:meshReduce(\"" + d.meshTerms[i] + "\")'>" + d.meshTerms[i] + "</a>";
		}
		var jsonRow = {"name" : "Mesh Terms", "content" : jsonStr};
		jsonTable.push(jsonRow);		
		reduceGraph(pubmedId);
		
		$.ajax({
			url: "makeRequest.php?dataset=pubmedResource&resource="+d.url,
			aync: true,
			success: function (json) {
				var dataParts = json.split('<body>');
			    var data = JSON.parse(dataParts[dataParts.length-1].split('</body>')[0]);
			    buildPubmedTableGraph(data, jsonTable, d, selector);
			}, 
			dataType: "text"
		});
		
	  } else if (d.type == "tumor") {
		  
		  var urlParts = d.url.split(/[:#\/]/);
		  var tumor = urlParts[urlParts.length-1];
		  methylationData = [];
		  
		  tumorReduce(pubmedId);
		  
		  $.ajax({
				url: "makeRequest.php?dataset=patientList&graph="+tumor+"&endpoint="+lookUpTable[tumor].methNode,
				aync: true,
				success: function (json) {
					var dataParts = json.split('<body>');
				    var data = JSON.parse(dataParts[dataParts.length-1].split('</body>')[0]);
				    buildPatientList(tumor, data);
				}, 
				dataType: "text"
		  });
	  } else {
		  meshReduce(pubmedId);
	  }
}

function buildPubmedTableGraph(data, jsonTable, d, selector){
	var authorStr = "", chemicalStr = "", journalStr = "", abstractStr = "";
	for (i in data.results.bindings) {
		var binding = data.results.bindings[i];
		var predicateParts = binding["p"].value.split(/[:#\/]/);
		var predicate = predicateParts[predicateParts.length-1];
		
		if(predicate == "Author")
			authorStr += binding["o"].value + ", ";
		else if(predicate == "Chemical")
			chemicalStr += binding["o"].value + ", ";
		else if(predicate == "Abstract")
			abstractStr = binding["o"].value;
		else if(predicate == "Affiliation")
			affiliationStr = binding["o"].value;
		else if(predicate == "Journal")
			journalStr = binding["o"].value;
	}
	var jsonRow = {"name" : "Authors", "content" : authorStr};
	jsonTable.push(jsonRow);
	var jsonRow = {"name" : "Affiliation", "content" : affiliationStr};
	jsonTable.push(jsonRow);
	var jsonRow = {"name" : "Journal", "content" : journalStr};
	jsonTable.push(jsonRow);
	var jsonRow = {"name" : "Abstract", "content" : abstractStr};
	jsonTable.push(jsonRow);
	var jsonRow = {"name" : "Chemicals", "content" : chemicalStr};
	jsonTable.push(jsonRow);
	
	var urlParts = d.url.split(/[:#\/]/);
	var actualUrl = "http://www.ncbi.nlm.nih.gov/pubmed/"+ urlParts[urlParts.length-1];
	var jsonRow = {"name" : "Source", "content": "<a href='"+actualUrl+"' target='_blank'>"+actualUrl+"</a>"}
	jsonTable.push(jsonRow);

//	goToByScroll("extraDetailPanel");
	updateTable(jsonTable,selector);
//	updateVis(convertedJSON);
}

function buildMeshGraph(data) {
	var meshTermCount = 0;
	for (i in data.results.bindings) {
		var binding = data.results.bindings[i];
		var pubmedIdentifierParts = binding["s"].value.split(/[:#\/]/);
		var pubmedId = pubmedIdentifierParts[pubmedIdentifierParts.length-1];
		var meshTerm = binding["name"].value;
		extractedNodes[nodeLocator[pubmedId]].meshTerms.push(meshTerm);
		
		if(meshTermLocator[meshTerm] == null) {
			var meshTermNode = {"id": "m" + meshTermCount, "description": meshTerm, "pubmedIdsLinked": []};
			meshTermNode.pubmedIdsLinked.push(pubmedId);
			nodeLocator[meshTerm] = "m" + meshTermCount;
			meshTermLocator[meshTerm] = "m" + meshTermCount++;
			meshTerms.push(meshTermNode);
		} else {
			meshTerms[meshTermLocator[meshTerm].substring(1,meshTermLocator[meshTerm].length)].pubmedIdsLinked.push(pubmedId);
		}
	}
//	console.log(meshTerms);
}

function allUpdate(){
	clearCanvas();
	initVisualization(extractedNodes, extractedLinks);
}

function clearCanvas(){
	$('#sigmaViz').remove();
	$("#sigmaViz-parent").append('<div id="sigmaViz" class="sigmaViz"></div>');
	$('#sigmaViz').html('');
}
//init();