import { encodeEntities } from './util.js';

/* eslint-disable no-var, key-spacing, object-curly-spacing, prefer-arrow-callback, semi, keyword-spacing */

// Default <preact-island> init script source:
// function initPreactIslandElement() {
// 	class PreactIslandElement extends HTMLElement {
// 		connectedCallback() {
// 			var d = this;
// 			if (!d.isConnected) return;

// 			let i = this.getAttribute('data-target');
// 			if (!i) return;

// 			var s,
// 				e,
// 				c = document.createNodeIterator(document, 128);
// 			while (c.nextNode()) {
// 				let n = c.referenceNode;

// 				if (n.data == '$s:' + i) s = n;
// 				else if (n.data == '/$s:' + i) e = n;
// 				if (s && e) break;
// 			}
// 			if (s && e && s.parentNode !== document) {
// 				requestAnimationFrame(() => {
// 					// Hydration may finish after connectedCallback queues this frame.
// 					if (!d.isConnected || !s.isConnected || !e.isConnected || s.parentNode !== e.parentNode) {
// 						d.remove();
// 						return;
// 					}
// 					var nodes = [], p = s.nextSibling, root = s.parentNode;
// 					while (p && p !== e) {
// 						nodes.push(p);
// 						p = p.nextSibling;
// 					}
// 					if (!p) { d.remove(); return; }
// 					// DOM already referenced by a rendered host/text VNode belongs to
// 					// the client. A suspended component's fallback pointer does not.
// 					while (root && !root.__k) root = root.parentNode;
// 					var owned = new Set();
// 					function visit(vnode) {
// 						if (vnode) {
// 							if (typeof vnode.type !== 'function' && vnode.__e && vnode.__e.parentNode === s.parentNode) owned.add(vnode.__e);
// 							if (vnode.__k) vnode.__k.forEach(visit);
// 						}
// 					}
// 					if (root) visit(root.__k);
// 					if (nodes.some(node => owned.has(node))) {
// 						var depth = 0;
// 						nodes.forEach(node => {
// 							if (node.nodeType === 8 && node.data.startsWith('$s')) depth++;
// 							else if (node.nodeType === 8 && node.data.startsWith('/$s')) depth--;
// 							else if (!depth && !owned.has(node)) node.remove();
// 						});
// 						d.remove();
// 						return;
// 					}
// 					p = e.previousSibling;
// 					while (p != s) {
// 						if (!p || p == s) break;
// 						e.parentNode.removeChild(p);
// 						p = e.previousSibling;
// 					}

// 					c = s;
// 					while (d.firstChild) {
// 						s = d.firstChild;
// 						d.removeChild(s);
// 						c.after(s);
// 						c = s;
// 					}

// 					d.parentNode.removeChild(d);
// 				});
// 			} else d.remove();
// 		}
// 	}

// 	customElements.define('preact-island', PreactIslandElement);
// }

// To modify the LEGACY_INIT_SCRIPT, uncomment the above code, modify it, and paste it into https://try.terser.org/.
const LEGACY_INIT_SCRIPT = `class e extends HTMLElement{connectedCallback(){var e=this;if(!e.isConnected)return;let t=this.getAttribute("data-target");if(t){for(var r,o,n=document.createNodeIterator(document,128);n.nextNode();){let e=n.referenceNode;if(e.data=="$s:"+t?r=e:e.data=="/$s:"+t&&(o=e),r&&o)break}r&&o&&r.parentNode!==document?requestAnimationFrame(()=>{if(e.isConnected&&r.isConnected&&o.isConnected&&r.parentNode===o.parentNode){for(var t=[],a=r.nextSibling,i=r.parentNode;a&&a!==o;)t.push(a),a=a.nextSibling;if(a){for(;i&&!i.__k;)i=i.parentNode;var d=new Set;if(i&&function e(t){t&&("function"!=typeof t.type&&t.__e&&t.__e.parentNode===r.parentNode&&d.add(t.__e),t.__k&&t.__k.forEach(e))}(i.__k),t.some(e=>d.has(e))){var s=0;return t.forEach(e=>{8===e.nodeType&&e.data.startsWith("$s")?s++:8===e.nodeType&&e.data.startsWith("/$s")?s--:s||d.has(e)||e.remove()}),void e.remove()}for(a=o.previousSibling;a!=r&&a&&a!=r;)o.parentNode.removeChild(a),a=o.previousSibling;for(n=r;e.firstChild;)r=e.firstChild,e.removeChild(r),n.after(r),n=r;e.parentNode.removeChild(e)}else e.remove()}else e.remove()}):e.remove()}}}customElements.define("preact-island",e);`;

