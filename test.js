/**
 * T E S T S 
 */
 
var Rng = require('./Ranges.js');



test_01('[10:30)', '[20:40]');
test_01('[5:10)', '[20:40]');
test_01('[10:30)', '[5:40]');
test_01('[1:10]', '(1:40]');

// sets global aliases to the methods, so its compatible with client's initial request.
function mock() {
	window.SegmentString = Rng.Range;
}


// test functions
function test_01( s1, s2) {
	var  A = new Rng.Range(s1)
		,B = new Rng.Range(s2)
		,R = new Rng.RangeSet([A, B])
		,out = R.subtract( A)
	;
	
	console.log( A.toString(), '-', B.toString(), '=', out.join(' '));
}



/*


var A1 = new SegmentString("[0:10]");
var A2 = new SegmentString("[0:102]");
var B = new SegmentString("[5:13)");
var C = new SegmentString("(12:100]");
var D1 = new SegmentString("[15:16)");
var D2 = new SegmentString("[5:16)");

var S1 = new Segments([A1, B, C, D1]);
    logger("S1: " + S1.toString());
var S2 = new Segments([A2, B, C, D2]);
    logger("S2: " + S2.toString());
    logger("--- Уникальные выборки для S1");
    
    logger("Уникальная выборка для A: " + S1.getUniqQuery(A1).toString());
    logger("Уникальная выборка для B: " + S1.getUniqQuery(B).toString());
    logger("Уникальная выборка для C: " + S1.getUniqQuery(C).toString());
    logger("Уникальная выборка для D: " + S1.getUniqQuery(D1).toString());
    logger("--- Уникальные выборки для S2");
    
    logger("Уникальная выборка для A: " + S2.getUniqQuery(A2).toString());
    logger("Уникальная выборка для B: " + S2.getUniqQuery(B).toString());
    logger("Уникальная выборка для C: " + S2.getUniqQuery(C).toString());
    logger("Уникальная выборка для D: " + S2.getUniqQuery(D2).toString());
    
*/