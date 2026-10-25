import { BadRequestException, Injectable, PipeTransform } from "@nestjs/common";

@Injectable()
export class ObjectIdPipe implements PipeTransform<string, string> {
  transform(value: string) {
    if (!/^[a-f\d]{24}$/i.test(value))
      throw new BadRequestException("ID inválido");
    return value;
  }
}
