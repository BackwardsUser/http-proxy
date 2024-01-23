// Import Node Packages
import { readFileSync, readdirSync, writeFileSync, renameSync } from "node:fs";
import { route, dev_route } from "./types";
import httpProxy from "http-proxy";
import { join } from "node:path";
import express from "express";
import http from "node:http";
import chalk from "chalk";

// Initiate Packages
const app = express(); // Create Express Application
const proxy = httpProxy.createProxyServer(); // Create Proxy Server

verifyRouteFiles() // Ensure the route files exist.

// Constants
const routes: route[] = JSON.parse(readFileSync(join(__dirname, "routes", "routes.json")).toString()); // Path to Routes file
const dev_routes: dev_route[] = JSON.parse(readFileSync(join(__dirname, "routes", "dev-routes.json")).toString()) // Path to Development Routes file


// Functions

/**
 * A function used to verify the existence of both route files.
 */
function verifyRouteFiles() {
    const files = readdirSync(join(__dirname, "routes")); // Get all files in routes directory
    const filter_routes = files.filter(file => file === "routes.json"); // Filter the routes for "routes.json"
    if (filter_routes.length < 1) {
        // if there is no "routes.json" file
        const filter_example_routes = files.filter(file => file === "routes.example.json"); // Filter for the example file
        if (filter_example_routes.length < 1) generateExampleRoutes() // if no example file, generate one
        renameSync(join(__dirname, "routes", "routes.example.json"), join(__dirname, "routes", "routes.json")) // Rename example file to route file.
    }
    
    const filter_dev_routes = files.filter(file => file === "dev-routes.json"); // Filter Development Routes
    if (filter_dev_routes.length < 1) {
        // If there is no development routes file
        const filter_example_routes = files.filter(file => file === "dev-routes.example.json"); // Filter for the example file.
        if (filter_example_routes.length < 1) generateExampleDevelopmentRoutes() // If there is no example file, generate one.
        renameSync(join(__dirname, "routes", "dev-routes.example.json"), join(__dirname, "routes", "dev-routes.json")) // rename the example file development file.
    }
}

/**
 * A function used to generate the Example WebServer Routes file.
 */
function generateExampleRoutes() {
    const exampleRoutes = {
        "url": "example.hostname.com",
        "route": "localhost:3000"
    } // Initiate Example Data

    writeFileSync(
        join(__dirname, "routes", "routes.example.json"),
        JSON.stringify(exampleRoutes, null, 4)
    ) // Write it to file.
}

/**
 * A function used to generate the Example Development Routes file.
 */
function generateExampleDevelopmentRoutes() {
    const exampleRoutes = {
        "url": "exampleapi.hostname.com",
        "context": "server.example.ts"
    } // Initiate Example Data

    writeFileSync(
        join(__dirname, "routes", "dev-routes.example.json"),
        JSON.stringify(exampleRoutes, null, 4)
    ) // Write it to file.
}

/**
 * Checks a given IP is active by probing it with a get request,
 * looking for the status code 200.
 * @param ip The IP to check.
 * @returns Boolean, whether the ip returns 200
 */
function getServerRes(ip: string) {
    return new Promise((res) => { // Create new Promise
        http.get(ip, (response) => { // Send the HTTP request to the given IP
            const { statusCode } = response; // pull the Status Code from the response
            if (statusCode == 200) return res(true) // if the Status Code is 200, return true
            else return res(false); // else return false.
        }).on("error", (err) => { // If the HTTP request fails,
            return res(false); // default return false
        });
    });
}

/**
 * Adds "http://" to the beginning of the required string,
 * this turns it into a valid URL as it is required by certain functions.
 * @param url The URL to "httpify"
 * @returns the hostname with http
 */
function httpify(url: string): string {
    if (url.startsWith("http")) return url // Return the url as-is if it already has the "http://" prefix
    else return `http://${url}`; // otherwise add the "http://" prefix and return it.
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
        if (b.includes(item)) { // if the item is in the second array,
            out.push(item); // add the item to output.
        }
    });
    return out; // return the output.
}

/**
 * The Main function, finds if hostname is in routes file, will proxy the webserver if it exists and its up.
 * @param connectionReq Hostname
 * @param req Express Request
 * @param res Express Response
 */
