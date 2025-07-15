// Import Node Packages
import {readFileSync, readdirSync, writeFileSync, renameSync} from "node:fs";
import {type Route, type BuiltInRoute, type BuiltInScript} from "./types";
import httpProxy from "http-proxy";
import {join} from "node:path";
import express, {type Request, type Response} from "express";
import http from "node:http";
import chalk from "chalk";

// Initiate Packages
const app = express();
const proxy = httpProxy.createProxyServer();

verifyRouteFiles();

// Constants
const routesDir = join(__dirname, "..", "routes");
const routes: Route[] = JSON.parse(readFileSync(join(routesDir, "routes.json")).toString()) as Route[];
const builtInRoutes: BuiltInRoute[] = JSON.parse(readFileSync(join(routesDir, "builtin-routes.json")).toString()) as BuiltInRoute[];

// Functions
function verifyRouteFiles() {
	const files = readdirSync(routesDir);
	const filterRoutes = files.filter(file => file === "routes.json");
	if (filterRoutes.length < 1) {
		const filterExampleRoutes = files.filter(file => file === "routes.example.json");
		if (filterExampleRoutes.length < 1) {
			generateExampleRoutes();
		}

		renameSync(join(routesDir, "routes.example.json"), join(routesDir, "routes.json"));
	}

	const filterDevRoutes = files.filter(file => file === "builtin-routes.json");
	if (filterDevRoutes.length < 1) {
		const filterExampleRoutes = files.filter(file => file === "builtin-routes.example.json");
		if (filterExampleRoutes.length < 1) {
			generateExampleBuiltInRoutes();
		}

		renameSync(join(routesDir, "builtin-routes.example.json"), join(routesDir, "builtin-routes.json"));
	}
}

function generateExampleRoutes() {
	const exampleRoutes = [{
		url: "example.hostname.com",
		route: "localhost:3000",
	},
	{
		url: "testing.hostname.com",
		route: "localhost:3001",
	}];

	writeFileSync(
		join(routesDir, "routes.example.json"),
		JSON.stringify(exampleRoutes, null, 4),
	);
}

function generateExampleBuiltInRoutes() {
	const exampleRoutes = [{
		url: "exampleapi.hostname.com",
		context: "server.example.ts",
	}];

	writeFileSync(
		join(routesDir, "builtin-routes.example.json"),
		JSON.stringify(exampleRoutes, null, 4),
	);
}

async function getServerRes(ip: string) {
	return new Promise(res => {
		// Use /health instead of just "/"
        http.get(ip, response => {
			const {statusCode} = response;
			if (statusCode === 200) {
				res(true);
				return;
			}

			res(false);
		}).on("error", err => {
			res(false);
		});
	});
}

function httpify(url: string): string {
	if (url.startsWith("http")) {
		return url;
	}

	return `http://${url}`;
}

function findOverlap(a: any[], b: any[]): any[] {
	const out: any[] = [];
	a.forEach(item => {
		if (b.includes(item)) {
			out.push(item);
		}
	});
	return out;
}

async function main(connectionReq: string, req: Request, res: Response) {
	const endFilter: Route[] = routes.filter(route => route.url.endsWith(connectionReq));
	const startFilter: Route[] = routes.filter(route => route.url.startsWith(connectionReq));
	const urls: Route[] = findOverlap(endFilter, startFilter) as Route[];

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

			proxy.web(req, res, {target: httpify(urls[0].route)});
			break;
		default:
			res.sendStatus(500);
			console.warn(chalk.red(`Multiple routes for: ${connectionReq}.\nAll Routes:\n${urls.toString()}`));
			break;
	}
}

async function builtInRoute(connectionReq: string, req: Request, res: Response) {
	const endFilter: BuiltInRoute[] = builtInRoutes.filter(route => route.url.endsWith(connectionReq));
	const startFilter: BuiltInRoute[] = builtInRoutes.filter(route => route.url.startsWith(connectionReq));
	const urls: BuiltInRoute[] = findOverlap(endFilter, startFilter) as BuiltInRoute[];

	switch (urls.length) {
		case 0:
			res.sendStatus(404);
			console.warn(chalk.yellow(`No route setup for: ${connectionReq}.`));
			break;
		case 1:
			// eslint-disable-next-line no-case-declarations
			const url: BuiltInRoute = urls[0];
			console.log(`Got Built-In Request from: ${url.url}.`);
			// eslint-disable-next-line no-case-declarations
			const scriptsPath: string = join(__dirname, "..", "built-ins");
			const files = readdirSync(scriptsPath).filter(file => file === `${url.context}.ts` || file === `${url.context}.js`);

			if (files.length < 1) {
				console.warn(chalk.red(`No such file as: "${scriptsPath} + ${url.context}" for url: "${connectionReq}" matching "${url.url}"`));
				break;
			}

			files.forEach(async (file: string) => {
				console.log(`Running "${file}"...`);
				try {
					const script: BuiltInScript = await import(join(scriptsPath, file)) as BuiltInScript;
					script.main(req, res);
					console.log(chalk.green(`"${file}" Ran and Returned Successfully.`));
				} catch (e) {
					console.error(chalk.red(e));
				}
			});

			break;
		default:
			res.sendStatus(500);
			console.warn(chalk.red(`Multiple routes for: ${connectionReq}.\nAll Routes:\n${urls.toString()}`));
			break;
	}
}

function isBuiltIn(connectionReq: string): boolean {
	if (builtInRoutes.filter(route => route.url.startsWith(connectionReq)).length > 0) {
		return true;
	}

	return false;
}

app.use(async (req: Request, res: Response) => {
	const connectionReq = req.headers.host;
	if (connectionReq === undefined) {
		return res.sendStatus(400);
	}

	if (isBuiltIn(connectionReq)) {
		return builtInRoute(connectionReq, req, res);
	}

	console.log(`Request from: ${req.headers.host}.`);
	await main(connectionReq, req, res);
});

app.listen(80, () => {
	console.clear();
	console.log(chalk.cyan("Web Proxies:"));
	routes.forEach((route, i) => {
		console.log(`${i}. From: ${route.url}, to ${route.route}.`);
	});
	console.log(chalk.cyan("\nDevelopment Proxies:"));
	builtInRoutes.forEach((route, i) => {
		console.log(`${i}. From: ${route.url}, to ${route.context}.`);
	});
	console.log(chalk.bgCyan("\nListening on port 80.\n"));
	console.log("Logs");
	const line = "-".repeat(process.stdout.columns);
	console.log(line);
});
