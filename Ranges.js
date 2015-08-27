"use strict";

module.exports = (function(){


	/**
	 * Operations on ranges.
	 *
	 * by Sergei Sokolov <hello@sergeisokolov.com>
	 * Moscow, 2015.
	 */
	var Rng = {};	// Root Object.


	/**
	 * Single point
	 * @param float	x		value
	 * @param int	mask	bitmask:
	 *							bit 0 - range after the dot is included
	 *							bit 1 - the dot itself is included
	 *							bit 2 - range before the dot is included
	 *							bit 3 - Point is on Unique track
	 */
	Rng.Point = function(x, mask) {
	    this.x = x;						// value
	    this.mask = 0xF & mask;			// four bits only
	}
	
	Rng.Point.prototype.toString = function() {
		if( this.mask == 0x2) return '['+this.x+']';		// single point
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
	Rng.Range = function(s){
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
	Rng.Range.prototype.getPoints = function( unique){
	    return [
	        new Rng.Point( this.from, (this.from_inc ? 0x3 : 0x1) | !!unique<<3),
	        new Rng.Point( this.to,   (this.to_inc   ? 0x6 : 0x4) | !!unique<<3)
	    ];
	}
	
	Rng.Range.prototype.toString = function() {
		return ( this.from_inc ? '[' : '(') +this.from +':' +this.to +(this.to_inc ? ']' : ')');
	}
	
	
	/**
	 * Pointer moving left to right.
	 */
	Rng.Cursor = function() {
		this.i = 0;	// initial value
		this.m = 0;	// minus (unsigned int)
		this.p = 0;	// plus
		this.inc = false;
	}
	
	Rng.Cursor.prototype.add = function(v) {
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
	
	Rng.Cursor.prototype.toString = function() {
		return '' +this.i +' -' +this.m +' +' +this.p +( this.inc ? " • " : " o ");
	}
	
	
	/**
	 * Returns a in-dot-out bit mask for the track
	 */
	Rng.Cursor.prototype.can = function() {
		var out = this.inc ? 0x2 : 0;			// bit 1: is dot included?
		
		if( this.i > this.m) return 0x7;		// some track passes by this point, covering it completely
		
		if( this.i > 0) out = out | 0x4;
		if( this.p > 0) out = out | 0x1;
		
		if( this.i > 0  &&  this.i == this.m) {	// bit 2: did data hit 0?
			//console.log('hit 0');
		}
		
		if( this.i == this.m  &&  this.p > 0) {	// bit 0: did data rise from 0?
			//console.log('rise from 0');
		}
		
		return out;
	}
	
	Rng.Cursor.prototype.binprint = function(v,l) {
		var i, s = '';
		l = l || 4;	// length
		for( i=0; i<l; i++)  s = (v & 1<<i ? '1' : '0') + s;

		return s;
	}
	
	Rng.Cursor.prototype.canTest = function() {
		var v = this.can();
		return this.binprint( v, 3);
	}
	
	Rng.Cursor.prototype.next = function() {
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
	Rng.RangeSet = function( rangeArray) {
	    this.ranges = rangeArray;
	}


	/**
	 * Find range that is in R, but not in any of the RS
	 *
	 * We have two "tracks": Data and Unique
	 * Data track contains ranges that are joined;
	 * Unique track supposed to contain only one range, however should work with more too.
	 * Output contains parts of "Unique" ranges, not present in the "Data" track.
	 */
	Rng.RangeSet.prototype.subtract = function(R) {
		var input = []					// array of given points: ranges and want
			,result = []				// array of Points
			,output
	
			,hash = R.toString()
			,P							// current Point
			,log = []					// debug tracing
			
			// Current position characterised by pre state, dot itself, and post state,
			// we have two "tracks": input data (d), and test range mask (m)
			// any incoming Point updates either pre, dot or post section;
			// to get next point's pre state, we sum them up.
			,X = {
				 data	: new Rng.Cursor()
				,test	: new Rng.Cursor()
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
			false  &&  console.log(
				'Finalize ' +P.x +':', X.data.toString(), X.test.toString()
			);
	
	
			// Finalize this X point
			
	
			out = ~( ~X.test.can() | X.data.can());
// console.log( X.test.canTest(), X.data.canTest(), '=', X.data.binprint( out, 3));

			if( out  &&  out != 0x7) {
				result.push( new Rng.Point( P.x, out));
			}
			
			// Prepare for next position
			X.data.next();
			X.test.next();
		}
		if( result.length == 0) return ["no Points"];
		
		output = [];
		for( i=1; i<result.length; i+=2) {
			output.push( result[i-1].toString() +':' +result[i].toString());
		}
		
		if( i == result.length) {
			//console.log('odd');
			output.push( result[i-1].toString());
		}
		
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
	Rng.RangeSet.prototype.sorter = function(a, b) {
		return (a.x < b.x) ? -1 : (( a.x > b.x) ? 1 : 0);
	}


	// nodejs module wrap up
	return Rng;
})();
