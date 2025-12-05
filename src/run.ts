import { Client } from './client/index.js';
import { StreamableHTTPClientTransport } from './client/streamableHttp.js';

const v: keyof typeof ts = 'v1';

// prod ebara
//const target = {
//    wsId: 'b3da3a2b-458f-4639-96e3-d6374284b351',
//    secret: 'sk-ws-6ab527a280446bb8e8e56f6a3d828d8a0bcde4009180da0aec7bde69fee9a48e',
//    domain: 'https://api.jinba.io',
//    token: 'eyJhbGciOiJFZERTQSIsImtpZCI6InFlTk5jcHZHSTBzR2JhYnBNakZjUTZNUEUwUWpVN3VIIn0.eyJuYW1lIjoiUnlvIFlhbWFkYSIsImVtYWlsIjoicnlvLnlAY2Fybm90LmFpIiwiZW1haWxWZXJpZmllZCI6dHJ1ZSwiaW1hZ2UiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NMQVNjcHlNU2tBY2t4Z0VZSDZFUTF5SWNMR0NHSnByUWl6b3RlbUpLRXlldEhhNmc9czk2LWMiLCJjcmVhdGVkQXQiOiIyMDI1LTA5LTE1VDA1OjI1OjA1Ljk2OVoiLCJ1cGRhdGVkQXQiOiIyMDI1LTA5LTE1VDA1OjI1OjA1Ljk2OVoiLCJyb2xlIjpudWxsLCJiYW5uZWQiOmZhbHNlLCJiYW5SZWFzb24iOm51bGwsImJhbkV4cGlyZXMiOm51bGwsImlkIjoiSGNmMUNpNW11V000QzlYZm80d0pxOTF0R2gyVFZzazUiLCJpYXQiOjE3NjM4ODE5NjksImlzcyI6Imh0dHBzOi8vYXBwLmppbmJhLmRldiIsImF1ZCI6Imh0dHBzOi8vYXBwLmppbmJhLmRldiIsImV4cCI6MTc2Mzg4Mjg2OSwic3ViIjoiSGNmMUNpNW11V000QzlYZm80d0pxOTF0R2gyVFZzazUifQ.aYnSlZJRpu_AX-HczlgWCIX30z1WAfeahdoLGWG50d2FGgsEDVBVW9j0rAaBWeD-qzgQv_iCiRF7ETj8zE9uAg'
//};

// prod my test
const target = {
    wsId: '4b9e99cf-4997-4624-b4f4-6cdde7e6f929',
    secret: 'sk-ws-5bf83c467a5e7921fcaad3c569ae6e9751bdfe27e05eb5c9103b8219714fdf00',
    domain: 'https://api.jinba.io',
    token: ''
}

// staging
// const target = {
//     wsId: '0c698d75-4b89-4e7e-8a70-e822285ca846',
//     secret: 'sk-ws-c8b0b8ac883399d3911a048b83f56e0454e1acd888155a5e1f2eb6f2af376003',
//     domain: 'https://api.jinba.dev',
//     token: 'eyJhbGciOiJFZERTQSIsImtpZCI6InFlTk5jcHZHSTBzR2JhYnBNakZjUTZNUEUwUWpVN3VIIn0.eyJuYW1lIjoiUnlvIFlhbWFkYSIsImVtYWlsIjoicnlvLnlAY2Fybm90LmFpIiwiZW1haWxWZXJpZmllZCI6dHJ1ZSwiaW1hZ2UiOiJodHRwczovL2xoMy5nb29nbGV1c2VyY29udGVudC5jb20vYS9BQ2c4b2NMQVNjcHlNU2tBY2t4Z0VZSDZFUTF5SWNMR0NHSnByUWl6b3RlbUpLRXlldEhhNmc9czk2LWMiLCJjcmVhdGVkQXQiOiIyMDI1LTA5LTE1VDA1OjI1OjA1Ljk2OVoiLCJ1cGRhdGVkQXQiOiIyMDI1LTA5LTE1VDA1OjI1OjA1Ljk2OVoiLCJyb2xlIjpudWxsLCJiYW5uZWQiOmZhbHNlLCJiYW5SZWFzb24iOm51bGwsImJhbkV4cGlyZXMiOm51bGwsImlkIjoiSGNmMUNpNW11V000QzlYZm80d0pxOTF0R2gyVFZzazUiLCJpYXQiOjE3NjM4ODE5NjksImlzcyI6Imh0dHBzOi8vYXBwLmppbmJhLmRldiIsImF1ZCI6Imh0dHBzOi8vYXBwLmppbmJhLmRldiIsImV4cCI6MTc2Mzg4Mjg2OSwic3ViIjoiSGNmMUNpNW11V000QzlYZm80d0pxOTF0R2gyVFZzazUifQ.aYnSlZJRpu_AX-HczlgWCIX30z1WAfeahdoLGWG50d2FGgsEDVBVW9j0rAaBWeD-qzgQv_iCiRF7ETj8zE9uAg'
// };
//
// local api key
// const target = {
//     wsId: '83dc44d1-d04c-4047-bbcf-749eafe19156',
//     secret: 'sk-ws-7e54f99a0213494d326c1f603381c0e5e1ec943478cc846b92bb828c8feeb205',
//     domain: 'http://localhost:8001',
//     token:
//         ''
// }
// local jwt
// const target = {
//     wsId: '55e8e9a5-2820-48d0-b98e-2c9be05e8412',
//     secret: '',
//     domain: 'http://localhost:8001',
//     token:
//         'eyJhbGciOiJFZERTQSIsImtpZCI6IkZZdXF6MHo2WjBGUEpCcjFLRm1RMlhZN1F4ZmxWR0NYIn0.eyJuYW1lIjoiYWl0ZXN0IiwiZW1haWwiOiJhaXRlc3RAZXhhbXBsZS5jb20iLCJlbWFpbFZlcmlmaWVkIjpmYWxzZSwiaW1hZ2UiOm51bGwsImNyZWF0ZWRBdCI6IjIwMjUtMTEtMDlUMTA6NTc6NTcuNzg3WiIsInVwZGF0ZWRBdCI6IjIwMjUtMTEtMDlUMTA6NTc6NTcuNzg3WiIsInJvbGUiOiJ1c2VyIiwiYmFubmVkIjpmYWxzZSwiYmFuUmVhc29uIjpudWxsLCJiYW5FeHBpcmVzIjpudWxsLCJpZCI6IjRLdnhReWszbXFlY0hZWU9jOERJeWJreXRFUFN1ZmVmIiwiaWF0IjoxNzYzODA3MDQzLCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjMwMDEiLCJhdWQiOiJodHRwOi8vbG9jYWxob3N0OjMwMDEiLCJleHAiOjE3NjM4MDc5NDMsInN1YiI6IjRLdnhReWszbXFlY0hZWU9jOERJeWJreXRFUFN1ZmVmIn0.t-ZNLA1TiDB6f1qD1illcKoUq0juKUxibnr9XZUOcpAphpvLc42Oi2DgsbIXYYPgYmqTDedLYWU2Crh9GPsfCA'
// }

