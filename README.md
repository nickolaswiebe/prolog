# Prolog

Prolog relations are compiled to generator functions, which yield once for each result, with the arguments being unified correctly until the generator next yields. This ensures that `foreach`-like loops over results will always have the correct bindings inside.

## Example

```prolog
append([], Q, Q).
append([H|A], B, [H|Q]) :- append(A, B, Q).
```

Compiles to:

```javascript
function* append(Arg1, Arg2, Arg3) {
	const Q = Variable();
	const H = Variable();
	const A = Variable();
	const B = Variable();
	for(const _ of unify(Arg1, nil))
		for(const _ of unify(Arg2, Q))
			for(const _ of unify(Arg3, Q))
				yield null;
	for(const _ of unify(Arg1, pair(H, A)))
		for(const _ of unify(Arg2, B))
			for(const _ of unify(Arg3, pair(H, Q)))
				for(const _ of append(A, B, Q))
					yield null;
}
```
