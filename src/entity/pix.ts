import {
    Entity,
    PrimaryGeneratedColumn,
    JoinColumn,
    OneToOne,
    Column,
    CreateDateColumn,
    ManyToOne,
    UpdateDateColumn
} from 'typeorm';
import { User } from './user';

@Entity()

export class Pix {

    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    status: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updateAt: Date;

    @ManyToOne( ( )=> User, user => user.id )
    @JoinColumn()
    requestingUser: User;

    @ManyToOne( ( )=> User, user => user.id, {nullable: true} )
    @JoinColumn()
    payingUser: User;

}