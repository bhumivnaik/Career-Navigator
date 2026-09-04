import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'

import { PrismaService } from './prisma.service.js'
import { ProfileController } from './profile.controller.js'
import { ProfileService } from './profile.service.js'
import { AuthController } from './auth.controller.js'
import { AuthService } from './auth.service.js'
import { JwtStrategy } from './jwt.strategy.js'

@Module({
  imports: [
    PassportModule,

    JwtModule.register({
      secret: 'career-navigator-secret',
      signOptions: {
        expiresIn: '1d',
      },
    }),
  ],

  controllers: [
    AuthController,
    ProfileController,
  ],

  providers: [
    PrismaService,
    AuthService,
    ProfileService,
    JwtStrategy,
  ],

  exports: [
    PrismaService,
  ],
})
export class AppModule {}