import { NestFactory } from "@nestjs/core";
import { ValidationPipe } from "@nestjs/common";
import { AppModule } from "./app.module";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());

  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle("Financial API")
    .setDescription(
      "API para gerenciamento de finanças pessoais com categorias, transações e usuários",
    )
    .setVersion("1.0")
    .addTag("auth", "Endpoints de autenticação")
    .addTag("users", "Gerenciamento de usuários")
    .addTag("categories", "Gerenciamento de categorias")
    .addTag("transactions", "Gerenciamento de transações financeiras")
    .addBearerAuth()
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api", app, documentFactory);

  const port = process.env.PORT || 3000;

  await app.listen(port);
  console.log(`🚀 API rodando em: http://localhost:${port}`);
}
bootstrap();
