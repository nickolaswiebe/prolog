// utilities
function unique(array) {
	return [...new Set(array)];
}

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

// term unification
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

let nvar = 0;
function str(expr) {
	// follow REFs as before
	while(expr.type == REF) expr = expr.head;
	if(expr.type == VAR)
		return `_${expr.tail = expr.tail || nvar++}`;
	if(expr.type == SYM) return expr.head;
	let items = [];
	do { items.push(str(expr.head)); expr = expr.tail; }
	while(expr.type == DOT);
	return `(${items.join(` `)})`;
}

// compiler
function is_var(sym) {
	return /^[A-Z]/.test(sym);
}
function vars(expr) {
	return unique(expr.flat(Infinity).filter(is_var));
}
function compile_var(name) {
	return `const ${name} = Var();`;
}
function compile_expr(expr) {
	if(expr instanceof Array)
		if(expr.length === 0)
			return `Sym("nil")`;
		else
			return `Dot(${compile_expr(expr[0])}, ${compile_expr(expr.slice(1))})`;
	else
		if(is_var(expr))
			return expr;
		else
			return `Sym("${expr}")`;
}
function compile_clause([relation, ...args]) {
	return `for(const _ of ${relation}(${compile_expr(args)}))`;
}
function compile_rule([head, ...clauses]) {
	return `for(const _ of unify($Args, ${compile_expr(head)}))
		${clauses.map(compile_clause).join("")}
		yield $Args;`;
}
function compile_relation(name, rules) {
	return `function* ${name}($Args) {
		${vars(rules).map(compile_var).join("")}
		${rules.map(compile_rule).join("")}
	}`;
}
function parse(code) {
	code = code.replace(/#.*$/gm,"");
	code = code.replace(/[()]/g," $& ");
	code = code.replace(/\s+/g," ");
	code = code.replace(/\b \(/g,",(");
	code = code.replace(/\) \b/g,"),");
	code = code.replace(/\b \b/g,",");
	code = code.replace(/\) \(/g,"),(");
	code = code.replace(/\b\w+\b/g,"'$&'");
	code = code.replace(/\(/g,"[");
	code = code.replace(/\)/g,"]");
	return new Function(`return [${code}];`)();
}
function compile(code) {
	const funcs = {};
	for(const [[name, ...args], ...clauses] of parse(code))
		funcs[name] = (funcs[name] || []).concat([[args, ...clauses]]);
	const ret = [];
	for(const name in funcs)
		ret.push(compile_relation(name, funcs[name]));
	return ret.join("\n");
}

const code = `
((append () Q Q))
((append (pair H A) B (pair H Q)) (append A B Q))
((main (A B Q)) (append A B Q))
`;

let answers = new Function(`
	// in order to make these functions/values available, we have to
	// explicitly import them into the new Function()
	const [VAR, REF, SYM, DOT] = [0, 1, 2, 3];
	${unify}
	${Var} ${Sym} ${Dot}
	${compile(code)}
	return main(Var());
`)();

for(answer of answers)
	console.log(str(answer));
