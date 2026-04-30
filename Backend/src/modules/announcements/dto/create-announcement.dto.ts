import { IsString, IsNotEmpty, IsBoolean, IsOptional } from 'class-validator';

export class CreateAnnouncementDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    content: string;

    @IsBoolean()
    @IsOptional()
    is_active?: boolean;

    @IsString()
    @IsOptional()
    role_intended?: string | null;
}
