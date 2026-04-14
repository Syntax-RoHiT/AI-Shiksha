import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

import { IsEmail, IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';

class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsBoolean()
  @IsOptional()
  rememberMe?: boolean;
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(createUserDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  async login(@Body() loginDto: LoginDto, @Request() req) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    // Pass the franchise ID from the domain (if any) to validation
    const originFranchiseId = (req as any).tenantId || null;
    return this.authService.login(user, originFranchiseId, loginDto.rememberMe ?? false);
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async getProfile(@Request() req) {
    return this.authService.getUserProfile(req.user.userId);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request a password reset link' })
  async forgotPassword(@Body() body: { email: string }, @Request() req) {
    if (!body.email) throw new UnauthorizedException('Email is required');
    const originFranchiseId = (req as any).tenantId || null;
    return this.authService.forgotPassword(body.email, originFranchiseId);
  }

  @Post('reset-password')
  @ApiOperation({ summary: 'Reset the password securely' })
  async resetPassword(@Body() body: { token: string; password: string }) {
    if (!body.token || !body.password) throw new UnauthorizedException('Token and password are required');
    return this.authService.resetPassword(body.token, body.password);
  }
}
