"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskType = exports.Packager = void 0;
var Packager;
(function (Packager) {
    Packager["npm"] = "npm";
    Packager["yarn"] = "yarn";
})(Packager = exports.Packager || (exports.Packager = {}));
var TaskType;
(function (TaskType) {
    TaskType["RUN_PACKAGE_SCRIPT_LOCAL"] = "RUN_PACKAGE_SCRIPT_LOCAL";
    TaskType["RUN_PACKAGE_SCRIPT_REMOTE"] = "RUN_PACKAGE_SCRIPT_REMOTE";
    TaskType["RUN_CMD_LOCAL"] = "RUN_CMD_LOCAL";
    TaskType["RUN_CMD_REMOTE"] = "RUN_CMD_REMOTE";
    TaskType["UPLOAD_FILES_LOCAL_TO_REMOTE"] = "UPLOAD_FILES_LOCAL_TO_REMOTE";
    TaskType["RUN_TASKS_FROM_PUBLISHER"] = "RUN_TASKS_FROM_PUBLISHER";
})(TaskType = exports.TaskType || (exports.TaskType = {}));
