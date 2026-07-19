import { injectable } from "inversify-hooks";
import type { McpConnectionStatus, McpToolCallResult } from "../../../../shared/ipc";
import type { IMcpService } from "../interfaces";

@injectable()
export class McpService implements IMcpService {
  private get api() {
    return window.api!.mcp;
  }

  async getStatus(environmentId: string): Promise<McpConnectionStatus> {
    return this.api.getStatus(environmentId);
  }

  async connect(environmentId: string): Promise<McpConnectionStatus> {
    return this.api.connect(environmentId);
  }

  async disconnect(environmentId: string): Promise<void> {
    return this.api.disconnect(environmentId);
  }

  async callTool(environmentId: string, toolName: string, args: Record<string, unknown>): Promise<McpToolCallResult> {
    return this.api.callTool(environmentId, toolName, args);
  }

  onStatusChange(cb: (status: McpConnectionStatus) => void): () => void {
    return this.api.onStatusChange(cb);
  }
}
