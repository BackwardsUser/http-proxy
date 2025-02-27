## This application is currently being rewritten.
I'm currently rewritting this application. I'll be reworking the routes, they'll be instead written to a database instead of being stored in file.  
Also a UI will be added to modify the routes.

# http proxy

A simple reverse proxy for routing hypertext files from different ports to http

### Note
This proxy requires any attached web server to reply with Status Code 200.

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

1. Clone this repository
2. Open the repository in a terminal
3. Install packages with: `npm install`
4. Modify the `routes.example.json` and `dev-routes.example.json` files as needed. (more info under [usage](#usage))
5. Rename the files to `routes.json` and `dev-routes.json` respectively.
6. Create any necessary files in the `development` directory
7. Start the proxy with: `npm start`
8. Make your connection


## Usage

### ESLint
If you want to use ESLint in your development scripts, remove the .eslintignore file.


### Adding and Removing Routes and Development Routes

Read Step 4 for basics,  
A web route is written as following:

```json
{
  "url": "example.hostname.com", // The hostname to intercept.
  "route": "localhost:3000" // The route to proxy clients to.
}
```

A dev route is written as following:
```json
{
    "url": "exampleapi.hostname.com", // The hostname to intercept
    "context": "server.example.ts" // The name of the file to send clients to.
}
```
Adding multiple can be done the same for either routes file, follow the routes example file for a demonstration for both, just remember that the routes file uses "route" while the dev routes file uses "context".


## Contributions

Feel free to make a Pull request, my layout is rather simple,  
everything related to the code is within the /src directory,

```txt
HTTP-PROXY
│   .gitignore
│   license
│   package-lock.json
│   package.json
│   readme.md
│   tsconfig.json
│   
└───src - Contains all of the functional code/files
    │   index.ts - The Main Script, contains all of the functions and methods to get the HTTP Proxy running.
    │   types.ts - The Main Typing file for Typescript, contains the layouts for the route files.
    │
    ├───development - Contains User API files.
    │   │   server.example.ts - (Example) The User API script, referenced in `dev-routes.example.json`.
    │   │
    │   └───example - (Example) Contains User Library files for the API script.
    │           test.ts - An Example Library File.
    │
    └───routes - Contains the routes.
            dev-routes.example.json - An Example of the dev-routes file.
            routes.example.json - An Example of the web routes file.
            dev-routes.json - The File that the script reads to get dev-routes.
            routes.json - The File that the script reads to get web-routes.
```
