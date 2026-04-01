import { Controller, Request, Post, UseGuards, Body, Get, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';

@Controller('auth')
export class AuthController {
  constructor(
      private authService: AuthService,
      private prisma: PrismaService
  ) {}

  @Post('login')
  async login(@Body() req) {
    const user = await this.authService.validateUser(req.email, req.password);
    if (!user) {
        throw new Error('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @Post('signup')
  async signup(@Body() req) {
    return this.authService.signup(req);
  }
  
  // Basic KYC Submission (For MVP, just taking details)
  @Post('kyc')
  async submitKyc(@Body() body: { userId: string; firstName: string; lastName: string; dob: string; country: string; documentType: string; documentUrl: string }) {
      // In a real app, verify the user making the request is the userId (via Guard)
      return this.prisma.kYC.create({
          data: {
              userId: body.userId,
              firstName: body.firstName,
              lastName: body.lastName,
              dob: new Date(body.dob),
              country: body.country,
              documentType: body.documentType,
              documentUrl: body.documentUrl, // In real app, this is S3 URL
              status: 'PENDING'
          }
      });
  }

  // @UseGuards(AuthGuard('jwt'))
  // @Get('profile')
  // getProfile(@Request() req) {
  //   return req.user;
  // }
}
