import { injectable } from "inversify-hooks";
import type { ReachabilityStatus } from "../../../../shared/ipc";
import type { IReachabilityService } from "../interfaces";

@injectable()
export class ReachabilityService implements IReachabilityService {
  private get api() {
    return window.api!.reachability;
  }

  async getStatus(environmentId: string): Promise<ReachabilityStatus | null> {
    return this.api.getStatus(environmentId);
  }

  async getAll(): Promise<ReachabilityStatus[]> {
    return this.api.getAll();
  }

  onStatusChange(cb: (status: ReachabilityStatus) => void): () => void {
    return this.api.onStatusChange(cb);
  }
}
