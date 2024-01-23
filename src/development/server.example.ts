import { Request, Response } from "express";

export function main(req: Request, res: Response) {
    // Anything in this function will run whenever the given dev-route runs.
    
    // Want to split your code into seperate files?
    // Just call it as you would normally.
    const called = require("./example/test").test_library();

    /* I would recommend putting any external libraries/scripts into their own folder,
    however this isn't required. */
    
    // This works like any old NodeJS Script, you are able to add any Package using NPM and import it above,
    // as demonstrated with the Request and Response from express.
}