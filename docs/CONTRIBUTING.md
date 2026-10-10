# Guia de Contribuicao

Obrigado por considerar contribuir com o Bora Correr Club!

## Codigo de Conduta

- Seja respeitoso e inclusivo
- Aceite criticas construtivas
- Foque no que e melhor para a comunidade

## Como Contribuir

### 1. Fork o Projeto

```bash
git clone https://github.com/seu-usuario/boracorrerclub.git
cd boracorrerclub
npm install
```

### 2. Crie uma Branch

```bash
git checkout -b feat/minha-feature
```

### 3. Faca suas Alteracoes

- Siga o padrao de codigo existente
- Adicione testes quando apropriado
- Atualize a documentacao se necessario

### 4. Commit suas Mudancas

Use [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git commit -m "feat: adiciona nova funcionalidade X"
```

Tipos de commit:

- `feat`: Nova funcionalidade
- `fix`: Correcao de bug
- `docs`: Documentacao
- `style`: Formatacao
- `refactor`: Refatoracao
- `test`: Testes
- `chore`: Manutencao

### 5. Push e Crie um Pull Request

```bash
git push origin feat/minha-feature
```

## Executando Testes

```bash
npm test
npm run test:watch
```

## Padroes de Codigo

- TypeScript strict mode
- ESLint para linting
- Prettier para formatacao
- Componentes funcionais com hooks
- Props tipadas com TypeScript

## Duvidas?

Abra uma issue ou entre em contato!
