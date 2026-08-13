# Raiz Viva FreshFlow

Projeto acadêmico de Arquitetura Empresarial que aplica TOGAF ADM e ArchiMate à operação de perecíveis de uma rede varejista simulada.

## Contexto

A Raiz Viva Mercados enfrenta uma contradição comum no varejo de alimentos frescos. Parte dos produtos vence na prateleira, enquanto outros acabam antes da reposição. As decisões dependem de planilhas, experiência individual e sistemas que não compartilham adequadamente as informações.

O FreshFlow propõe integrar vendas, estoque, validade, promoções, clima e sazonalidade para recomendar a reposição por produto, loja e dia. A inteligência artificial apoia a decisão, mas o gestor continua responsável pelas exceções.

## Objetivos do projeto

1. Reduzir o descarte de perecíveis em vinte por cento.

2. Reduzir a ruptura de estoque em quinze por cento.

3. Tornar cada recomendação explicável e auditável.

4. Validar a arquitetura em um piloto de três lojas antes da expansão.

Os percentuais são metas propostas para o piloto e não resultados já alcançados.

## TOGAF ADM

O TOGAF orienta a construção e a evolução da arquitetura. O projeto percorre a visão, a arquitetura de negócio, dados, aplicações, tecnologia, oportunidades, migração, governança e gestão de mudanças. A gestão de requisitos acompanha todo o ciclo.

## ArchiMate

O modelo ArchiMate representa as relações entre motivação, estratégia, negócio, dados, aplicações, tecnologia e implementação. Ele permite visualizar quem participa da decisão, quais processos são executados, quais dados circulam e quais serviços tecnológicos sustentam a solução.

## Funcionamento do FreshFlow

1. O PDV, o ERP, o sistema de estoque, as promoções e o clima fornecem os dados.

2. A plataforma preserva o histórico e executa controles de qualidade, catálogo e linhagem.

3. O modelo produz uma previsão e o motor de reposição transforma essa previsão em uma recomendação.

4. O gerente aceita, ajusta ou rejeita a recomendação e registra o motivo.

5. O pedido segue para o ERP e o resultado real retroalimenta a operação e o modelo.

## Governança, ética e segurança

Cada recomendação deve preservar a versão dos dados, a versão do modelo, as variáveis relevantes, a regra aplicada, a decisão humana e o resultado observado. A arquitetura também prevê acesso mínimo, criptografia, auditoria, qualidade de dados e monitoramento de erro, viés e deriva.

## Estrutura do repositório

`modelos/Raiz_Viva_TOGAF_ArchiMate.archimate` contém o modelo editável para o aplicativo Archi.

`documentos/Raiz_Viva_Relatorio_TOGAF_ArchiMate.docx` contém o relatório técnico completo.

`documentos/roteiro_apresentacao.md` contém a divisão da apresentação e um resumo das falas.

## Apresentação

A apresentação nativa pode ser visualizada e editada no [Canva](https://www.canva.com/design/DAHSFuLoMDM/nzXD9kx9KZq06YAXZ65hPA/edit).

## Como abrir o modelo

1. Instale o aplicativo Archi.

2. Baixe o arquivo com extensão `.archimate` deste repositório.

3. No Archi, escolha a opção para abrir um modelo existente.

4. Selecione o arquivo baixado e navegue pelas visões do projeto.

## Equipe

Luana Ramos Rabelo

Guilherme Ladeira Correia

Lucas Luna Pimentel

## Disciplina

Data Ethics, Governance and Security in the AI Age

FIAP, segundo semestre de 2026.
