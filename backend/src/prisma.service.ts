import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    const adapter = new PrismaMariaDb({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'career_navigator_app',
      connectionLimit: 5,
    })

    super({ adapter })
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}