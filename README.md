# Gerador de CV

Editor de currículo no navegador: você escreve de um lado e vê a folha A4 do outro. O PDF sai com texto de verdade, então os sistemas de triagem (ATS) conseguem ler.

**Acesse:** https://joao-menezes.github.io/gerador-cv/

## O que dá pra fazer

- Escrever pelo **formulário** ou direto em **Markdown**
- Ver na hora se o CV ainda cabe em **uma página**
- Manter **várias versões** (uma para cada tipo de vaga, por exemplo)
- **Comparar com a vaga**: cola a descrição e vê quais tecnologias pedidas não aparecem no CV
- Escolher a **cor** do CV e da interface
- Baixar o **PDF** ou o **.md** para guardar

Tudo fica salvo no seu navegador. Nada é enviado para servidor nenhum.

## Markdown aceito

```md
# Seu Nome
Título profissional
telefone · e-mail · cidade

## Experiência profissional
### Cargo — Empresa | Jan/2024 – Atual
- O que você fez, com resultado

## Projetos
### Nome do projeto — *Java • Spring Boot* | 2025
Descrição curta.

## Competências técnicas
**Back-end:** Java, Spring Boot, PostgreSQL
```

- `### texto | período` coloca o período alinhado à direita
- `*texto*` dentro de um `###` fica cinza (bom para tecnologias ou instituição)
- Cada linha vira uma linha no CV

## Rodando localmente

Não tem build. Como o JavaScript usa módulos, abra com qualquer servidor estático:

```sh
npx serve .
# ou
python3 -m http.server
```

## Estrutura

```
index.html
css/style.css
js/
  main.js       interface e eventos
  markdown.js   formulário → Markdown → blocos
  preview.js    blocos → HTML da prévia
  pdf.js        blocos → PDF (jsPDF)
  palettes.js   cores
  keywords.js   comparação com a vaga
  storage.js    localStorage
  example.js    CV de exemplo
  utils.js
```
