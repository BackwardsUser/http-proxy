import {type Request, type Response} from "express";

// Route Object Layout
export type Route = {
	url: string;
	route: string;
};

// Built-in Route Object Layout
export type BuiltInRoute = {
	url: string;
	context: string;
};

// Built-in Script File Layout
export type BuiltInScript = {
	main: (req: Request, res: Response) => void;
};
