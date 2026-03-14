import { IsString, IsNotEmpty } from 'class-validator';

export class CreateQaDto {
    @IsString()
    @IsNotEmpty()
    lesson_id: string;

    @IsString()
    @IsNotEmpty()
    question: string;
}
