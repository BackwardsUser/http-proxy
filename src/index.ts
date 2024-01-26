// Import Node Packages
import {readFileSync, readdirSync, writeFileSync, renameSync} from 'node:fs';
import {type Route, type DevRoute, type DevScript} from './types';
import httpProxy from 'http-proxy';
import {join} from 'node:path';
import express, {type Request, type Response} from 'express';
import http from 'node:http';
import chalk from 'chalk';

// Initiate Packages
const app = express(); // Create Express Application
const proxy = httpProxy.createProxyServer(); // Create Proxy Server

verifyRouteFiles(); // Ensure the route files exist.

// Constants
const routes: Route[] = JSON.parse(readFileSync(join(__dirname, 'routes', 'routes.json')).toString()) as Route[]; // Path to Routes file
const devRoutes: DevRoute[] = JSON.parse(readFileSync(join(__dirname, 'routes', 'dev-routes.json')).toString()) as DevRoute[]; // Path to Development Routes file

// Functions

/**
 * A function used to verify the existence of both route files.
 */
function verifyRouteFiles() {
	const files = readdirSync(join(__dirname, 'routes')); // Get all files in routes directory
	const filterRoutes = files.filter(file => file === 'routes.json'); // Filter the routes for "routes.json"
	if (filterRoutes.length < 1) {
		// If there is no "routes.json" file
		const filterExampleRoutes = files.filter(file => file === 'routes.example.json'); // Filter for the example file
		if (filterExampleRoutes.length < 1) {
			generateExampleRoutes();
		} // If no example file, generate one

		renameSync(join(__dirname, 'routes', 'routes.example.json'), join(__dirname, 'routes', 'routes.json')); // Rename example file to route file.
	}

	const filterDevRoutes = files.filter(file => file === 'dev-routes.json'); // Filter Development Routes
	if (filterDevRoutes.length < 1) {
		// If there is no development routes file
		const filterExampleRoutes = files.filter(file => file === 'dev-routes.example.json'); // Filter for the example file.
		if (filterExampleRoutes.length < 1) {
			generateExampleDevelopmentRoutes();
		} // If there is no example file, generate one.

		renameSync(join(__dirname, 'routes', 'dev-routes.example.json'), join(__dirname, 'routes', 'dev-routes.json')); // Rename the example file development file.
	}
}

/**
 * A function used to generate the Example WebServer Routes file.
 */
function generateExampleRoutes() {
	const exampleRoutes = [{
		url: 'example.hostname.com',
		route: 'localhost:3000',
	},
	{
		url: 'testing.hostname.com',
		route: 'localhost:3001',
	}]; // Initiate Example Data

	writeFileSync(
		join(__dirname, 'routes', 'routes.example.json'),
		JSON.stringify(exampleRoutes, null, 4),
	); // Write it to file.
}

/**
 * A function used to generate the Example Development Routes file.
 */
function generateExampleDevelopmentRoutes() {
	const exampleRoutes = [{
		url: 'exampleapi.hostname.com',
		context: 'server.example.ts',
	}]; // Initiate Example Data

	writeFileSync(
		join(__dirname, 'routes', 'dev-routes.example.json'),
		JSON.stringify(exampleRoutes, null, 4),
	); // Write it to file.
}

/**
 * Checks a given IP is active by probing it with a get request,
 * looking for the status code 200.
 * @param ip The IP to check.
 * @returns Boolean, whether the ip returns 200
 */
async function getServerRes(ip: string) {
	return new Promise(res => { // Create new Promise
		http.get(ip, response => { // Send the HTTP request to the given IP
			const {statusCode} = response; // Pull the Status Code from the response
			if (statusCode === 200) {
				res(true);
				return;
			} // If the Status Code is 200, return true

			res(false); // Else return false.
		}).on('error', err => {
			res(false); // Default Return False if error.
		},
		);
	});
}

/**
 * Adds "http://" to the beginning of the required string,
 * this turns it into a valid URL as it is required by certain functions.
 * @param url The URL to "httpify"
 * @returns the hostname with http
 */
function httpify(url: string): string {
	if (url.startsWith('http')) {
		return url;
	} // Return the url as-is if it already has the "http://" prefix

	return `http://${url}`; // Otherwise add the "http://" prefix and return it.
}

/**
 * Takes two arrays and compares them for any overlapping/similar items.
 * Will then return a list of all the similar items.
 * @param a First Array
 * @param b Second Array
 * @returns Array of Overlaps
 */
function findOverlap(a: any[], b: any[]): any[] {
	const out: any[] = []; // Create new "output" array
	a.forEach(item => { // For every item in the first array,
		if (b.includes(item)) { // If the item is in the second array,
			out.push(item); // Add the item to output.
		}
	});
	return out; // Return the output.
}

/**
 * The Main function, finds if hostname is in routes file, will proxy the webserver if it exists and its up.
 * @param connectionReq Hostname
 * @param req Express Request
 * @param res Express Response
 */
