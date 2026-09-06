import 'preact/debug';
import { hydrate } from 'preact';
import { app, resource } from './app';
window.resources = { a: resource(), b: resource() };
window.start = (ready = false, mismatch = false) => {
	if (ready) Object.values(window.resources).forEach((r) => r.resolve());
	hydrate(app(window.resources, mismatch), document.getElementById('root'));
	window.started = true;
};
window.resolveClient = (id) => window.resources[id].resolve();
