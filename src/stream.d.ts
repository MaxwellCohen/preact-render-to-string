import { VNode } from 'preact';

interface RenderStream extends ReadableStream<Uint8Array> {
	allReady: Promise<void>;
}

interface RenderToReadableStreamOptions {
	nonce?: string;
	/** Opt in to `<template for>` (declarative partial updates) streaming. */
	dpu?: boolean;
}

export function renderToReadableStream<P = {}>(
	vnode: VNode<P>,
	options?: RenderToReadableStreamOptions,
	context?: any
): RenderStream;