// DPU init script source (opt-in, `dpu: true`):
// ((d) => {
// 	// Assumptions: the renderer always emits both $s markers as siblings, ids are unique numbers,
// 	// and a template never arrives before the outer boundary it patches into.
// 	let owned, lost,
// 		visit = (v) =>
// 			v && (v.__e && (owned.add(v.__e), v.__e.parentNode || lost.add(v.__e)), v.__k && v.__k.forEach(visit)),
// 		// collect the DOM every vnode under the nearest client root points at,
// 		// and separately the part of it that is detached (no parent left)
// 		collect = (s) => {
// 			let n = s.parentNode;
// 			owned = new Set();
// 			lost = new Set();
// 			while (n && !n.__k) n = n.parentNode;
// 			visit(n?.__k);
// 		},
// 		// DPU cannot patch into svg/math namespaces (needed even with native support),
// 		// so reparse each node between the markers in its parent's namespace.
// 		fixNamespace = (s, e) => {
// 			let n, next;
// 			if (s.parentNode.closest("svg,math"))
// 				for (n = s.nextSibling; n != e; n = next) (next = n.nextSibling), (n.outerHTML = n.outerHTML);
// 		},
// 		// <?start name=id>/<?end> are processing instructions natively and bogus comments otherwise
// 		marker = (n, t, id) =>
// 			n && (n.nodeType == 7 ? n.target == t : n.nodeType == 8 && n.data.startsWith("?" + t)) && (t != "start" || n.data.includes('"' + id + '"')),
// 		mo = new MutationObserver((records) =>
// 			records.forEach((r) => {
// 				let e = r.nextSibling, s = e, l, id;
// 				// Native DPU replaces the <?start>..<?end> range itself and consumes the template,
// 				// so the polyfill below never sees a template there. The <?end> removal is the signal,
// 				// and it is only valid when it sits right before the "/$s:<id>" end boundary.
// 				if (r.removedNodes[0]?.nodeName == "end" && e?.data?.startsWith("/$s:")) {
// 					id = e.data.slice(1);
// 					while ((s = s.previousSibling) && s.data != id);
// 					if (s) {
// 						collect(s);
// 						// client DOM that the swap detached must survive:
// 						// put it back and drop the server content
// 						if (lost.size) {
// 							while ((l = s.nextSibling) != e) l.remove();
// 							e.before(...lost);
// 						} else fixNamespace(s, e);
// 					}
// 				}
// 				// Polyfill: a template is closed once the node after it arrives.
// 				r.addedNodes.forEach((node) => {
// 					if ((node = node.previousSibling) && node.content) {
// 						let id = node.getAttribute("for"),
// 						c = d.createNodeIterator(d, 128);
// 						// find this boundary's markers, stopping as soon as both are found
// 						for (s = e = 0; (l = c.nextNode()) && !(s && e); )
// 							l.data == "$s:" + id ? (s = l) : l.data == "/$s:" + id && (e = l);
// 						if (e) {
// 							// DOM that a client vnode already owns (hydration got here first)
// 							// must survive, so leave the boundary alone and only drop the template.
// 							for (collect(s), l = s; (l = l.nextSibling) && l != e && !owned.has(l); );
// 							// A client that already resolved the boundary leaves no markers: skip.
// 							if (l == e && marker(s.nextSibling, "start", id) && marker(e.previousSibling, "end")) {
// 								while ((l = s.nextSibling) != e) l.remove();
// 								s.after(node.content);
// 								fixNamespace(s, e);
// 							}
// 							node.remove();
// 						}
// 					}
// 				});
// 			}),
// 		);
// 	mo.observe(d, { childList: 1, subtree: 1 });
// 	d.addEventListener("DOMContentLoaded", () => mo.disconnect());
// })(document);

// To modify the DPU_INIT_SCRIPT, uncomment the above code, modify it, and paste it into https://try.terser.org/.
const DPU_INIT_SCRIPT = `(e=>{let r,u,f=e=>e&&(r.add(e.__e),null===e.__e?.parentNode&&u.add(e.__e),e.__k&&e.__k.forEach(f)),b=n=>{let a=n.parentNode;for(r=new Set,u=new Set;a&&!a.__k;)a=a.parentNode;f(a?.__k)},h=(n,t)=>{let f,L;if(n.parentNode.closest("svg,math"))for(f=n.nextSibling;f!=t;f=L)L=f.nextSibling,f.outerHTML=f.outerHTML},m=(n,t,i)=>n&&(7==n.nodeType?n.target==t:8==n.nodeType&&n.data.startsWith("?"+t))&&("start"!=t||n.data.includes('"'+i+'"')),g=new MutationObserver(k=>k.forEach(o=>{let t=o.nextSibling,n=t,s,a,i;if("end"==o.removedNodes[0]?.nodeName&&"/"==t?.data?.[0]){for(i=t.data.slice(1);(n=n.previousSibling)&&n.data!=i;);if(n)if(b(n),u.size){for(;(a=n.nextSibling)!=t;)a.remove();t.before(...u)}else h(n,t)}o.addedNodes.forEach(d=>{let i,L;if((d=d.previousSibling)&&d.content){for(i=d.getAttribute("for"),L=e.createNodeIterator(e,128),n=t=0;(a=L.nextNode())&&!(n&&t);)a.data=="$s:"+i?n=a:a.data=="/$s:"+i&&(t=a);if(t){for(b(n),a=n;(a=a.nextSibling)&&a!=t&&!r.has(a););if(a==t&&m(n.nextSibling,"start",i)&&m(t.previousSibling,"end")){for(;(a=n.nextSibling)!=t;)a.remove();n.after(d.content),h(n,t)}d.remove()}}})}));g.observe(e,{childList:1,subtree:1}),e.addEventListener("DOMContentLoaded",()=>g.disconnect())})(document);`;

/**
 * @param {string} [nonce]
 * @param {boolean} [dpu] Use the opt-in `<template for>` wire format.
 * @returns {string}
 */
export function createInitScript(nonce, dpu) {
	const attrs = nonce ? ` nonce="${encodeEntities(nonce)}"` : '';
	return dpu
		? `<script${attrs}>${DPU_INIT_SCRIPT}</script>`
		: `<script${attrs}>(function(){${LEGACY_INIT_SCRIPT}}())</script>`;
}

/**
 * @param {string} id
 * @param {string} content
 * @param {boolean} [dpu] Use the opt-in `<template for>` wire format.
 * @returns {string}
 */
export function createSubtree(id, content, dpu) {
	// DPU: the trailing newline is a sibling node that tells the init script the
	// parser has closed the template, so it can patch before the stream ends.
	return dpu
		? `<template for="${id}">${content}</template>\n`
		: `<preact-island hidden data-target="${id}">${content}</preact-island>`;
}
