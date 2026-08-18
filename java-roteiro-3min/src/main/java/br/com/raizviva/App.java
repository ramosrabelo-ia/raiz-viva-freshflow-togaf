package br.com.raizviva;

import java.util.List;

public class App {
    private record Slide(int numero, String titulo, String fala) {}

    public static void main(String[] args) {
        List<Slide> roteiro = List.of(
            new Slide(1, "Abertura", "Hoje apresentamos o FreshFlow, uma proposta de arquitetura orientada pelo TOGAF ADM para o varejo de pereciveis."),
            new Slide(2, "Problema", "O problema central e que excesso e falta acontecem ao mesmo tempo. Quando compra demais, ha descarte. Quando compra de menos, ha ruptura."),
            new Slide(3, "Causa", "A decisao ainda depende de planilhas, experiencia individual e sistemas separados, como PDV, estoque, ERP, promocoes e clima."),
            new Slide(4, "Por que arquitetura", "Um modelo isolado nao resolve. E preciso alinhar processo, dado, aplicacao, tecnologia e responsabilidade humana."),
            new Slide(5, "TOGAF ADM", "Usamos o TOGAF ADM para organizar a transformacao em fases, saindo da visao do negocio ate tecnologia, migracao, governanca e mudanca continua."),
            new Slide(6, "FreshFlow", "O FreshFlow integra sinais operacionais e recomenda reposicao por SKU, loja e dia, sempre com justificativa e registro."),
            new Slide(7, "Humano no loop", "A IA recomenda, mas o gestor aceita, ajusta ou rejeita antes de enviar ao ERP. Isso preserva contexto, responsabilidade e explicabilidade."),
            new Slide(8, "ArchiMate", "Usamos ArchiMate para tornar a arquitetura visivel, conectando motivacao, negocio, aplicacoes, dados, tecnologia e implementacao."),
            new Slide(9, "Governanca", "Cada recomendacao preserva versao do dado, versao do modelo, regra aplicada, decisao humana e resultado observado."),
            new Slide(10, "Fechamento", "O objetivo nao e prever o futuro perfeitamente. E decidir melhor, medir o resultado e aprender com governanca.")
        );

        System.out.println("FreshFlow em 3 minutos\n");
        for (Slide slide : roteiro) {
            System.out.printf("Slide %02d - %s%n%s%n%n", slide.numero(), slide.titulo(), slide.fala());
        }
    }
}
