import { getRepository } from 'typeorm';
import { User } from '../../entity/user';
import { UserSignIn } from './dtos/user.signin.dtos';
import { UserSignUP} from './dtos/user.signup.dtos';
import md5 from 'crypto-js/md5';
import AppError from '../../shared/error/AppError';
import { sign } from 'jsonwebtoken';
import authConfig from '../../config/auth';

export default class UserService {
    
    async signin( user: UserSignIn ){

        const userRepository = getRepository( User );

        const {email, password } = user;

        const passwordHash = md5(password).toString();
        
        const existUser = await userRepository.findOne(
            {
                where: {
                    email,
                    password: passwordHash
                }
            }
        );

        if ( !existUser ) {
            throw new AppError('Usuário não encontrado', 401);
        }

        const { secret, expiresIn } = authConfig.jwt;

        const token = sign(
            {
                firstName: existUser.firstName,
                lastename: existUser.lastName,
                accountNumber: existUser.accountNumber,
                accountDigit: existUser.accountDigit,
                wallet: existUser.wallet
                
            },
            secret , 
            {
                subject: existUser.id,
                expiresIn
            }
        );

        //@ts-expect-error
        delete existUser.password

        return {accesToken: token}
    }

    async signup( user: UserSignUP ){

        const userRepository = getRepository(User);

        const existeUser = await userRepository.findOne(
            {
                where: {
                    email: user.email
                }
            }
        )

        if ( existeUser) {
            throw new AppError('Usuário já cadastrado', 401)
        }

        const userData = {
            ...user,
            password: md5(user.password).toString(),
            wallet: 5000,
            accountNumber: Math.floor(Math.random() * 999999),
            accountDigit: Math.floor(Math.random() * 99)
        }

        const userCreate =  await userRepository.save(userData);

        const { secret, expiresIn } = authConfig.jwt;

        const token = sign(
            {
                firstName: user.firstName,
                lastename: user.lastName,
                accountNumber: userData.accountNumber,
                accountDigit: userData.accountDigit,
                wallet: userData.wallet
                
            },
            secret , 
            {
                subject: userCreate.id,
                expiresIn
            }
        );

    }

    async me ( user: Partial<User> ) {
        
        const userRepository = getRepository(User);

        const currentUser = await userRepository.findOne({
            where: {
                id: user.id
            }
        });

        if ( !currentUser ) {
            throw new AppError('Usuário não encontrado', 401);
        }

        //@ts-expect-error
        delete currentUser.password

        return currentUser
    }

}