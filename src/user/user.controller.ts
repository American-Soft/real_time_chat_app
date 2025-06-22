import { Body, Controller, Get, HttpCode, HttpStatus, Post, Headers, UseGuards, Put } from '@nestjs/common';
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
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
@Controller('user')
export class UserController {
  constructor(private readonly usersService: UserService) {
  }

  @Post("auth/register")
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    schema: {
      example: {
        success: true,
        message: 'User logged in successfully',
        data: {
          user: {
            id: 1,
            username: 'maged',
            email: 'maged@example.com',
          },
          token: 'jwt_token_here'
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  public register(@Body() body: RegisterDto) {
    return this.usersService.register(body);
  }


  @Post("auth/login")
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

  @Get("auth/current-user")
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: 200, description: 'User profile data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  public getCurrentUser(@CurrentUser() payload: JWTPayloadType) {
    return this.usersService.getCurrentUser(payload.id);
  }

  @Put()
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

}
