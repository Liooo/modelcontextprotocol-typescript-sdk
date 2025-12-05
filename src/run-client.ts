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
    console.log('sendiing')
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
      name: 'long_running',
      arguments: { input_seconds: '10' },
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

// const url = 'http://localhost:9999/mcp';
const workspaceId = '55e8e9a5-2820-48d0-b98e-2c9be05e8412'
const url = `http://localhost:8001/api/v2/workspaces/${workspaceId}/mcp`

const client = new Client({
  name: 'streamable-http-client',
  version: '1.0.0',
});

const token = 'eyJhbGciOiJFZERTQSIsImtpZCI6InBYa2RDbFJXd0kwUVROSHUwaUFtNEozM1pyem95cktTIn0.eyJuYW1lIjoicnlvLnkrMSIsImVtYWlsIjoicnlvLnkrMUBjYXJub3QuYWkiLCJlbWFpbFZlcmlmaWVkIjpmYWxzZSwiaW1hZ2UiOm51bGwsImNyZWF0ZWRBdCI6IjIwMjUtMTItMDFUMTA6Mjk6MTUuOTA0WiIsInVwZGF0ZWRBdCI6IjIwMjUtMTItMDFUMTA6Mjk6MTUuOTA0WiIsInJvbGUiOiJ1c2VyIiwiYmFubmVkIjpmYWxzZSwiYmFuUmVhc29uIjpudWxsLCJiYW5FeHBpcmVzIjpudWxsLCJpZCI6IkhFZDhZYWhxZXR3TTNrUXM2dzd2TmhqV2R0cE9MSFdkIiwiaWF0IjoxNzY0OTAzOTQ0LCJpc3MiOiJodHRwOi8vbG9jYWxob3N0OjMwMDEiLCJhdWQiOiJodHRwOi8vbG9jYWxob3N0OjMwMDEiLCJleHAiOjE3NjUxMzA3MjcsInN1YiI6IkhFZDhZYWhxZXR3TTNrUXM2dzd2TmhqV2R0cE9MSFdkIn0.xJXyr1-Pvzqs3IfyE1a7pOoWeZrrhieOeC_aoShdURZMOxmvEwf_eqMOVOfkI1btcd7aBjOEbJPImVBZGw1eCg'
const transport = new StreamableHTTPClientTransport(new URL(url), {
  requestInit: {
    headers: {
      Authorization: `Bearer ${token}`, "Authorization-Type": "JWT"
    },
  },
  fetch: (u, i) => {
    console.log('-----FETCH');
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
