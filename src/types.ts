import {type Request, type Response} from "express";

// Route Object Layout
export type Route = {
	url: string; // URL must be of type "string"
	route: string; // Route must be of type "string"
};

// Development Route Object Layout
export type DevRoute = {
	url: string; // URL must be of type "string"
	context: string; // Context must be of type "string"
};

// Development Script File Layout
export type DevScript = {
	main: (req: Request, res: Response) => void; // "main" function with no callback given "req" and "res"
};
