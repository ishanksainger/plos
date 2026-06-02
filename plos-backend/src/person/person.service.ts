import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PlanService } from 'src/plan/plan.service';
import { normalizeOptionalPhone } from 'src/common/phone.util';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';

@Injectable()
export class PersonService {
  constructor(
    private prisma: PrismaService,
    private plan: PlanService,
  ) {}

  /**
   * Creates a person in the user's circle with required email and optional phone.
   */
  async create(dto: CreatePersonDto) {
    // Dormant plan-limit guard (no-op until BILLING_ENABLED). Free tier = 3 people.
    const count = await this.prisma.person.count({
      where: { userId: dto.userId as number },
    });
    await this.plan.assertCanCreate(dto.userId as number, 'people', count);

    return this.prisma.person.create({
      data: {
        userId: dto.userId as number,
        name: dto.name.trim(),
        email: dto.email.trim().toLowerCase(),
        phone: normalizeOptionalPhone(dto.phone),
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

  async getById(id: number, userId: number) {
    const person = await this.prisma.person.findFirst({
      where: { id, userId },
      include: {
        responsibilities: {
          orderBy: { dueDate: 'asc' },
        },
      },
    });
    if (!person) throw new NotFoundException('Person not found');
    return person;
  }

  /**
   * Updates contact fields for a person owned by the user.
   */
  async update(id: number, userId: number, dto: UpdatePersonDto) {
    await this.assertOwned(id, userId);
    return this.prisma.person.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.email !== undefined
          ? { email: dto.email.trim().toLowerCase() }
          : {}),
        ...(dto.phone !== undefined
          ? { phone: normalizeOptionalPhone(dto.phone) ?? null }
          : {}),
        ...(dto.relation !== undefined ? { relation: dto.relation } : {}),
        ...(dto.dateOfBirth !== undefined
          ? { dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : null }
          : {}),
      },
    });
  }

  /**
   * Stores the public URL path for a person's avatar after upload.
   */
  async setAvatarUrl(id: number, userId: number, avatarUrl: string) {
    await this.assertOwned(id, userId);
    return this.prisma.person.update({
      where: { id },
      data: { avatarUrl },
    });
  }

  async delete(id: number, userId: number) {
    const person = await this.assertOwned(id, userId);
    if (person.relation === 'self') {
      throw new ForbiddenException('Cannot remove your self profile');
    }
    return this.prisma.person.delete({ where: { id } });
  }

  private async assertOwned(id: number, userId: number) {
    const person = await this.prisma.person.findFirst({
      where: { id, userId },
    });
    if (!person) throw new NotFoundException('Person not found');
    return person;
  }
}