async function main(connectionReq: any, req: any, res: any) {
    const end_filter = routes.filter(route => route.url.endsWith(connectionReq)); // Filter Routes by comparing the Hostname to the end of the route
    const start_filter = routes.filter(route => route.url.startsWith(connectionReq)); // Filter Routes by comparing the Hostname to the beginning of the route
    const urls = findOverlap(end_filter, start_filter); // Find the Overlaps between the start and end filter

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
            proxy.web(req, res, { target: httpify(urls[0].route) }); // Proxy WebServer
            break; // End Request
        default:
            res.sendStatus(500); // Send Status 500 if there are multiple overlapping routes.
            console.warn(chalk.red(`Multiple routes for: ${connectionReq}.\nAll Routes:\n${urls}`)); // Log Warning
            break; // End Request
    }
}

/**
 * Like the Main function, finds if hostname is in routes file, will run the development file if it exists.
 * @param connectionReq Hostname
 * @param req Express Request
 * @param res Express Response
 */
async function development_route(connectionReq: any, req: any, res: any) {
    const end_filter = dev_routes.filter(route => route.url.endsWith(connectionReq)); // Filter Routes by comparing the Hostname to the end of the route
    const start_filter = dev_routes.filter(route => route.url.startsWith(connectionReq)); // Filter Routes by comparing the Hostname to the beginning of the route
    const urls: dev_route[] = findOverlap(end_filter, start_filter); // Find the Overlaps between the start and end filter

    // Switch Statement checking the number of overlapping items.
    switch (urls.length) {
        case 0:
            res.sendStatus(404); // Send Status 404 if there is no overlap
            console.warn(chalk.yellow(`No route setup for: ${connectionReq}.`)); // Log Warning
            break; // End Request.
        case 1:
            const url = urls[0]; // get the first URL if there is one overlap.
            console.log(`Got Dev Request from: ${url.url}.`) // Log Successful request
            const scripts_path = join(__dirname, "development"); // Get the path to development files

            // Get files within the development folder.
            // Than Filter the files with route context.
            const files = readdirSync(scripts_path).filter(file => file === `${url.context}.ts`);

            if (files.length < 1) {
                // Log Error if no such file exists.
                console.warn(chalk.red(`No such file as: "${scripts_path} + ${url.context}" for url: "${connectionReq}" matching "${url.url}"`));
                break; // End Request.
            }
            files.forEach(file => {
                console.log(`Running "${file}"...`) // Log run attempt.
                try {
                    require(`${scripts_path}\\${file}`).main(req, res); // Try and run file.
                    console.log(chalk.green(`"${file}" Ran and Returned Successfully.`)); // Log Success.
                } catch (e) {
                    console.error(chalk.red(e)) // Error if something breaks.
                }
            });

            break; // End Request
        default:
            res.sendStatus(500); // Send Status 500 if there are too many routes with that name.
            console.warn(chalk.red(`Multiple routes for: ${connectionReq}.\nAll Routes:\n${urls}`)); // Log Error
            break; // End Request
    }
}

/**
 * Checks if the request is a development request (API).
 * @param connectionReq Hostname
 * @returns boolean based on whether the hostname is a development request
 */
function isDevelopment(connectionReq: any): boolean {
    if (dev_routes.filter(route => route.url.startsWith(connectionReq)).length > 0) return true
    else return false;
}

app.use((req, res, next) => {
    const connectionReq = req.headers.host; // Get Hostname from request
    if (connectionReq == undefined) return res.sendStatus(400) // if there is no connection Request, Send Status 400
    if (isDevelopment(connectionReq)) return development_route(connectionReq, req, res); // Check if its a Development Route.
    console.log(`Request from: ${req.headers.host}.`); // Log the request attempt
    main(connectionReq, req, res); // Call main function.
});

// Start Express App on port 80
app.listen(80, () => {
    console.clear() // Clear Console
    console.log(chalk.cyan("Web Proxies:")) // Log Header for WebServers
    routes.forEach((route, i) => {
        console.log(`${i}. From: ${route.url}, to ${route.route}.`) // Log each route and its information
    });
    console.log(chalk.cyan("\nDevelopment Proxies:")) // Log Header for Development Files
    dev_routes.forEach((route, i) => {
        console.log(`${i}. From: ${route.url}, to ${route.context}.`); // Log each route and its information
    });
    console.log(chalk.bgCyan("\nListening on port 80.\n")); // Log the port the app is listening on.
    console.log("Logs") // App Log Header
    const line = '-'.repeat(process.stdout.columns) // Create Separator line.
    console.log(line); // Log Separator Line
});