import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { UserController } from './user.controllers';
import { UserService } from './user.services';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule/*  implements NestModule */ {
  // configure(consumer: MiddlewareConsumer) {
  //   consumer
  //     .apply(LoggerMiddleware)
  //     .forRoutes(
  //       { path: 'users/:id', method: RequestMethod.GET },
  //       { path: 'users/:id', method: RequestMethod.PATCH },
  //       { path: 'users/:id', method: RequestMethod.DELETE },
  //     );
  // }
}
