"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureParentDir = ensureParentDir;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function ensureParentDir(filePath) {
    fs_1.default.mkdirSync(path_1.default.dirname(path_1.default.resolve(filePath)), { recursive: true });
}
