# Ranges.js

JavaScript library implementing basic operations on Ranges.

## Range definition

*Range* or *Interval*, according to [wiki](https://en.wikipedia.org/wiki/Interval_%28mathematics%29), is a set of real numbers with the property that any number that lies between two numbers in the set is also included in the set.

## Operators

PostgreSQL [defines](http://www.postgresql.org/docs/9.2/static/functions-range.html) the following operators on ranges (intervals):

Operator | Description | Example | Result
---------|-------------|---------|-------
= 	| equal	|	int4range(1,5) = '[1,4]'::int4range	|	t
<> 	| not equal	|	numrange(1.1,2.2) <> numrange(1.1,2.3)	|	t
< 	| less than	|	int4range(1,10) < int4range(2,3)	|	t
> 	| greater than	|	int4range(1,10) > int4range(1,5)	|	t
<= 	| less than or equal	|	numrange(1.1,2.2) <= numrange(1.1,2.2)	|	t
>= 	| greater than or equal	|	numrange(1.1,2.2) >= numrange(1.1,2.0)	|	t
@> 	| contains range	|	int4range(2,4) @> int4range(2,3)	|	t
@> 	| contains element	|	'[2011-01-01,2011-03-01)'::tsrange @> '2011-01-10'::timestamp	|	t
<@ 	| range is contained by	|	int4range(2,4) <@ int4range(1,7)	|	t
<@ 	| element is contained by	|	42 <@ int4range(1,7)	|	f
&& 	| overlap (have points in common)	|	int8range(3,7) && int8range(4,12)	|	t
<< 	| strictly left of	|	int8range(1,10) << int8range(100,110)	|	t
>> 	| strictly right of	|	int8range(50,60) >> int8range(20,30)	|	t
&< 	| does not extend to the right of	|	int8range(1,20) &< int8range(18,20)	|	t
&> 	| does not extend to the left of	|	int8range(7,20) &> int8range(5,10)	|	t
-|- | 	is adjacent to	|	numrange(1.1,2.2) -|- numrange(2.2,3.3)	|	t
+ 	| union	|	numrange(5,15) + numrange(10,20)	|	[5,20)
* 	| intersection	|	int8range(5,15) * int8range(10,20)	|	[10,15)
- 	| difference	|	int8range(5,15) - int8range(10,20)	|	[5,10)

## Library methods

At the moment, library development just started with a particular task to perform union and exclusion of ranges. Union is described in the above table. A excluding B leaves out range(s) that are present in A, but not in B.

*To be continued. 2015 August 26, Moscow, Russia.*