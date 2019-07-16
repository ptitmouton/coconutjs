"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const https_1 = __importDefault(require("https"));
const url_1 = require("url");
var fs = require('fs');
const USER_AGENT = 'Coconut/2.4.0 (NodeJS)';
const COCONUT_URL = url_1.parse(process.env.COCONUT_URL || 'https://api.coconut.co');
class CoconutJS {
    constructor(apiKey = process.env.COCONUT_API_KEY) {
        if (apiKey === undefined) {
            throw new Error('No API Key was given. Please provide apiKey to constructor or COCONUT_API_KEY env variable');
        }
        this.apiKey = apiKey;
    }
    createJob(options, callback) {
        const promise = this.submit(this.getConfig(options));
        if (typeof callback === 'undefined') {
            return promise;
        }
        else if (callback) {
            promise.then(result => callback(null, result), error => callback(error));
        }
    }
    getJob(jobId, callback) {
        const promise = this.get(`/v1/jobs/${jobId}`);
        if (typeof callback === 'undefined') {
            return promise;
        }
        else if (callback) {
            promise.then(result => callback(null, result), error => callback(error));
        }
    }
    getAllMetadata(jobId, callback) {
        const promise = this.get(`/v1/metadata/jobs/${jobId}`);
        if (typeof callback === 'undefined') {
            return promise;
        }
        else if (callback) {
            promise.then(result => callback(null, result), error => callback(error));
        }
    }
    getAllMetadataFor(jobId, sourceOrOutput, callback) {
        const promise = this.get(`/v1/metadata/jobs/${jobId}/${sourceOrOutput}`);
        if (typeof callback === 'undefined') {
            return promise;
        }
        else if (callback) {
            promise.then(result => callback(null, result), error => callback(error));
        }
    }
    async sendCoconutRequest(requestOptions, data) {
        return new Promise((resolve, reject) => {
            const req = (COCONUT_URL.protocol == 'https:' ? https_1.default : http_1.default).request(requestOptions, (res) => {
                res.setEncoding('utf8');
                let responseString = '';
                res.on('data', function (data) {
                    responseString += data;
                });
                res.on('end', function () {
                    const resultObject = JSON.parse(responseString);
                    resolve(resultObject);
                });
            });
            req.on('error', function (e) {
                reject(e);
            });
            if (data) {
                req.write(data);
            }
            req.end();
        });
    }
    submit(configContent) {
        return this.sendCoconutRequest(this.getRequestOptions('POST', {
            headers: {
                'Content-Length': configContent.length
            }
        }), configContent);
    }
    get(path) {
        return this.sendCoconutRequest(this.getRequestOptions('GET', { path }));
    }
    getRequestOptions(method, options = { headers: {} }) {
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
        };
    }
    getConfig(options) {
        let conf, vars, source, webhook, api_version, outputs;
        const conf_file = options.conf;
        if (conf_file) {
            conf = fs.readFileSync(conf_file, 'utf8').split("\n");
        }
        else {
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
        let newConf = [];
        newConf = newConf.concat(conf.filter(l => l.indexOf('var') === 0).sort());
        newConf.push('');
        newConf = newConf.concat(conf.filter(l => l.indexOf('set') === 0).sort());
        newConf.push('');
        newConf = newConf.concat(conf.filter(l => l.indexOf('->') === 0).sort());
        return newConf.join('\n');
    }
}
exports.default = CoconutJS;
