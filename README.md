# Financial API

API NestJS para controle financeiro pessoal, com Prisma e MongoDB.

## Regras de acesso da API

- Todas as rotas de categorias exigem token Bearer. Categorias com `userId` pertencem ao usuário; categorias sem `userId` (ou com valor nulo) são padrão, disponíveis para consulta e uso, mas protegidas contra edição e exclusão pela API.
- Categorias antigas sem proprietário continuam sendo tratadas como padrão. Caso existam categorias pessoais antigas, é necessário identificar seus proprietários antes de atribuir `userId`; a API não infere essa associação.
- `GET /users` retorna somente o usuário autenticado, mantendo o formato de lista. Consultar, atualizar ou excluir `/users/:id` exige que o ID seja o do token; outros IDs retornam 403.
- Transações são consultadas e modificadas no escopo do usuário autenticado. O parâmetro `userId` enviado pelo cliente não substitui o ID do token.
- Campos fora dos DTOs são removidos pela validação global. Senhas e hashes não são retornados pelos endpoints de cadastro, criação e atualização de usuários.
- Após atualizar o schema, execute `npx prisma generate` para regenerar os dois clientes Prisma. O campo opcional de proprietário das categorias é compatível com documentos MongoDB existentes; estas correções não executam atualização de dados.

Para verificar as correções: `npm test -- --runInBand` e `npm run build`. Os testes usam mocks de persistência e não exigem acesso ao banco.

## Recursos implementados

Todos os endpoints abaixo exigem Bearer JWT, exceto recuperação e redefinição de senha. Swagger disponível em `/api`.

| Método | Endpoint | Finalidade |
|---|---|---|
| POST | `/auth/forgot-password` | Solicitar email de recuperação: `{ "email": "usuario@exemplo.com" }` |
| POST | `/auth/reset-password` | Redefinir senha: `{ "token": "...", "password": "nova-senha" }` |
| GET | `/dashboard?year=2026&month=1` | Saldo acumulado, resumo do mês, seis meses de evolução e cinco transações recentes |
| GET | `/reports/spending-ranking?year=2026&month=1` | Ranking de despesas por categoria |
| GET | `/reports/monthly-comparison?year=2026&month=1` | Comparação com dezembro/2025, incluindo valores e variações percentuais |
| GET | `/reports/export?year=2026&month=1&format=pdf` | Relatório PDF; use `format=xlsx` para Excel |
| GET | `/recurrences` | Consultar séries recorrentes próprias |
| POST | `/recurrences` | Ativar série a partir de transação existente |
| DELETE | `/recurrences/:id` | Cancelar próximos lançamentos, preservando transações existentes |
| GET | `/users/me/preferences` | Consultar tema e preferências de notificações |
| PATCH | `/users/me/preferences` | Alterar `theme`, `emailNotifications` e/ou `pushNotifications` |
| POST | `/users/me/change-password` | Alterar senha com `{ "currentPassword": "...", "password": "..." }` |
| POST | `/users/me/logout-all` | Revogar todas as sessões, inclusive a atual |
| GET | `/users/me/export` | Download de backup JSON com perfil, categorias acessíveis, transações e séries |

### Instalação e execução

1. Execute `npm ci` e copie `.env.example` para `.env`, preenchendo as configurações do seu ambiente.
2. Use MongoDB com replica set (como MongoDB Atlas). As operações de recorrência usam transações atômicas do Prisma 6.
3. Execute `npx prisma db push` no banco destinado à aplicação para sincronizar o schema e criar os índices de recorrência. Não use Prisma Migrate para MongoDB. Nenhum comando de alteração do banco foi executado automaticamente nesta implementação.
4. Execute `npm run build` e `npm run start:prod`, ou `npm run start:dev` no desenvolvimento. O build regenera os clientes Prisma e resolve aliases para o Node.js.

### Recuperação de senha e segurança

Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `MAIL_FROM` e `PASSWORD_RESET_URL`; se o servidor exigir autenticação, preencha `SMTP_USER` e `SMTP_PASSWORD`. É possível testar localmente com um SMTP de captura, como Mailpit, sem enviar email real. `PASSWORD_RESET_URL` aponta para a tela do front-end que recebe o parâmetro `token` e envia a nova senha à API.

Novas senhas exigem no mínimo 8 caracteres e no máximo 72 bytes (limite do bcrypt).

O token tem 32 bytes aleatórios, somente o hash SHA-256 é armazenado, expira em 30 minutos e só pode ser consumido uma vez. Há um intervalo mínimo de um minuto entre solicitações para a mesma conta. A resposta não informa se o email está cadastrado e não retorna o token. Sem configuração de email, a solicitação retorna 503. Falhas de entrega são registradas sem expor token ou senha e mantêm a resposta genérica.

