import http, { RequestOptions } from 'http';
import https from 'https';
import { parse as parseUrl } from 'url';
var fs = require('fs');

const USER_AGENT = 'Coconut/3.0.0 (NodeJS)';
const COCONUT_URL = parseUrl(process.env.COCONUT_URL || 'https://api.coconut.co');

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
  vars?: { [varname: string]: string };
  api_key: string;
  source: string;
  webhook: string;
  outputs: JobOutputFormat;
}

export interface Job {
  id: number;
  output_urls: string[];
  event: string;
  errors?: JobOutputFormat;
  error_code?: string;
  error_message?: string;
}

export type Callback<T> = (error: (null | Error), job?: T) => void;

export default class CoconutJS {

  private apiKey: string;

  constructor(apiKey: string | undefined = process.env.COCONUT_API_KEY) {
    if (apiKey === undefined) {
      throw new Error('No API Key was given. Please provide apiKey to constructor or COCONUT_API_KEY env variable');
    }
    this.apiKey = apiKey;
  }

  public createJob(options: CreateJobOptions): Promise<Job>;
  public createJob(options: CreateJobOptions, callback: Callback<Job>): void;
  public createJob(options: CreateJobOptions, callback?: Callback<Job>): void | Promise<Job> {
    const promise = this.submit(this.getConfig(options));
    if (typeof callback === 'undefined') {
      return promise;
    } else if (callback) {
      promise.then(
        result => callback(null, result),
        error => callback(error)
      );
    }
  }

  public getJob(jobId: number): Promise<Job>;
  public getJob(jobId: number, callback: Callback<Job>): void;
  public getJob(jobId: number, callback?: Callback<Job>): void | Promise<Job> {
    const promise = this.get(`/v1/jobs/${jobId}`);
    if (typeof callback === 'undefined') {
      return promise;
    } else if (callback) {
      promise.then(
        result => callback(null, result),
        error => callback(error)
      );
    }
  }

  public getAllMetadata(jobId: number): Promise<Job>;
  public getAllMetadata(jobId: number, callback: Callback<Job>): void;
  public getAllMetadata(jobId: number, callback?: Callback<Job>): void | Promise<Job> {
    const promise = this.get(`/v1/metadata/jobs/${jobId}`);
    if (typeof callback === 'undefined') {
      return promise;
    } else if (callback) {
      promise.then(
        result => callback(null, result),
        error => callback(error)
      );
    }
  }

  public getAllMetadataFor(jobId: string, sourceOrOutput: string): Promise<Job>;
  public getAllMetadataFor(jobId: string, sourceOrOutput: string, callback: Callback<Job>): void;
  public getAllMetadataFor(jobId: string, sourceOrOutput: string, callback?: Callback<Job>): void | Promise<Job> {
    const promise = this.get(`/v1/metadata/jobs/${jobId}/${sourceOrOutput}`);
    if (typeof callback === 'undefined') {
      return promise;
    } else if (callback) {
      promise.then(
        result => callback(null, result),
        error => callback(error)
      );
    }
  }

  private async sendCoconutRequest<T = any>(requestOptions: RequestOptions, data?: any): Promise<T> {
    return new Promise<T>((resolve, reject) => {

      const req = (COCONUT_URL.protocol == 'https:' ? https : http).request(requestOptions, (res: any) => {
        res.setEncoding('utf8');
        let responseString = '';

        res.on('data', function (data: string) {
          responseString += data;
        });

        res.on('end', function () {
          const resultObject = JSON.parse(responseString);
          resolve(resultObject);
        });
      });

      req.on('error', function (e: Error) {
        reject(e);
      });
      if (data) {
        req.write(data);
      }
      req.end();
    });
  }

  private submit<T = any>(configContent: string): Promise<T> {
    return this.sendCoconutRequest(this.getRequestOptions('POST', {
      headers: {
        'Content-Length': configContent.length
      }
    }), configContent);
  }

  private get<T = any>(path: string): Promise<T> {
    return this.sendCoconutRequest(this.getRequestOptions('GET', { path }));
  }

  private getRequestOptions(method: 'GET' | 'POST', options: RequestOptions = { headers: {} }): RequestOptions {
    const { ...baseOptions } = options;
    const customHeaders = baseOptions.headers || {};
    return {
      hostname: COCONUT_URL.hostname,
      port: COCONUT_URL.port || (COCONUT_URL.protocol == 'https:' ? 443 : 80),
      path: '/v1/job',
      method,
      auth: `${this.apiKey}:`,
      ...baseOptions,
      headers: {
        'User-Agent': USER_AGENT,
        'Content-Type': 'text/plain',
        'Accept': 'application/json',
        ...customHeaders,
      }
    }
  }

  private getConfig(options: CreateJobOptions): string {
    let conf: string[],
      vars: { [varname: string]: string } | undefined,
      source: string,
      webhook: string,
      api_version: string | undefined,
      outputs: JobOutputFormat | undefined;

    const conf_file = options.conf;
    if (conf_file) {
      conf = fs.readFileSync(conf_file, 'utf8').split("\n");
    } else {
      conf = [];
    }

    vars = options.vars;
    if (vars) {
      for (const v in vars) {
        conf.push('var ' + v + ' = ' + String(vars[v]));
      }
    }

    source = options.source;
    if (source) {
      conf.push('set source = ' + source);
    }

    webhook = options.webhook;
    if (webhook) {
      conf.push('set webhook = ' + webhook);
    }

    api_version = options.api_version;
    if (api_version) {
      conf.push('set api_version = ' + api_version);
    }

    outputs = options.outputs;
    if (outputs) {
      for (const format in outputs) {
        conf.push('-> ' + format + ' = ' + String(outputs[format]));
      }
    }

    let newConf: string[] = [];
    newConf = newConf.concat(conf.filter(l => l.indexOf('var') === 0).sort());
    newConf.push('');
    newConf = newConf.concat(conf.filter(l => l.indexOf('set') === 0).sort());
    newConf.push('');
    newConf = newConf.concat(conf.filter(l => l.indexOf('->') === 0).sort());

    return newConf.join('\n');
  }
}
