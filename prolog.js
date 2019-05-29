// node types
const [VAR, REF, SYM, DOT] = [0, 1, 2, 3];

// constructors
function Var() {
	return {type: VAR};
}

function Sym(name) {
	return {type: SYM, head: name};
}

function Dot(head, tail) {
	return {type: DOT, head: head, tail: tail};
}

function *unify(a, b) {
	// follow REFs to the correct node
	while(a.type == REF) a = a.head;
	while(b.type == REF) b = b.head;
	
	// a is unbound
	if(a.type == VAR) {
		// bind it 'inside' the yield
		a.type = REF;
		a.head = b;
		yield null;
		a.type = VAR;
		return;
	}
	
	// b is unbound
	if(b.type == VAR) {
		// same as above, but the other way around
		b.type = REF;
		b.head = a;
		yield null;
		b.type = VAR;
		return;
	}
	
	// both are symbols
	if(a.type == SYM && b.type == SYM) {
		if(a.head == b.head)
			yield null;
		return;
	}
	
	// both are dots
	if(a.type == DOT && b.type == DOT) {
		// unify heads and tails separately
		for(const _ of unify(a.head, b.head))
		for(const _ of unify(a.tail, b.tail))
			yield null;
	}
}
