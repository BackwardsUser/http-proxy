# http proxy
A simple reverse proxy for routing hypertext files from different ports to http

## Dependencies

* NodeJS
* NPM

## Installation/Usage

1. Clone this repository
2. In a terminal cd to where you installed the repository
3. Run the command `npm i`
4. Within the routes.json file enter your routes, I've left an example for you to follow
5. run the command `npm start`
6. Make your connection

## Usage
Read Step 4 for basics,  
A route is written as following:
```json
    {
        "url": "example.hostname.com",
        "route": "localhost:3000"
    }
```
all of the routes in the routes.json file are contained within an array,  
to add or remove one just enter the above with the url being the url to intercept and the route being where to send users.  
the entire object should be listed with a comma following the closing curly bracket (}).

## Contributions
Feel free to make a Pull request, my layout is rather simple,  
everything related to the code is within the /src directory,  
  
* `index.ts` is the main script,  
* `routes.json` is a file that contains all the routes to proxy.  
* `types.ts` is the typing file for typescript.
