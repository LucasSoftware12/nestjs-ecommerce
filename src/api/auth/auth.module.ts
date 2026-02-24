import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { User } from '../../database/entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RoleModule } from '../role/role.module';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { UserService } from '../user/services/user.service';
import { AwsModule } from '../aws/aws.module';

@Module({
  imports: [
    AwsModule,
    UserModule,
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: { expiresIn: '3h' },
      }),
    }),
    RoleModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, UserService],
  exports: [],
})
export class AuthModule {}
