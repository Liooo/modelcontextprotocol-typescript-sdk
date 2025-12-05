import { createServer } from 'node:http';
import { z } from 'zod';
import { McpServer } from './server/mcp.js';
import {
  EventStore,
  StreamableHTTPServerTransport,
} from './server/streamableHttp.js';
import { JSONRPCError, JSONRPCErrorSchema, JSONRPCMessage } from './types.js';

type StreamId = string;
type EventId = string;
const events: Record<EventId, { message: JSONRPCMessage; streamId: StreamId }> =
  {};

export class McpServerJsonRPCError extends Error {
  constructor(public jsonrpcError: JSONRPCError) {
    super(`MCP Server Error: ${jsonrpcError.error.message}`);
  }
}

const eventStore: EventStore = {
  storeEvent: async (streamId, message) => {
    const eventId = Object.keys(events).length.toString();
    events[eventId] = { message, streamId };
    console.log(
      `stored event eventId=${eventId} message=${JSON.stringify(message)}`,
    );

    // https://modelcontextprotocol.io/specification/2025-06-18/basic/transports
    // > Servers MAY attach an id field to their SSE events, as described in the SSE standard.
    // > If present, the ID MUST be globally unique across all streams within that session—or all streams with that specific client, if session management is not in use.
    //
    // ====> "globally unique across all streams within that session"
    return eventId; // return eventID
  },
  replayEventsAfter: async (lastEventId, { send }) => {
    console.log('replay!!!')
    if (!events[lastEventId]) {
      throw new McpServerJsonRPCError({
        jsonrpc: '2.0',
        error: { code: -32602, message: 'invalid last-event-id' },
        id: 0,
      });
    }

    console.log('got replay request with', lastEventId);
    const streamId = events[lastEventId].streamId;
    console.log('streamid', events[lastEventId].streamId);

    for (
      let i = parseInt(lastEventId) + 1;
      events[i.toString()].streamId === streamId;
      i++
    ) {
      console.log('replayiing event', i);
      await send(i.toString(), events[i.toString()]?.message);
    }
    return streamId;
  },
};

createServer(async (req, res) => {
  if (req.url === '/dump') {
    console.log('dumping events', JSON.stringify(events, null, 4));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end();
    return;
  }

  const server = new McpServer({ name: 'mcp-server', version: '1.0.0' });
  server.registerTool(
    'echo',
    { inputSchema: { message: z.string() } },
    async ({ message }) => ({
      content: [{ type: 'text', text: `Echo: ${message}` }],
    }),
  );
  server.registerTool(
    'long',
    { inputSchema: { count: z.number() } },
    async ({ count }, { sendNotification, _meta }) => {
      for (let i = 0; i < count; i++) {
        if (_meta?.progressToken) {
          await sendNotification({
            method: 'notifications/progress',
            params: { progress: i, progressToken: _meta.progressToken },
          });
        }
        await new Promise((r) => setTimeout(r, 1000));
        console.log(i, 'done');
      }
      console.log('finished!');
      return { content: [] };
    },
  );

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    eventStore,
  });

  transport.onclose = () => {
    console.log('closed');
  };

  // when error occurs during SSE communication
  transport.onerror = (e) => {
    if (e instanceof McpServerJsonRPCError) {
      res.write(`event: message\ndata: ${JSON.stringify(e.jsonrpcError)}\n\n`);
    } else {
      const error: JSONRPCError = {
        jsonrpc: '2.0',
        error: { code: -32603, message: `${e}` },
        id: 0, 
      }
      res.write(`event: message\ndata: ${JSON.stringify(error)}\n\n`);
    }
    transport.close()
    console.log('waiting')
    res.end();
  };
  await server.connect(transport);



  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks).toString();

  try {
    await transport.handleRequest(
      req,
      res,
      body ? JSON.parse(body) : undefined,
    );
  } catch (e) {
    console.log('error handling request:', e);
  }
}).listen(9999, () => console.log('MCP server on http://localhost:9999'));
