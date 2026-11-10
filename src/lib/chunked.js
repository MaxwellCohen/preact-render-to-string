import { renderToString } from '../index.js';
import { CHILD_DID_SUSPEND, COMPONENT, PARENT } from './constants.js';
import { Deferred } from './util.js';
import { createInitScript, createSubtree } from './client.js';

/**
 * @param {VNode} vnode
 * @param {RenderToChunksOptions} options
 * @returns {Promise<void>}
 */
export async function renderToChunks(
	vnode,
	{ context, onWrite, abortSignal, nonce, dpu }
) {
	context = context || {};

	/** @type {RendererState} */
	const renderer = {
		start: Date.now(),
		abortSignal,
		onWrite,
		onError: handleError,
		dpu: !!dpu,
		idPrefix: dpu ? createIdPrefix() : '',
		suspended: []
	};

	// Synchronously render the shell
	// @ts-ignore - using third internal RendererState argument
	const shell = renderToString(vnode, context, renderer);

	// Wait for any suspended sub-trees if there are any
	const len = renderer.suspended.length;
	if (len > 0) {
		// When rendering a full HTML document, the shell ends with </body></html>.
		// Inserting deferred patches after </html> is invalid HTML
		// and causes browsers to reject the content. Instead, we inject the deferred
		// content before the closing tags, then emit them last.
		const docSuffixIndex = getDocumentClosingTagsIndex(shell);
		const hasHtmlTag = shell.trimStart().startsWith('<html');
		const initialWrite =
			docSuffixIndex !== -1 ? shell.slice(0, docSuffixIndex) : shell;
		const prefix = hasHtmlTag ? '<!DOCTYPE html>' : '';
		onWrite(prefix + initialWrite);
		// The default <preact-island> format wraps deferred content in a hidden div.
		if (!dpu) onWrite('<div hidden>');
		onWrite(createInitScript(nonce, dpu));
		// We should keep checking all promises
		await forkPromises(renderer);
		if (!dpu) onWrite('</div>');
		if (docSuffixIndex !== -1) onWrite(shell.slice(docSuffixIndex));
	} else {
		onWrite(shell);
	}
}

/**
 * Random, attribute-safe token (80 bits) prepended to DPU boundary ids.
 * @returns {string}
 */
function createIdPrefix() {
	const bytes = new Uint8Array(10);
	const c = globalThis.crypto;
	if (c && c.getRandomValues) c.getRandomValues(bytes);
	else for (let i = 0; i < 10; i++) bytes[i] = Math.random() * 256;
	let out = 'p';
	for (let i = 0; i < 10; i++) out += bytes[i].toString(16).padStart(2, '0');
	return out + '-';
}

/**
 * If the shell ends with </body></html> (full document rendering), return that
 * suffix so it can be emitted *after* the deferred content, keeping the HTML valid.
 * @param {string} html
 * @returns {number}
 */
function getDocumentClosingTagsIndex(html) {
	return html.lastIndexOf('</body>');
}

async function forkPromises(renderer) {
	if (renderer.suspended.length > 0) {
		const suspensions = [...renderer.suspended];
		await Promise.all(renderer.suspended.map((s) => s.promise));
		renderer.suspended = renderer.suspended.filter(
			(s) => !suspensions.includes(s)
		);
		await forkPromises(renderer);
	}
}

/** @type {RendererErrorHandler} */
function handleError(error, vnode, renderChild) {
	if (!error || !error.then) return;

	// walk up to the Suspense boundary
	while ((vnode = vnode[PARENT])) {
		let component = vnode[COMPONENT];
		if (component && component[CHILD_DID_SUSPEND]) {
			break;
		}
	}

	if (!vnode) return;

	// DPU ids carry a random per-render prefix so that attacker-supplied HTML
	// containing <template for="..."> cannot target a boundary by guessing it.
	const id = this.idPrefix + vnode.__v;
	const found = this.suspended.find((x) => x.id === id);
	const race = new Deferred();

	const abortSignal = this.abortSignal;
	if (abortSignal) {
		// @ts-ignore 2554 - implicit undefined arg
		if (abortSignal.aborted) race.resolve();
		else abortSignal.addEventListener('abort', race.resolve);
	}

	const promise = error.then(
		() => {
			if (abortSignal && abortSignal.aborted) return;
			const suspendedCount = this.suspended.length;
			const child = renderChild(vnode.props.children, vnode);
			const suspendedAgain = this.suspended
				.slice(suspendedCount)
				.some((suspension) => suspension.id === id);
			if (!suspendedAgain) this.onWrite(createSubtree(id, child, this.dpu));
		},
		// TODO: Abort and send hydration code snippet to client
		// to attempt to recover during hydration
		this.onError
	);

	this.suspended.push({
		id,
		vnode,
		promise: Promise.race([promise, race.promise])
	});

	const fallback = renderChild(vnode.props.fallback);

	if (found) return '';
	return this.dpu
		? `<!--$s:${id}--><?start name="${id}">${fallback}<?end><!--/$s:${id}-->`
		: `<!--$s:${id}-->${fallback}<!--/$s:${id}-->`;
}
