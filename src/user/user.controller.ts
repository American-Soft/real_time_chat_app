import { Body, Controller, Get, HttpCode, HttpStatus, Post,Headers, UseGuards, Put } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterDto } from './dtos/register.dto';
import { LoginDto } from './dtos/login.dto';
import { JWTPayloadType } from 'src/utils/types';
import { CurrentUser } from './decorator/current-user.decorator';
import { AuthGuard } from './guards/auth.guard';
import { UpdateUserDto } from './dtos/update-user.dto';

@Controller('user')
export class UserController {
    constructor( private readonly usersService: UserService) {
        // Constructor logic can be added here if needed
    }

    @Post("auth/register")
    public register(@Body() body: RegisterDto) {
        return this.usersService.register(body);
    }
      @Post("auth/login")
    @HttpCode(HttpStatus.OK)
    public login(@Body() body: LoginDto) {
        return this.usersService.login(body);
    }

     @Get("auth/current-user")
     @UseGuards(AuthGuard)
    public getCurrentUser(@CurrentUser() payload: JWTPayloadType) {
        return this.usersService.getCurrentUser(payload.id);
    }

    @Put()
    @UseGuards(AuthGuard)
    public updateUser(@CurrentUser() payload: JWTPayloadType, @Body() body: UpdateUserDto) {
        return this.usersService.update(payload.id, body);
    }

}
