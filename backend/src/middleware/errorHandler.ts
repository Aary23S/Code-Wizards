import { Request, Response, NextFunction } from 'express';

export interface HttpError extends Error {
    statusCode?: number;
    code?: string;
}

export const errorHandler = (
    err: HttpError,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const statusCode = err.statusCode || 500;
    const code = err.code || 'internal-error';
    
    console.error(`[${statusCode}] ${code}:`, err.message);
    
    res.status(statusCode).json({
        error: err.message || 'Internal server error',
        code,
    });
};

export class ApiError extends Error implements HttpError {
    statusCode: number;
    code: string;

    constructor(message: string, statusCode: number = 500, code: string = 'internal-error') {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
    }
}
