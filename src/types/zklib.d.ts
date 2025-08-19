declare module 'zklib' {
  export default class ZKLib {
    constructor(ip: string, port: number, timeout: number, inport: number);
    createSocket(): Promise<boolean>;
    closeSocket(): Promise<boolean>;
    getUsers(): Promise<unknown[]>;
    getRealTimeLogs(): Promise<unknown[]>;
    getAttendances(): Promise<unknown[]>;
    setUser(user: unknown): Promise<boolean>;
    deleteUser(uid: string): Promise<boolean>;
    disconnect(): Promise<boolean>;
    getInfo(): Promise<unknown>;
    executeCmd(command: number, data?: unknown): Promise<unknown>;
  }
}
