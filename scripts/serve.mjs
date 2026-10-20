// Production-only test server emulating Pages: unknown paths return 404.html with status 404.
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root=resolve('dist');
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.xml':'application/xml','.txt':'text/plain'};
http.createServer(async(req,res)=>{
 try {
  const rawPath=new URL(req.url,'http://localhost').pathname;
  let path;
  try { path=decodeURIComponent(rawPath); } catch { path='/__invalid_encoding__'; }
  let file=resolve(root, '.'+path);
  if(file!==root&&!file.startsWith(root+sep)) {res.writeHead(403);res.end();return;}
  let code=200;
  try {if((await stat(file)).isDirectory())file=resolve(file,'index.html'); await stat(file);}catch{file=resolve(root,'404.html');code=404;}
  res.writeHead(code,{'Content-Type':types[extname(file)]||'application/octet-stream','Referrer-Policy':'no-referrer'});res.end(await readFile(file));
 }catch{res.writeHead(400);res.end('Bad request');}
}).listen(4322,'127.0.0.1',()=>console.log('Pages-like production fixture: http://127.0.0.1:4322'));
