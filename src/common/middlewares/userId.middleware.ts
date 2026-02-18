import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";

// Extende o tipo Request para incluir user
interface RequestWithUser extends Request {
  user?: {
    id: number;
    email: string;
  };
}

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  use(req: RequestWithUser, res: Response, next: NextFunction) {
    console.log(req.user)
    if (req.user) {
      console.log("User ID:", req.user.id);
      console.log("User Email:", req.user.email);
    }

    next();
  }
}
