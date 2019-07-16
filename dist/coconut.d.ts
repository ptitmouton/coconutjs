export interface JobOutputFormat {
    'mp4': string | undefined;
    'mp4:hevc': string | undefined;
    'webm': string | undefined;
    'webm:vp9': string | undefined;
    'avi': string | undefined;
    'asf': string | undefined;
    'mpegts': string | undefined;
    'mov': string | undefined;
    'flv': string | undefined;
    'mkv': string | undefined;
    '3gp': string | undefined;
    'ogv': string | undefined;
    'ogg': string | undefined;
    'mp3': string | undefined;
    'jpg': string | undefined;
    'png': string | undefined;
    'gif': string | undefined;
    [key: string]: string | undefined;
}
export interface CreateJobOptions {
    api_version?: string;
    conf?: string;
    vars?: {
        [varname: string]: string;
    };
    api_key: string;
    source: string;
    webhook: string;
    outputs: JobOutputFormat;
}
export interface Job {
    id: number;
    output_urls: string[];
    event: string;
    created_at: string;
    completed_at: string;
    status: string;
    progress: string;
    errors?: JobOutputFormat;
    error_code?: string;
    error_message?: string;
}
export declare type Callback<T> = (error: (null | Error), job?: T) => void;
export default class CoconutJS {
    private apiKey;
    constructor(apiKey?: string | undefined);
    createJob(options: CreateJobOptions): Promise<Job>;
    createJob(options: CreateJobOptions, callback: Callback<Job>): void;
    getJob(jobId: number): Promise<Job>;
    getJob(jobId: number, callback: Callback<Job>): void;
    getAllMetadata(jobId: number): Promise<Job>;
    getAllMetadata(jobId: number, callback: Callback<Job>): void;
    getAllMetadataFor(jobId: string, sourceOrOutput: string): Promise<Job>;
    getAllMetadataFor(jobId: string, sourceOrOutput: string, callback: Callback<Job>): void;
    private sendCoconutRequest<T>(requestOptions, data?);
    private submit<T>(configContent);
    private get<T>(path);
    private getRequestOptions(method, options?);
    private getConfig(options);
}
