import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateEmailTemplateDto {
    @ApiProperty({ example: 'Welcome to the Platform!' })
    @IsString()
    @IsNotEmpty()
    subject: string;

    @ApiProperty({ example: '<p>Hello <%= name %>,</p><p>Welcome!</p>' })
    @IsString()
    @IsNotEmpty()
    body: string;
}
