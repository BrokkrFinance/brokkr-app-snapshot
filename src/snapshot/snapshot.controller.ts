import { Controller, Get, Query } from "@nestjs/common";
import { SnapshotService } from "./snapshot.service";

@Controller("snapshot")
export class SnapshotController {
  constructor(private readonly snapshotService: SnapshotService) {}

  @Get()
  async generateSnapshot(@Query("snapshotBlock") snapshotBlock: number, @Query("usdThreshold") usdThreshold: number) {
    // Implement snapshot generation logic
    return this.snapshotService.getTotalSnapshotWithChecks(snapshotBlock, usdThreshold);
  }
}
