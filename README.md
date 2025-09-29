# DataCESUCA - Painel de Análise Estatística de Sistema

Este projeto foi desenvolvido como parte da matéria de Métodos Quantitativos para Tomada de Decisão, com o objetivo de aplicar conceitos estatísticos na análise de dados de desempenho de um sistema simulado.

A aplicação gera dados fictícios de eventos de um sistema (como tempo de resposta e taxa de erros), calcula diversas métricas estatísticas descritivas, exibe os dados em tabelas e gráficos interativos, e permite a exportação de toda a análise para uma planilha Excel bem formatada.

## 📜 Contexto da Missão (Trabalho Acadêmico)

Fomos recrutados como analistas de sistemas pela organização secreta DataCESUCA. Um sistema crítico está apresentando falhas misteriosas e os dados de desempenho precisam ser analisados com urgência para evitar um colapso digital. Nossa missão é descobrir padrões ocultos, desvendar anomalias e apresentar um relatório estatístico que salve o sistema.

## ✨ Funcionalidades Principais

- **Geração de Dados Dinâmicos**: Simula eventos de um sistema com diferentes tempos de resposta, serviços e status.
- **Dashboard Interativo**: Uma interface web moderna e limpa para visualizar todas as análises.
- **Análise Estatística Completa**: Calcula média, mediana, moda, desvio padrão, variância, amplitude e coeficiente de variação.
- **Visualização de Dados**: Apresenta 4 tipos de gráficos para diferentes perspectivas da análise (Histograma, Gráfico de Pizza, Gráfico de Barras e Gráfico de Dispersão).
- **Tabelas de Frequência**: Detalha a distribuição dos dados com frequências absoluta, relativa e acumulada.
- **Relatório de Inteligência**: Gera um relatório em texto com interpretações e sugestões baseadas nos dados.
- **Exportação para Excel**: Exporta TODA a análise para um arquivo `.xlsx` com múltiplas abas, formatado e estilizado para fácil leitura e apresentação.

> ⚠️ **Observação Importante sobre os Gráficos no Excel:** ⚠️
> Devido a limitações técnicas das bibliotecas que rodam no navegador, a geração de **gráficos nativos** do Excel diretamente pelo código não é possível. 
> 
> Como solução, a planilha exportada contém a aba **"Dados para Gráficos"**, que entrega os dados já sumarizados e prontos. Para gerar um gráfico, basta selecionar os dados e usar a função "Inserir > Gráfico" do próprio Excel.
> 
> Para facilitar, um arquivo chamado **`PLANILHA-EXEMPLO-COM-GRAFICOS.xlsx`** foi incluído na pasta raiz do projeto, contendo exemplos dos gráficos já montados a partir desses dados.

## 🚀 Como Executar o Projeto

Para executar este projeto em sua máquina local, siga os passos abaixo. É mais simples do que parece!

### Pré-requisitos

Antes de começar, você precisa ter o **Node.js** instalado em seu computador. Ele é o responsável por gerenciar as dependências e executar o servidor local.

1.  **Baixe o Node.js**: Acesse o site [nodejs.org](https://nodejs.org/) e baixe a versão **LTS** (a mais estável).
2.  **Instale o Node.js**: Execute o arquivo baixado e siga as instruções do instalador. A instalação é padrão e basta clicar em "Avançar" na maioria das etapas.

### Passo a Passo da Instalação

Com o Node.js instalado, abra o terminal de sua preferência (como o `CMD` ou `PowerShell` no Windows) dentro da pasta do projeto.

**1. Abra a Pasta do Projeto**

   Navegue até a pasta onde você descompactou os arquivos do projeto.

**2. Instale as Dependências**

   Este comando irá baixar todas as bibliotecas que o projeto utiliza (Bootstrap, Chart.js, etc.). Você só precisa fazer isso uma vez.

   ```bash
   npm install
   ```

**3. Inicie a Aplicação**

   Após a instalação das dependências, execute o seguinte comando para iniciar o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

**4. Acesse a Aplicação**

   O terminal irá exibir uma mensagem parecida com esta:

   ```
   > datacesuca@0.0.0 dev
   > vite

   VITE v5.3.1  ready in 319 ms

   ➜  Local:   http://localhost:5173/
   ➜  Network: use --host to expose
   ➜  press h + enter to show help
   ```

   Abra o seu navegador de internet (Chrome, Firefox, etc.) e acesse o endereço **Local** fornecido (geralmente `http://localhost:5173/`).

Pronto! A aplicação estará rodando em seu navegador.

---

## 🛠️ Tecnologias Utilizadas

- **Vite**: Ferramenta de build e servidor de desenvolvimento local super rápido.
- **TypeScript**: Superset do JavaScript que adiciona tipagem estática, tornando o código mais robusto.
- **Bootstrap**: Framework CSS para a criação de uma interface responsiva e moderna.
- **Chart.js**: Biblioteca para a criação dos gráficos interativos.
- **ExcelJS**: Biblioteca para a criação e estilização avançada de planilhas Excel diretamente do navegador.
- **Node.js**: Ambiente de execução do JavaScript no lado do servidor (necessário para as ferramentas de desenvolvimento).

## 📂 Estrutura do Projeto

Para fins de contexto, aqui está uma breve descrição dos arquivos mais importantes:

- `README.md`: Este arquivo que você está lendo.
- `index.html`: A estrutura principal da página web.
- `package.json`: Lista todas as dependências do projeto e os scripts (como o `npm run dev`).
- `src/`: Pasta que contém todo o código-fonte da aplicação.
  - `main.ts`: O coração da aplicação. Controla todos os eventos, cálculos e a renderização dos componentes na tela.
  - `style.css`: Arquivo com os estilos personalizados da aplicação.
  - `statistics.ts`: Módulo dedicado que contém todas as funções de cálculo puramente estatístico.
  - `data-generator.ts`: Módulo responsável por simular e gerar os dados brutos do sistema.
