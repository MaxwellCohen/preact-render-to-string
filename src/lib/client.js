import { encodeEntities } from './util.js';

/* eslint-disable no-var, key-spacing, object-curly-spacing, prefer-arrow-callback, semi, keyword-spacing */

// ((d) => {
// 	let initPreactPatch = () => {
// 	  let isNotLoading = d.readyState[0] != "l", qsa = 'querySelectorAll',node;
// 	  // The trailing marker proves that a patch has finished parsing.
// 	  let markers = d.createNodeIterator(d, 128), marker;
// 	  while ((marker = markers.nextNode())) {
// 		if (marker.data.startsWith("$p:")) {
// 		  let template = marker.previousSibling;
// 		  if (template && template.localName == "template" && template.getAttribute("for") == marker.data.slice(3)) template._$p = true;
// 		  marker.remove();
// 		}
// 	  }
//   	  // loop through all <template[for]> and move them
// 	  for ( node of d[qsa]("template[for]")) {
// 		// make sure the template is done streaming in
// 		if (node._$p || isNotLoading || node.nextElementSibling) {
// 		  let s, e, n, p, c = d.createNodeIterator(d, 128), id = "$s:" + node.getAttribute("for");
// 		  // find the start and end markers in content
// 		  while ((n = c.nextNode()) && !(s && e)) {
// 			if (n.data == id) s = n;
// 			else if (n.data == "/" + id) e = n;
// 		  }
// 		  // remove the old template and insert the new one
// 		  if (s && e && s.parentNode !== d) {
// 			while ((p = s.nextSibling) && p != e) p.remove();
// 			s.after(node.content);
// 			node.remove();
// 		  }
// 		}
// 	  }

// 	 // re-parse SVG and MathML elements so they will be rendered correctly
// 	  for ( node of d[qsa]("svg *,math *")) {
// 		if (node.tagName < "a" && (node = node.closest("svg,math"))) {
// 		  node.innerHTML += "";
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
const INIT_SCRIPT = `(e=>{let t=()=>{let t,o,a="l"!=e.readyState[0],n="querySelectorAll",i=e.createNodeIterator(e,128);for(;o=i.nextNode();)if(o.data.startsWith("$p:")){let e=o.previousSibling;e&&"template"==e.localName&&e.getAttribute("for")==o.data.slice(3)&&(e._$p=!0),o.remove()}for(t of e[n]("template[for]"))if(t._$p||a||t.nextElementSibling){let r,o,a,n,i=e.createNodeIterator(e,128),l="$s:"+t.getAttribute("for");for(;(a=i.nextNode())&&(!r||!o);)a.data==l?r=a:a.data=="/"+l&&(o=a);if(r&&o&&r.parentNode!==e){for(;(n=r.nextSibling)&&n!=o;)n.remove();r.after(t.content),t.remove()}}for(t of e[n]("svg *,math *"))t.tagName<"a"&&(t=t.closest("svg,math"))&&(t.innerHTML+="");a&&r.disconnect()},r=new MutationObserver(t);r.observe(e,{childList:1,subtree:1}),e.addEventListener("DOMContentLoaded",t)})(document);`;

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
	return `<template for="${id}">${content}</template><!--$p:${id}-->`;
}
