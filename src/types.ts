import { SpawnOptions } from 'child_process';

export interface Project {
  name: string;
  apps: App[];
}

export interface App {
  name: string;
  configList: {
    [key: string]:
      | ({ location: 'local' } & LocationLocal)
      | ({ location: 'remote' } & LocationRemote);
  };
  publishers: AppPublisher[];
}

export interface AppsToPublish {
  project: Project;
  app: App;
  publisher: AppPublisher;
}

export type LocationLocal = {
  platform: 'win32' | 'posix';
  path: string;
};
export type LocationRemote = LocationLocal & {
  server: string;
  protocol: string;
  username: string;
  password: string;
  hostkey?: string;
};
export type AppPublisher = { name: string; tasks: Task[] };
export enum Packager {
  npm = 'npm',
  yarn = 'yarn',
}

export enum TaskType {
  RUN_PACKAGE_SCRIPT_LOCAL = 'RUN_PACKAGE_SCRIPT_LOCAL',
  RUN_PACKAGE_SCRIPT_REMOTE = 'RUN_PACKAGE_SCRIPT_REMOTE',
  RUN_CMD_LOCAL = 'RUN_CMD_LOCAL',
  RUN_CMD_REMOTE = 'RUN_CMD_REMOTE',
  UPLOAD_FILES_LOCAL_TO_REMOTE = 'UPLOAD_FILES_LOCAL_TO_REMOTE',
  RUN_TASKS_FROM_PUBLISHER = 'RUN_TASKS_FROM_PUBLISHER',
}

type CmdType =
  | string
  | { wait: number; cmd: string }
  | Array<string | { wait: number; cmd: string }>;
export type LocalCmd = {
  message?: string;
  command: string;
  args?: string[];
  spawnOptions?: SpawnOptions;
  shellCommands?: CmdType;
};
export type FilesToCopy = {
  src: string | string[];
  dest: string | string[];
};

export type Task =
  | ({ type: TaskType.RUN_PACKAGE_SCRIPT_LOCAL } & TaskRunPackageScriptLocal)
  | ({ type: TaskType.RUN_PACKAGE_SCRIPT_REMOTE } & TaskRunPackageScriptRemote)
  | ({ type: TaskType.RUN_CMD_LOCAL } & TaskRunCmdLocal)
  | ({ type: TaskType.RUN_CMD_REMOTE } & TaskRunCmdRemote)
  | ({
      type: TaskType.UPLOAD_FILES_LOCAL_TO_REMOTE;
    } & TaskUploadFilesLocalToRemote)
  | ({ type: TaskType.RUN_TASKS_FROM_PUBLISHER } & TaskRunTasksFromPublisher);

interface TaskBase {
  message?: string;
  ID?: string;
}

export type TaskRunPackageScriptLocal = TaskBase & {
  useConfig: string;
  script: string;
  packager: Packager;
};
export type TaskRunPackageScriptRemote = TaskBase & {
  useConfig: string;
  script: string;
  packager: Packager;
};
export type TaskRunCmdLocal = TaskBase & {
  useConfig: string;
  cmd: LocalCmd | LocalCmd[];
};
export type TaskRunCmdRemote = TaskBase & {
  useConfig: string;
  cmd: CmdType;
};
export type TaskUploadFilesLocalToRemote = TaskBase & {
  localConfig: string;
  remoteConfig: string;
  files: FilesToCopy | Array<FilesToCopy>;
};
export type TaskRunTasksFromPublisher = TaskBase & {
  publisher: string;
  taskId: string;
};
