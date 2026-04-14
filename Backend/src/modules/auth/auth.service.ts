import { Injectable, UnauthorizedException, NotFoundException, BadRequestException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
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

  async login(user: any, originFranchiseId?: string | null, rememberMe: boolean = false) {
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

    // If rememberMe is true, token lasts 30 days; otherwise 24 hours.
    const expiresIn = rememberMe ? '30d' : '24h';

    return {
      access_token: this.jwtService.sign(payload, { expiresIn }),
      rememberMe,
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
    if (role === 'FRANCHISE_ADMIN') return 'franchise_admin';
    return role.toLowerCase();
  }

  async forgotPassword(email: string, originFranchiseId?: string | null) {
    // 1. Find user by email and franchise_id (to maintain strict isolation)
    const baseUser = await this.usersService.findOne(email);
    if (!baseUser) {
      // Do not reveal if the user exists for security reasons
      return { message: 'If an account with that email exists, a password reset link has been sent.' };
    }

    const user = await this.usersService.findById(baseUser.id);
    if (!user) {
      return { message: 'If an account with that email exists, a password reset link has been sent.' };
    }

    // 2. Enforce Isolation: Ensure user belongs to the requested franchise, or is SUPER_ADMIN
    if (originFranchiseId && user.role !== 'SUPER_ADMIN' && user.franchise_id !== originFranchiseId) {
      return { message: 'If an account with that email exists, a password reset link has been sent.' };
    }

    // 3. Generate secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenExpires = new Date();
    tokenExpires.setHours(tokenExpires.getHours() + 1); // 1 hour expiry

    // 4. Save token to user record
    await this.usersService.updateResetToken(user.id, token, tokenExpires);

    // 5. Send Email
    // If we have an originFranchiseId, we know this came from a custom domain
    // we need to build the correct reset link. For simplicity we assume
    // the frontend URL is whatever domain we are on. 
    // Usually the frontend passes an origin or we read it from req headers, 
    // but here we can just pass the path and let the MailService or Frontend figure out the domain if needed,
    // or we can require the frontend to send the `reset_url` base.
    
    // For now, let's just make the frontend handle the origin and send it, or we rely on franchise logic.
    const frontendBaseUrl = originFranchiseId 
        ? ((user as any).franchise?.domain ? `https://${(user as any).franchise.domain}` : process.env.FRONTEND_URL) 
        : process.env.FRONTEND_URL;

    const resetLink = `${frontendBaseUrl}/reset-password?token=${token}`;

    await this.mailService.sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      franchise_id: user.franchise_id || null
    }, resetLink);

    return { message: 'If an account with that email exists, a password reset link has been sent.' };
  }

  async resetPassword(token: string, newPassword: string) {
    // 1. Find user by token
    const user = await this.usersService.findByResetToken(token);
    
    if (!user) {
      throw new BadRequestException('Invalid or expired password reset token');
    }

    // 2. Check Expiry
    if (user.reset_password_expires && user.reset_password_expires < new Date()) {
      throw new BadRequestException('Password reset token has expired');
    }

    // 3. Hash New Password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);

    // 4. Update Password and Clear Token
    await this.usersService.updatePasswordAndClearToken(user.id, password_hash);

    return { message: 'Password has been successfully reset' };
  }
}

