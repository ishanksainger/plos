import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PersonService } from './person.service';
import { CreatePersonDto } from './dto/create-person.dto';
import { UpdatePersonDto } from './dto/update-person.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { CurrentUser } from 'src/auth/current-user.decorator';
import type { JwtPayload } from 'src/auth/current-user.decorator';
import {
  personAvatarFileFilter,
  personAvatarStorage,
} from './person-upload.config';

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
  getById(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.personService.getById(Number(id), user.sub);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() dto: UpdatePersonDto,
  ) {
    return this.personService.update(Number(id), user.sub, dto);
  }

  @Post(':id/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: personAvatarStorage,
      limits: { fileSize: 2 * 1024 * 1024 },
      fileFilter: personAvatarFileFilter,
    }),
  )
  async uploadAvatar(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      return this.personService.getById(Number(id), user.sub);
    }
    const avatarUrl = `/uploads/avatars/${file.filename}`;
    return this.personService.setAvatarUrl(Number(id), user.sub, avatarUrl);
  }

  @Delete(':id')
  delete(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.personService.delete(Number(id), user.sub);
  }
}
