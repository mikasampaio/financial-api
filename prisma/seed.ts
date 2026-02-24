import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Categorias padrões para o sistema financeiro
 * Ícones: Lucide Icons (https://lucide.dev/icons)
 * Use o nome do componente (ex: "Wallet", "Home", "Car")
 */

const incomeCategories = [
  {
    name: "Salário",
    type: "INCOME" as const,
    description: "Salário mensal",
    color: "#10B981",
    icon: "Wallet",
    order: 1,
  },
  {
    name: "Freelance",
    type: "INCOME" as const,
    description: "Trabalhos freelance",
    color: "#3B82F6",
    icon: "Briefcase",
    order: 2,
  },
  {
    name: "Investimentos",
    type: "INCOME" as const,
    description: "Rendimentos de investimentos",
    color: "#8B5CF6",
    icon: "TrendingUp",
    order: 3,
  },
  {
    name: "Prêmios",
    type: "INCOME" as const,
    description: "Prêmios e bonificações",
    color: "#F59E0B",
    icon: "Trophy",
    order: 4,
  },
  {
    name: "Vendas",
    type: "INCOME" as const,
    description: "Venda de produtos ou serviços",
    color: "#14B8A6",
    icon: "ShoppingBag",
    order: 5,
  },
  {
    name: "Outros",
    type: "INCOME" as const,
    description: "Outras receitas",
    color: "#6B7280",
    icon: "DollarSign",
    order: 6,
  },
];

const expenseCategories = [
  {
    name: "Alimentação",
    type: "EXPENSE" as const,
    description: "Supermercado, restaurantes e delivery",
    color: "#EF4444",
    icon: "Utensils",
    order: 1,
  },
  {
    name: "Moradia",
    type: "EXPENSE" as const,
    description: "Aluguel, condomínio e IPTU",
    color: "#DC2626",
    icon: "House",
    order: 2,
  },
  {
    name: "Transporte",
    type: "EXPENSE" as const,
    description: "Combustível, transporte público e aplicativos",
    color: "#F97316",
    icon: "Car",
    order: 3,
  },
  {
    name: "Saúde",
    type: "EXPENSE" as const,
    description: "Plano de saúde, medicamentos e consultas",
    color: "#EC4899",
    icon: "Heart",
    order: 4,
  },
  {
    name: "Educação",
    type: "EXPENSE" as const,
    description: "Cursos, mensalidades e materiais",
    color: "#6366F1",
    icon: "GraduationCap",
    order: 5,
  },
  {
    name: "Lazer",
    type: "EXPENSE" as const,
    description: "Entretenimento e hobbies",
    color: "#A855F7",
    icon: "Gamepad2",
    order: 6,
  },
  {
    name: "Compras",
    type: "EXPENSE" as const,
    description: "Roupas, eletrônicos e outros",
    color: "#F59E0B",
    icon: "ShoppingCart",
    order: 7,
  },
  {
    name: "Contas",
    type: "EXPENSE" as const,
    description: "Água, luz, internet e telefone",
    color: "#84CC16",
    icon: "FileText",
    order: 8,
  },
  {
    name: "Assinaturas",
    type: "EXPENSE" as const,
    description: "Streaming, academia e outros serviços",
    color: "#06B6D4",
    icon: "Tv",
    order: 9,
  },
  {
    name: "Pets",
    type: "EXPENSE" as const,
    description: "Ração, veterinário e produtos para pets",
    color: "#D946EF",
    icon: "PawPrint",
    order: 10,
  },
  {
    name: "Beleza",
    type: "EXPENSE" as const,
    description: "Salão, cosméticos e cuidados pessoais",
    color: "#DB2777",
    icon: "Sparkles",
    order: 11,
  },
  {
    name: "Viagens",
    type: "EXPENSE" as const,
    description: "Passagens, hospedagem e turismo",
    color: "#0EA5E9",
    icon: "Plane",
    order: 12,
  },
  {
    name: "Impostos",
    type: "EXPENSE" as const,
    description: "Impostos e taxas governamentais",
    color: "#78716C",
    icon: "Receipt",
    order: 13,
  },
  {
    name: "Outros",
    type: "EXPENSE" as const,
    description: "Outras despesas",
    color: "#6B7280",
    icon: "Ellipsis",
    order: 14,
  },
];

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...\n");

  // Limpar categorias existentes (opcional - comente se não quiser limpar)
  await prisma.category.deleteMany({});
  // console.log("✅ Categorias anteriores removidas\n");

  // Criar categorias de receita
  console.log("💰 Criando categorias de receita...");
  for (const category of incomeCategories) {
    await prisma.category.create({
      data: {
        ...category,
        status: {
          createdAt: new Date(),
        },
      },
    });
    console.log(`  ✓ [${category.icon}] ${category.name}`);
  }

  // Criar categorias de despesa
  console.log("\n💸 Criando categorias de despesa...");
  for (const category of expenseCategories) {
    await prisma.category.create({
      data: {
        ...category,
        status: {
          createdAt: new Date(),
        },
      },
    });
    console.log(`  ✓ [${category.icon}] ${category.name}`);
  }

  console.log("\n✅ Seed concluído com sucesso!");
  console.log(
    `📊 Total: ${incomeCategories.length} receitas + ${expenseCategories.length} despesas = ${incomeCategories.length + expenseCategories.length} categorias criadas`,
  );
}

main()
  .catch((e) => {
    console.error("❌ Erro ao executar seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
