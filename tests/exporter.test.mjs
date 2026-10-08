import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

const html = readFileSync(new URL('../so4t_data_export.html', import.meta.url), 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(script, 'standalone page has an inline script');

function page(responses) {
  const nodes = new Map();
  const calls = [];
  let downloaded;
  const node = id => {
    if (!nodes.has(id)) nodes.set(id, {
      value:'', hidden:false, disabled:false, textContent:'', className:'',
      handlers:{}, addEventListener(name, handler) { this.handlers[name] = handler; },
      setAttribute() {}, removeAttribute() {},
    });
    return nodes.get(id);
  };
  class TestURL extends URL { static createObjectURL(blob) { downloaded = blob; return 'blob:test'; } static revokeObjectURL() {} }
  const context = {
    document: {
      getElementById:node,
      body:{ append() {} },
      createElement:() => ({ click() {}, remove() {} }),
    },
    URL:TestURL, Blob, TextEncoder, Uint32Array, Uint8Array, DataView, Date, DOMException, AbortController,
    setTimeout:(callback, delay) => delay === 60000 ? 0 : setTimeout(callback,delay), clearTimeout,
    fetch:async (url, options) => {
      calls.push({ url:String(url), options });
      const path = url.pathname.replace(/^\/api\/v3|^\/v3\/teams\/[^/]+/, '');
      const key = path + (url.searchParams.has('page') ? `?page=${url.searchParams.get('page')}` : '');
      const entry = responses[key];
      if (!entry) throw new Error(`No fixture for ${key}`);
      if (entry.status) return { ok:false, status:entry.status, headers:{get:()=>null} };
      return { ok:true, json:async () => structuredClone(entry) };
    },
  };
  runInNewContext(script, context);
  node('instance-url').value = 'https://example.stackenterprise.co';
  node('access-token').value = 'test-token';
  return { node, calls, get downloaded() { return downloaded; }, submit:() => node('export-form').handlers.submit({preventDefault() {}}) };
}

function unzipStored(bytes) {
  const view = new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
  const files = {};
  let position = 0;
  while (view.getUint32(position,true) === 0x04034b50) {
    const size = view.getUint32(position+18,true);
    const nameSize = view.getUint16(position+26,true);
    const extraSize = view.getUint16(position+28,true);
    const name = new TextDecoder().decode(bytes.subarray(position+30,position+30+nameSize));
    const start = position+30+nameSize+extraSize;
    files[name] = JSON.parse(new TextDecoder().decode(bytes.subarray(start,start+size)));
    position = start+size;
  }
  assert.equal(view.getUint32(position,true),0x02014b50,'ZIP has a central directory');
  return files;
}

test('exports complete API v3 records, pagination, and nested content in one ZIP', async () => {
  const list = (items, totalPages=1) => ({items,totalPages});
  const app = page({
    '/users?page=1':list([{id:1}],2), '/users?page=2':list([{id:2}],2),
    '/users/1':{id:1,email:'one@example.com'}, '/users/2':{id:2,email:null},
    '/user-groups?page=1':list([{id:3,users:[{id:1}]}]),
    '/tags?page=1':list([{id:4,hasSynonyms:true}]),
    '/tags/4':{id:4,subjectMatterExperts:{users:[{id:1}]}},
    '/tags/4/synonyms?page=1':list([{id:5,name:'alias'}]),
    '/articles?page=1':list([{id:6,commentCount:1}]),
    '/articles/6':{id:6,bodyMarkdown:'article body'},
    '/articles/6/comments':[{id:7,body:'article comment'}],
    '/questions?page=1':list([{id:8,answerCount:1,commentCount:1}]),
    '/questions/8':{id:8,bodyMarkdown:'question body'},
    '/questions/8/comments':[{id:9,body:'question comment'}],
    '/questions/8/answers?page=1':list([{id:10,commentCount:1}]),
    '/questions/8/answers/10':{id:10,bodyMarkdown:'answer body'},
    '/questions/8/answers/10/comments':[{id:11,body:'answer comment'}],
  });
  await app.submit();
  assert.ok(app.downloaded instanceof Blob);
  const bytes = new Uint8Array(await app.downloaded.arrayBuffer());
  const files = unzipStored(bytes);
  const validated = execFileSync('python3', ['-c', 'import io,json,sys,zipfile; z=zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read())); assert z.testzip() is None; print(json.dumps(z.namelist()))'], {input:Buffer.from(bytes)});
  assert.equal(JSON.parse(validated).length,5);
  assert.deepEqual(Object.keys(files).sort(), ['articles.json','questions_answers_comments.json','tags.json','user_groups.json','users.json']);
  assert.equal(files['users.json'].length,2);
  assert.equal(files['tags.json'][0].synonyms[0].name,'alias');
  assert.equal(files['articles.json'][0].comments[0].body,'article comment');
  assert.equal(files['questions_answers_comments.json'][0].answers[0].comments[0].body,'answer comment');
  assert.ok(app.calls.every(call => call.url.startsWith('https://example.stackenterprise.co/api/v3/')));
  assert.ok(app.calls.every(call => call.options.method === 'GET' && call.options.headers.Authorization === 'Bearer test-token'));
  assert.equal(app.node('access-token').value,'');
});

test('stops without downloading when API v3 rejects a request', async () => {
  const app = page({ '/users?page=1':{status:403} });
  await app.submit();
  assert.equal(app.downloaded,undefined);
  assert.match(app.node('notice').textContent,/403/);
  assert.equal(app.node('start-button').disabled,false);
});

test('uses the team-scoped v3 URL for Basic and Business sites', async () => {
  const empty = {items:[],totalPages:0};
  const app = page(Object.fromEntries(['/users','/user-groups','/tags','/articles','/questions'].map(path => [`${path}?page=1`,empty])));
  app.node('instance-url').value = 'https://stackoverflowteams.com/c/example-team';
  await app.submit();
  assert.ok(app.downloaded instanceof Blob);
  assert.ok(app.calls.every(call => call.url.startsWith('https://api.stackoverflowteams.com/v3/teams/example-team/')));
});

test('rejects insecure URLs before transmitting the token', async () => {
  const app = page({});
  app.node('instance-url').value = 'http://example.stackenterprise.co';
  await app.submit();
  assert.equal(app.calls.length,0);
  assert.match(app.node('notice').textContent,/HTTPS/);
});
