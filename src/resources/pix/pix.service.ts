import { getRepository } from 'typeorm';
import { encodeKey, decodeKey } from '../../utils/utilsPix';
import { User } from '../../entity/user';
import AppError from '../../shared/error/AppError';
import { sign } from 'jsonwebtoken';
import { Pix } from '../../entity/pix';

export default class PixService {
    

    async request( value: number, user: Partial<User> ) {

        const pixRepository = getRepository(Pix);

        const userRepository = getRepository(User);

        const currentUser = await userRepository.findOne(
            {
                where: { id: user.id}
            }
        )

        const requestData = {
            requetingUser: currentUser,
            value,
            status: 'open'
        }

        const register = await pixRepository.save(requestData);

        const key = encodeKey( user.id || '', value, register.id )

        return key
        
    }

    async pay( key: string, user: Partial<User> ) {

        const keyDecoded = decodeKey(key);

        if ( keyDecoded.registerID == user.id ) {
            throw new AppError( 'Não é possivel receber o PIX do mesmo usuário', 401)
        }

        const pixRepository = getRepository(Pix);

        const userRepository = getRepository(User);

        const requestingUser = await userRepository.findOne({
            where: {id: keyDecoded.userId}
        });

        const payignUser = await userRepository.findOne({
            where: {id: user.id}
        });

        if ( payignUser?.wallet && payignUser.wallet < Number(keyDecoded.value ) ) {

            throw new AppError('Saldo insuficiente para essa operação ');
        }

        if ( !requestingUser || !payignUser ) {

            throw new AppError('Cliente não encontrado para essa operação ');

        }

        requestingUser.wallet = Number(requestingUser?.wallet) + Number(keyDecoded.value);
        await userRepository.save(requestingUser);

        payignUser.wallet = Number(payignUser?.wallet) - Number(keyDecoded.value);
        await userRepository.save(payignUser);        

        const pixTransaction = await pixRepository.findOne({
            where: { 
                id: keyDecoded.registerID,
                status: 'open'
            }
        });


        if ( !pixTransaction ) {
            throw new AppError('Chave inválida para pagamento');
        }
        
        pixTransaction.status = 'close';
        pixTransaction.payingUser = payignUser;

        await pixRepository.save(pixTransaction);

        return {msg: 'Pagamento realizado com sucesso'}
        
    }

    async transitions( user: Partial<User> ) {

        const pixRepository = getRepository(Pix);
        
        const pixReceived = await ( await pixRepository.find({
            where: { 
                requestingUser: user.id,
                status: 'close',
                relations: ['payingUser']
            }
        }));

        const pixPaying = await pixRepository.find({
            where: { 
                requestingUser: user.id,
                status: 'close',
                relations: ['requestingUser']
            }
        });

        const received = pixReceived.map( transaction => ({
            value: transaction.value,
            user: {
                firstname: transaction.payingUser.firstName,
                lastname: transaction.payingUser.lastName
            },
            updateAt: transaction.updateAt,
            type: 'received'
        }));

        const paying = pixPaying.map( transaction => ({
            value: transaction.value,
            user: {
                firstname: transaction.payingUser.firstName,
                lastname: transaction.payingUser.lastName
            },
            updateAt: transaction.updateAt,
            type: 'paid'
        }));

        const allTransactions = received.concat(paying);

        allTransactions.sort( function (a,b) {
            const dateA = new Date(a.updateAt).getTime();
            const dateB = new Date(b.updateAt).getTime();
            return dateA < dateB ? 1:-1;
        })

        return allTransactions
    }
}