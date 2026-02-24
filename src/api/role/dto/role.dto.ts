import { IsNotEmpty, IsNumber, IsEmail } from 'class-validator';

export class AssignRoleDto {
  @IsEmail()
  @IsNotEmpty()
  public email: string;

  @IsNumber()
  @IsNotEmpty()
  public roleId: number;
}
