# NotaFiscal - Emissao, Relatorios e Controle Financeiro

Aplicacao web para emissao de nota/cupom fiscal com foco operacional para pequenos negocios.

Este projeto foi pensado para uso diario com baixa friccao: emissao rapida, registro historico de vendas, consolidacao financeira, contas a pagar e contas a receber, em uma unica interface.

## Objetivo do sistema

- Emitir nota/cupom com calculo automatico de subtotal, descontos, impostos e total liquido.
- Registrar vendas para gerar historico contabil.
- Consolidar indicadores financeiros por periodo.
- Controlar contas a pagar e contas a receber com status.
- Exibir saldo projetado para decisao de caixa.

## Principais recursos

- Emissao de nota/cupom com:
  - Cabecalho da nota
  - Dados do emitente
  - Dados do cliente
  - Itens dinamicos (adicionar/remover)
  - Calculo financeiro automatico
  - Pre-visualizacao do cupom
  - Impressao
- Relatorio de vendas:
  - Historico de notas registradas
  - Cliente, forma de pagamento, data e total
  - Filtro por periodo
- Relatorio financeiro:
  - Quantidade de vendas
  - Faturamento bruto
  - Descontos acumulados
  - Impostos acumulados
  - Faturamento liquido
  - Ticket medio
  - Contas a pagar pendentes
  - Contas a receber pendentes
  - Saldo projetado
- Modulo financeiro complementar:
  - Contas a pagar (pendente/pago)
  - Contas a receber (pendente/recebido)
  - Totais por status

## Arquitetura

- Frontend: React + Vite
- Persistencia local: `localStorage`
- Estilizacao: CSS modular por componente principal

Estado persistido no navegador:

- `nota_fiscal_vendas`
- `nota_fiscal_contas_pagar`
- `nota_fiscal_contas_receber`

## Estrutura de pastas

```text
NotaFiscal/
  public/
  src/
    App.jsx
    App.css
    main.jsx
    index.css
  index.html
  package.json
```

## Requisitos

- Node.js 18+
- npm 9+

## Como executar localmente

1. Instalar dependencias

```bash
npm install
```

2. Subir ambiente de desenvolvimento

```bash
npm run dev
```

3. Abrir no navegador

```text
http://localhost:5173
```

## Build de producao

```bash
npm run build
npm run preview
```

## Fluxo operacional recomendado

1. Preencher cabecalho, cliente e itens.
2. Validar totais no resumo financeiro.
3. Registrar venda para gravar no historico.
4. Emitir/imprimir cupom.
5. Acompanhar resultados no relatorio financeiro.
6. Atualizar contas a pagar e receber conforme movimentacao real.

## Regras de calculo

- `subtotal` = soma de `qtd x valorUnitario` dos itens.
- `descontos` = soma dos descontos dos itens.
- `impostos` = soma de `((subtotalItem - descontoItem) x aliquota / 100)`.
- `total liquido` = `subtotal - descontos + impostos`.
- `saldo projetado` = `faturamento liquido + contas a receber pendentes - contas a pagar pendentes`.

## Acessibilidade e inclusao (PCD)

O sistema prioriza operacao objetiva e leitura clara.

Recursos atuais que favorecem acessibilidade:

- Layout responsivo (mobile first).
- Campos com labels explicitas.
- Contraste visual consistente em blocos informativos.
- Fluxo linear por secoes (facil para orientacao cognitiva).

Boas praticas de uso para equipes diversas:

- Padronize descricoes curtas e claras em itens e contas.
- Evite abreviacoes ambigas em campos financeiros.
- Utilize periodicidade fixa para fechamento e conciliacao.

Melhorias recomendadas para evolucao (roadmap de acessibilidade):

- Navegacao completa por teclado com destaque de foco mais forte.
- Marcacoes ARIA para tabelas e componentes interativos.
- Controle de tamanho de fonte no proprio sistema.
- Modo de alto contraste configuravel pelo usuario.
- Leitura assistida de totais criticos por sintetizador de voz.

## Qualidade do codigo

- Estrutura orientada por estados e memorias derivadas (`useMemo`).
- Nomes semanticos para facilitar manutencao.
- Fluxo sem comentarios inline, com intencao expressa por nomenclatura.

## Deploy

Deploy recomendado: Vercel.

Comando:

```bash
npx vercel --prod
```

## Suporte operacional

Para uso em ambiente real, recomenda-se:

- Definir rotina de backup/exportacao periodica dos dados.
- Evoluir de `localStorage` para banco de dados quando houver multiplo acesso.
- Registrar trilha de auditoria para alteracoes financeiras.

## Licenca

Uso interno e adaptavel conforme necessidade do negocio.
