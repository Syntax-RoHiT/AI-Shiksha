import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Body,
    Param,
    UseGuards,
    Request,
    HttpCode,
    HttpStatus,
    BadRequestException,
} from '@nestjs/common';
import { FranchisesService } from './franchises.service';
import { CreateFranchiseDto } from './dto/create-franchise.dto';
import { UpdateFranchiseDto } from './dto/update-franchise.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../enums/role.enum';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Franchises')
@Controller('franchises')
export class FranchisesController {
    constructor(private readonly franchisesService: FranchisesService) { }

    /**
     * Public endpoint — returns branding for the current domain
     * Used by frontend on load to get logo, name, colors
     */
    @Get('branding')
    @ApiOperation({ summary: 'Get franchise branding for current domain (public)' })
    getBranding(@Request() req) {
        // Check for custom domain header from frontend
        const customDomain = req.headers['x-franchise-domain'] || req.headers['custom-franchise-domain'];
        const hostname = customDomain || req.hostname || req.headers['host'] || 'localhost';
        return this.franchisesService.getBrandingByDomain(hostname);
    }

    /**
     * Public endpoint — used by Caddy (On-Demand TLS ask endpoint)
     * Validates if a domain exists in the DB before Caddy issues an SSL certificate.
     */
    @Get('verify-domain')
    @ApiOperation({ summary: 'Verify if a domain is registered for Caddy On-Demand TLS (public)' })
    async verifyDomain(@Request() req) {
        const domain = req.query.domain;
        if (!domain) {
            throw new BadRequestException('Domain query parameter is required');
        }

        // Caddy expects a 200 OK status if the domain is allowed, or 4xx/5xx if rejected
        await this.franchisesService.verifyDomainForCaddy(domain);
        return { valid: true };
    }

    @Get('me/settings')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.ADMIN, Role.FRANCHISE_ADMIN, Role.SUPER_ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current franchise settings' })
    getMySettings(@Request() req: any) {
        // Super Admins not attached to a franchise will get default system settings
        const franchiseId = req.user.franchise_id || null;
        return this.franchisesService.getMySettings(franchiseId);
    }

    @Patch('me/settings')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.ADMIN, Role.FRANCHISE_ADMIN, Role.SUPER_ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update current franchise settings' })
    updateMySettings(@Request() req: any, @Body() updateFranchiseDto: UpdateFranchiseDto) {
        const franchiseId = req.user.franchise_id || null;
        return this.franchisesService.updateMySettings(franchiseId, updateFranchiseDto);
    }

    @Post('me/check-domain')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.ADMIN, Role.FRANCHISE_ADMIN, Role.SUPER_ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Check DNS domain verification and update status' })
    checkDomain(@Request() req: any) {
        const franchiseId = req.user.franchise_id;
        if (!franchiseId) {
            return { verified: true, message: 'System domain is always verified', domain: 'localhost' };
        }
        return this.franchisesService.checkAndUpdateDomainVerification(franchiseId);
    }

    @Get()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.SUPER_ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List all franchises (SUPER_ADMIN only)' })
    findAll() {
        return this.franchisesService.findAll();
    }

    @Get(':id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.SUPER_ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get franchise by ID (SUPER_ADMIN only)' })
    findOne(@Param('id') id: string) {
        return this.franchisesService.findOne(id);
    }

    @Get(':id/stats')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.SUPER_ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get franchise stats (SUPER_ADMIN only)' })
    getStats(@Param('id') id: string) {
        return this.franchisesService.getStats(id);
    }

    @Post()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.SUPER_ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new franchise (SUPER_ADMIN only)' })
    create(@Body() createFranchiseDto: CreateFranchiseDto) {
        return this.franchisesService.create(createFranchiseDto);
    }

    @Patch(':id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.SUPER_ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update franchise details (SUPER_ADMIN only)' })
    update(@Param('id') id: string, @Body() updateFranchiseDto: UpdateFranchiseDto) {
        return this.franchisesService.update(id, updateFranchiseDto);
    }

    @Patch(':id/suspend')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.SUPER_ADMIN)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Toggle franchise active/suspended status (SUPER_ADMIN only)' })
    toggleSuspend(@Param('id') id: string) {
        return this.franchisesService.toggleSuspend(id);
    }

    @Delete(':id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(Role.SUPER_ADMIN)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Complete delete a franchise from the database (SUPER_ADMIN only)' })
    remove(@Param('id') id: string) {
        return this.franchisesService.remove(id);
    }
}
