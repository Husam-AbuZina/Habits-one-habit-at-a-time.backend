import type { Request, Response } from "express";
import pkg from "../../package.json";

export const getVersion = (_req: Request, res: Response) => {
  res.json({ name: pkg.name, version: pkg.version });
};
