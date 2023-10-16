import http from "node:http";
import express from "express";
import { route } from "./types";
import { join } from "node:path";
import httpProxy from "http-proxy";
import { readFileSync } from "node:fs";

const app = express();
const proxy = httpProxy.createProxyServer();
const routes: route[] = JSON.parse(readFileSync(join(__dirname, "routes.json")).toString());

function getServerRes(ip: string) {
    return new Promise((res) => {
        http.get(`http://${ip}`, (response) => {
            const { statusCode } = response;
            if (statusCode == 200) return res(true)
            else return res(false);
        }).on("error", (err) => {
            return res(false);
        })
    })
}

function connectionFailed(res: any) {
    console.log("Failed to connect");
    res.sendStatus(404);
    return false;
}

app.use(async (req, res, next) => {
    const connectionReq = req.headers.host;
    if (connectionReq == undefined) return connectionFailed(res);
    console.log(`Request from: ${req.headers.host}.`);
    const filteredRoutes = routes.filter(route => route.url === connectionReq);
    let proxyMade = false;
    if (filteredRoutes.length > 0 && filteredRoutes.length < 2) {
        const route = filteredRoutes[0];
        const serverRes = await getServerRes(route.route);
        if (!serverRes) return connectionFailed(res);
        const newRoute = `http://${route.route}/`;
        proxyMade = true;
        proxy.web(req, res, { target: newRoute });
        return false;
    } else {
        console.error(`Too many similar routes to: ${connectionReq}`)
    }
})

app.listen(80, () => {
    console.log("App listening on port 80");
})