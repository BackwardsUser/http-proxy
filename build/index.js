"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
// Import Node Packages
const node_fs_1 = require("node:fs");
const http_proxy_1 = __importDefault(require("http-proxy"));
const node_path_1 = require("node:path");
const express_1 = __importDefault(require("express"));
const node_http_1 = __importDefault(require("node:http"));
const chalk_1 = __importDefault(require("chalk"));
const node_cron_1 = __importDefault(require("node-cron"));
// Initiate Packages
const app = (0, express_1.default)();
const proxy = http_proxy_1.default.createProxyServer();
const routesDir = (0, node_path_1.join)(__dirname, '..', 'routes'); // While this is a constant, it needs to exist before "verifyRouteFiles" which needs to exist before defining constants...
verifyRouteFiles();
// Constants
const port = (_a = process.env.PORT) !== null && _a !== void 0 ? _a : 80;
const updateRoutes = () => JSON.parse((0, node_fs_1.readFileSync)((0, node_path_1.join)(routesDir, 'routes.json')).toString());
const updateBuiltInRoutes = () => JSON.parse((0, node_fs_1.readFileSync)((0, node_path_1.join)(routesDir, 'builtin-routes.json')).toString());
const routes = updateRoutes();
const builtInRoutes = updateBuiltInRoutes();
// Functions
function verifyRouteFiles() {
    const files = (0, node_fs_1.readdirSync)(routesDir);
    const filterRoutes = files.filter(file => file === 'routes.json');
    if (filterRoutes.length < 1) {
        const filterExampleRoutes = files.filter(file => file === 'routes.example.json');
        if (filterExampleRoutes.length < 1) {
            generateExampleRoutes();
        }
        (0, node_fs_1.renameSync)((0, node_path_1.join)(routesDir, 'routes.example.json'), (0, node_path_1.join)(routesDir, 'routes.json'));
    }
    const filterDevRoutes = files.filter(file => file === 'builtin-routes.json');
    if (filterDevRoutes.length < 1) {
        const filterExampleRoutes = files.filter(file => file === 'builtin-routes.example.json');
        if (filterExampleRoutes.length < 1) {
            generateExampleBuiltInRoutes();
        }
        (0, node_fs_1.renameSync)((0, node_path_1.join)(routesDir, 'builtin-routes.example.json'), (0, node_path_1.join)(routesDir, 'builtin-routes.json'));
    }
}
function generateExampleRoutes() {
    const exampleRoutes = [{
            url: 'example.hostname.com',
            route: 'localhost:3000',
        },
        {
            url: 'testing.hostname.com',
            route: 'localhost:3001',
        }];
    (0, node_fs_1.writeFileSync)((0, node_path_1.join)(routesDir, 'routes.example.json'), JSON.stringify(exampleRoutes, null, 4));
}
function generateExampleBuiltInRoutes() {
    const exampleRoutes = [{
            url: 'exampleapi.hostname.com',
            context: 'server.example.ts',
        }];
    (0, node_fs_1.writeFileSync)((0, node_path_1.join)(routesDir, 'builtin-routes.example.json'), JSON.stringify(exampleRoutes, null, 4));
}
function getServerRes(ip, healthRoute = false) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(res => {
            node_http_1.default.get(`${ip}${healthRoute ? '/health' : ''}`, response => {
                const { statusCode } = response;
                if (statusCode !== 404) {
                    res(true);
                    return;
                }
                res(false);
            }).on('error', err => {
                res(false);
            });
        });
    });
}
function httpify(url) {
    if (url.startsWith('http')) {
        return url;
    }
    return `http://${url}`;
}
function findOverlap(a, b) {
    const out = [];
    a.forEach(item => {
        if (b.includes(item)) {
            out.push(item);
        }
    });
    return out;
}
function main(connectionReq, req, res) {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        const endFilter = routes.filter(route => route.url.endsWith(connectionReq));
        const startFilter = routes.filter(route => route.url.startsWith(connectionReq));
        const urls = findOverlap(endFilter, startFilter);
        switch (urls.length) {
            case 0:
                res.sendStatus(404);
                console.warn(chalk_1.default.yellow(`No route setup for: ${connectionReq}.`));
                break;
            case 1:
                if ((yield getServerRes(httpify(urls[0].route), ((_a = urls[0].healthRoute) !== null && _a !== void 0 ? _a : false))) === false) {
                    res.sendStatus(503);
                    console.warn(chalk_1.default.red(`Cannot reach route: ${urls[0].route}.`));
                    break;
                }
                proxy.web(req, res, { target: httpify(urls[0].route) });
                break;
            default:
                res.sendStatus(500);
                console.warn(chalk_1.default.red(`Multiple routes for: ${connectionReq}.\nAll Routes:\n${urls.toString()}`));
                break;
        }
    });
}
function builtInRoute(connectionReq, req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const endFilter = builtInRoutes.filter(route => route.url.endsWith(connectionReq));
        const startFilter = builtInRoutes.filter(route => route.url.startsWith(connectionReq));
        const urls = findOverlap(endFilter, startFilter);
        switch (urls.length) {
            case 0:
                res.sendStatus(404);
                console.warn(chalk_1.default.yellow(`No route setup for: ${connectionReq}.`));
                break;
            case 1:
                // eslint-disable-next-line no-case-declarations
                const url = urls[0];
                console.log(`Got Built-In Request from: ${url.url}.`);
                // eslint-disable-next-line no-case-declarations
                const scriptsPath = (0, node_path_1.join)(__dirname, '..', 'built-ins');
                const files = (0, node_fs_1.readdirSync)(scriptsPath).filter(file => file === `${url.context}.ts` || file === `${url.context}.js`);
                if (files.length < 1) {
                    console.warn(chalk_1.default.red(`No such file as: "${scriptsPath} + ${url.context}" for url: "${connectionReq}" matching "${url.url}"`));
                    break;
                }
                files.forEach((file) => __awaiter(this, void 0, void 0, function* () {
                    console.log(`Running "${file}"...`);
                    try {
                        const script = yield Promise.resolve(`${(0, node_path_1.join)(scriptsPath, file)}`).then(s => __importStar(require(s)));
                        script.main(req, res);
                        console.log(chalk_1.default.green(`"${file}" Ran and Returned Successfully.`));
                    }
                    catch (e) {
                        console.error(chalk_1.default.red(e));
                    }
                }));
                break;
            default:
                res.sendStatus(500);
                console.warn(chalk_1.default.red(`Multiple routes for: ${connectionReq}.\nAll Routes:\n${urls.toString()}`));
                break;
        }
    });
}
function isBuiltIn(connectionReq) {
    if (builtInRoutes.filter(route => route.url.startsWith(connectionReq)).length > 0) {
        return true;
    }
    return false;
}
app.use((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const connectionReq = req.headers.host;
    if (connectionReq === undefined) {
        return res.sendStatus(400);
    }
    if (isBuiltIn(connectionReq)) {
        return builtInRoute(connectionReq, req, res);
    }
    console.log(`Request from: ${req.headers.host}.`);
    yield main(connectionReq, req, res);
}));
app.listen(port, () => {
    console.clear();
    console.log(chalk_1.default.cyan('Web Proxies:'));
    routes.forEach((route, i) => {
        console.log(`${i}. From: ${route.url}, to ${route.route}.`);
    });
    console.log(chalk_1.default.cyan('\nDevelopment Proxies:'));
    builtInRoutes.forEach((route, i) => {
        console.log(`${i}. From: ${route.url}, to ${route.context}.`);
    });
    console.log(chalk_1.default.bgCyan(`\nListening on port ${port}.\n`));
    console.log('Logs');
    const line = '-'.repeat(process.stdout.columns);
    console.log(line);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    node_cron_1.default.schedule('0 0 * * *', () => {
        console.log(chalk_1.default.magenta('Updating routes.'));
        updateRoutes();
        updateBuiltInRoutes();
    });
});
