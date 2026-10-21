import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";

@Injectable()
export class ClientTypeMiddleWare implements NestMiddleware {
    use(req:Request,res:Response,next:NextFunction){
        const clientType = req.headers['x-client-type'] || 'web';
        (req as any).clientType = clientType;
        next();
    }
}