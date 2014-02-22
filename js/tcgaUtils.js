var unique = function(origArr) {  
    var newArr = [],  
        origLen = origArr.length,  
        found,  
        x, y;   
    for ( x = 0; x < origLen; x++ ) {  
        found = undefined;  
        for ( y = 0; y < newArr.length; y++ ) {  
            if ( origArr[x].key === newArr[y].key ) {   
              found = true;  
              break;  
            }  
        }  
        if ( !found) newArr.push( origArr[x] );      
    }  
   return newArr;  
};  

var storage = (function() {
    var uid = new Date,
        storage,
        result;
    try {
      (storage = window.localStorage).setItem(uid, uid);
      result = storage.getItem(uid) == uid;
      storage.removeItem(uid);
      return result && storage;
    } catch(e) {}
}());


function co (lor) {
	return (lor +=[0,1,2,3,4,5,6,7,8,9,'a','b','c','d','e','f'][Math.floor(Math.random()*16)]) && (lor.length == 6) ? lor : co(lor); 
}

/*
 * Input data in the format of {attributes : .... , "value": someValue, "normalizedValue": normalizedValue} for normalization
 * Provided the desired range of normalized Data
 */

function normalizeData(data, maximum, minimum, desMax, desMin) {
	for(i in data){
		var normalizedValue = desMin + (data[i].value - minimum)*(desMax - desMin)/(maximum - minimum);
		if(normalizedValue > 50)
			console.log(data[i].value);
		data[i].normalizedValue = normalizedValue;
	}
	return data;
}