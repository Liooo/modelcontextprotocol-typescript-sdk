import { Client } from './client/index.js';
import { StreamableHTTPClientTransport } from './client/streamableHttp.js';
import { z } from 'zod';
import {
  CallToolResultSchema,
  JSONRPCErrorSchema,
  JSONRPCResponseSchema,
  ProgressNotificationSchema,
} from './types.js';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { ProgressCallback } from './shared/protocol.js';
import { exit } from 'process';

const resume = ({
  onprogress,
  resume,
  timeout = 10000,
}: {
  onprogress?: ProgressCallback;
  resume: { type: 'resumability'; resumptionToken: string };
  timeout?: number;
}) => {
  return new Promise((resolve, reject) => {
    const onmessageOrig = transport.onmessage;
    const onerrorOrig = transport.onerror;
    const oncloseOrig = transport.onclose;

    const cleanup = () => {
      transport.onmessage = onmessageOrig;
      transport.onerror = onerrorOrig;
      transport.onclose = oncloseOrig;
    };

    transport.onmessage = (message) => {
      const notification = ProgressNotificationSchema.safeParse(message);
      if (notification.success) {
        onprogress?.(notification.data.params);
        return;
      }

      const error = JSONRPCErrorSchema.safeParse(message);
      if (error.success) {
        cleanup();
        transport.close();
        reject(
          new Error(
            `Server error (${error.data.error.code}): ${error.data.error.message}`,
          ),
        );
        return;
      }

      const response = JSONRPCResponseSchema.safeParse(message);
      if (response.success) {
        cleanup();
        transport.close();
        resolve(response.data.result);
        return;
      }

      console.warn('Unknown message during resumption:', message);
    };

    transport.onclose = () => {
      console.log('closed');
      cleanup();
      reject(new Error('Connection closed before response received'));
    };

    transport.onerror = (e) => {
      console.log('error');
      cleanup();
      transport.close();
      reject(e);
    };

    // any method triggers resumption internally, when resumptionToken is specified
    transport
      .send([], { resumptionToken: resume.resumptionToken })
      .then(() => {
        console.log('send resolve');
      })
      .catch((e) => {
        console.log('send reject', e);
        cleanup();
        reject(e);
      });
  });
};

const toolCall = async ({ onprogress }: { onprogress?: ProgressCallback }) =>
  client.callTool(
    {
      name: 'long',
      arguments: { count: 3 },
      _meta: { progressToken: 'my-progress-token' },
    },
    CallToolResultSchema,
    {
      onresumptiontoken: (token) => {
        console.log('resumption token on call:', token);
      },
      onprogress,
      timeout: 60 * 60 * 1000,
    },
  );

const onprogress: ProgressCallback = (p) => {
  console.log('progress:', p);
};

const url = 'http://localhost:9999/mcp';
const client = new Client({
  name: 'streamable-http-client',
  version: '1.0.0',
});

const transport = new StreamableHTTPClientTransport(new URL(url), {
  fetch: (u, i) => {
    console.log('-----');
    console.log(i);
    return fetch(u, i);
  },
});

if (process.argv.includes('--resume')) {
  // Must start the transport to initialize abort controller
  await transport.start();

  try {
    const result = await resume({
      onprogress,
      resume: {
        type: 'resumability',
        resumptionToken: process.argv[process.argv.indexOf('--resume') + 1],
      },
    });
    console.log('result:', JSON.stringify(result, null, 4));
  } catch (e) {
    console.error('error during resumption:', e);
    exit(1);
  }

  exit(0);
}

await client.connect(transport);

const result = await toolCall({
  onprogress: (p) => {
    console.log(p);
  },
});

console.log('result:', JSON.stringify(result, null, 4));

await transport.close();
