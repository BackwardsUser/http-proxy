import { getUser } from "./backwardsapi/eco/databaseInteract";
import { Request, Response } from "express";

export function main(req: Request, res: Response) {
    const splitURL = req.url.toLowerCase().split("/");
    const shifted = splitURL.shift();
    const params = splitURL.join("").split("?")
    const path = params.shift();
    switch (path) {
        case "":
            res.sendStatus(200);
            break;
        case "example":
            res.send(`<h1>An Example Page</h1>`);
            break;
        case "eco":
            const splitParams = params.join("").split("&")
            const hasValue: string[] = splitParams.filter(param => param.includes("="));
            if (hasValue.length >= 1) {
                hasValue.forEach(valued => {
                    const parameter = valued.split("=");
                    switch (parameter[0]) {
                        case "getuser":
                            const id = parameter.join(",").split(",");
                            getUser(id[1], id[2]).then(response => {
                                res.json(response);
                            }).catch(err => {
                                if (!err) return;
                                res.status(500);
                                throw err;
                            })
                            
                            break;
                    }
                })
            }
            break;
        default:
            res.sendStatus(404);
            break;
    }
}