async function main(connectionReq: string, req: Request, res: Response) {
	const endFilter: Route[] = routes.filter(route => route.url.endsWith(connectionReq)); // Filter Routes by comparing the Hostname to the end of the route
	const startFilter: Route[] = routes.filter(route => route.url.startsWith(connectionReq)); // Filter Routes by comparing the Hostname to the beginning of the route
	const urls: Route[] = findOverlap(endFilter, startFilter) as Route[]; // Find the Overlaps between the start and end filter

	// Switch Statement checking the number of overlapping items.
	switch (urls.length) {
		case 0:
			res.sendStatus(404); // Send Status 404 if there is no overlap
			console.warn(chalk.yellow(`No route setup for: ${connectionReq}.`)); // Log Warning
			break; // End Request
		case 1:
			// Check Server Status.
			if (await getServerRes(httpify(urls[0].route)) === false) {
				res.sendStatus(503); // Send Status 503 if server is down.
				console.warn(chalk.red(`Cannot reach route: ${urls[0].route}.`)); // Log Error
				break; // End Request
			}

			proxy.web(req, res, {target: httpify(urls[0].route)}); // Proxy WebServer
			break; // End Request
		default:
			res.sendStatus(500); // Send Status 500 if there are multiple overlapping routes.
			console.warn(chalk.red(`Multiple routes for: ${connectionReq}.\nAll Routes:\n${urls.toString()}`)); // Log Warning
			break; // End Request
	}
}

/**
 * Like the Main function, finds if hostname is in routes file, will run the development file if it exists.
 * @param connectionReq Hostname
 * @param req Express Request
 * @param res Express Response
 */
async function developmentRoute(connectionReq: string, req: Request, res: Response) {
	const endFilter: DevRoute[] = devRoutes.filter(route => route.url.endsWith(connectionReq)); // Filter Routes by comparing the Hostname to the end of the route
	const startFilter: DevRoute[] = devRoutes.filter(route => route.url.startsWith(connectionReq)); // Filter Routes by comparing the Hostname to the beginning of the route
	const urls: DevRoute[] = findOverlap(endFilter, startFilter) as DevRoute[]; // Find the Overlaps between the start and end filter

	// Switch Statement checking the number of overlapping items.
	switch (urls.length) {
		case 0:
			res.sendStatus(404); // Send Status 404 if there is no overlap
			console.warn(chalk.yellow(`No route setup for: ${connectionReq}.`)); // Log Warning
			break; // End Request.
		case 1:
			// eslint-disable-next-line no-case-declarations
			const url: DevRoute = urls[0]; // Get the first URL if there is one overlap.
			console.log(`Got Dev Request from: ${url.url}.`); // Log Successful request
			// eslint-disable-next-line no-case-declarations
			const scriptsPath: string = join(__dirname, 'development'); // Get the path to development files

			// Get files within the development folder.
			// Than Filter the files with route context.
			// eslint-disable-next-line no-case-declarations
			const files = readdirSync(scriptsPath).filter(file => file === `${url.context}.ts`);

			if (files.length < 1) {
				// Log Error if no such file exists.
				console.warn(chalk.red(`No such file as: "${scriptsPath} + ${url.context}" for url: "${connectionReq}" matching "${url.url}"`));
				break; // End Request.
			}

			files.forEach(async (file: string) => {
				console.log(`Running "${file}"...`); // Log run attempt.
				try {
					const script: DevScript = await import(`${scriptsPath}\\${file}`) as DevScript; // Get User Development file.
					script.main(req, res);
					console.log(chalk.green(`"${file}" Ran and Returned Successfully.`)); // Log Success.
				} catch (e) {
					console.error(chalk.red(e)); // Error if something breaks.
				}
			});

			break; // End Request
		default:
			res.sendStatus(500); // Send Status 500 if there are too many routes with that name.
			console.warn(chalk.red(`Multiple routes for: ${connectionReq}.\nAll Routes:\n${urls.toString()}`)); // Log Error
			break; // End Request
	}
}

/**
 * Checks if the request is a development request (API).
 * @param connectionReq Hostname
 * @returns boolean based on whether the hostname is a development request
 */
function isDevelopment(connectionReq: string): boolean {
	if (devRoutes.filter(route => route.url.startsWith(connectionReq)).length > 0) {
		return true;
	}

	return false;
}

app.use(async (req: Request, res: Response) => {
	const connectionReq = req.headers.host; // Get Hostname from request
	if (connectionReq === undefined) {
		return res.sendStatus(400);
	} // If there is no connection Request, Send Status 400

	if (isDevelopment(connectionReq)) {
		return developmentRoute(connectionReq, req, res);
	} // Check if its a Development Route.

	console.log(`Request from: ${req.headers.host}.`); // Log the request attempt
	await main(connectionReq, req, res); // Call main function.
});

// Start Express App on port 80
app.listen(80, () => {
	console.clear(); // Clear Console
	console.log(chalk.cyan('Web Proxies:')); // Log Header for WebServers
	routes.forEach((route, i) => {
		console.log(`${i}. From: ${route.url}, to ${route.route}.`); // Log each route and its information
	});
	console.log(chalk.cyan('\nDevelopment Proxies:')); // Log Header for Development Files
	devRoutes.forEach((route, i) => {
		console.log(`${i}. From: ${route.url}, to ${route.context}.`); // Log each route and its information
	});
	console.log(chalk.bgCyan('\nListening on port 80.\n')); // Log the port the app is listening on.
	console.log('Logs'); // App Log Header
	const line = '-'.repeat(process.stdout.columns); // Create Separator line.
	console.log(line); // Log Separator Line
});