const client = new Client({
    name: 'streamable-http-client',
    version: '1.0.0'
});

let count = 0;
const myFetch = async (url, init: RequestInit) => {
    const c = count++;
    const headers = init.headers.keys().reduce((acc, key) => {
        let value: any;
        switch (key) {
            case 'authorization':
                value = '...';
                break;
            default:
                value = init.headers.get(key);
                break;
        }
        acc[key] = value;
        return acc;
    }, {} as any);

    console.log(`❓ ${c} ${init.method} ${url.toString()}\n`, `    ${JSON.stringify({ ...init, headers })}`);
    const before = performance.now();
    const resp = await fetch(url, init);
    const took = performance.now() - before;
    const cloned = resp.clone();

    console.log(`${cloned.ok ? '✅' : '⚠️'} ${c} ${cloned.status} ⏱️${Math.round(took / 1000)}s ${init.method} ${url.toString()}\n`);
    console.log(`    header: ${JSON.stringify(resp.headers)}`);

    (async () => {
        const body = await cloned.text();
        console.group();
        console.log(`📦 ${c} body\n${body}`);
        console.groupEnd();
    })();

    return resp;
};

const v1 = () => {
    const { wsId, secret, domain } = target;
    const baseUrl = `${domain}/api/v1/mcp/${wsId}/mcp`;
    return new StreamableHTTPClientTransport(new URL(baseUrl), {
        requestInit: {
            headers: {
                Authorization: `Bearer ${secret}`
            }
        },
        fetch: myFetch
    });
};
const v2 = () => {
    const { wsId, token, domain } = target;
    const baseUrl = `${domain}/api/v2/workspaces/${wsId}/mcp`;
    return new StreamableHTTPClientTransport(new URL(baseUrl), {
        requestInit: {
            headers: {
                'Authorization-Type': 'jwt',
                Authorization: `Bearer ${token}`
            }
        },
        fetch: myFetch
    });
};

const ts = { v1, v2 };

console.log(`==== running ${v} for ${target.domain} ===\n`);
const tp = ts[v]()
tp.onmessage = (msg)=>{
    console.group('onmessaage')
    console.log(JSON.stringify(msg, null, 2))
    console.groupEnd()
}
await client.connect(tp);
console.log('Connected using Streamable HTTP transport');

const tools = await client.listTools();
console.log(JSON.stringify(tools, null, 4));

await tp.terminateSession()



//{
//   tools: [
//     {
//       name: 'healthz',
//       description: 'Health check',
//       inputSchema: [Object]
//     },
//     { name: 'long_running', description: '', inputSchema: [Object] }
//   ]

// const result = await client.callTool({
//     name: 'long_running',
//     arguments: { input_seconds: '3' }
// });
//
// console.log('===== Tool call result =====');
// console.group();
// console.log(result);
// console.groupEnd();
// console.log('===== Tool call result =====');