Alteração ou redefinição de senha e logout global revogam JWTs anteriores por meio de uma versão aleatória da sessão. Usuários e tokens anteriores sem versão continuam compatíveis até a primeira revogação. A API consulta o usuário ao validar cada JWT, bloqueando também contas excluídas. O campo `password` deixou de ser aceito no `PUT /users/:id`; use a rota de troca de senha com a senha atual. Alterar email no `PUT` também exige `currentPassword`, revoga as sessões e invalida links de recuperação anteriores.

### Recorrência

Para criar uma série junto com o primeiro lançamento, envie para `POST /transactions`:

```json
{
  "type": "EXPENSE",
  "amount": "150.50",
  "date": "2026-01-31",
  "categoryId": "507f1f77bcf86cd799439011",
  "description": "Assinatura",
  "recurring": true,
  "frequency": "MONTHLY",
  "recurrenceEndsAt": "2026-12-31"
}
```

Frequências: `DAILY`, `WEEKLY`, `MONTHLY` (padrão) e `YEARLY`. A data final é opcional e inclusiva; uma data sem horário inclui o dia inteiro em UTC. Séries mensais/anual preservam o dia original, ajustando ao último dia de meses curtos. Assim, 31/jan gera 28 ou 29/fev e depois 31/mar; 29/fev volta ao dia 29 no próximo ano bissexto.

O primeiro lançamento e a série são gravados na mesma transação. A API processa vencimentos ao iniciar e a cada minuto, com até 100 séries por execução e uma ocorrência por série. Períodos atrasados são recuperados nas execuções seguintes. IDs determinísticos e atualização condicional da série dentro da transação protegem contra reprocessamento, concorrência entre instâncias e cancelamento simultâneo. Erros transitórios são tentados novamente; séries sem usuário ou categoria utilizável são desativadas. A API precisa estar em execução para gerar os lançamentos. `RECURRENCE_WORKER_ENABLED=false` desativa o processamento naquela instância.

Transações antigas com `recurring=true` não são convertidas automaticamente, pois isso poderia gerar lançamentos históricos inesperados. Para ativar explicitamente uma série, use:

```json
{
  "transactionId": "507f1f77bcf86cd799439011",
  "frequency": "MONTHLY",
  "endsAt": "2026-12-31"
}
```

Editar ou excluir uma ocorrência não altera os demais lançamentos nem a série. Para interromper lançamentos futuros, cancele a série por seu `recurrenceId`. Para mudar valor ou frequência da série, cancele-a e crie uma nova. O cancelamento não apaga lançamentos já registrados, e uma transação já vinculada não pode iniciar outra série.

### Datas e relatórios

Períodos financeiros usam UTC. `year` e `month` são opcionais; o padrão é o mês atual em UTC. O dashboard retorna os seis meses terminando no mês selecionado, em ordem cronológica, incluindo meses zerados. `totalBalance` e `accumulatedBalance` incluem os lançamentos anteriores até o último milissegundo do mês selecionado. Isso inclui transações futuras já cadastradas dentro desse período. O resumo mensal mostra somente o movimento daquele mês.

O comparativo usa o mês calendário anterior, inclusive ao atravessar o ano. Variações percentuais retornam `null` quando o valor anterior é zero. O ranking considera despesas agrupadas por categoria, em ordem decrescente de valor. PDF e Excel incluem resumo, comparativo, ranking e transações do período, em BRL. O Excel contém abas separadas e mantém textos do usuário como texto, sem avaliá-los como fórmulas.

### Preferências e backup

Temas aceitos: `light`, `dark` e `system` (padrão). Notificações por email e push começam desativadas. As flags persistem preferências; não constituem um serviço de entrega de notificações ou registro de dispositivos push. Emails de recuperação são enviados independentemente dessas preferências.

O backup JSON inclui apenas dados do usuário autenticado e categorias acessíveis, sem hashes de senha, tokens ou estado interno de sessão. É uma exportação para download; não há restauração/importação nem agendamento de backups.

Recibos, metas, orçamentos, biometria e interfaces do aplicativo permanecem fora desta implementação.

### Verificação

- `npm test -- --runInBand`: testes unitários e HTTP, com persistência e email simulados. Os testes HTTP usam porta temporária em `127.0.0.1`.
- `npm run build`: geração dos clientes, compilação e resolução dos imports.

Os testes não alteram bancos reais nem enviam emails. A configuração de SMTP e a execução contra MongoDB com replica set devem ser validadas no ambiente de implantação.
