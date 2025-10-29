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

    @Column({ nullable: true })
    image: string;

    @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE', onUpdate: 'CASCADE' })
    creator: User;

    @ManyToMany(() => User, { eager: true, onDelete: 'CASCADE' })
    @JoinTable()
    members: User[];

    @ManyToMany(() => User, { eager: true, onDelete: 'CASCADE' })
    @JoinTable()
    admins: User[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

}

