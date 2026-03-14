import { IsString, IsNotEmpty } from 'class-validator';

export class ReplyQaDto {
    @IsString()
    @IsNotEmpty()
    reply: string;
}
