import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { RegisterDto } from './dtos/register.dto';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from './dtos/login.dto';
import { JwtService } from '@nestjs/jwt';
import { JWTPayloadType } from 'src/utils/types';
import { AuthProvider } from './auth.provider';
import { UpdateUserDto } from './dtos/update-user.dto';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly authProvider: AuthProvider
  ) {
    // Constructor logic can be added here if needed
  }

  public async register(registerDto: RegisterDto) {
    return this.authProvider.register(registerDto);

  }

  public async login(loginDto: LoginDto) {
    return this.authProvider.login(loginDto);

  }


  public async update(id: number, updateUserDto: UpdateUserDto) {
    const { password, username } = updateUserDto;
    const user = await this.userRepository.findOne({ where: { id } });

    user.username = username ?? user.username;
    if (password) {
      user.password = await this.authProvider.hashPassword(password);
    }

    return this.userRepository.save(user);
  }
  public async getCurrentUser(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException("user not found");
    return user;
  }

}
