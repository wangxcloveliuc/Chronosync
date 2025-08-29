import { Controller, Get, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  findProfile(@Request() req) {
    return this.usersService.findById(req.user.id);
  }

  // Lookup a user by email (used for task sharing by email)
  @Get('by-email')
  async findByEmail(@Query('email') email: string) {
    if (!email) {
      return null;
    }
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }

    // Return safe public fields only
    return {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      avatar: user.avatar,
    };
  }

  @Patch('profile')
  update(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(req.user.id, updateUserDto);
  }

  @Delete('profile')
  remove(@Request() req) {
    return this.usersService.remove(req.user.id);
  }
}