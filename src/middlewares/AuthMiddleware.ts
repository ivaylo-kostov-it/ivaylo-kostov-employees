import { ExpressMiddlewareInterface } from 'routing-controllers';
import { Service } from 'typedi';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

@Service()
export class AuthMiddleware implements ExpressMiddlewareInterface {
    use(req: Request, res: Response, next: NextFunction): void {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            res.status(401).send({ message: 'Authentication token is required' });
            return;
        }

        try {
            // Verify JWT token
            const secret = process.env.JWT_SECRET || 'default_secret';
            jwt.verify(token, secret);
            next();
        } catch (error) {
            res.status(401).send({ message: 'Invalid authentication token' });
        }
    }
}
