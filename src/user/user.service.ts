import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { RegisterDto } from './dtos/register.dto';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dtos/login.dto';
import { JwtService } from '@nestjs/jwt';
import { JWTPayloadType } from 'src/utils/types';

@Injectable()
export class UserService {
    constructor(   @InjectRepository(User) private readonly userRepository: Repository<User>,
private readonly jwtService: JwtService) {
        // Constructor logic can be added here if needed
    }

      public async register(registerDto: RegisterDto) {
        const { email, password, username } = registerDto;
        const existingUser = await this.userRepository.findOne({ where: { email } });
        if (existingUser) {
            throw new Error('User with this email already exists');
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        let newSUser = this.userRepository.create({
            email,
            password: hashedPassword,
            userName: username,
        });
        newSUser = await this.userRepository.save(newSUser);
        const token = await this.generateJWTToken({id: newSUser.id, email: newSUser.email });
        return {
            user: newSUser,
            token,
        };
    }

    public async login(loginDto: LoginDto) {
        const { email, password } = loginDto;
        const user = await this.userRepository.findOne({ where: { email } });
        if (!user) {
            throw new BadRequestException('Invalid email or password');
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new BadRequestException('Invalid email or password');
        }
                const token = await this.generateJWTToken({id: user.id, email: user.email });

        return {
            token,
        };
    }

     public async getCurrentUser(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException("user not found");
    return user;
  }

    private async generateJWTToken(payload: JWTPayloadType): Promise<string> {
       return this.jwtService.signAsync(payload);
    }
}
