# Fractional indexing jittered

Goal of this package is a abstraction to use Fractional indexing, 
a technique to generate new order keys in between a existing list without
having to reorder all the existing keys. 

This package supports [Jittering](#jittering) the key to have a high probability of a unique key.

The package consist of two parts: 
- [Fractional index API](#fractional-index-api) is a collection of functions to generate order keys, either jittered or not
- [Generator](#generator-quick-start) is a class to help with the generator process, with support for groups

This package builds on a solid foundation both in writing and in code, see [credits](#credits)

Some examples using react are available in the examples folder and can be viewed on [Github Pages](https://tmeerhof.github.io/fractional-indexing-jittered)

## Jittering
Both the low level API and generator the support jittering, see [credits](#random-jitter) for more background info.
This means that the keys are with high probability unique even when multiple actors insert on the same spot at the same time

The default character set has a chance of roughly one in 47.000 to generate the same key for the same input at the cost of making the keys 3 characters longer on average.
(Not taking into account that `Math.random` is not 100% random)

## Fractional index API
4 functions to generate keys:
- generateKeyBetween -> generates a single key between two keys or at the start or end of the list
- generateNKeysBetween -> generate N consecutive keys between two keys or at the start or end of the list
- generateJitteredKeyBetween -> generates a single key with Jittering
- generateNJitteredKeysBetween > generate N consecutive keys with Jittering

1 utility functions
- indexCharacterSet -> create a custom character set if you want more control

See [Fractional index API](./docs/fractionalApi.md)

## Generator Quick Start
The easiest way is to use the index generator, the generator should be updated with the latest list 
after you processed the generated order keys, or if there are updates from other sources like the server/CRDT.

The default will use a base62 character set, with generated keys starting from 'a0', 'a1', 'a2' etc, with random [jitter](#jittering)

Read more about Generator Groups and the API at the [Generator Docs](./docs/generator.md)

```ts
import { IndexGenerator } from 'fractional-indexing-jittered';
const generator = new IndexGenerator([]);

// dummy code, would normally be stored in database or CRDT and updated from there
const list: string[] = [];
function updateList(newKey: string) {
  list.push(newKey);
  generator.updateList(list);
}

// "a01TB" a0 with jitter
const firstKey = generator.keyStart(); 
updateList(firstKey);

// "a10Vt" a1 with jitter
const secondKey = generator.keyEnd(); 
updateList(secondKey);

// "a0fMq" jittered midpoint between firstKey and secondKey
const keyInBetween = generator.keyAfter(firstKey); 
updateList(keyInBetween);

// "a0M3o" jittered midpoint between firstKey and keyInBetween
const anotherKeyInBetween = generator.keyBefore(keyInBetween); 
updateList(anotherKeyInBetween);

// [ 'a01TB', 'a0M3o', 'a0fMq', 'a10Vt' ] 
// [ firstKey, anotherKeyInBetween, keyInBetween, secondKey ]
console.log(list.sort()); 
```

## Credits
This package builds on a solid foundation both in writing and in code, the two most influential sources are listed below.

### fractional-indexing
Starting point for this package was the [fractional-indexing](https://github.com/rocicorp/fractional-indexing) package.

Kudos to them and [David Greenspan](https://github.com/dgreensp), this implementation also includes a slightly adjusted 
version of variable-length integers, and the prepend/append optimization described in David's article.

### Random Jitter
The idea for adding random jitter to this package comes from this excellent post by Even Wallace called [CRDT: Fractional Indexing](https://madebyevan.com/algos/crdt-fractional-indexing/).
It was [another](https://www.figma.com/blog/realtime-editing-of-ordered-sequences/) post by Even Wallace, that put me on the path to use fractional indexing in our app.

## Questions

### What about interleaving?
If two peers both simultaneously insert at the same location, the resulting objects may be interleaved. 
Protecting against interleaving comes at the cost of added complexity or rapidly growing order key length.

This means that this package is not well suited for situations where object adjacency is critical 
(like character order in collaborative text editing)

### What if I do have an identical key (even with jittering)?
Identical keys still possible if two peers both simultaneously insert at the same location, even with jittering on, and likely if you do not use jittering.

Best practice is use another ID as tiebreaker like the object ID. 
If you detect an Identical key, you can always just regenerate one (or both)

### How long can the keys get?
There is no limit on how long the keys can get, 
and theoretically can get quite long if inserting on the same spot hundreds or thousand of times. 
But with human input the length of the order keys will normally stay reasonable.
