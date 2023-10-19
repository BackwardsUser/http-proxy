import http from "node:http";
import express from "express";
import {route} from "./types";
import {join} from "node:path";
import httpProxy from "http-proxy";
import {readFileSync} from "node:fs";
import chalk from "chalk";

const app = express();
const proxy = httpProxy.createProxyServer();
const routes: route[] = JSON.parse(readFileSync(join(__dirname, "routes.json")).toString());

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
    return `http://${url}`;
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
    const endFilter = routes.filter(route => route.url.endsWith(connectionReq));
    const startFilter = routes.filter(route => route.url.startsWith(connectionReq));
    const urls = findOverlap(endFilter, startFilter);
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

app.use((req, res, next) => {
	const connectionReq = req.headers.host;
	if (connectionReq == undefined) return res.sendStatus(400)
	console.log(`Request from: ${req.headers.host}.`);
    main(connectionReq, req, res);
})

app.listen(80, () => {
	console.log("App listening on port 80");
})