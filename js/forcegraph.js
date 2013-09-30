var lookUpTable = [];
lookUpTable["laml"] = "Acute Myeloid Leukemia";
lookUpTable["blca"] = "Bladder Urothelial Carcinoma";
lookUpTable["cesc"] = "Cervical squamous cell carcinoma and endocervical adenocarcinoma";
lookUpTable["kirp"] = "Kidney renal papillary cell carcinoma";
lookUpTable["hnsc"] = "Head and Neck squamous cell carcinoma ";

lookUpTable["lgg"] = "Brain Lower Grade Glioma";
lookUpTable["prad"] = "Prostate adenocarcinoma";
lookUpTable["lusc"] = "Lung squamous cell carcinoma";
lookUpTable["skcm"] = "Skin Cutaneous Melanoma";

var extractedNodes = [], extractedLinks = [], meshTerms = [];
var nodeLocator = [], linkLocator = [];
var methylationData = [];

String.prototype.width = function(font) {
	  var f = font || '13px sans-serif',
	      o = jQuery('<div>' + this + '</div>')
	            .css({'position': 'absolute', 'float': 'left', 'white-space': 'nowrap', 'visibility': 'hidden', 'font': f})
	            .appendTo(jQuery('body')),
	      w = o.width();

	  o.remove();

	  return w;
}

var width = 850,
    height = 800,
    root, extractedJSON;

var ticks = 0;
var force = d3.layout.force()
    .linkDistance(100)
   // .charge(-120)
    .size([width, height])
   // .on("tick", tick);

var vis = d3.select("#graph").append("svg:svg")
    .attr("width", width)
    .attr("height", height)
    .attr("pointer-events", "all")
    .append('svg:g')
    .call(d3.behavior.zoom().on("zoom", redraw))
    .append('svg:g');

/*var refresh = vis.append("svg:image")
	.attr("xlink:href", "img/refresh.png")
	.attr("x", "20")
	.attr("y", "20")
	.attr("width", "40")
	.attr("height", "40");
	*/
var link = vis.selectAll(".link"),
	node = vis.selectAll(".node");

