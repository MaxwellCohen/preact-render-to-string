import { h, Fragment } from 'preact';
import { Suspense } from 'preact/compat';
import { useState } from 'preact/hooks';
export function resource() {
	let resolve;
	const r = { ready: false, promise: new Promise((r) => (resolve = r)) };
	r.resolve = () => {
		r.ready = true;
		resolve();
	};
	return r;
}
export function app(resources, mismatch = false) {
	function Item({ id }) {
		const [count, setCount] = useState(0);
		if (!resources[id].ready) throw resources[id].promise;
		return h(
			Fragment,
			null,
			h(
				'button',
				{ id, onClick: () => setCount((c) => c + 1) },
				`${id}:${count}`
			),
			h(mismatch ? 'strong' : 'span', { 'data-label': id }, 'label ' + id)
		);
	}
	return h(
		'main',
		null,
		h('p', { id: 'before' }, 'before'),
		...['a', 'b'].map((id) =>
			h(
				Suspense,
				{ fallback: h('i', { 'data-fallback': id }, 'loading ' + id) },
				h(Item, { id })
			)
		),
		h('p', { id: 'after' }, 'after')
	);
}
