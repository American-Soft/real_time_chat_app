import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { User } from "./user.entity";
import { Repository } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import { RegisterDto } from "./dtos/register.dto";
import * as bcrypt from 'bcryptjs';
import { LoginDto } from "./dtos/login.dto";
import { JWTPayloadType } from "../utils/types";
import { ConfigService } from "@nestjs/config";
import { randomBytes } from "node:crypto";
import { MailService } from "src/mail/mail.service";
import { ResetPasswordDto } from "./dtos/reset-password.dto";

@Injectable()
export class AuthProvider {

    constructor(
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService,
        private readonly config: ConfigService,
        private readonly mailService: MailService,
    ) { }


    /**
    * Create new user
    * @param registerDto data for creating new user
    * @returns a success message
    */

    public async register(registerDto: RegisterDto) {
        try {
            const { email, password, username,firstName,lastName } = registerDto;
            const existingUser = await this.userRepository.findOne({ where: { email } });
            if (existingUser) {
                throw new BadRequestException('User with this email already exists');
            }
            const hashedPassword = await this.hashPassword(password);
            let user = this.userRepository.create({
                email,
                password: hashedPassword,
                username: username,
                verificationToken: randomBytes(32).toString('hex'),
            });
            user = await this.userRepository.save(user);
            const verifyLink = this.generateLink(user.id, user.verificationToken);
            await this.mailService.sendVerifyEmailTemplate(email, verifyLink);
            const token = await this.generateJWTToken({ id: user.id, email: user.email });
            return {
                success: true,
                message: 'Verification token has been sent to your email, please verify your email address',
                data: {
                    user,
                    token,
                },

            };
        } catch (error) {
            throw new BadRequestException(error.message || 'Registration failed');
        }
    }

    /**
 * Log In user
 * @param loginDto data for log in to user account
 * @returns JWT (access token)
 */
    public async login(loginDto: LoginDto) {
        try {
            const { email, password } = loginDto;
            const user = await this.userRepository.findOne({ where: { email } });
            if (!user) throw new BadRequestException('Invalid email or password');

            const isPasswordValid = await bcrypt.compare(password, user.password);
            if (!isPasswordValid) throw new BadRequestException('Invalid email or password');

            const token = await this.generateJWTToken({ id: user.id, email: user.email });

            return {
                success: true,
                message: 'User logged in successfully',
                data: {
                    user,
                    token,
                },
            };
        } catch (err) {
            throw new BadRequestException(err.message || 'Login failed');
        }
    }


    public async sendResetPasswordLink(email: string) {
        try {
            const user = await this.userRepository.findOne({ where: { email } });
            if (!user) throw new BadRequestException('User with given email does not exist');

            user.resetPasswordToken = randomBytes(32).toString('hex');
            const result = await this.userRepository.save(user);

            const resetPasswordLink = `${this.config.get<string>('CLIENT_DOMAIN')}/reset-password/${user.id}/${result.resetPasswordToken}`;
            await this.mailService.sendResetPasswordTemplate(email, resetPasswordLink);

            return { message: 'Password reset link sent to your email, please check your inbox' };
        } catch (err) {
            throw new BadRequestException(err.message || 'Failed to send reset password link');
        }
    }

    public async getResetPasswordLink(userId: number, resetPasswordToken: string) {
        try {
            const user = await this.userRepository.findOne({ where: { id: userId } });
            if (!user || user.resetPasswordToken !== resetPasswordToken)
                throw new BadRequestException('Invalid reset password link');

            return { message: 'Valid link' };
        } catch (err) {
            throw new BadRequestException(err.message || 'Invalid reset password link');
        }
    }

    public async resetPassword(dto: ResetPasswordDto) {
        try {
            const { userId, resetPasswordToken, newPassword } = dto;
            const user = await this.userRepository.findOne({ where: { id: userId } });

            if (!user || user.resetPasswordToken !== resetPasswordToken)
                throw new BadRequestException('Invalid reset password link');

            const hashedPassword = await this.hashPassword(newPassword);
            user.password = hashedPassword;
            user.resetPasswordToken = null;

            await this.userRepository.save(user);
            return { message: 'Password reset successfully, please log in' };
        } catch (err) {
            throw new BadRequestException(err.message || 'Password reset failed');
        }
    }


    /**
   * Hashing password
   * @param password plain text password
   * @returns hashed password
   */
    public async hashPassword(password: string): Promise<string> {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    }
    /**
       * Generate Json Web Token
       * @param payload JWT payload
       * @returns token
       */
    private generateJWTToken(payload: JWTPayloadType): Promise<string> {
        return this.jwtService.signAsync(payload);
    }

    private generateLink(userId: number, verificationToken: string) {
        return `${this.config.get<string>("DOMAIN")}/user/verify-email/${userId}/${verificationToken}`;
    }
}