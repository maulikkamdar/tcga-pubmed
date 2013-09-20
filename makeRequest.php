<?php 

function constructQuery($query, $url)
{
   $format = 'json';
 
   $searchUrl = $url . '?'
      .'query='.urlencode($query)
      .'&format='.$format;
	  
   return $searchUrl;
}
 
 
function request($url)
{
   if (!function_exists('curl_init')){ 
      die('CURL is not installed!');
   }
   $ch= curl_init();
 
   curl_setopt($ch, 
      CURLOPT_URL, 
      $url);
 
   curl_setopt($ch, 
      CURLOPT_RETURNTRANSFER, 
      true);
 
   $response = curl_exec($ch);
 
   curl_close($ch);
 
   return $response;
}

$term = $_GET['dataset'];

switch($term) {
	case "pubmed" : $query = "PREFIX pubmed:<http://bio2rdf.org/pubmed_vocabulary:>
							PREFIX purl:<http://purl.org/dc/terms/>
							SELECT DISTINCT ?s ?o ?title WHERE {
								?s a <http://bio2rdf.org/pubmed_vocabulary:PubMedRecord>;
									pubmed:relatedTo ?o; 
									purl:title ?title.
							}";
		$url = "http://virtuoso.srvgal85.deri.ie/sparql";
		break;
	case "pubmedAuthors" : $query = "PREFIX pubmed:<http://bio2rdf.org/pubmed_vocabulary:>
									PREFIX purl:<http://purl.org/dc/terms/>
									SELECT DISTINCT ?s ( CONCAT(?fore, \" \", ?last) AS ?author) WHERE {
										?s pubmed:author ?author .
										?author pubmed:fore_name ?fore ; 
											pubmed:last_name ?last.
									}";
		$url = "http://virtuoso.srvgal85.deri.ie/sparql";
		break;
	case "pubmedMeshTerms" : $query = "PREFIX pubmed:<http://bio2rdf.org/pubmed_vocabulary:>
									PREFIX purl:<http://purl.org/dc/terms/>
									SELECT ?s ?name WHERE {
										?s pubmed:mesh_heading ?meshTerm . ?meshTerm pubmed:mesh_descriptor_name ?name
									}";
		$url = "http://virtuoso.srvgal85.deri.ie/sparql";
		break;
	case "pubmedResource" : $resource = $_GET['resource']; // http://linked2safety.deri.org/pubmed/19903095
		$query = "PREFIX pubmed:<http://bio2rdf.org/pubmed_vocabulary:>
				PREFIX purl:<http://purl.org/dc/terms/>
				PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#>
				
				CONSTRUCT {
					<".$resource."> pubmed:Author `bif:concat (?fore, \" \", ?last)` ;
							pubmed:Chemical ?chemicalName; pubmed:Abstract ?abstractText; pubmed:Affiliation ?affiliation; 
							pubmed:Journal `bif:concat (?jtitle, \" (\", ?jvol, \":\", ?jissue, \")\")`  }
				WHERE {
					<".$resource."> pubmed:author ?author .
					?author pubmed:fore_name ?fore ; 
							pubmed:last_name ?last .
					OPTIONAL {<".$resource."> pubmed:chemical ?chemical. ?chemical rdfs:label ?chemicalName .}
					OPTIONAL {<".$resource."> pubmed:affiliation ?affiliation}
					OPTIONAL {<".$resource."> purl:abstract ?abstract . ?abstract pubmed:abstract_text ?abstractText}
					OPTIONAL {<".$resource."> pubmed:journal ?journal . ?journal pubmed:journal_title ?jtitle; 
										pubmed:journal_volume ?jvol; pubmed:journal_issue ?jissue }
				}";
		$url = "http://virtuoso.srvgal85.deri.ie/sparql";
		break;
	case "blcamethpatients" : $query = "SELECT DISTINCT * WHERE {
											?patient <http://tcga.deri.ie/schema/bcr_patient_barcode> ?s
										} LIMIT 5 OFFSET ".$_GET['offset'];
		$url = "http://vmlion14.deri.ie/node43/8082/sparql";
		break;
	case "blcamethdata" : $query = "SELECT DISTINCT * WHERE  {
										<".$_GET['patient']."> <http://tcga.deri.ie/schema/result> ?result.
										?result <http://tcga.deri.ie/schema/chromosome> ?chromosome; 
												<http://tcga.deri.ie/schema/position> ?pos; 
												<http://tcga.deri.ie/schema/beta_value> ?value
									} LIMIT 2000" ;
		$url = "http://vmlion14.deri.ie/node43/8082/sparql";
		break;
	case "lamlmethpatients" : $query = "SELECT DISTINCT * WHERE {
											?patient <http://tcga.deri.ie/schema/bcr_patient_barcode> ?s
										} LIMIT 5 OFFSET ".$_GET['offset'];
		$url = "http://vmlion14.deri.ie/node45/8082/sparql";
		break;
	case "lamlmethdata" : $query = "SELECT DISTINCT * WHERE  {
										<".$_GET['patient']."> <http://tcga.deri.ie/schema/result> ?result.
										?result <http://tcga.deri.ie/schema/chromosome> ?chromosome; 
												<http://tcga.deri.ie/schema/position> ?pos; 
												<http://tcga.deri.ie/schema/beta_value> ?value
									} LIMIT 2000" ;
		$url = "http://vmlion14.deri.ie/node45/8082/sparql";
		break;
	case "cescmethpatients" : $query = "SELECT DISTINCT * WHERE {
											?patient <http://tcga.deri.ie/schema/bcr_patient_barcode> ?s
										} LIMIT 5 OFFSET ".$_GET['offset'];
		$url = "http://vmlion14.deri.ie/node43/8080/sparql";
		break;
	case "cescmethdata" : $query = "SELECT DISTINCT * WHERE  {
										<".$_GET['patient']."> <http://tcga.deri.ie/schema/result> ?result.
										?result <http://tcga.deri.ie/schema/chromosome> ?chromosome; 
												<http://tcga.deri.ie/schema/position> ?pos; 
												<http://tcga.deri.ie/schema/beta_value> ?value
									} LIMIT 2000" ;
		$url = "http://vmlion14.deri.ie/node43/8080/sparql";
		break;
	case "kirpmethpatients" : $query = "SELECT DISTINCT * WHERE {
											?patient <http://tcga.deri.ie/schema/bcr_patient_barcode> ?s
										} LIMIT 5 OFFSET ".$_GET['offset'];
		$url = "http://vmlion14.deri.ie/node45/8080/sparql";
		break;
	case "kirpmethdata" : $query = "SELECT DISTINCT * WHERE  {
										<".$_GET['patient']."> <http://tcga.deri.ie/schema/result> ?result.
										?result <http://tcga.deri.ie/schema/chromosome> ?chromosome; 
												<http://tcga.deri.ie/schema/position> ?pos; 
												<http://tcga.deri.ie/schema/beta_value> ?value
									} LIMIT 2000" ;
		$url = "http://vmlion14.deri.ie/node45/8080/sparql";
		break;
	case "hnscmethpatients" : $query = "SELECT DISTINCT * WHERE {
											?patient <http://tcga.deri.ie/schema/bcr_patient_barcode> ?s
										} LIMIT 5 OFFSET ".$_GET['offset'];
		$url = "http://vmlion14.deri.ie/node44/8080/sparql";
		break;
	case "hnscmethdata" : $query = "SELECT DISTINCT * WHERE  {
										<".$_GET['patient']."> <http://tcga.deri.ie/schema/result> ?result.
										?result <http://tcga.deri.ie/schema/chromosome> ?chromosome; 
												<http://tcga.deri.ie/schema/position> ?pos; 
												<http://tcga.deri.ie/schema/beta_value> ?value
									} LIMIT 2000" ;
		$url = "http://vmlion14.deri.ie/node44/8080/sparql";
		break;						
}

$requestURL = constructQuery($query, $url);
 
$responseArray = request($requestURL);
?>
 
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
      "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
 
<html xmlns="http://www.w3.org/1999/xhtml">
 
<head>
 
<title>SPARQL Proxy Executor</title>
<meta http-equiv="content-type" content="text/html; charset=utf-8" />
</head>
 
<body><?php echo $responseArray; ?>
</body>
</html>
