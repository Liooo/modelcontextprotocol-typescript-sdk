import {experimental_createMCPClient as createMCPClient} from 'ai'
import { StreamableHTTPClientTransport } from './client/streamableHttp.js'

const stuff = {
    wsId: '4b9e99cf-4997-4624-b4f4-6cdde7e6f929',
    secret: 'sk-ws-5bf83c467a5e7921fcaad3c569ae6e9751bdfe27e05eb5c9103b8219714fdf00',
    domain: 'https://api.jinba.io',
}

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

const { wsId, secret, domain } = stuff;
const baseUrl = `${domain}/api/v1/mcp/${wsId}/mcp`;
const transport = new StreamableHTTPClientTransport(new URL(baseUrl), {
    requestInit: {
        headers: {
            Authorization: `Bearer ${secret}`
        }
    },
    fetch: myFetch
});

const client = await createMCPClient({transport})
const tools = await client.tools()
console.log(JSON.stringify(tools, null, 4))
