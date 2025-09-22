import { User } from "src/user/user.entity";
import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity('groups')
export class Group {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    description: string;
    @ManyToOne(() => User, { eager: true })
    creator: User;

    @ManyToMany(() => User, { eager: true })  // groups can have many members
    @JoinTable()
    members: User[];

    @ManyToMany(() => User, { eager: true })  // groups can have many admins
    @JoinTable()
    admins: User[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

}   