d3.text("makeRequest.php?dataset=pubmed", function(error,json) {
	var dataParts = json.split('<body>');
	var data = JSON.parse(dataParts[dataParts.length-1].split('</body>')[0]);

	var count = 0;
	var linkCount = 0;
	
	for (i in data.results.bindings) {
		var binding = data.results.bindings[i];
		
		var tumorIdentifierParts = binding["o"].value.split(/[:#\/]/);
		var tumorId = tumorIdentifierParts[tumorIdentifierParts.length-1];
		var tumorUri = binding["o"].value;
		
		var pubmedIdentifierParts = binding["s"].value.split(/[:#\/]/);
		var pubmedId = pubmedIdentifierParts[pubmedIdentifierParts.length-1];
		var pubmedUri = binding["s"].value;
		
		if(nodeLocator[tumorId] == null) {
			var newTumor = {"id": count, "type": "tumor", "name" : lookUpTable[tumorId], "description": lookUpTable[tumorId], "size": 100, "url": tumorUri, "children": []};
			nodeLocator[tumorId] = count++;
			extractedNodes.push(newTumor);
		} else {
			var newTumor = extractedNodes[nodeLocator[tumorId]];
		}
		if(nodeLocator[pubmedId] == null) {
			var newPage = {"id": count, "type": "publication", "name": "", "description": binding["title"].value, "size": 16, "url": pubmedUri, "children": [], "meshTerms": []};
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
	
	var convertedJSON = {"nodes": extractedNodes, "links" : extractedLinks};
	root = convertedJSON;
	extractedJSON = convertedJSON;
	//update();
	//getAssocAuthors();
	getAssocMeshTerms();
});

function getAssocAuthors() {
	d3.text("makeRequest.php?dataset=pubmedAuthors", function(error,json) {
		var dataParts = json.split('<body>');
		var data = JSON.parse(dataParts[dataParts.length-1].split('</body>')[0]);
		for (i in data.results.bindings) {
			var binding = data.results.bindings[i];
			var pubmedIdentifierParts = binding["s"].value.split(/[:#\/]/);
			var pubmedId = pubmedIdentifierParts[pubmedIdentifierParts.length-1];
			extractedNodes[nodeLocator[pubmedId]].name = binding["author"].value;
		}
		
		var convertedJSON = {"nodes": extractedNodes, "links" : extractedLinks};
		root = convertedJSON;
		update();
	});
}

function getAssocMeshTerms() {
	d3.text("makeRequest.php?dataset=pubmedMeshTerms", function(error,json) {
		var dataParts = json.split('<body>');
		var data = JSON.parse(dataParts[dataParts.length-1].split('</body>')[0]);
		var linkCount = extractedLinks.length;
		var thresholdLinkLocator = [];
		console.log(linkCount);
		var meshCount = extractedNodes.length;
		for (i in data.results.bindings) {
			var binding = data.results.bindings[i];
			var pubmedIdentifierParts = binding["s"].value.split(/[:#\/]/);
			var pubmedId = pubmedIdentifierParts[pubmedIdentifierParts.length-1];
			var meshTerm = binding["name"].value;
			extractedNodes[nodeLocator[pubmedId]].meshTerms.push(meshTerm);
			if(meshTerms[meshTerm] == null) {
				meshTerms[meshTerm] = [];
				meshTerms[meshTerm].push(pubmedId);
				
				var newTerm = {"id": meshCount, "type": "meshTerm", "name": meshTerm, "description": meshTerm, "size": 16, "url": "http://tcga.deri.ie/graph/"+meshTerm, "children": []};
				nodeLocator[meshTerm] = meshCount++;
				extractedNodes.push(newTerm);
				
				var source = extractedNodes[nodeLocator[pubmedId]];
				var target = extractedNodes[nodeLocator[meshTerm]];
				var newLink = {"id": linkCount, "source": source.id, "target": target.id, "value": 1, "color": "#9ecae1", "type": "meshLink"};
				extractedLinks.push(newLink);
				linkLocator[source.id + "-" + target.id] = linkCount++;
			} else {
				var source = extractedNodes[nodeLocator[pubmedId]];
				var target = extractedNodes[nodeLocator[meshTerm]];
				var newLink = {"id": linkCount, "source": source.id, "target": target.id, "value": 1, "color": "#9ecae1", "type": "meshLink"};
				extractedLinks.push(newLink);
				linkLocator[source.id + "-" + target.id] = linkCount++;
			/*	for(ids in meshTerms[meshTerm]) {
					if(pubmedId < meshTerms[meshTerm][ids]) {
						var source = extractedNodes[nodeLocator[pubmedId]];
						var target = extractedNodes[nodeLocator[meshTerms[meshTerm][ids]]];
					} else {
						var target = extractedNodes[nodeLocator[pubmedId]];
						var source = extractedNodes[nodeLocator[meshTerms[meshTerm][ids]]];
					}
					if(linkLocator[source.id + "-" + target.id] == null && thresholdLinkLocator[source.id + "-" + target.id] == null) {
						thresholdLinkLocator[source.id + "-" + target.id] = 1;
					} else if (thresholdLinkLocator[source.id + "-" + target.id] < 7) {
						thresholdLinkLocator[source.id + "-" + target.id]++;
					} else if (thresholdLinkLocator[source.id + "-" + target.id] == 7) {
						var newLink = {"id": linkCount, "source": source.id, "target": target.id, "value": 1, "color": "#9ecae1"};
						extractedLinks.push(newLink);
						linkLocator[source.id + "-" + target.id] = linkCount++;
						thresholdLinkLocator[source.id + "-" + target.id]++;
					} else {
						extractedLinks[linkLocator[source.id + "-" + target.id]].value++;
					}
				}*/
				meshTerms[meshTerm].push(pubmedId);
			}
		}
		var convertedJSON = {"nodes": extractedNodes, "links" : extractedLinks};
		console.log(extractedLinks);
		console.log(meshTerms);
		root = convertedJSON;
		update();
	});
}

function redraw() {
	  vis.attr("transform",
	      "translate(" + d3.event.translate + ")"
	      + " scale(" + d3.event.scale + ")");
}

function update() {
	var nodes = root.nodes,
    links = root.links;

	// Restart the force layout.
	force
	    .nodes(nodes)
	    .links(links)
	    .start();
	
	// Update links.
	link = link.data(links, function(d) { return d.target.id; });
	
	link.exit().remove();
	
	link.enter().insert("line", ".node")
	    .filter(function(d){return (d.type != "meshLink")})
		.attr("class", "link")
	    .style("stroke-width", function(d) { return Math.sqrt(d.value); })
	    .style("stroke", function(d) { return d.color; })
		.style("stroke-opacity", function(d) { return d.opacity; });
	
	// Update nodes.
	node = node.data(nodes, function(d) { return d.id; });
	
	node.exit().remove();
	
	var nodeEnter = node.enter().append("g")
	    .attr("class", "node")
	    .on("click", click)
	    .call(force.drag);
	
	nodeEnter.filter(function(d){return (d.type == "publication" || d.type == "tumor")}).append("circle")
	    .attr("r", function(d) { return Math.sqrt(d.size) || 4.5; })
	//    .attr("x", "-8px")
      	//    .attr("y", "-8px")
	//    .on("mouseover", function(d) { d.color = "#0000ff"; update(); return null;})
	    .append("title")
	    .text(function(d) { return d.description; });
	
	nodeEnter.filter(function(d){return (d.type == "publication" || d.type == "tumor")}).append("text")
		.attr("dx", "7em")
	    .attr("dy", ".35em");
	    
	node.select("text")
		.attr("class", "circleText")
		.text(function(d) { return d.name; });
	
	node.select("circle")
	    .style("fill", color);

	nodeEnter.filter(function(d){return d.type == "subMeshTerm"}).append("svg:rect")
     	.attr("class", "literal")
     	.attr("x", "-4px")
     	.attr("y", "-8px")
     	.attr("width", function(d){ return d.name.width() + 12;})
     	.attr("height", "16px")
     	.style("fill", "#CFEFCF")
     	.style("stroke", "#000").append("title")
     	.text(function(d) { return d.description; });
	
	nodeEnter.filter(function(d){return d.type == "subMeshTerm"}).append("svg:text")
     	.attr("class", "literalText")
     	.attr("dx", "0px")
     	.attr("dy", "4px")
     	.text(function(d) { return d.name });
	 
	var n = 100;
	setTimeout(function() {
		force.start();
		for (var i = n * n; i > 0; --i) force.tick();
		force.stop();
		
		link.attr("x1", function(d) { return d.source.x; })
	      .attr("y1", function(d) { return d.source.y; })
	      .attr("x2", function(d) { return d.target.x; })
	      .attr("y2", function(d) { return d.target.y; });

		node.attr("transform", function(d) { 
	      		return "translate(" + d.x + "," + d.y + ")"; });
	//	loading.remove();
		jQuery(".splashScreenExplorer").hide();
	}, 10);
}

// Color leaf nodes orange, and packages white or blue.
function color(d) {
  return (d.type == "tumor") ? "#ff0000" : ((d.center == 1) ? "#00ff00": "#666666");
 // return d._children ? "#3182bd" : d.children ? "#c6dbef" : "#fd8d3c";
}

function meshUpdate(meshTerm) {
	var count = 0;
	var subExtractedNodes = [], subExtractedLinks = [];
	var subNodeLocator = [];
	var linkCount = 0;
	
	var meshNode = extractedJSON.nodes[nodeLocator[meshTerm]];
	var newMesh = {"id": count, "type": "subMeshTerm", "name": meshNode.name, "description": meshNode.description, "size": meshNode.size, "url": meshNode.url, "children": meshNode.children};
	var source = count;
	subNodeLocator[meshTerm] = count++;
	subExtractedNodes.push(newMesh);
	
	var adjoiningPubmedNodes = meshTerms[meshTerm];
	for(j in adjoiningPubmedNodes) {
		if(subNodeLocator[adjoiningPubmedNodes[j]] == null) {
			var pubmedNode = extractedJSON.nodes[nodeLocator[adjoiningPubmedNodes[j]]];
			var newPage = {"id": count, "type": "publication", "name": "", "description": pubmedNode.description, "size": pubmedNode.size, "url": pubmedNode.url, "children": pubmedNode.children, "meshTerms": pubmedNode.meshTerms};
			target = count;
			subNodeLocator[adjoiningPubmedNodes[j]] = count++;
			subExtractedNodes.push(newPage);
			
			var newLink = {"id": linkCount++, "source": source, "target": target, "value": 1, "color": "#9ecae1", "type": "subMeshLink"};
			subExtractedLinks.push(newLink);
		} else {
			target = subNodeLocator[adjoiningPubmedNodes[j]];
			var newLink = {"id": linkCount++, "source": source, "target": target, "value": 1, "color": "#9ecae1", "type": "subMeshLink"};
			subExtractedLinks.push(newLink);
		}
	}
	var convertedJSON = {"nodes": subExtractedNodes, "links" : subExtractedLinks};
//	console.log(convertedJSON);
	updateVis(convertedJSON);
}

function subUpdate(url) {
	console.log(url);
	var pubmedIdentifierParts = url.split(/[:#\/]/);
	var pubmedId = pubmedIdentifierParts[pubmedIdentifierParts.length-1];
	var pubmedNode = extractedJSON.nodes[nodeLocator[pubmedId]];
	var meshArray = pubmedNode.meshTerms;
	var subExtractedNodes = [], subExtractedLinks = [];
	var subNodeLocator = [];
	
	var count = 0;
	var newPage = {"id": count, "type": "publication", "center" : 1, "name": pubmedNode.description, "description": pubmedNode.description, "size": 625, "url": pubmedNode.url, "children": pubmedNode.children, "meshTerms": pubmedNode.meshTerms};
	var target = count;
	var mainPub = count;
	subNodeLocator[pubmedId] = count++;
	subExtractedNodes.push(newPage);
	var linkCount = 0;
	
	var assocTumors = pubmedNode.children;
	for(i in assocTumors) {
		var tumorNode = extractedJSON.nodes[nodeLocator[assocTumors[i]]];
		var newTumor = {"id": count, "type": "tumor", "name": tumorNode.name, "description": tumorNode.description, "size": tumorNode.size, "url": tumorNode.url, "children": tumorNode.children};
		var mainTumor = count;
		subNodeLocator[assocTumors[i]] = count++;
		subExtractedNodes.push(newTumor);		
		
		var newLink = {"id": linkCount++, "source": mainTumor, "target": mainPub, "value": 8, "color": "aaa", "opacity": "0.4"};
		subExtractedLinks.push(newLink);
	}
	
	for(i in meshArray) {
		
		var meshNode = extractedJSON.nodes[nodeLocator[meshArray[i]]];
		var newMesh = {"id": count, "type": "subMeshTerm", "name": meshNode.name, "description": meshNode.description, "size": meshNode.size, "url": meshNode.url, "children": meshNode.children};
		var source = count;
		subNodeLocator[meshArray[i]] = count++;
		subExtractedNodes.push(newMesh);
		
		var newLink = {"id": linkCount++, "source": source, "target": mainPub, "value": 16, "color": "#00ff00", "type": "subMeshLink"};
		subExtractedLinks.push(newLink);
		
		var adjoiningPubmedNodes = meshTerms[meshArray[i]];
		
		for(j in adjoiningPubmedNodes) {
			if(subNodeLocator[adjoiningPubmedNodes[j]] == null) {
				var pubmedNode = extractedJSON.nodes[nodeLocator[adjoiningPubmedNodes[j]]];
				var newPage = {"id": count, "type": "publication", "name": "", "description": pubmedNode.description, "size": pubmedNode.size, "url": pubmedNode.url, "children": pubmedNode.children, "meshTerms": pubmedNode.meshTerms};
				target = count;
				subNodeLocator[adjoiningPubmedNodes[j]] = count++;
				subExtractedNodes.push(newPage);
				
				var newLink = {"id": linkCount++, "source": source, "target": target, "value": 1, "color": "#9ecae1", "type": "subMeshLink"};
				subExtractedLinks.push(newLink);
			} else {
				target = subNodeLocator[adjoiningPubmedNodes[j]];
				var newLink = {"id": linkCount++, "source": source, "target": target, "value": 1, "color": "#9ecae1", "type": "subMeshLink"};
				subExtractedLinks.push(newLink);
			}
			
		}
	}
	var convertedJSON = {"nodes": subExtractedNodes, "links" : subExtractedLinks};
//	console.log(convertedJSON);
	return convertedJSON;
}

function tumorUpdate(url) {
	var tumorIdentifierParts = url.split(/[:#\/]/);
	var tumorId = tumorIdentifierParts[tumorIdentifierParts.length-1];
	var tumorNode = extractedJSON.nodes[nodeLocator[tumorId]];
	var pubmedArray = tumorNode.children;
	var subExtractedNodes = [], subExtractedLinks = [];
	var subNodeLocator = [];
	
	var count = 0;
	var newTumor = {"id": count, "type": "tumor", "name": tumorNode.name, "description": tumorNode.description, "size": tumorNode.size, "url": tumorNode.url, "children": tumorNode.children};
	var mainTumor = count;
	subNodeLocator[tumorId] = count++;
	subExtractedNodes.push(newTumor);
	var linkCount = 0;
	
	for(i in pubmedArray) {
		
		var pubmedNode = extractedJSON.nodes[nodeLocator[pubmedArray[i]]];
		var newPage = {"id": count, "type": "publication", "name": pubmedNode.name, "description": pubmedNode.description, "size": pubmedNode.size, "url": pubmedNode.url, "children": pubmedNode.children, "meshTerms" : pubmedNode.meshTerms};
		var target = count;
		subNodeLocator[pubmedArray[i]] = count++;
		subExtractedNodes.push(newPage);
		
		var newLink = {"id": linkCount++, "source": mainTumor, "target": target, "value": 8, "color": "aaa", "opacity": "0.4"};
		subExtractedLinks.push(newLink);
	}
	var convertedJSON = {"nodes": subExtractedNodes, "links" : subExtractedLinks};
//	console.log(convertedJSON);
	return convertedJSON;
}

function allUpdate() {
	var convertedJSON = extractedJSON;
	updateVis(convertedJSON);
}

function updateVis(convertedJSON) {
	var clearJSON = {"nodes" : [], "links" : []};
	root = clearJSON;
	update();
	jQuery(".splashScreenExplorer").show();
	root = convertedJSON;
	update();
}

function getData(tumor,patientId,interval) {
	d3.text("makeRequest.php?dataset="+tumor+"methdata&patient="+patientId, function(error,json) {
		var dataParts = json.split('<body>');
		var data = JSON.parse(dataParts[dataParts.length-1].split('</body>')[0]);
		for (i in data.results.bindings) {
			var binding = data.results.bindings[i];
			var chromosome = (binding["chromosome"].value == "X") ? 23 : ((binding["chromosome"].value == "Y") ? 24 : parseInt(binding["chromosome"].value));
			methylationData[interval].values.push({
		        x: parseInt(binding["pos"].value)/100000, 
		        y: chromosome, 
		        size: binding["value"].value*1000,
		        text: "Chromosome Number: " + binding["chromosome"].value + "<br>Position: "+binding["pos"].value+ "<br>Beta Value: "+binding["value"].value,
		        shape: "circle"
		     });
		}
		methylationData[interval].complete = true;
	});
}

function updateTable(jsonTable, selector) {
	d3.select(selector).append("table").attr("border","1px").selectAll("tr").data(jsonTable).enter().append("tr").html(function(d){
		return "<th>"+d.name+"</th><td>"+d.content+"</td>";
	});
}

function mouseover(d) {
	d.color = "#0000ff";
	update();
}

function click(d) {
	  console.log(d.url);
	  var selector = "#extraDetailPanel";
	  d3.select(selector).html("<h4 align='center'>" + d.description + "</h4>");
	  var jsonTable = [];
	  
	  if(d.type == "publication") {
		  var convertedJSON = subUpdate(d.url);
		  var jsonStr = "";
		  for (i in d.meshTerms) {
			  if(i == 0)
				  jsonStr += "<a href='javascript:meshUpdate(\"" + d.meshTerms[i] + "\")'>" + d.meshTerms[i] + "</a>";
			  else
				  jsonStr += ", " + "<a href='javascript:meshUpdate(\"" + d.meshTerms[i] + "\")'>" + d.meshTerms[i] + "</a>";
		  }
		  var jsonRow = {"name" : "Mesh Terms", "content" : jsonStr};
		  jsonTable.push(jsonRow);
		  d3.text("makeRequest.php?dataset=pubmedResource&resource="+d.url, function(error,json) {
				var dataParts = json.split('<body>');
				var data = JSON.parse(dataParts[dataParts.length-1].split('</body>')[0]);
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
				goToByScroll("extraDetailPanel");
				updateTable(jsonTable,selector);
				updateVis(convertedJSON);
		  });
	  } else if (d.type == "tumor") {
		  var urlParts = d.url.split(/[:#\/]/);
		  var tumor = urlParts[urlParts.length-1];
		  methylationData = [];
		  var convertedJSON = tumorUpdate(d.url);
		  updateVis(convertedJSON);
		  d3.text("makeRequest.php?dataset="+tumor+"methpatients&offset=5", function(error,json) {
				var dataParts = json.split('<body>');
				var data = JSON.parse(dataParts[dataParts.length-1].split('</body>')[0]);
				for (i in data.results.bindings) {
					var binding = data.results.bindings[i];
					methylationData.push({
						key: binding["s"].value,
						values: [],
						complete : false
					});
					getData(tumor,binding["patient"].value,i);
				}	
				var initInterval = setInterval(function(){
					var count = 0;
					for(i in methylationData) {
						if(methylationData[i].complete)
							count++;
					}
					if (count > 4) {
						clearInterval(initInterval);
					//	console.log(methylationData);
						jQuery('#methylation').show();
						plotMethylationData(methylationData);
						goToByScroll("methylation");
					}
				}, 1000);
		  })
	  } else {
		  meshUpdate(d.name);
	  }
}

function goToByScroll(id){
  jQuery('html,body').animate({
      scrollTop: jQuery("#"+id).offset().top},
      'slow');
}

jQuery('#methylation').hide();