import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import { nextTick } from 'process';
import authConfig from '../config/auth';
import AppError from '../shared/error/AppError';

interface ITokenPlayload {
    firstName: string;
    lastName: string;
    iat: number;
    exp: number;
    sub: string;
}

export default function userAuthenticated (

    req: Request,
    res: Response,
    nest: NextFunction
) : void {

    const authHeader = req.headers.authorization;

    if ( !authHeader ) {
        throw new AppError('Nã foi enviado  o JWT', 401);
    }

    const [, token ] = authHeader.split(' ');

    try {
        const decoded = verify( token, authConfig.jwt.secret );

        const { sub, firstName, lastName } = decoded as ITokenPlayload;

        req.user = {

            id: sub,
            firstName,
            lastName
        };

        return next();

    }catch {
        throw new AppError('Token JWT inválido', 401)
    }

}