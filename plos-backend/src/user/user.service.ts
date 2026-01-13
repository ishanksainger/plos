import { Injectable } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UserService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateUserDto) {
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                name: dto.name,
            },
        })

        return user
    };
}
