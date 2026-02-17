import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { UserService } from "./user.services";
import { CreateUserDTO, UpdateUserDTO } from "./dtos/user.dtos";
import { ParamsId } from "src/common/decorators/params.decorator";
import { JwtAuthGuard } from "src/common/guards/jwt.guard";

@Controller("users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  getUsers() {
    return this.userService.getUsers();
  }

  @UseGuards(JwtAuthGuard)
  @Get(":id")
  getById(@ParamsId() id: string) {
    return this.userService.getById(id);
  }

  @Post()
  async createUser(@Body() body: CreateUserDTO) {
    return await this.userService.createUser(body);
  }

  @UseGuards(JwtAuthGuard)
  @Put(":id")
  updateUser(@ParamsId() id: string, @Body() body: UpdateUserDTO) {
    return this.userService.updateUser(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  async deleteUser(@ParamsId() id: string) {
    return await this.userService.deleteUser(id);
  }
}
