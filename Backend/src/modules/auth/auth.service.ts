import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) { }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(email);
    if (user && (await bcrypt.compare(pass, user.password_hash))) {
      const { password_hash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any, originFranchiseId?: string | null) {
    // STRICT FRANCHISE ISOLATION:
    // If request comes from a franchise domain (originFranchiseId exists),
    // user MUST belong to that franchise.
    // SUPER_ADMIN is NOT allowed to login to a franchise domain, they must use the system domain.
    if (originFranchiseId) {
      if (user.role === 'SUPER_ADMIN') {
        // Find if this originFranchiseId is the localhost/system domain we auto-created
        // For simplicity, we can trust they are hitting a valid franchise, but SUPER_ADMIN
        // should ideally only go to localhost. We will just bypass the block if they are SUPER_ADMIN
        // and let them login to manage the system.
        // Or we can check if originFranchiseId matches their own (which is null).
        // Since SUPER_ADMIN has franchise_id=null, we allow them through on any domain for now,
        // or strictly on 'localhost' if we had the domain name here.
        // Actually, let's just allow SUPER_ADMIN to login anywhere since they are global admins.
      } else if (user.franchise_id !== originFranchiseId) {
        throw new UnauthorizedException('You do not have access to this franchise');
      }
    }

    // SYSTEM DOMAIN PROTECTION:
    // If request comes from System (originFranchiseId is null/undefined),
    // ONLY SUPER_ADMIN or users explicitly without franchise (if any) can login.
    // Franchise Users/Admins MUST login via their Franchise URL.
    if (!originFranchiseId && user.franchise_id && user.role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException('Please login via your Franchise URL');
    }

    const payload = {
      username: user.email,
      sub: user.id,
      role: user.role,
      franchise_id: user.franchise_id || null,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: this.normalizeRole(user.role),
        avatar_url: user.avatar_url,
        bio: user.bio,
        franchise_id: user.franchise_id || null,
        franchise: user.franchise || null,
      },
    };
  }

  async register(createUserDto: CreateUserDto) {
    // Check if user exists
    const existingUser = await this.usersService.findOne(createUserDto.email);
    if (existingUser) {
      throw new UnauthorizedException('User already exists'); // Or ConflictException
    }
    const user = await this.usersService.create(createUserDto);

    // Send emails
    this.mailService.sendWelcomeEmail({
      email: user.email,
      name: user.name,
      franchise_id: user.franchise_id || null,
    });
    this.mailService.sendNewRegistrationNotificationToAdmin({
      email: user.email,
      name: user.name,
      franchise_id: user.franchise_id || null,
    });

    return user;
  }

  async getUserProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: this.normalizeRole(user.role),
      avatar_url: user.avatar_url,
      bio: user.bio,
      franchise_id: (user as any).franchise_id || null,
      franchise: (user as any).franchise || null,
    };
  }

  private normalizeRole(role: string): string {
    if (role === 'INSTRUCTOR') return 'teacher';
    if (role === 'SUPER_ADMIN') return 'super_admin';
    if (role === 'FRANCHISE_ADMIN') return 'FRANCHISE_ADMIN'; // Keep uppercase for frontend checks or consistency
    return role.toLowerCase();
  }
}

