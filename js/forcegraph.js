var lookUpTable = [];
lookUpTable["laml"] = "Acute Myeloid Leukemia";
lookUpTable["blca"] = "Bladder Urothelial Carcinoma";
lookUpTable["cesc"] = "Cervical squamous cell carcinoma and endocervical adenocarcinoma";
lookUpTable["kirp"] = "Kidney renal papillary cell carcinoma";
lookUpTable["hnsc"] = "Head and Neck squamous cell carcinoma ";

var extractedNodes = [], extractedLinks = [], meshTerms = [];
var nodeLocator = [], linkLocator = [];
var methylationData = [];

var width = 960,
    height = 800,
    root;

var ticks = 0;
var force = d3.layout.force()
    .linkDistance(60)
    .charge(-120)
    .gravity(.05)
    .size([width, height])
    .on("tick", tick);

var vis = d3.select("#graph").append("svg:svg")
    .attr("width", width)
    .attr("height", height)
    .attr("pointer-events", "all")
    .append('svg:g')
    .call(d3.behavior.zoom().on("zoom", redraw))
    .append('svg:g');

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
			var newTumor = {"id": count, "type": "tumor", "name" : lookUpTable[tumorId], "description": "", "size": 100, "url": tumorUri, "children": []};
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
			newTumor.size = newTumor.size + 5;
			newPage.size = newPage.size*2;
			linkLocator[tumorId + "-" + pubmedId] = linkCount++;
		}
		
	}
	
	var convertedJSON = {"nodes": extractedNodes, "links" : extractedLinks};
	root = convertedJSON;
	update();
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
		for (i in data.results.bindings) {
			var binding = data.results.bindings[i];
			var pubmedIdentifierParts = binding["s"].value.split(/[:#\/]/);
			var pubmedId = pubmedIdentifierParts[pubmedIdentifierParts.length-1];
			var meshTerm = binding["name"].value;
			extractedNodes[nodeLocator[pubmedId]].meshTerms.push(meshTerm);
			if(meshTerms[meshTerm] == null) {
				meshTerms[meshTerm] = [];
				meshTerms[meshTerm].push(pubmedId);
			} else {
				for(ids in meshTerms[meshTerm]) {
					if(pubmedId < meshTerms[meshTerm][ids]) {
						var source = extractedNodes[nodeLocator[pubmedId]];
						var target = extractedNodes[nodeLocator[meshTerms[meshTerm][ids]]];
					} else {
						var target = extractedNodes[nodeLocator[pubmedId]];
						var source = extractedNodes[nodeLocator[meshTerms[meshTerm][ids]]];
					}
					if(linkLocator[source.id + "-" + target.id] == null && thresholdLinkLocator[source.id + "-" + target.id] == null) {
						thresholdLinkLocator[source.id + "-" + target.id] = 1;
					} else if (thresholdLinkLocator[source.id + "-" + target.id] < 5) {
						thresholdLinkLocator[source.id + "-" + target.id]++;
					} else if (thresholdLinkLocator[source.id + "-" + target.id] == 5) {
						var newLink = {"id": linkCount, "source": source.id, "target": target.id, "value": 1, "color": "#9ecae1"};
						extractedLinks.push(newLink);
						linkLocator[source.id + "-" + target.id] = linkCount++;
						thresholdLinkLocator[source.id + "-" + target.id]++;
					} else {
						extractedLinks[linkLocator[source.id + "-" + target.id]].value++;
					}
				}
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
	
	nodeEnter.append("circle")
	    .attr("r", function(d) { return Math.sqrt(d.size) || 4.5; })
	    .on("mouseover", function(d) { d.color = "#0000ff"; update(); return null;})
	    .append("title")
	    .text(function(d) { return d.description; });
	
	nodeEnter.append("text")
		.attr("dx", "7em")
	    .attr("dy", ".35em");
	    
	node.select("text")
		.text(function(d) { return d.name; });
	
	node.select("circle")
	    .style("fill", color);
}

function tick() {
  ticks++;
  if (ticks > 200) {
      force.stop();
      force.charge(0)
            .linkStrength(0)
            .linkDistance(0)
            .gravity(0);
      force.start();
  }
  link.attr("x1", function(d) { return d.source.x; })
      .attr("y1", function(d) { return d.source.y; })
      .attr("x2", function(d) { return d.target.x; })
      .attr("y2", function(d) { return d.target.y; });

  node.attr("transform", function(d) { 
      return "translate(" + d.x + "," + d.y + ")"; });
}

// Color nodes according to tumor or publication
function color(d) {
  return (d.type == "tumor") ? "#ff0000" : "#666666";
 // return d._children ? "#3182bd" : d.children ? "#c6dbef" : "#fd8d3c";
}

// Execute Specific Queries
function click(d) {
  console.log(d.url);
  var selector = "#extraDetailPanel";
  d3.select(selector).html("<h4 align='center'>" + d.description + "</h4>");
  var jsonTable = [];
  
  if(d.type == "publication") {
	  var jsonStr = "";
	  for (i in d.meshTerms) {
		  if(i == 0)
			  jsonStr += d.meshTerms[i];
		  else
			  jsonStr += ", " + d.meshTerms[i];
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
	  });
  } else {
	  var urlParts = d.url.split(/[:#\/]/);
	  var tumor = urlParts[urlParts.length-1];
	  methylationData = [];
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
					goToByScroll("methylation");
					plotMethylationData(methylationData);
				}
			}, 1000);
	  })
  }
  
 /* if (d.children) {
    d._children = d.children;
    d.children = null;
  } else {
    d.children = d._children;
    d._children = null;
  } */
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

function goToByScroll(id){
  jQuery('html,body').animate({
      scrollTop: jQuery("#"+id).offset().top},
      'slow');
}

jQuery('#methylation').hide();