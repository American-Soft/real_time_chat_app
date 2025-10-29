import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards, Put, Param, ParseIntPipe, UseInterceptors, BadRequestException, Delete, Res, UploadedFile } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { JWTPayloadType } from 'src/utils/types';
import { CurrentUser } from './decorator/current-user.decorator';
import { AuthGuard } from './guards/auth.guard';
import { UpdateUserDto } from './dtos/update-user.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageUploadDto } from './dtos/image-upload.dto';
import { Response } from 'express';
@ApiTags('Users')
@ApiBearerAuth()
@Controller('v1/users')
export class UserController {
  constructor(private readonly usersService: UserService) {
  }

  @Post("register")
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    schema: {
      example: {
        success: true,
        message: 'Verification token has been sent to your email, please verify your email address',

      }
    }
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  public register(@Body() body: RegisterDto) {
    return this.usersService.register(body);
  }


  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login a user' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'User logged in successfully',
    schema: {
      example: {
        success: true,
        message: 'User logged in successfully',
        data: {
          user: {
            id: 1,
            email: 'maged@example.com',
            username: 'maged'
          },
          token: 'jwt_token_here'
        }
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
    schema: {
      example: {
        success: false,
        message: 'Invalid email or password',
      }
    }
  })
  public login(@Body() body: LoginDto) {
    return this.usersService.login(body);
  }

  @Get("me")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: 200, description: 'User profile data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public getCurrentUser(@CurrentUser() payload: JWTPayloadType) {
    return this.usersService.getCurrentUser(payload.id);
  }

  @Put('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current user' })
  @ApiBody({ type: UpdateUserDto })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    schema: {
      example: {
        id: 1,
        username: 'updatedUsername',
        email: 'user@example.com',
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed',
    schema: {
      example: {
        statusCode: 400,
        message: ['username must be a string'],
        error: 'Bad Request'
      }
    }
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      }
    }
  })
  public updateUser(@CurrentUser() payload: JWTPayloadType, @Body() body: UpdateUserDto) {
    return this.usersService.update(payload.id, body);
  }

  @Get(":id/verify-email/:verificationToken")
  public verifyEmail(
    @Param('id', ParseIntPipe) id: number,
    @Param('verificationToken') verificationToken: string
  ) {
    return this.usersService.verifyEmail(id, verificationToken);
  }

  @Post("forgot-password")
  @HttpCode(HttpStatus.OK)
  public forgotPassword(@Body() body: ForgotPasswordDto) {
    return this.usersService.sendResetPassword(body.email);
  }

  @Get(":id/reset-password/:token")
  public getResetPassword(
    @Param("id", ParseIntPipe) id: number,
    @Param("resetPasswordToken") resetPasswordToken: string
  ) {
    return this.usersService.getResetPassword(id, resetPasswordToken);
  }

  @Post("reset-password")
  public resetPassword(@Body() body: ResetPasswordDto) {
    return this.usersService.resetPassword(body);
  }


  @Post('me/profile-image')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('profile-image'))
  @ApiSecurity('bearer')
  @ApiConsumes("multipart/form-data")
  @ApiBody({ type: ImageUploadDto, description: 'profile image' })
  public uploadProfileImage(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() payload: JWTPayloadType) {
    if (!file) throw new BadRequestException("no image provided");
    return this.usersService.setProfileImage(payload.id, file.filename);
  }

  @Delete("me/profile-image")
  @UseGuards(AuthGuard)
  @ApiSecurity('bearer')
  public removeProfileImage(@CurrentUser() payload: JWTPayloadType) {
    return this.usersService.removeProfileImage(payload.id);
  }

  @Delete('me')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete current user account' })
  @ApiResponse({
    status: 200,
    description: 'User account deleted successfully',
    schema: {
      example: {
        success: true,
        message: 'Your account has been deleted successfully',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      example: {
        success: false,
        message: 'Unauthorized',
      },
    },
  })
  public deleteAccount(@CurrentUser() payload: JWTPayloadType) {
    return this.usersService.deleteAccount(payload.id);
  }


  @Get("profile-images/:filename")
  @UseGuards(AuthGuard)
  @ApiSecurity('bearer')
  public showProfileImage(@Param('filename') profile_image: string, @Res() res: Response) {
    return res.sendFile(profile_image, { root: 'profile-images' })
  }


}
