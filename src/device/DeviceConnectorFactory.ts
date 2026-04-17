import type { AppConfig } from "../config/schema";
import { DeviceConnector } from "./types";
import { TopAccessExportConnector } from "./filewatch/TopAccessExportConnector";
import { TopDataTcpConnector } from "./topdata/TopDataTcpConnector";

export function createDeviceConnector(config: AppConfig): DeviceConnector {
  if (config.device.mode === "file-watch") {
    return new TopAccessExportConnector(config);
  }
  return new TopDataTcpConnector(config);
}
