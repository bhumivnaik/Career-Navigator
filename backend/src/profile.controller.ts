import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'

import { ProfileService } from './profile.service.js'
import { JwtAuthGuard } from './jwt-auth.guard.js'

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  async getProfile(@Req() req: any) {
    return this.profileService.getProfile(req.user.user_id)
  }

  @Post()
  async saveProfile(
    @Req() req: any,
    @Body() data: any,
  ) {
    return this.profileService.saveProfile(
      req.user.user_id,
      data,
    )
  }
}