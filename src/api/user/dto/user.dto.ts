import { Expose, Type } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  public email: string;

  @IsString()
  @IsNotEmpty()
  public password: string;
}

export class RoleDto {
  @Expose()
  public id: number;

  @Expose()
  public name: string;
}

export class UserDto {
  @Expose()
  public id: number;

  @Expose()
  public email: string;

  @Expose()
  @Type(() => RoleDto)
  public roles: RoleDto[];
}
