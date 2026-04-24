"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDeviceConnector = createDeviceConnector;
const TopAccessExportConnector_1 = require("./filewatch/TopAccessExportConnector");
const TopDataTcpConnector_1 = require("./topdata/TopDataTcpConnector");
function createDeviceConnector(config) {
    if (config.device.mode === "file-watch") {
        return new TopAccessExportConnector_1.TopAccessExportConnector(config);
    }
    return new TopDataTcpConnector_1.TopDataTcpConnector(config);
}
