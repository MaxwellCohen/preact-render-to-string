const esbuild = require('esbuild');
esbuild.buildSync({
	entryPoints: ['verification/server.jsx'],
	bundle: true,
	platform: 'node',
	outfile: 'verification/server.cjs'
});
esbuild.buildSync({
	entryPoints: ['verification/client.jsx'],
	bundle: true,
	platform: 'browser',
	outfile: 'verification/client.js'
});
