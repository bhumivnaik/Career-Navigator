import { Body, Controller, Post } from '@nestjs/common'
import { AuthService } from './auth.service.js'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(
    @Body()
    body: {
      fullName: string
      email: string
      password: string
    },
  ) {
    return this.authService.register(
      body.fullName,
      body.email,
      body.password,
    )
  }

  @Post('login')
  async login(
    @Body()
    body: {
      email: string
      password: string
    },
  ) {
    return this.authService.login(
      body.email,
      body.password,
    )
  }
}