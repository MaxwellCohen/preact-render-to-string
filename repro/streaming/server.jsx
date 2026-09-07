import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { h } from 'preact';
import { renderToReadableStream } from '../src/stream';
import { app, resource } from './app';
const sessions = new Map();
const instrumentation = `<script>window.mutations=[];window.phase='shell';new MutationObserver(rs=>{for(const r of rs)window.mutations.push({phase:window.phase,type:r.type,target:r.target.nodeName,added:[...r.addedNodes].map(n=>n.outerHTML||n.data),removed:[...r.removedNodes].map(n=>n.outerHTML||n.data)})}).observe(document,{subtree:true,childList:true,characterData:true,attributes:true});</script>`;
const server = createServer(async (req, res) => {
	const u = new URL(req.url, 'http://localhost');
	if (u.pathname === '/client.js') {
		res.setHeader('Content-Type', 'application/javascript');
		res.end(readFileSync('verification/client.js'));
		return;
	}
	if (u.pathname === '/resolve') {
		sessions
			.get(u.searchParams.get('session'))
			[u.searchParams.get('id')].resolve();
		res.end('ok');
		return;
	}
	res.setHeader('Content-Type', 'text/html');
	res.setHeader('Cache-Control', 'no-store');
	const resources = { a: resource(), b: resource() };
	sessions.set(u.searchParams.get('session'), resources);
	res.write('<!doctype html><html><head>' + instrumentation + '</head><body>');
	const stream = renderToReadableStream(
		h('div', { id: 'root' }, app(resources))
	);
	const reader = stream.getReader();
	let i = 0;
	for (;;) {
		const { value, done } = await reader.read();
		if (done) break;
		let chunk = new TextDecoder().decode(value);
		if (u.searchParams.has('split') && chunk.includes('<template')) {
			const cut = chunk.indexOf('>', chunk.indexOf('<template')) + 1;
			res.write(chunk.slice(0, cut));
			await new Promise((r) => setTimeout(r, 150));
			res.write(chunk.slice(cut));
		} else res.write(chunk);
		if (i++ === 1) res.write('<script src="/client.js"></script>');
	}
	res.end('</body></html>');
});
server.listen(4197, '127.0.0.1', () => console.log('ready 4197'));
