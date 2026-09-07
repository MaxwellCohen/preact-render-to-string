const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
	let results = [];
	for (const native of [false, true]) {
		const browser = await chromium.launch({
			executablePath: process.env.CHROME_PATH,
			headless: true,
			args: [
				`--${native ? 'enable' : 'disable'}-blink-features=DocumentPatching`
			]
		});
		const probe = await browser.newPage();
		await probe.setContent(
			'<div id="probe"><?start name="probe">old<?end></div><template for="probe">new</template>'
		);
		if (
			(await probe.locator('#probe').textContent()) !== (native ? 'new' : 'old')
		)
			throw new Error('Browser did not honor the requested DPU mode');
		await probe.close();
		for (const mode of [
			'server-first',
			'client-first',
			'suspended-client-first',
			'server-while-suspended',
			'mismatch',
			'server-first-mismatch',
			'split'
		]) {
			const page = await browser.newPage();
			let errors = [];
			page.on('pageerror', (e) => errors.push(e.message));
			page.on('console', (m) => {
				if (['error', 'warning'].includes(m.type())) errors.push(m.text());
			});
			const session = `${native}-${mode}`;
			const navigation = page.goto(
				`http://127.0.0.1:4197/?session=${session}${mode === 'split' ? '&split=1' : ''}`,
				{ waitUntil: 'load' }
			);
			await page.waitForFunction(() => window.start);
			const snapshots = [];
			const snap = async (label) => {
				await page.waitForTimeout(80);
				snapshots.push(
					await page.evaluate(
						(label) => ({
							label,
							html: document.querySelector('#root').innerHTML,
							text: document.querySelector('#root').textContent,
							templates: document.querySelectorAll('template[for]').length,
							aSame: window.savedA
								? window.savedA === document.querySelector('#a')
								: null
						}),
						label
					)
				);
			};
			const phase = (label) => page.evaluate((x) => (window.phase = x), label);
			const server = async (id) => {
				await phase('server-' + id);
				await page.request.get(
					`http://127.0.0.1:4197/resolve?session=${session}&id=${id}`
				);
				await snap('server-' + id);
			};
			const client = async (id) => {
				await phase('client-' + id);
				await page.evaluate((id) => resolveClient(id), id);
				await snap('client-' + id);
			};
			await snap('shell');
			if (['client-first', 'mismatch'].includes(mode)) {
				await phase('hydrate');
				await page.evaluate((m) => start(true, m), mode === 'mismatch');
				await snap('hydrated');
				await page.locator('#a').click();
				await page.evaluate(
					() => (window.savedA = document.querySelector('#a'))
				);
				await snap('clicked-before-server');
				await server('b');
				await server('a');
			} else if (mode === 'suspended-client-first') {
				await page.evaluate(() => start());
				await client('a');
				await page.locator('#a').click();
				await page.evaluate(
					() => (window.savedA = document.querySelector('#a'))
				);
				await client('b');
				await server('b');
				await server('a');
			} else if (mode === 'server-while-suspended') {
				await page.evaluate(() => start());
				await server('b');
				await server('a');
				await navigation;
				await client('a');
				await client('b');
			} else {
				await server('b');
				await server('a');
				await navigation;
				await page.evaluate(
					() => (window.savedA = document.querySelector('#a'))
				);
				await phase('hydrate');
				await page.evaluate(
					(m) => start(true, m),
					mode === 'server-first-mismatch'
				);
				await snap('hydrated');
			}
			await navigation;
			await phase('final-click');
			await page
				.locator('#a')
				.click({ timeout: 2000 })
				.catch((e) => errors.push(e.message));
			await snap('final');
			const diagnostics = await page.evaluate(() => ({
				native: 'htmlFor' in HTMLTemplateElement.prototype,
				mutations: window.mutations
			}));
			results.push({ native, mode, errors, snapshots, ...diagnostics });
			fs.writeFileSync(
				'verification/results.json',
				JSON.stringify(results, null, 2)
			);
			console.log(
				JSON.stringify({ native, mode, errors, final: snapshots.at(-1) })
			);
			await page.close();
		}
		await browser.close();
	}
	fs.writeFileSync(
		'verification/results.json',
		JSON.stringify(results, null, 2)
	);
})().catch((e) => {
	console.error(e);
	process.exit(1);
});
