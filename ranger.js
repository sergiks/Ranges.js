"use strict";

module.exports = (function(){
	/**
	 * Tool to intersect ranges.
	 *
	 * We have two "tracks": Data and Unique
	 * Data track contains ranges that are joined;
	 * Unique track supposed to contain only one range, however should work with more too.
	 * Output contains parts of "Unique" ranges, not present in the "Data" track.
	 */
	var Uni = {};
	
	/**
	 * Single point
	 * @param float x value
	 * @param int mask - bitmask:
	 *						bit 0 is on if range after the dot is included
	 *						bit 1 is on if the dot itself is included
	 *						bit 2 is on if range before the dot is included
	 *						bit 3 is on if Point is on Unique track
	 */
	Uni.Point = function(x, mask) {
	    this.x = x;						// value
	    this.mask = 0xF & mask;			// the three bits only
	}
	
	Uni.Point.prototype.toString = function() {
		return '' +
			(this.mask & 0x1 ? (this.mask & 0x2 ? '[' : '(') : '')
			+
			this.x
			+
			(this.mask & 0x4 ? (this.mask & 0x2 ? ']' : ')') : '')
		;	
	}
	
	/**
	 * Single range
	 * Consists of two Points.
	 */
	Uni.Range = function(s){
		var m = s.match(/^([\(\[])([\d\.]+):([\d\.]+)([\)\]])$/);
		if(!m || m.length != 5) throw('Range string has wrong format: ' + s);
	
	    this.from_inc	= m[1] === '[';		// from inclusion
		this.from		= parseInt(m[2]);	// from x
	    this.to			= parseInt(m[3]);	// to x
	    this.to_inc		= m[4] === ']'; 	// to inclusion
	    return;
	};
	
	/**
	 * Get the two Points form the Range.
	 * @param boolean unique optional - true to set additional "Master" property
	 */
	Uni.Range.prototype.getPoints = function( unique){
	    return [
	        new Uni.Point( this.from, (this.from_inc ? 0x3 : 0x1) | !!unique<<3),
	        new Uni.Point( this.to,   (this.to_inc   ? 0x6 : 0x4) | !!unique<<3)
	    ];
	}
	
	Uni.Range.prototype.toString = function() {
		return ( this.from_inc ? '[' : '(') +this.from +':' +this.to +(this.to_inc ? ']' : ')');
	}
	
	
	Uni.Cursor = function() {
		this.i = 0;	// initial value
		this.m = 0;	// minus (unsigned int)
		this.p = 0;	// plus
		this.inc = false;
	}
	
	Uni.Cursor.prototype.add = function(v) {
		if( v & 0x4) {			// closing end
			this.m ++;			// minus
		} else if( v & 0x1) {	// "start" change affects dot (if inc) or post
			this.p ++;			// plus
		} else {
			throw("Point's bit mask is wrong");
		}
	
		// Point inclusion
		if( v & 0x2) this.inc = true;
	}
	
	Uni.Cursor.prototype.toString = function() {
		return '' +this.i +' -' +this.m +' +' +this.p +( this.inc ? " • " : " o ");
	}
	
	
	/**
	 * Returns a in-dot-out bit mask for the track
	 * 
	 */
	Uni.Cursor.prototype.can = function() {
		var out = this.inc ? 0x2 : 0;			// bit 1: is dot included?
		
		if( this.i > this.m) return 0x7;		// some track passes by this point, covering it completely
		
		if( this.i > 0) out = out | 0x4;
		if( this.p > 0) out = out | 0x1;
		
		if( this.i > 0  &&  this.i == this.m) {	// bit 2: did data hit 0?
			console.log('hit 0');
		}
		
		if( this.i == this.m  &&  this.p > 0) {	// bit 0: did data rise from 0?
			console.log('rise from 0');
		}
		
		return out;
	}
	
	Uni.Cursor.prototype.binprint = function(v,l) {
		var i, s = '';
		l = l || 4;	// length
		for( i=0; i<l; i++) {
			s = (v & 1<<i ? '1' : '0') + s;
		}
		return s;
	}
	
	Uni.Cursor.prototype.canTest = function() {
		var v = this.can();
		return this.binprint( v, 3);
	}
	
	Uni.Cursor.prototype.next = function() {
		var v = this.i - this.m + this.p;
		
		this.i = v;
		this.m = 0;
		this.p = 0;
		this.inc = false;
	}
	
	
	/**
	 * Range Set - set of ranges.
	 * Can perform various operations on the Ranges it contains
	 */
	Uni.RangeSet = function( rangeArray) {
	    this.ranges = rangeArray;
	}
	
	/**
	 * Find range that is in R, but not in any of the RS
	 */
	Uni.RangeSet.prototype.subtract = function(R) {
		var input = []					// array of given points: ranges and want
			,output = []				// array of Points
	
			,hash = R.toString()
			,P							// current Point
			,log = []					// debug tracing
			
			// Current position characterised by pre state, dot itself, and post state,
			// we have two "tracks": input data (d), and test range mask (m)
			// any incoming Point updates either pre, dot or post section;
			// to get next point's pre state, we sum them up.
			,X = {
				 data	: new Uni.Cursor()
				,test	: new Uni.Cursor()
			}
			
			,out	// bit mask for the possible new out Point
			
			,type
			
			,i
		;
		
		// collect input ranges as Points and sort them
		for( i=0; i<this.ranges.length; i++) {
			input = input.concat( this.ranges[i].getPoints( hash === this.ranges[i].toString() ));
		}
	
		input.sort( this.sorter);
	// 	console.log( input);
	
		// Walk over the sorted input left to right.
		while( input.length) {
			P = input.shift();
			type = P.mask & 0x8 ? 'test' : 'data';
			
			X[ type].add( P.mask);	// add to plus or minus
	
			// Got more?
			if( input.length  &&  input[0].x == P.x) continue;	// there are more Points with same x
	
	
			// Before finalize
			console.log(
				'Finalize ' +P.x +':', X.data.toString(), X.test.toString()
			);
	
	
			// Finalize this X point
			
	
			out = ~( ~X.test.can() | X.data.can());
			console.log( X.test.canTest(), X.data.canTest(), '=', X.data.binprint( out, 3));
	//  		output.push( new Uni.Point( P.x, 1, true));
			if( out  &&  out != 0x7) {
				output.push( new Uni.Point( P.x, out));
			}
			
			// Prepare for next position
			X.data.next();
			X.test.next();
		}
		if( output.length == 0) output = ["no Points"];
		
		return output;
	}
	
	/**
	 * Sorts Points
	 * 1. by x value
	 * 2. with same x:
	 *   a) master points are the last
	 *   b) "to" nodes come before "from" nodes
	 * All end types change state, but
	 * open ends "(", ")" - do not count for the current X
	 *    
	 */
	Uni.RangeSet.prototype.sorter = function(a, b) {
		return (a.x < b.x) ? -1 : (( a.x > b.x) ? 1 : 0);
	}


	// nodejs module wrap up
	return Uni;
})();
