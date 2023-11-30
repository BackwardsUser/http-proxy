import http from "node:http";
import express from "express";
import {route, dev_route} from "./types";
import {join} from "node:path";
import httpProxy from "http-proxy";
import {readFileSync, readdirSync} from "node:fs";
import chalk from "chalk";

const app = express();
const proxy = httpProxy.createProxyServer();

const routes: route[] = JSON.parse(readFileSync(join(__dirname, "routes", "routes.json")).toString());
const dev_routes: dev_route[] = JSON.parse(readFileSync(join(__dirname, "routes", "dev-routes.json")).toString())

function getServerRes(ip: string) {
	return new Promise((res) => {
		http.get(ip, (response) => {
			const {statusCode} = response;
			if (statusCode == 200) return res(true)
			else return res(false);
		}).on("error", (err) => {
			return res(false);
		});
	});
}

function httpify(url: string): string {
    if (url.startsWith("http")) return url
    else return `http://${url}`;
}

function findOverlap(a: any[], b: any[]) {
    const out: any[] = [];
    a.forEach(item => {
        if (b.includes(item)) {
            out.push(item);
        }
    });
    return out;
}

async function main(connectionReq: any, req: any, res: any) {
    const end_filter = routes.filter(route => route.url.endsWith(connectionReq));
    const start_filter = routes.filter(route => route.url.startsWith(connectionReq));
    const urls = findOverlap(end_filter, start_filter);
    switch (urls.length) {
        case 0:
            res.sendStatus(404);
            console.warn(chalk.yellow(`No route setup for: ${connectionReq}.`));
            break;
        case 1:
            if (await getServerRes(httpify(urls[0].route)) === false) {
                res.sendStatus(503);
                console.warn(chalk.red(`Cannot reach route: ${urls[0].route}.`));
                break;
            }
            proxy.web(req, res, { target: httpify(urls[0].route) });
            break;
        default:
            res.sendStatus(500);
            console.warn(chalk.red(`Multiple routes for: ${connectionReq}.\nAll Routes:\n${urls}`));
            break;
    }
}

async function development_route(connectionReq: any, req: any, res: any) {
    const end_filter = dev_routes.filter(route => route.url.endsWith(connectionReq));
    const start_filter = dev_routes.filter(route => route.url.startsWith(connectionReq));
    const urls: dev_route[] = findOverlap(end_filter, start_filter);
    switch (urls.length) {
        case 0:
            res.sendStatus(404);
            console.warn(chalk.yellow(`No route setup for: ${connectionReq}.`));
            break;
        case 1:
            const url = urls[0];
            console.log(`Got Dev Request from: ${url.url}.`)
            const scripts_path = join(__dirname, "development");
            const files = readdirSync(scripts_path).filter(file => file === `${url.context}.ts`);
            if (files.length < 1) {
                console.warn(chalk.red(`No such file as: "${scripts_path} + ${url.context}" for url: "${connectionReq}" matching "${url.url}"`));
                break;
            }
            files.forEach(file => {
                console.log(`Running "${file}"...`)
                try {
                    require(`${scripts_path}\\${file}`).main(req, res);
                    console.log(chalk.green(`"${file}" Ran and Returned Successfully.`));
                } catch (e) {
                    console.error(chalk.red(e))
                }
            });

            break;
        default:
            res.sendStatus(500);
            console.warn(chalk.red(`Multiple routes for: ${connectionReq}.\nAll Routes:\n${urls}`));
            break;
    }
}

function isDevelopment(connectionReq: any): boolean {
    if (dev_routes.filter(route => route.url.startsWith(connectionReq)).length > 0) return true
    else return false;
}

app.use((req, res, next) => {
	const connectionReq = req.headers.host;
    if (isDevelopment(connectionReq)) return development_route(connectionReq, req, res);
	if (connectionReq == undefined) return res.sendStatus(400)
	console.log(`Request from: ${req.headers.host}.`);
    main(connectionReq, req, res);
});

app.listen(80, () => {
    console.clear()
    console.log(chalk.cyan("Web Proxies:"))
    routes.forEach((route, i) => {
        console.log(`${i}. From: ${route.url}, to ${route.route}.`)
    });
    console.log(chalk.cyan("\nDevelopment Proxies:"))
    dev_routes.forEach((route, i) => {
        console.log(`${i}. From: ${route.url}, to ${route.context}.`);
    });
	console.log(chalk.bgCyan("\nListening on port 80.\n"));
    console.log("Logs")
    const line = '-'.repeat(process.stdout.columns)
    console.log(line)
})