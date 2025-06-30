import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'users' })
export class User {
@PrimaryGeneratedColumn()
id: number;
@Column({type: 'varchar', length: 150, nullable: true})
username: string;
@Column({type: 'varchar', length: 250, unique: true})
email: string;
@Column()
password: string;
@Column({ nullable: true })
verificationToken: string;
@Column({ nullable: true })
resetPasswordToken: string;
@Column({ default: false,nullable: true })
isAcountVerified: boolean;
@Column({ nullable: true,default:null })
profileImage: string;
@Column({type:'timestamp', default: () => 'CURRENT_TIMESTAMP'})
createdAt: Date;
@Column({type:'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP'})
updatedAt: Date;

}