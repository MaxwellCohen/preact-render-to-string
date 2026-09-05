import { encodeEntities } from './util.js';

/* eslint-disable no-var, key-spacing, object-curly-spacing, prefer-arrow-callback, semi, keyword-spacing */

// ((d) => {
// 	let initPreactPatch = () => {
// 	  let isNotLoading = d.readyState[0] != "l", qsa = 'querySelectorAll',node;
//   	  // loop through all <template[for]> and move them
// 	  for ( node of d[qsa]("template[for]")) {
// 		// make sure the template is done streaming in
// 		if (isNotLoading || node.nextElementSibling) {
// 		  let s, e, n, p, c = d.createNodeIterator(d, 128), id = "$s:" + node.getAttribute("for");
// 		  // find the start and end markers in content
// 		  while ((n = c.nextNode()) && !(s && e)) {
// 			if (n.data == id) s = n;
// 			else if (n.data == "/" + id) e = n;
// 		  }
// 		  // remove the old template and insert the new one
// 		  if (s && e && s.parentNode !== d) {
// 			while ((p = s.nextSibling) && p != e) p.remove();
// 			let content = node.content;
// 			if (s.parentNode.namespaceURI != "http://www.w3.org/1999/xhtml") {
// 				let range = d.createRange();
// 				range.selectNodeContents(s.parentNode);
// 				content = range.createContextualFragment(node.innerHTML);
// 			}
// 			s.after(content);
// 			node.remove();
// 		  }
// 		}
// 	  }

// 	  // disconnect the mutation observer if the document is not loading (complete or interactive)
// 	  if (isNotLoading) mo.disconnect();
// 	};

// 	let mo = new MutationObserver(initPreactPatch);
// 	mo.observe(d, { childList: 1, subtree: 1 });
// 	d.addEventListener("DOMContentLoaded", initPreactPatch);
// })(document);

// To modify the INIT_SCRIPT, uncomment the above code, modify it, and paste it into https://try.terser.org/.
const INIT_SCRIPT = `(e=>{let t=()=>{let t,r="l"!=e.readyState[0];for(t of e.querySelectorAll("template[for]"))if(r||t.nextElementSibling){let n,r,o,a,l=e.createNodeIterator(e,128),d="$s:"+t.getAttribute("for");for(;(o=l.nextNode())&&(!n||!r);)o.data==d?n=o:o.data=="/"+d&&(r=o);if(n&&r&&n.parentNode!==e){for(;(a=n.nextSibling)&&a!=r;)a.remove();let o=t.content;if("http://www.w3.org/1999/xhtml"!=n.parentNode.namespaceURI){let r=e.createRange();r.selectNodeContents(n.parentNode),o=r.createContextualFragment(t.innerHTML)}n.after(o),t.remove()}}r&&n.disconnect()},n=new MutationObserver(t);n.observe(e,{childList:1,subtree:1}),e.addEventListener("DOMContentLoaded",t)})(document);`;

/**
 * @param {string} nonce
 * @returns {string}
 */
export function createInitScript(nonce) {
	return `<script${nonce ? ` nonce="${encodeEntities(nonce)}"` : ''}>${INIT_SCRIPT}</script>`;
}

/**
 * @param {string} id
 * @param {string} content
 * @returns {string}
 */
export function createSubtree(id, content) {
	return `<template for="${id}">${content}</template>`;
}
