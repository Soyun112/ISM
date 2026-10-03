import esbuild from 'esbuild';

await esbuild.build({
 entryPoints:['server/http.ts'],
 bundle:true,
 platform:'node',
 format:'esm',
 outfile:'api/chat.js',
 target:'node20',
 legalComments:'none'
});
