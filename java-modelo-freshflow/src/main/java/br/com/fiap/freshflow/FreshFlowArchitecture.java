package br.com.fiap.freshflow;

import java.util.List;

public class FreshFlowArchitecture {

    record Elemento(String camada, String nome, String funcao) {}

    record Relacao(String origem, String destino, String tipo) {}

    public static void main(String[] args) {
        var stakeholders = List.of(
            new Elemento("Motivação", "Diretoria de Operações", "Acompanha metas e resultado"),
            new Elemento("Motivação", "Gerente de Loja", "Revisa exceções e decide"),
            new Elemento("Motivação", "Equipe de Compras", "Executa o pedido ao fornecedor")
        );

        var processos = List.of(
            new Elemento("Negócio", "Prever demanda diária", "Estimar demanda por SKU, loja e dia"),
            new Elemento("Negócio", "Gerar recomendação de reposição", "Sugerir quantidade e justificativa"),
            new Elemento("Negócio", "Revisar exceções", "Aceitar, ajustar ou rejeitar"),
            new Elemento("Negócio", "Emitir pedido ao fornecedor", "Enviar decisão aprovada ao ERP"),
            new Elemento("Negócio", "Medir venda, ruptura e descarte", "Aprender com o resultado real")
        );

        var aplicacoes = List.of(
            new Elemento("Aplicação", "Sistema de PDV", "Fornece vendas"),
            new Elemento("Aplicação", "ERP de compras", "Recebe pedidos"),
            new Elemento("Aplicação", "Sistema de estoque", "Fornece estoque, validade e descarte"),
            new Elemento("Aplicação", "Calendário de promoções", "Fornece contexto comercial"),
            new Elemento("Aplicação", "API de clima", "Fornece contexto externo"),
            new Elemento("Aplicação", "Serviço de ingestão", "Centraliza dados em lote e por eventos"),
            new Elemento("Aplicação", "Serviço de qualidade", "Valida, cataloga e rastreia dados"),
            new Elemento("Aplicação", "Motor de previsão", "Gera previsão probabilística"),
            new Elemento("Aplicação", "Motor de reposição", "Transforma previsão em recomendação"),
            new Elemento("Aplicação", "Portal FreshFlow", "Permite decisão humana explicável")
        );

        var tecnologias = List.of(
            new Elemento("Tecnologia", "Amazon Kinesis", "Captura eventos"),
            new Elemento("Tecnologia", "Amazon S3 Data Lake", "Preserva dados brutos, curados e históricos"),
            new Elemento("Tecnologia", "AWS Glue e Data Catalog", "Prepara, cataloga e registra linhagem"),
            new Elemento("Tecnologia", "Amazon SageMaker", "Treina e monitora modelos"),
            new Elemento("Tecnologia", "AWS Lambda e API Gateway", "Entrega recomendações"),
            new Elemento("Tecnologia", "Amazon Aurora PostgreSQL", "Persiste regras e decisões"),
            new Elemento("Tecnologia", "IAM, KMS e Secrets Manager", "Controla acesso, criptografia e segredos"),
            new Elemento("Tecnologia", "CloudWatch", "Monitora e audita a operação")
        );

        var roadmap = List.of(
            "Fase A: Visão de Arquitetura",
            "Fase B: Arquitetura de Negócio",
            "Fase C: Dados e Aplicações",
            "Fase D: Tecnologia",
            "Fase E: Oportunidades e Soluções",
            "Fase F: Planejamento da Migração",
            "Fase G: Governança da Implementação",
            "Fase H: Gestão de Mudanças"
        );

        var relacoes = List.of(
            new Relacao("PDV, ERP, estoque, promoções e clima", "Serviço de ingestão", "fluxo"),
            new Relacao("Serviço de ingestão", "Zona bruta versionada", "acesso"),
            new Relacao("Dados curados", "Motor de previsão", "fluxo"),
            new Relacao("Motor de previsão", "Motor de reposição", "fluxo"),
            new Relacao("Motor de reposição", "Portal FreshFlow", "serviço"),
            new Relacao("Portal FreshFlow", "ERP de compras", "decisão aprovada")
        );

        imprimir("STAKEHOLDERS", stakeholders);
        imprimir("PROCESSOS DE NEGÓCIO", processos);
        imprimir("APLICAÇÕES", aplicacoes);
        imprimir("TECNOLOGIA", tecnologias);

        System.out.println("\n=== ROADMAP TOGAF ADM ===");
        roadmap.forEach(fase -> System.out.println("• " + fase));

        System.out.println("\n=== RELAÇÕES PRINCIPAIS ===");
        relacoes.forEach(r -> System.out.printf("• %s --[%s]--> %s%n", r.origem(), r.tipo(), r.destino()));

        System.out.println("\n=== PRINCÍPIO CENTRAL ===");
        System.out.println("IA recomenda. O responsável humano aprova exceções.");

        System.out.println("\n=== TRANSIÇÃO ===");
        System.out.println("Baseline: planilhas e sistemas isolados");
        System.out.println("Piloto: 3 lojas");
        System.out.println("Target: plataforma FreshFlow em toda a rede");
    }

    private static void imprimir(String titulo, List<Elemento> elementos) {
        System.out.println("\n=== " + titulo + " ===");
        elementos.forEach(e -> System.out.printf("• [%s] %s: %s%n", e.camada(), e.nome(), e.funcao()));
    }
}
