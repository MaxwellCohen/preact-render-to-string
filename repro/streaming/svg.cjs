const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
	const results = [];
	for (const native of [false, true]) {
		const browser = await chromium.launch({
			executablePath: process.env.CHROME_PATH,
			headless: true,
			args: [
				`--${native ? 'enable' : 'disable'}-blink-features=DocumentPatching`
			]
		});
		const p = await browser.newPage();
		await p.addInitScript(() => {
			const MO = window.MutationObserver;
			window.observers = [];
			window.MutationObserver = class extends MO {
				constructor(cb) {
					const stats = { callbacks: 0, capped: false };
					super((rs, observer) => {
						if (++stats.callbacks > 30) {
							stats.capped = true;
							observer.disconnect();
							return;
						}
						cb(rs, observer);
					});
					observers.push(stats);
				}
			};
		});
		const nav = p.goto(`http://127.0.0.1:4197/?session=svg${native}`);
		await p.waitForFunction(() => window.start);
		await p.evaluate(() => {
			const holder = document.createElement('div');
			holder.innerHTML =
				'<svg><foreignObject><button xmlns="http://www.w3.org/1999/xhtml" id="svg-button">click</button></foreignObject></svg>';
			window.svgOriginal = holder.querySelector('button');
			window.svgClicks = 0;
			svgOriginal.onclick = () => svgClicks++;
			document.body.append(holder);
		});
		await p.waitForTimeout(100);
		const result = await p.evaluate(() => {
			document.querySelector('#svg-button').click();
			return {
				readyState: document.readyState,
				sameNode: svgOriginal === document.querySelector('#svg-button'),
				clicks: svgClicks,
				observers
			};
		});
		results.push({ native, ...result });
		console.log(results.at(-1));
		for (const id of ['a', 'b'])
			await p.request.get(
				`http://127.0.0.1:4197/resolve?session=svg${native}&id=${id}`
			);
		await nav;
		await browser.close();
	}
	fs.writeFileSync(
		'verification/svg-results.json',
		JSON.stringify(results, null, 2)
	);
})();
