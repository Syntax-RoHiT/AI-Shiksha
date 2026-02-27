import { Controller, Get, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../enums/role.enum';
import { MailService } from './mail.service';
import { UpdateEmailTemplateDto } from './dto/update-email-template.dto';

@ApiTags('Mail Templates')
@Controller('mail/templates')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth()
export class MailController {
    constructor(private readonly mailService: MailService) { }

    @Get()
    @Roles(Role.ADMIN, Role.FRANCHISE_ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Get all custom email templates for the current franchise' })
    async getTemplates(@Request() req) {
        const isSuperAdmin = req.user?.role === Role.SUPER_ADMIN;
        const franchiseId = isSuperAdmin ? null : (req.user?.franchise_id || null);
        return this.mailService.getCustomTemplates(franchiseId);
    }

    @Put(':type')
    @Roles(Role.ADMIN, Role.FRANCHISE_ADMIN, Role.SUPER_ADMIN)
    @ApiOperation({ summary: 'Update a specific email template (e.g., WELCOME, PASSWORD_RESET)' })
    async updateTemplate(
        @Param('type') type: string,
        @Body() updateDto: UpdateEmailTemplateDto,
        @Request() req
    ) {
        const isSuperAdmin = req.user?.role === Role.SUPER_ADMIN;
        const franchiseId = isSuperAdmin ? null : (req.user?.franchise_id || null);
        return this.mailService.upsertCustomTemplate(type, updateDto, franchiseId);
    }
}
