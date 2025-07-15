# http proxy

A simple reverse proxy for routing hypertext files from different ports to http

### Note
The proxy will probe the web server's "/health" route to determine whether the server is up.
This prevents the proxy from crashing when attempting to connect a client to a non-existant server.

## Versions

- [NodeJS](https://nodejs.org) `v21.1.0`
- [NPM](https://npmjs.com/) `v10.2.3`

### Packages

- [express](https://expressjs.com/) `v4.18.2`
- [http-proxy](https://www.npmjs.com/package/http-proxy) `v1.18.1`
- [chalk](https://www.npmjs.com/package/chalk) `v4.1.2`
- [nodemon](https://nodemon.io/) `v3.0.1`
- [typescript](https://typescriptlang.org/) `v5.3.3`
- [ts-node](https://typestrong.org/ts-node) `v10.9.1`
- [eslint](https://eslint.org/) `v8.56.0`

## Installation

### Note:
Any Docker methods to host this application will not work on any Windows machines due to how I'm binding the docker volume to an absolute path.  

__Docker__
The "deploy" branch contains the built code ready to deploy on docker, just run docker compose up,
Both the "Routes" and "built-ins" directory can be found under `/srv/http-proxy/`  

__Portainer__
1. Create a new Stack ("Stacks")
2. Give your stack a name ("http-proxy"?)
3. Set build method to `Repository`
4. Set the repository URL to the URL of this repository
5. Set Repository reference to `refs/heads/deploy`
6. Deploy the stack.  
  
Both the "Routes" and "built-ins" directory can be found under `/srv/http-proxy/`  

_Bare Metal_
1. Clone this repository
2. Open the repository in a terminal
3. Install packages with: `npm install`
4. Modify the `routes.example.json` and `builtin-routes.example.json` files as needed. (more info under [usage](#usage))
5. Rename the files to `routes.json` and `builtin-routes.json` respectively.
6. Create any necessary files in the `built-ins` directory
7. Start the proxy with: `npm start`
8. Make your connection

## Usage

### ESLint
If you want to use ESLint in your built-in scripts, remove the .eslintignore file.

### What is a "Built-in"?
A built-in route is a route that doesn't proxy, I've been using it for my API, but it can really be used for anything you don't want to proxy, or want to make a dedicated webserver for.
Instead of routing to webserver, it routes to a local script stored in `built-ins`

### Adding and Removing Routes and Development Routes

A web route is written as following:

`route`
```json
{
  "url": "example.hostname.com", // The hostname to intercept.
  "route": "localhost:3000" // The route to proxy clients to.
}
```

`built-in`
```json
{
    "url": "exampleapi.hostname.com", // The hostname to intercept
    "context": "server.example.ts" // The name of the file to send clients to.
}
```
Adding multiple can be done the same for either routes file, follow the routes example file for a demonstration for both, just remember that the routes file uses "route" while the dev routes file uses "context".

### Creating Built-ins
I've tried to leave as much free liberty in creating your own Built-ins, but there were some restrictions.
An index built-in file (whatever file is listed in your builtin-routes file) must contain a exported "main" function
```js
modules.export = function main() {}
```
The main function is passed the [Request](https://expressjs.com/en/5x/api.html#req) and [Response](https://expressjs.com/en/5x/api.html#res) variables from [express](https://expressjs.com/)  
As with any express app, any main function you may create should *always* send a response to the user in some form.  
While leaving as much free liberty as I can, I am also not sending a response to the user in the proxy, this is on you.
Not adding a response will cause any users requesting your built-in to hang until timeout (and recieve no response)

This can be done in the following ways:
```js
response.sendStatus(/* Any HTTP code */); // This is depreciated on express, but still works as of this commit.
response.send(/* Any string content here, including html which will be parsed */)
response.status(/* Any HTTP code */)
```
Mozilla has a good resource on HTTP Codes [here](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status).

As of this commit, I'm not certain of the compatibility of different templating languages, (i.e. pug or EJS) but if you're able to get them working in some form, feel free to make a commit changing this statement with a guide!

## Contributions

Feel free to make a Pull request, my layout is rather simple,  
everything related to the code is within the /src directory,

```txt
HTTP-PROXY
│   .dockerignore
│   .eslintignore
│   .eslintrc.json
│   .gitignore
│   docker-compose.yml
│   Dockerfile
│   license
│   package-lock.json
│   package.json
│   readme.md
│   tsconfig.json
│   
├───src - Contains all of the proxy code
│       index.ts - The Main Script, contains all of the functions and methods to get the HTTP Proxy running.
│       types.ts - The Main Typing file for Typescript, contains the layouts for the route files.
│   
├───built-ins - Contains any built-in routes.
│   │   server.example.ts - An example script to showcase how a built-in is created.
│   │
│   └───example - Contains an Example User Library, can contain whatever information and can be organized however the user wishes.
│               test.ts - An Example Library File.
│     
└───routes - Contains the routes.
            builtin-routes.example.json - An Example of the builtin-routes file.
            routes.example.json - An Example of the proxied routes file.
```
