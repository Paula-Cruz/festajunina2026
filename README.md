# Mapa de Festas Juninas - Campinas

MVP de site estático com mapa de Campinas usando Leaflet, com pontos carregados de uma planilha.

## 1) Estrutura do projeto

- `index.html`: estrutura da página
- `styles.css`: estilos visuais
- `app.js`: mapa + leitura da planilha + marcadores
- `template-festas.csv`: exemplo de dados para preencher no Google Sheets

## 2) Como preparar a planilha (Google Sheets)

1. Crie uma nova planilha no Google Sheets.
2. Copie o cabeçalho abaixo na primeira linha:
   - `nome,endereco,lat,lng,data,horario,descricao,link`
3. Copie os dados de `template-festas.csv` para testar.
4. Deixe a aba com nome `Pagina1` (ou ajuste no código).

### Colunas obrigatórias

- `nome`
- `endereco`
- `lat`
- `lng`
- `data`

### Colunas opcionais

- `horario`
- `descricao`
- `link`

## 3) Conectar planilha no site

Este MVP usa [OpenSheet](https://github.com/benborgers/opensheet) para transformar Google Sheets em JSON.

1. Publique a planilha para leitura:
   - Google Sheets > Arquivo > Compartilhar > Publicar na Web.
2. Copie o ID da planilha (parte entre `/d/` e `/edit` na URL).
3. Monte a URL no formato:
   - `https://opensheet.elk.sh/SEU_SHEET_ID/Pagina1`
4. No arquivo `app.js`, substitua `SHEET_JSON_URL` por essa URL.

## 4) Rodar localmente

Como é um site estático, você pode:

- Abrir `index.html` diretamente no navegador, ou
- Servir com uma extensão/live server para melhor fluxo de teste.

## 5) Publicar e gerar link

### Opção A: Netlify Drop (mais simples)

1. Acesse [https://app.netlify.com/drop](https://app.netlify.com/drop)
2. Arraste a pasta do projeto.
3. Copie o link público gerado.

### Opção B: Vercel

1. Suba esta pasta para um repositório GitHub.
2. Conecte o repositório em [https://vercel.com](https://vercel.com).
3. Deploy padrão (sem build command) funciona para site estático.

### Opção C: GitHub Pages

1. Envie os arquivos para um repositório público.
2. Em Settings > Pages, selecione branch principal e pasta raiz.
3. Use a URL pública gerada.

## 6) Operação diária

- Para adicionar/editar festas, basta alterar linhas da planilha.
- Recarregue o site para ver os novos pontos.
- Se um ponto não aparecer, confira se `lat` e `lng` são números válidos.
