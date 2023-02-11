export type CmdResponse =
    | { success: true; data: string[] }
    | { success: false; error: any };
