import { User } from "src/user/user.entity";
import { Column, CreateDateColumn, Entity, JoinTable, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('groups')
export class Group {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @ManyToOne(() => User, { eager: true })
    creator: User;

    @ManyToOne(() => User, { eager: true })
    @JoinTable()
    members: User[];

    @ManyToOne(() => User, { eager: true })
    @JoinTable()
    admins: User[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

}   