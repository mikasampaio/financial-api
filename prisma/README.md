# Scripts do Banco de Dados

## Seed - Categorias Padrões

O script de seed popula o banco de dados com categorias padrões de receitas e despesas usando ícones do [Lucide Icons](https://lucide.dev/).

### Categorias de Receita (6)

- **Wallet** - Salário
- **Briefcase** - Freelance
- **TrendingUp** - Investimentos
- **Trophy** - Prêmios
- **ShoppingBag** - Vendas
- **DollarSign** - Outros

### Categorias de Despesa (14)

- **Utensils** - Alimentação
- **Home** - Moradia
- **Car** - Transporte
- **Heart** - Saúde
- **GraduationCap** - Educação
- **Gamepad2** - Lazer
- **ShoppingCart** - Compras
- **FileText** - Contas
- **Tv** - Assinaturas
- **PawPrint** - Pets
- **Sparkles** - Beleza
- **Plane** - Viagens
- **Receipt** - Impostos
- **MoreHorizontal** - Outros

## Como executar

### Opção 1: Executar o seed automaticamente (após migrate)

```bash
npx prisma db seed
```

### Opção 2: Executar diretamente

```bash
npx ts-node prisma/seed.ts
```

### Opção 3: Executar com migrate e seed

```bash
npx prisma migrate dev
```

## Personalização

Você pode editar o arquivo `prisma/seed.ts` para:

- Adicionar mais categorias
- Alterar cores e ícones (veja todos os ícones em [lucide.dev](https://lucide.dev/icons))
- Modificar descrições
- Ajustar a ordem de exibição

Cada categoria tem:

- Nome descritivo
- Cor personalizada (formato hex)
- Ícone do Lucide (nome do componente, ex: "Wallet", "Home")
- Descrição
- Ordem de exibição

## ⚠️ Importante

Por padrão, o script **não** deleta categorias existentes. Se quiser limpar o banco antes de popular, descomente esta linha no `seed.ts`:

```typescript
await prisma.category.deleteMany({});
```
