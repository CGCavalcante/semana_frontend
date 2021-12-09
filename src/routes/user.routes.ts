import { Router } from 'express'
import userAuthenticated from '../middlewares/userAuthenticated';
import UserController from '../resources/user/user.controlles'

const userRouter = Router();
const userController = new UserController();


userRouter.post('/singin', userController.signin);

userRouter.post('/singup', userController.signup);

userRouter.get('/me', userAuthenticated, userController.me);

export default userRouter;