import { Injectable } from '@nestjs/common'
import { PrismaService } from './prisma.service.js'

@Injectable()
export class ProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: number) {
    const user = await this.prisma.users.findUnique({
      where: {
        user_id: userId,
      },
      select: {
        user_id: true,
        full_name: true,
        email: true,
        github_profile_url: true,
        linkedin_profile_url: true,
        created_at: true,
      },
    })

    if (!user) {
      return {
        message: 'User not found',
      }
    }

    return {
      message: 'Profile loaded successfully',
      profile: user,
    }
  }

  async saveProfile(userId: number, data: any) {
    return {
      message: 'Profile saved successfully',
      userId,
      data,
    }
  }
}