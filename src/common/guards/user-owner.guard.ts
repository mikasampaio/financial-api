import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";

@Injectable()
export class UserOwnerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    if (!request.user?.id || request.params.id !== request.user.id) {
      throw new ForbiddenException("Acesso permitido apenas ao próprio perfil");
    }
    return true;
  }
}
