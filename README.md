# Financial API

API REST para controle financeiro pessoal, desenvolvida com **TypeScript, NestJS, Prisma e MongoDB**. Centraliza receitas e despesas, automatiza lançamentos recorrentes e disponibiliza dados para dashboards, relatórios e exportações.

![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)
![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=flat-square&logo=nestjs&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-6-2D3748?style=flat-square&logo=prisma&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat-square&logo=mongodb&logoColor=white)
![Jest](https://img.shields.io/badge/Testes-Jest%20%2B%20Supertest-C21325?style=flat-square&logo=jest&logoColor=white)

## Sobre o projeto

O projeto organiza as movimentações financeiras de cada usuário em uma única API. Além do cadastro de transações e categorias, oferece uma visão da evolução financeira, comparação de resultados entre meses e geração automática de lançamentos como assinaturas e contas recorrentes.

A implementação reúne autenticação, autorização por proprietário dos dados, processamento periódico e geração de arquivos. A estrutura é dividida por domínio, com validação de entrada, documentação OpenAPI e testes unitários e de integração HTTP.

## Funcionalidades

| Área         | Recursos                                                                                                        |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| Autenticação | Cadastro, login com JWT, recuperação de senha por email e revogação de sessões.                                 |
| Transações   | Cadastro, consulta, edição e exclusão de receitas e despesas; paginação, busca, filtros e agrupamento por data. |
| Categorias   | Categorias padrão e personalizadas, com tipo, cor e ícone.                                                      |
| Dashboard    | Saldo acumulado, resumo mensal, evolução de seis meses e cinco transações recentes.                             |
| Recorrências | Frequências diária, semanal, mensal e anual, com data final opcional e cancelamento de próximos lançamentos.    |
| Relatórios   | Despesas por categoria, histórico de receitas e despesas, ranking de gastos e comparação mensal.                |
| Exportações  | Relatórios em PDF e Excel, além de backup dos dados pessoais em JSON.                                           |
| Perfil       | Edição de dados, troca de senha, encerramento de sessões e preferências de tema e notificações.                 |

## Tecnologias

| Tecnologia                          | Aplicação                                                                         |
| ----------------------------------- | --------------------------------------------------------------------------------- |
| TypeScript e NestJS                 | Organização dos módulos, injeção de dependências e construção dos endpoints REST. |
| Prisma ORM e MongoDB                | Modelagem, consultas, agregações e persistência de dados.                         |
| Passport, JWT e bcrypt              | Autenticação e armazenamento de hashes de senha.                                  |
| class-validator e class-transformer | Validação de DTOs, transformação de parâmetros e remoção de campos não previstos. |
| Swagger / OpenAPI                   | Documentação interativa da API.                                                   |
| Nodemailer                          | Envio de emails para recuperação de senha via SMTP.                               |
| PDFKit e ExcelJS                    | Geração de relatórios em PDF e XLSX.                                              |
| Jest e Supertest                    | Testes de regras de negócio e contratos HTTP.                                     |

## Organização do código

A aplicação segue a estrutura modular do NestJS. Os controllers recebem as requisições, os services concentram as regras de negócio e o serviço Prisma fornece acesso à persistência.

```text
prisma/
├── schema.prisma          # Modelos, relacionamentos e índices
└── seed.ts                # Categorias padrão
src/
├── common/                # Decorators, DTOs, guards, helpers e pipes
├── modules/
│   ├── auth/              # Login, cadastro, recuperação de senha e estratégia JWT
│   ├── categories/        # Categorias padrão e personalizadas
│   ├── dashboard/         # Resumo financeiro e evolução mensal
│   ├── mail/              # Integração SMTP
│   ├── prisma/            # Acesso ao banco
│   ├── recurrences/       # Séries e processamento de lançamentos recorrentes
│   ├── reports/           # Agregações, comparativos e exportações
│   ├── transactions/      # Movimentações financeiras
│   └── users/             # Perfil, preferências, segurança e backup
├── api.integration.spec.ts
├── app.module.ts
└── main.ts
```

### Decisões de implementação

- **Isolamento por usuário:** consultas e alterações de transações usam o usuário autenticado. As rotas de perfil verificam a propriedade do recurso; categorias personalizadas também possuem proprietário.
- **Revogação de JWT:** cada sessão carrega uma versão validada contra o usuário no banco. Trocar ou redefinir a senha, alterar o email ou encerrar todas as sessões invalida os tokens anteriores.
- **Recuperação de senha:** tokens aleatórios têm validade de 30 minutos e uso único. Apenas o hash SHA-256 é persistido; o consumo do token e a troca da senha ocorrem em uma operação atômica.
- **Consistência das recorrências:** o primeiro lançamento e sua série são criados na mesma transação. Ocorrências seguintes usam IDs determinísticos e atualização condicional da série em uma transação para evitar duplicação no reprocessamento.
- **Calendário financeiro em UTC:** os períodos incluem o último milissegundo do mês. A evolução mensal inclui meses sem movimentação e preserva o saldo acumulado anterior à janela exibida.
- **Valores nos resumos:** dashboard e comparativos calculam os totais em centavos. O modelo de persistência atual armazena os valores como `Float`.

## Como executar

### Pré-requisitos

- Node.js 22 ou superior e npm.
- MongoDB com **replica set**, local ou em um serviço como MongoDB Atlas, para as transações atômicas utilizadas pelo Prisma 6.
- Servidor SMTP para utilizar a recuperação de senha. No desenvolvimento, é possível usar um servidor de captura de emails, como Mailpit.

### Instalação

```bash
git clone https://github.com/mikasampaio/financial-api.git
cd financial-api
npm ci
cp .env.example .env
```

Preencha o arquivo `.env` com as configurações do ambiente:

| Variável                                | Finalidade                                                                  |
| --------------------------------------- | --------------------------------------------------------------------------- |
| `DATABASE_URL`                          | Conexão com o MongoDB e o banco da aplicação.                               |
| `JWT_SECRET_KEY`                        | Segredo utilizado para assinar e validar JWTs.                              |
| `PORT`                                  | Porta HTTP; padrão `3000`.                                                  |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` | Configuração do servidor SMTP.                                              |
| `SMTP_USER`, `SMTP_PASSWORD`            | Credenciais SMTP, quando exigidas pelo servidor.                            |
| `MAIL_FROM`                             | Remetente dos emails de recuperação.                                        |
| `PASSWORD_RESET_URL`                    | URL da tela do cliente que recebe o token de recuperação.                   |
| `RECURRENCE_WORKER_ENABLED`             | Ativa o processamento periódico; use `false` para desativá-lo na instância. |

O arquivo [.env.example](.env.example) contém uma configuração de referência. O SMTP é necessário para o fluxo de recuperação de senha; os demais recursos podem ser utilizados sem envio de emails.

Com o banco configurado, gere os clientes Prisma e sincronize o schema:

```bash
npx prisma generate
npx prisma db push

# Opcional: cadastrar as categorias padrão
npm run seed

# Iniciar em desenvolvimento
npm run start:dev
```

O conector MongoDB utiliza `prisma db push` para sincronização do schema e dos índices, em vez de Prisma Migrate. Execute o comando no banco destinado ao projeto.

Para executar o código compilado:

```bash
npm run build
npm run start:prod
```

O build gera os clientes Prisma, compila o TypeScript e resolve os aliases dos imports para execução pelo Node.js.

## Documentação e uso da API

Com a aplicação em execução, acesse o **Swagger em [http://localhost:3000/api](http://localhost:3000/api)**. A documentação apresenta os endpoints, parâmetros e schemas de entrada.

Para testar um fluxo básico:

1. Crie uma conta em `POST /auth/register`, enviando `name`, `email` e `password`.
2. Copie o `access_token` retornado e informe-o no botão **Authorize** do Swagger.
3. Consulte `GET /categories` e selecione uma categoria do tipo da transação. Se não executou o seed, crie uma em `POST /categories`.
4. Cadastre uma movimentação em `POST /transactions`.
5. Consulte o dashboard e os relatórios do período escolhido.

Nas chamadas fora do Swagger, envie o header `Authorization: Bearer <access_token>`.

### Principais endpoints

| Método                 | Endpoint                        | Finalidade                                                      |
| ---------------------- | ------------------------------- | --------------------------------------------------------------- |
| `POST`                 | `/auth/register`                | Criar conta.                                                    |
| `POST`                 | `/auth/login`                   | Autenticar e obter JWT.                                         |
| `POST`                 | `/auth/forgot-password`         | Solicitar recuperação por email.                                |
| `POST`                 | `/auth/reset-password`          | Redefinir senha com token.                                      |
| `GET`, `POST`          | `/transactions`                 | Listar ou criar movimentações.                                  |
| `GET`, `PUT`, `DELETE` | `/transactions/:id`             | Consultar, editar ou excluir uma movimentação.                  |
| `GET`                  | `/transactions/grouped-by-date` | Consultar movimentações agrupadas por data.                     |
| `GET`                  | `/transactions/balance`         | Consultar saldo, receitas e despesas do mês.                    |
| `GET`, `POST`          | `/categories`                   | Listar categorias acessíveis ou criar uma categoria própria.    |
| `GET`, `PUT`, `DELETE` | `/categories/:id`               | Consultar categoria ou alterar/excluir uma categoria própria.   |
| `GET`                  | `/dashboard`                    | Consultar resumo e evolução financeira.                         |
| `GET`, `POST`          | `/recurrences`                  | Listar séries ou ativar recorrência em uma transação existente. |
| `DELETE`               | `/recurrences/:id`              | Cancelar próximos lançamentos de uma série.                     |
| `GET`                  | `/reports/expense-by-category`  | Consultar distribuição das despesas.                            |
| `GET`                  | `/reports/incomes-and-expenses` | Consultar histórico mensal de receitas e despesas.              |
| `GET`                  | `/reports/spending-ranking`     | Consultar ranking de categorias por gasto.                      |
| `GET`                  | `/reports/monthly-comparison`   | Comparar um mês com o anterior.                                 |
| `GET`                  | `/reports/export`               | Baixar relatório em PDF ou XLSX.                                |
| `GET`, `PATCH`         | `/users/me/preferences`         | Consultar ou atualizar preferências.                            |
| `POST`                 | `/users/me/change-password`     | Trocar senha mediante confirmação da senha atual.               |
| `POST`                 | `/users/me/logout-all`          | Revogar todas as sessões.                                       |
| `GET`                  | `/users/me/export`              | Baixar dados pessoais em JSON.                                  |

As rotas de autenticação da tabela são públicas. As demais exigem JWT. Os endpoints de dashboard e relatórios por período aceitam `year` e `month`; quando omitidos, utilizam o mês atual em UTC. O histórico `/reports/incomes-and-expenses` retorna os meses com movimentação.

### Exemplo: criar uma transação recorrente

Envie para `POST /transactions`, substituindo `categoryId` pelo ID de uma categoria de despesa acessível:

```json
{
  "type": "EXPENSE",
  "amount": "150.50",
  "date": "2026-01-31",
  "categoryId": "507f1f77bcf86cd799439011",
  "description": "Assinatura mensal",
  "recurring": true,
  "frequency": "MONTHLY",
  "recurrenceEndsAt": "2026-12-31"
}
```

O campo `amount` recebe uma string decimal com até duas casas, usando ponto como separador. As frequências aceitas são `DAILY`, `WEEKLY`, `MONTHLY` e `YEARLY`; o padrão é mensal. A data final é opcional e inclusiva.

Para consultar os resultados desse período:

```http
GET /dashboard?year=2026&month=1
GET /reports/monthly-comparison?year=2026&month=1
GET /reports/export?year=2026&month=1&format=pdf
GET /reports/export?year=2026&month=1&format=xlsx
```

## Testes

A suíte contém testes unitários e de integração HTTP, com persistência e email simulados. Os testes não dependem de um MongoDB ativo nem enviam emails reais; os testes HTTP utilizam uma porta temporária em `127.0.0.1`.

```bash
# Executar a suíte
npm test -- --runInBand

# Executar em modo de observação
npm run test:watch

# Gerar relatório de cobertura
npm run test:cov -- --runInBand
```

Os cenários cobrem autorização entre usuários, omissão de credenciais nas respostas, recuperação de senha e revogação de sessões, recorrências em meses curtos e anos bissextos, comparativos na virada de ano, meses sem movimentação e geração de PDF/XLSX.

Os clientes Prisma são gerados automaticamente antes dos testes. A integração com um banco real e a entrega de emails via SMTP precisam ser validadas no ambiente em que a aplicação for executada.

## Regras de negócio e escopo

- Categorias sem proprietário são tratadas como padrão: podem ser consultadas e utilizadas, mas não editadas ou excluídas pela API. Categorias pessoais são acessíveis somente ao proprietário.
- Novas senhas exigem pelo menos oito caracteres e até 72 bytes. A recuperação responde de forma genérica para emails cadastrados ou inexistentes e aplica um intervalo mínimo de um minuto entre solicitações para a mesma conta.
- Alterar o email do perfil exige `currentPassword`. A troca de senha utiliza a rota específica, em vez do endpoint de edição de dados do usuário.
- O processamento de recorrências ocorre ao iniciar a API e a cada minuto, em lotes de até 100 séries, com uma ocorrência por série a cada execução. Lançamentos atrasados são recuperados nas execuções seguintes.
- Séries mensais e anuais preservam a data original quando possível: o dia 31 é ajustado em meses curtos e volta a ser utilizado nos meses seguintes; o mesmo princípio vale para 29 de fevereiro em anos bissextos.
- Editar ou excluir uma ocorrência não altera a série. O cancelamento preserva os lançamentos existentes. Para mudar valor ou frequência, cancele a série e crie outra.
- Transações antigas marcadas como recorrentes podem iniciar uma série por `POST /recurrences`, enviando `transactionId`, `frequency` e, opcionalmente, `endsAt`. Não há conversão automática dos registros existentes.
- O saldo acumulado considera os lançamentos até o fim do mês selecionado, incluindo datas futuras já cadastradas naquele período. Variações percentuais retornam `null` quando o valor anterior é zero.
- As preferências persistem tema e opções de notificações. A entrega de notificações push e o registro de dispositivos não fazem parte do projeto; o envio por email implementado atende à recuperação de senha.
- O backup JSON é uma exportação para download, sem restauração ou agendamento. Recibos, metas, orçamentos, biometria e interface gráfica estão fora do escopo atual.
