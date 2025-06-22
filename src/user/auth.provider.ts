import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./user.entity";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import { RegisterDto } from "./dtos/register.dto";
import * as bcrypt from 'bcryptjs';
import { LoginDto } from "./dtos/login.dto";
import { JWTPayloadType } from "../utils/types";
import { randomBytes } from "node:crypto"
import { ConfigService } from "@nestjs/config";

@Injectable()
export class AuthProvider {

    constructor(
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService,
        private readonly config: ConfigService
    ) { }

     public async register(registerDto: RegisterDto) {
           const { email, password, username } = registerDto;
           const existingUser = await this.userRepository.findOne({ where: { email } });
           if (existingUser) {
               return {
      success: false,
      message: 'User with this email already exists',
    };
           }
           const hashedPassword = await this.hashPassword(password);
           let newSUser = this.userRepository.create({
               email,
               password: hashedPassword,
               username: username,
           });
           newSUser = await this.userRepository.save(newSUser);
           const token = await this.generateJWTToken({id: newSUser.id, email: newSUser.email });
           return {
  success: true,
  message: 'User logged in successfully',
  data: {
    user:newSUser,
    token,
  },
};
       }

   
       public async login(loginDto: LoginDto) {
           const { email, password } = loginDto;
           const user = await this.userRepository.findOne({ where: { email } });
           if (!user) {
               return {
      success: false,
      message: 'Invalid email or password',
    };
           }
           const isPasswordValid = await bcrypt.compare(password, user.password);
           if (!isPasswordValid) {
  return {
      success: false,
      message: 'Invalid email or password',
    };           }
                   const token = await this.generateJWTToken({id: user.id, email: user.email });
   
           return {
  success: true,
  message: 'User logged in successfully',
  data: {
    user,
    token,
  },
};
       }

  
   

    public async hashPassword(password: string): Promise<string> {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    }

    private generateJWTToken(payload: JWTPayloadType): Promise<string> {
        return this.jwtService.signAsync(payload);
    }
}