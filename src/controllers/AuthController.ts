import { JsonController, Post, Body } from 'routing-controllers';
import { Service } from 'typedi';
import * as jwt from 'jsonwebtoken';

interface LoginRequest {
    username: string;
    password: string;
}

@JsonController('/auth')
@Service()
export class AuthController {
    @Post('/login')
    async login(@Body() credentials: LoginRequest): Promise<{ token: string }> {
        // In a real application, you would validate credentials against your database
        // This is a simplified example for demonstration purposes

        if (credentials.username === 'admin' && credentials.password === 'blackdeep') {
            const token = jwt.sign(
                { userId: 1, username: credentials.username },
                process.env.JWT_SECRET || 'default_secret',
                { expiresIn: '24h' }
            );

            return { token };
        } else {
            throw new Error('Invalid credentials');
        }
    }
}
