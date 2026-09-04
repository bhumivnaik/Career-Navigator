import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { PrismaService } from './prisma.service.js'

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(
    fullName: string,
    email: string,
    password: string,
  ) {
    // Check whether email already exists
    const existingUser = await this.prisma.users.findUnique({
      where: { email },
    })

    if (existingUser) {
      throw new ConflictException('Email already registered')
    }

    // Hash password before storing it
    const passwordHash = await bcrypt.hash(password, 10)

    // Create user
    const user = await this.prisma.users.create({
      data: {
        full_name: fullName,
        email,
        password_hash: passwordHash,
      },
    })

    return {
      message: 'Registration successful',
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
      },
    }
  }

  async login(email: string, password: string) {
    // Find user by email
    const user = await this.prisma.users.findUnique({
      where: { email },
    })

    if (!user) {
      throw new UnauthorizedException('Invalid email or password')
    }

    // Compare entered password with hashed password
    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash,
    )

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password')
    }

    // Create JWT containing user ID
    const payload = {
      sub: user.user_id,
      email: user.email,
    }

    const accessToken = await this.jwtService.signAsync(payload)

    return {
      message: 'Login successful',
      access_token: accessToken,
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
      },
    }
  }
}