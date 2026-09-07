const assert = require('node:assert/strict');
const results = require('./results.json');
let failures = 0;
function check(label, fn) {
	try {
		fn();
		console.log('PASS', label);
	} catch (error) {
		failures++;
		console.log('FAIL', label, error.message);
	}
}
for (const result of results) {
	const label = `DPU=${result.native} ${result.mode}`;
	const final = result.snapshots.at(-1);
	check(`${label}: no unexpected browser errors`, () => {
		assert.deepEqual(
			result.errors.filter(
				(error) =>
					!error.startsWith('Expected a DOM node') &&
					!error.startsWith('Add @babel/plugin-transform-react-jsx-source')
			),
			[]
		);
	});
	const earlyClient = [
		'client-first',
		'suspended-client-first',
		'mismatch'
	].includes(result.mode);
	check(`${label}: final content and interaction`, () => {
		assert.equal(
			final.text,
			`beforea:${earlyClient ? 2 : 1}label ab:0label bafter`
		);
		if (
			earlyClient ||
			['server-first', 'server-first-mismatch', 'split'].includes(result.mode)
		)
			assert.equal(final.aSame, true);
	});
	check(`${label}: no leftover patches`, () =>
		assert.equal(final.templates, 0)
	);
	if (result.mode === 'server-first') {
		check(`${label}: completed B visible while A pending`, () => {
			assert.equal(
				result.snapshots.find((s) => s.label === 'server-b').text,
				'beforeloading ab:0label bafter'
			);
		});
	}
}
for (const result of require('./svg-results.json')) {
	check(
		`DPU=${result.native}: foreignObject preserves node and listener`,
		() => {
			assert.equal(result.sameNode, true);
			assert.equal(result.clicks, 1);
		}
	);
	check(`DPU=${result.native}: observer settles`, () =>
		assert.equal(
			result.observers.some((o) => o.capped),
			false
		)
	);
}
console.log(`${failures} failed checks`);
process.exitCode = failures ? 1 : 0;
