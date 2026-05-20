import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PersonService } from './person.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorator';
import type { JwtPayload } from 'src/auth/current-user.decorator';

@Controller('persons')
@UseGuards(JwtAuthGuard)
export class PersonController {
  constructor(private readonly personService: PersonService) {}

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreatePersonDto) {
    return this.personService.create({ ...dto, userId: user.sub });
  }

  @Get()
  getByUser(@CurrentUser() user: JwtPayload) {
    return this.personService.getByUser(user.sub);
  }

  @Get(':id')
  getById(@Param('id') id: string) {
    return this.personService.getById(Number(id));
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.personService.delete(Number(id));
  }
}
