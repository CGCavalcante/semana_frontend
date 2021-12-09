import PixService from './pix.service'
import { Request, Response } from 'express';

export default class pixController {
    
    async request( req: Request, res: Response ){
        
        const pixService = new PixService();

        const value = req.body;
        const user = req.user;
        
        const requestKey = await pixService.request(value, user);
        
        return res.status(200).send({copyPastKey: requestKey})
    }

    async pay( req: Request, res: Response ){
        
        const pixService = new PixService();

        const {key} = req.params;
        
        const payment = await pixService.pay(key, req.user);
        
        return res.status(200).send(payment)
    }

    async transactions( req: Request, res: Response ){
        
        const pixService = new PixService();
        
        const transactions = await pixService.transitions(req.user);
        
        return res.status(200).send({transactions})
    }

}