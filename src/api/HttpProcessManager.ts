import {default as IProcessManager , IProcess} from "./ProcessManager";
import {default as EventEmitter} from "./EventEmitter";

export class HttpProcessManager {
    private static resourceToProcess (resource: any): IProcess {
        return {
            programName: null,
            filePath: null,
            args: resource.attributes.args || [ ],
            pid: Number(resource.id)
        };
    }

    private eventEmitter = new EventEmitter();
    private io: SocketIOClient.Socket;
    private http: vuejs.Http

    public constructor (http: vuejs.Http, document, host: string, authToken?) {
        this.http = http;
        //const host = `${document.location.protocol}//${document.location.hostname}:${document.location.port}`;
        this.io = io(host, {query: {jwtToken: authToken}});
        this.socketIoRegisterNewProcessHandler();
        this.socketIoRegisterStreamDataHandler('stdout');
        this.socketIoRegisterStreamDataHandler('stderr');
        this.socketIoRegisterProcessExitHandler();
    }

    public async run (args: string[] = [ ]) {
        let response = (await this.http.post('/api/processes', {
            data: {
                type: 'process',
                attributes: {
                    programId: null,
                    fileId: null,
                    args
                }
            }
        }))['data'];

        return HttpProcessManager.resourceToProcess(response);
    }

    public async kill (pid: number) {
        await this.http.delete(`/api/processes/${pid}`);
    }

    public async writeStdin (pid: number, data: string): Promise<void> {
        await this.http.patch(`/api/processes/${pid}/stdin`, data);
    }

    public async getProcess (pid: number): Promise<IProcess> {
        let response = (await this.http.get(`/api/processes/${pid}`))['data'];
        return HttpProcessManager.resourceToProcess(response);
    }

    public on (event: string, handler: Function) {
        this.eventEmitter.on(event, handler);
    }

    private socketIoRegisterNewProcessHandler () {
        this.io.on('process_new', (process: IProcess) => {
            this.eventEmitter.emit('new', process);
        });
    }

    private socketIoRegisterProcessExitHandler () {
        this.io.on('process_exit', (pid: number) => {
            this.eventEmitter.emit('exit', pid);
        });
    }

    private socketIoRegisterStreamDataHandler (stream: string) {
        this.io.on('process_data_' + stream, (pid: number, data: string) => {
            this.eventEmitter.emit(stream, pid, data);
        });
    }
}