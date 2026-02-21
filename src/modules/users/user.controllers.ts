import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { UserService } from "./user.services";
import { CreateUserDTO, UpdateUserDTO } from "./dtos/user.dtos";
import { ParamsId } from "src/common/decorators/params.decorator";
import { JwtAuthGuard } from "src/common/guards/jwt.guard";

@ApiTags("users")
@Controller("users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Listar todos os usuários" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Lista de usuários retornada com sucesso",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Não autorizado",
  })
  getUsers() {
    return this.userService.getUsers();
  }

  @UseGuards(JwtAuthGuard)
  @Get(":id")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Buscar usuário por ID" })
  @ApiResponse({ status: HttpStatus.OK, description: "Usuário encontrado" })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Não autorizado",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Usuário não encontrado",
  })
  getById(@ParamsId() id: string) {
    return this.userService.getById(id);
  }

  @Post()
  @ApiOperation({ summary: "Criar novo usuário" })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Usuário criado com sucesso",
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Dados inválidos",
  })
  async createUser(@Body() body: CreateUserDTO) {
    return await this.userService.createUser(body);
  }

  @UseGuards(JwtAuthGuard)
  @Put(":id")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Atualizar usuário" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Usuário atualizado com sucesso",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Não autorizado",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Usuário não encontrado",
  })
  updateUser(@ParamsId() id: string, @Body() body: UpdateUserDTO) {
    return this.userService.updateUser(id, body);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":id")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Deletar usuário" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Usuário deletado com sucesso",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Não autorizado",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Usuário não encontrado",
  })
  async deleteUser(@ParamsId() id: string) {
    return await this.userService.deleteUser(id);
  }
}
