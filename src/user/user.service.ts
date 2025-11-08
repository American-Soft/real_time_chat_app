import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { AuthProvider } from './auth.provider';
import { UpdateUserDto } from './dtos/update-user.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { join } from 'node:path';
import { unlinkSync } from 'node:fs';
import { EventEmitter2 } from '@nestjs/event-emitter';
@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly authProvider: AuthProvider,
    private readonly eventEmitter: EventEmitter2
  ) {
  }


  /**
   * Create new user
   * @param registerDto data for creating new user
   * @returns JWT (access token)
   */
  public async register(registerDto: RegisterDto) {
    return this.authProvider.register(registerDto);

  }

  /**
  * Log In user
  * @param loginDto data for log in to user account
  * @returns JWT (access token)
  */
  public async login(loginDto: LoginDto) {
    return this.authProvider.login(loginDto);

  }


  /**
 * Update user
 * @param id id of the logged in user
 * @param updateUserDto data for updating the user
 * @returns updated user from the database
 */
  public async update(id: number, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    if (updateUserDto.password) {
      updateUserDto.password = await this.authProvider.hashPassword(updateUserDto.password);
    } else {
      delete updateUserDto.password;
    }

    const updatedUser = this.userRepository.merge(user, updateUserDto);

    return this.userRepository.save(updatedUser);
  }


  /**
 * Get current user (logged in user)
 * @param id id of the logged in user
 * @returns the user from the database
 */
  public async getCurrentUser(id: number): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException("user not found");
    return user;
  }


  /**
   * Verify Email
   * @param userId id of the user from the link
   * @param verificationToken verification token from the link
   * @returns success message
   */
  public async verifyEmail(userId: number, verificationToken: string) {
    const user = await this.getCurrentUser(userId);

    if (user.verificationToken === null)
      throw new NotFoundException("there is no verification token");

    if (user.verificationToken !== verificationToken)
      throw new BadRequestException("invalid link");

    user.isAcountVerified = true;
    user.verificationToken = null;

    await this.userRepository.save(user);
    return { success: true, message: "Your email has been verified, please log in to your account" };
  }

  /**
 * Sending reset password template
 * @param email email of the user
 * @returns a success message
 */

  public sendResetPassword(email: string) {
    return this.authProvider.sendResetPasswordLink(email);
  }

  /**
   * Get reset password link
   * @param userId user id from the link
   * @param resetPasswordToken reset password token from the link
   * @returns a success message
   */
  public getResetPassword(userId: number, resetPasswordToken: string) {
    return this.authProvider.getResetPasswordLink(userId, resetPasswordToken);
  }

  /**
   * Reset the password
   * @param dto data for reset the password
   * @returns a success message
   */
  public resetPassword(dto: ResetPasswordDto) {
    return this.authProvider.resetPassword(dto);
  }

  /**
 * Set Profile Image
 * @param userId id of the logged in user
 * @param newProfileImage profile image
 * @returns the user from the database
 */
  public async setProfileImage(userId: number, newProfileImage: string) {
    const user = await this.getCurrentUser(userId);

    if (user.profileImage === null) {
      user.profileImage = newProfileImage;
    } else {
      await this.removeProfileImage(userId);
      user.profileImage = newProfileImage;
    }

    return this.userRepository.save(user);
  }

  /**
   * Remove Profile Image
   * @param userId id of the logged in user
   * @returns the user from the database
   */
  public async removeProfileImage(userId: number) {
    const user = await this.getCurrentUser(userId);
    if (user.profileImage === null)
      throw new BadRequestException("there is no profile image");

    const imagePath = join(process.cwd(), 'uploads', 'profiles', user.profileImage);

    unlinkSync(imagePath);

    user.profileImage = null;
    return this.userRepository.save(user);
  }

  /**
 * Delete current user account
 * @param userId id of the logged in user
 * @returns success message
 */
  public async deleteAccount(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');


    await this.userRepository.remove(user);

    this.eventEmitter.emit('user.deleted', { user });

    return {
      success: true,
      message: 'Your account has been deleted successfully',
    };
  }
}
