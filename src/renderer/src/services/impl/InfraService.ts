import { injectable } from "inversify-hooks";
import type { InfraActionArgs, InfraActionResult, PlatformType } from "../../../../shared/ipc";
import type { IInfraService } from "../interfaces";

@injectable()
export class InfraService implements IInfraService {
  private get api() {
    return window.api!.infra;
  }

  async executeAction(args: InfraActionArgs): Promise<InfraActionResult> {
    return this.api.executeAction(args);
  }
  async getStatus(): Promise<{ mainVmId: string | null; connected: boolean }> {
    return this.api.getStatus();
  }
  async getPlatform(environmentId: string, projectId: string): Promise<PlatformType> {
    return this.api.getPlatform(environmentId, projectId);
  }
}
