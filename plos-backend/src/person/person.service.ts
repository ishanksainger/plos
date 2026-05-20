import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePersonDto } from './dto/create-person.dto';

@Injectable()
export class PersonService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePersonDto) {
    return this.prisma.person.create({
      data: {
        userId: dto.userId as number,  // always set by controller from JWT
        name: dto.name,
        relation: dto.relation,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      },
    });
  }

  async getByUser(userId: number) {
    const persons = await this.prisma.person.findMany({
      where: { userId },
      include: {
        _count: { select: { responsibilities: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
    return persons;
  }

  async getById(id: number) {
    const person = await this.prisma.person.findUnique({
      where: { id },
      include: {
        responsibilities: {
          orderBy: { dueDate: 'asc' },
        },
      },
    });
    if (!person) throw new NotFoundException('Person not found');
    return person;
  }

  async delete(id: number) {
    return this.prisma.person.delete({ where: { id } });
  }
}
