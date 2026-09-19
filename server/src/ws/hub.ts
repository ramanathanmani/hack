/**
 * ws/hub.ts — client registry + broadcast(event). Raw `ws`, not socket.io
 * (architecture.md §1 bullet 3). Every WS payload is a strict subset of
 * `GET /api/state`'s shape (architecture decision #2 / architecture.md §8),
 * so the poll fallback and the push path converge on identical reducer code
 * on the client.
 */

import type { Server as HttpServer } from "node:http";
import { WebSocketServer, WebSocket } from "ws";
import type { WsEvent } from "../../../shared/types.js";

export class Hub {
  private wss: WebSocketServer;
  private clients = new Set<WebSocket>();

  constructor(server: HttpServer, path = "/ws") {
    this.wss = new WebSocketServer({ server, path });
    this.wss.on("connection", (socket) => {
      this.clients.add(socket);
      socket.on("close", () => this.clients.delete(socket));
      socket.on("error", () => this.clients.delete(socket));
    });
  }

  broadcast(event: WsEvent): void {
    const message = JSON.stringify(event);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    }
  }

  clientCount(): number {
    return this.clients.size;
  }

  close(): void {
    for (const client of this.clients) client.terminate();
    this.wss.close();
  }
}
