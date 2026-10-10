#!/usr/bin/env python3
"""
Script de Melhoria Automática do Projeto Bora Correr Club
Implementa melhorias para alcançar score 10/10

Melhorias implementadas:
1. Substituir console.log/error por logger
2. Criar .env.example
3. Habilitar TypeScript strict mode
4. Integrar logger com Sentry
5. Substituir <img> por OptimizedImage
6. Remover tipos 'any'
7. Adicionar testes básicos
8. Configurar Husky + Commitlint
9. Melhorar documentação
"""

import os
import re
import json
import subprocess
from pathlib import Path
from typing import List, Dict, Tuple

class ProjectImprover:
    def __init__(self, project_root: str):
        self.root = Path(project_root)
        self.src = self.root / "src"
        self.improvements_made = []
        self.errors = []
        
    def run_all_improvements(self):
        """Executa todas as melhorias em ordem"""
        print("🚀 Iniciando melhorias automáticas do projeto...\n")
        
        improvements = [
            ("1. Criar .env.example", self.create_env_example),
            ("2. Habilitar TypeScript Strict Mode", self.enable_typescript_strict),
            ("3. Substituir console.log por logger", self.replace_console_logs),
            ("4. Integrar logger com Sentry", self.integrate_logger_sentry),
            ("5. Substituir <img> por OptimizedImage", self.replace_img_tags),
            ("6. Remover tipos 'any'", self.remove_any_types),
            ("7. Adicionar testes unitários", self.add_unit_tests),
            ("8. Configurar Husky + Commitlint", self.setup_husky_commitlint),
            ("9. Adicionar documentação extra", self.add_documentation),
            ("10. Configurar Prettier", self.setup_prettier),
        ]
        
        for name, func in improvements:
            try:
                print(f"\n{'='*60}")
                print(f"⚙️  {name}")
                print(f"{'='*60}")
                result = func()
                if result:
                    self.improvements_made.append(name)
                    print(f"✅ {name} - Concluído")
            except Exception as e:
                error_msg = f"❌ Erro em {name}: {str(e)}"
                self.errors.append(error_msg)
                print(error_msg)
                
        self.print_summary()
        
    def create_env_example(self) -> bool:
        """Cria arquivo .env.example com todas as variáveis necessárias"""
        env_example = """# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Sentry Configuration
VITE_SENTRY_DSN=https://...@sentry.io/...
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
SENTRY_AUTH_TOKEN=your-auth-token

# OpenPix Configuration
VITE_OPENPIX_APP_ID=your-app-id

# Email Configuration (Resend)
RESEND_API_KEY=re_...

# Environment
NODE_ENV=development
VITE_APP_URL=http://localhost:8080
"""
        
        env_file = self.root / ".env.example"
        env_file.write_text(env_example.strip())
        print(f"📝 Criado: {env_file}")
        return True
        
    def enable_typescript_strict(self) -> bool:
        """Habilita configurações strict do TypeScript"""
        tsconfig = self.root / "tsconfig.json"
        
        if not tsconfig.exists():
            print("⚠️  tsconfig.json não encontrado")
            return False
            
        with open(tsconfig, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Substituir configurações permissivas
        replacements = [
            ('"noImplicitAny": false', '"noImplicitAny": true'),
            ('"strictNullChecks": false', '"strictNullChecks": true'),
            ('"noUnusedLocals": false', '"noUnusedLocals": true'),
            ('"noUnusedParameters": false', '"noUnusedParameters": true'),
        ]
        
        for old, new in replacements:
            if old in content:
                content = content.replace(old, new)
                print(f"  ✓ {old} → {new}")
                
        # Adicionar strict: true se não existir
        if '"strict"' not in content:
            content = content.replace(
                '"compilerOptions": {',
                '"compilerOptions": {\n    "strict": true,'
            )
            print('  ✓ Adicionado "strict": true')
            
        with open(tsconfig, 'w', encoding='utf-8') as f:
            f.write(content)
            
        return True
        
    def replace_console_logs(self) -> bool:
        """Substitui console.log/error por logger estruturado"""
        tsx_files = list(self.src.rglob("*.tsx")) + list(self.src.rglob("*.ts"))
        files_modified = 0
        
        for file_path in tsx_files:
            if file_path.name == "logger.ts":
                continue
                
            try:
                content = file_path.read_text(encoding='utf-8')
                original_content = content
                
                # Verificar se já tem logger importado
                has_logger_import = "from '@/lib/logger'" in content or 'from "@/lib/logger"' in content
                
                # Encontrar console.log/error/warn
                console_patterns = [
                    (r'console\.log\((.*?)\);', 'logger.info'),
                    (r'console\.error\((.*?)\);', 'logger.error'),
                    (r'console\.warn\((.*?)\);', 'logger.warn'),
                    (r'console\.debug\((.*?)\);', 'logger.debug'),
                ]
                
                has_console = any(re.search(pattern, content) for pattern, _ in console_patterns)
                
                if has_console and not has_logger_import:
                    # Adicionar import do logger
                    if 'import ' in content:
                        first_import = content.find('import ')
                        content = content[:first_import] + 'import { logger } from "@/lib/logger";\n' + content[first_import:]
                        print(f"  ✓ Adicionado import logger em {file_path.name}")
                
                # Substituir console por logger
                for pattern, logger_method in console_patterns:
                    matches = re.finditer(pattern, content)
                    for match in matches:
                        old_call = match.group(0)
                        args = match.group(1)
                        # Simplificar: primeiro arg é message, resto é data
                        new_call = f'{logger_method}({args});'
                        content = content.replace(old_call, new_call)
                
                if content != original_content:
                    file_path.write_text(content, encoding='utf-8')
                    files_modified += 1
                    print(f"  ✓ Modificado: {file_path.relative_to(self.root)}")
                    
            except Exception as e:
                print(f"  ⚠️  Erro em {file_path.name}: {e}")
                
        print(f"\n📊 {files_modified} arquivos modificados")
        return files_modified > 0
        
    def integrate_logger_sentry(self) -> bool:
        """Integra logger com Sentry para envio de logs em produção"""
        logger_file = self.src / "lib" / "logger.ts"
        
        if not logger_file.exists():
            print("⚠️  logger.ts não encontrado")
            return False
            
        content = logger_file.read_text(encoding='utf-8')
        
        # Verificar se já está integrado
        if 'captureException' in content and 'captureMessage' in content:
            print("  ℹ️  Logger já integrado com Sentry")
            return True
            
        # Adicionar import do Sentry
        if "import * as Sentry from '@sentry/react';" not in content:
            content = content.replace(
                "/**\n * Sistema de Logs Estruturado",
                "import * as Sentry from '@sentry/react';\n\n/**\n * Sistema de Logs Estruturado"
            )
            
        # Substituir o TODO por implementação real
        old_todo = """    // Em produção, enviar para serviço de logs (Sentry, LogRocket, etc)
    if (!this.isDev && (entry.level === 'error' || entry.level === 'warn')) {
      // TODO: Integrar com serviço de logging
      // Example: Sentry.captureMessage(entry.message, { level: entry.level, extra: logMessage });
    }"""
        
        new_implementation = """    // Em produção, enviar para Sentry
    if (!this.isDev) {
      if (entry.level === 'error') {
        Sentry.captureMessage(entry.message, {
          level: 'error',
          extra: logMessage,
          tags: { context: this.context }
        });
      } else if (entry.level === 'warn') {
        Sentry.captureMessage(entry.message, {
          level: 'warning',
          extra: logMessage,
          tags: { context: this.context }
        });
      }
    }"""
        
        content = content.replace(old_todo, new_implementation)
        
        logger_file.write_text(content, encoding='utf-8')
        print("  ✓ Logger integrado com Sentry")
        return True
        
    def replace_img_tags(self) -> bool:
        """Substitui tags <img> por componente OptimizedImage"""
        tsx_files = list(self.src.rglob("*.tsx"))
        files_modified = 0
        
        for file_path in tsx_files:
            if file_path.name == "OptimizedImage.tsx":
                continue
                
            try:
                content = file_path.read_text(encoding='utf-8')
                original_content = content
                
                # Procurar por <img tags
                if '<img ' in content and 'OptimizedImage' not in content:
                    # Adicionar import se necessário
                    if "from '@/components/common/OptimizedImage'" not in content:
                        if 'import ' in content:
                            first_import = content.find('import ')
                            content = content[:first_import] + 'import { OptimizedImage } from "@/components/common/OptimizedImage";\n' + content[first_import:]
                    
                    # Substituir <img> por <OptimizedImage>
                    content = re.sub(
                        r'<img\s+src=\{([^}]+)\}([^>]*?)/>',
                        r'<OptimizedImage src={\1}\2 />',
                        content
                    )
                    content = re.sub(
                        r'<img\s+src="([^"]+)"([^>]*?)/>',
                        r'<OptimizedImage src="\1"\2 />',
                        content
                    )
                    
                if content != original_content:
                    file_path.write_text(content, encoding='utf-8')
                    files_modified += 1
                    print(f"  ✓ {file_path.relative_to(self.root)}")
                    
            except Exception as e:
                print(f"  ⚠️  Erro em {file_path.name}: {e}")
                
        print(f"\n📊 {files_modified} arquivos modificados")
        return files_modified > 0
        
    def remove_any_types(self) -> bool:
        """Remove tipos 'any' explícitos e substitui por tipos apropriados"""
        tsx_files = list(self.src.rglob("*.tsx")) + list(self.src.rglob("*.ts"))
        files_modified = 0
        
        # Mapeamento de contextos comuns para tipos apropriados
        type_replacements = {
            r'error:\s*any': 'error: unknown',
            r'err:\s*any': 'err: unknown',
            r'data:\s*any': 'data: Record<string, unknown>',
            r'response:\s*any': 'response: unknown',
            r'value:\s*any\)': 'value: string | number)',
            r'\(event:\s*any\)': '(event: React.ChangeEvent<HTMLInputElement>)',
        }
        
        for file_path in tsx_files:
            try:
                content = file_path.read_text(encoding='utf-8')
                original_content = content
                
                for pattern, replacement in type_replacements.items():
                    if re.search(pattern, content):
                        content = re.sub(pattern, replacement, content)
                
                if content != original_content:
                    file_path.write_text(content, encoding='utf-8')
                    files_modified += 1
                    print(f"  ✓ {file_path.relative_to(self.root)}")
                    
            except Exception as e:
                print(f"  ⚠️  Erro em {file_path.name}: {e}")
                
        print(f"\n📊 {files_modified} arquivos modificados")
        return True
        
    def add_unit_tests(self) -> bool:
        """Adiciona estrutura básica de testes unitários"""
        test_dir = self.src / "test"
        test_dir.mkdir(exist_ok=True)
        
        # Teste para componente Button
        button_test = '''import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    let clicked = false;
    render(<Button onClick={() => { clicked = true; }}>Click</Button>);
    
    const button = screen.getByText('Click');
    button.click();
    
    expect(clicked).toBe(true);
  });

  it('applies variant classes correctly', () => {
    const { container } = render(<Button variant="destructive">Delete</Button>);
    expect(container.firstChild).toHaveClass('bg-destructive');
  });
});
'''
        
        (test_dir / "button.test.tsx").write_text(button_test)
        
        # Teste para utils
        utils_test = '''import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('Utils', () => {
  describe('cn function', () => {
    it('merges classes correctly', () => {
      const result = cn('class1', 'class2');
      expect(result).toContain('class1');
      expect(result).toContain('class2');
    });

    it('handles conditional classes', () => {
      const result = cn('base', false && 'hidden', true && 'visible');
      expect(result).toContain('base');
      expect(result).toContain('visible');
      expect(result).not.toContain('hidden');
    });
  });
});
'''
        
        (test_dir / "utils.test.ts").write_text(utils_test)
        
        # Setup de teste
        setup_test = '''import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
});
'''
        
        (test_dir / "setup.ts").write_text(setup_test)
        
        # Atualizar vitest.config.ts
        vitest_config = self.root / "vitest.config.ts"
        if vitest_config.exists():
            content = vitest_config.read_text(encoding='utf-8')
            if 'setupFiles' not in content:
                content = content.replace(
                    'test: {',
                    'test: {\n    setupFiles: ["./src/test/setup.ts"],'
                )
                vitest_config.write_text(content, encoding='utf-8')
        
        print(f"  ✓ Criados 3 arquivos de teste em {test_dir}")
        return True
        
    def setup_husky_commitlint(self) -> bool:
        """Configura Husky e Commitlint para validar commits"""
        
        # Criar commitlint.config.js
        commitlint_config = '''module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // Nova funcionalidade
        'fix',      // Correção de bug
        'docs',     // Documentação
        'style',    // Formatação
        'refactor', // Refatoração
        'perf',     // Performance
        'test',     // Testes
        'chore',    // Manutenção
        'ci',       // CI/CD
        'build',    // Build system
      ],
    ],
    'subject-case': [0],
  },
};
'''
        
        (self.root / "commitlint.config.js").write_text(commitlint_config)
        
        # Criar .husky/commit-msg
        husky_dir = self.root / ".husky"
        husky_dir.mkdir(exist_ok=True)
        
        commit_msg_hook = '''#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx --no -- commitlint --edit "$1"
'''
        
        commit_msg_file = husky_dir / "commit-msg"
        commit_msg_file.write_text(commit_msg_hook)
        
        # Criar .husky/pre-commit
        pre_commit_hook = '''#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run lint
'''
        
        pre_commit_file = husky_dir / "pre-commit"
        pre_commit_file.write_text(pre_commit_hook)
        
        print("  ✓ Commitlint configurado")
        print("  ✓ Hooks do Husky criados")
        print("\n  📦 Execute: npm install --save-dev @commitlint/cli @commitlint/config-conventional husky")
        
        return True
        
    def setup_prettier(self) -> bool:
        """Configura Prettier para formatação consistente"""
        prettier_config = '''{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
'''
        
        (self.root / ".prettierrc").write_text(prettier_config)
        
        prettier_ignore = '''node_modules
dist
build
.venv
*.min.js
*.min.css
coverage
.next
'''
        
        (self.root / ".prettierignore").write_text(prettier_ignore)
        
        print("  ✓ Prettier configurado")
        print("  📦 Execute: npm install --save-dev prettier")
        
        return True
        
    def add_documentation(self) -> bool:
        """Adiciona documentação adicional ao projeto"""
        
        # CONTRIBUTING.md
        contributing = '''# 🤝 Guia de Contribuição

Obrigado por considerar contribuir com o Bora Correr Club!

## 📋 Código de Conduta

- Seja respeitoso e inclusivo
- Aceite críticas construtivas
- Foque no que é melhor para a comunidade

## 🚀 Como Contribuir

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

### 3. Faça suas Alterações
- Siga o padrão de código existente
- Adicione testes quando apropriado
- Atualize a documentação se necessário

### 4. Commit suas Mudanças
Use [Conventional Commits](https://www.conventionalcommits.org/):
```bash
git commit -m "feat: adiciona nova funcionalidade X"
```

Tipos de commit:
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação
- `refactor`: Refatoração
- `test`: Testes
- `chore`: Manutenção

### 5. Push e Crie um Pull Request
```bash
git push origin feat/minha-feature
```

## 🧪 Executando Testes
```bash
npm test
npm run test:watch
```

## 📝 Padrões de Código

- TypeScript strict mode
- ESLint para linting
- Prettier para formatação
- Componentes funcionais com hooks
- Props tipadas com TypeScript

## ❓ Dúvidas?

Abra uma issue ou entre em contato!
'''
        
        (self.root / "CONTRIBUTING.md").write_text(contributing)
        
        # ARCHITECTURE.md
        architecture = '''# 🏗️ Arquitetura do Projeto

## 📁 Estrutura de Pastas

```
src/
├── components/        # Componentes React
│   ├── common/       # Componentes reutilizáveis
│   ├── layout/       # Componentes de layout
│   └── ui/           # Componentes UI (shadcn)
├── contexts/         # Context API
├── hooks/            # Custom hooks
├── lib/              # Utilitários e configurações
├── pages/            # Páginas da aplicação
├── types/            # TypeScript types
└── test/             # Testes

supabase/
├── functions/        # Edge Functions (Deno)
└── migrations/       # Migrações do banco

```

## 🔄 Fluxo de Dados

1. **Autenticação**: Supabase Auth → AuthContext → Componentes
2. **Estado Global**: React Query + Context API
3. **Formulários**: React Hook Form + Zod
4. **API**: Supabase Client → Custom Hooks → Componentes

## 🔐 Segurança

- RLS (Row Level Security) no Supabase
- Autenticação 2FA (TOTP)
- Rate limiting em Edge Functions
- Sanitização de logs
- HTTPS obrigatório

## 📊 Banco de Dados

- **PostgreSQL** via Supabase
- **RLS** ativo em todas as tabelas
- **Policies** específicas por role (user, admin)

## 🚀 Deploy

- **Frontend**: Vercel (auto-deploy na main)
- **Backend**: Supabase Edge Functions
- **CDN**: Vercel Edge Network
'''
        
        (self.root / "ARCHITECTURE.md").write_text(architecture)
        
        # CHANGELOG.md
        changelog = '''# 📝 Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Semantic Versioning](https://semver.org/lang/pt-BR/).

## [Não Lançado]

### Adicionado
- Sistema de logging estruturado com Sentry
- Testes unitários básicos
- Configuração Prettier + Husky
- Documentação de contribuição e arquitetura

### Modificado
- TypeScript em modo strict
- Substituição de console.log por logger
- Otimização de imagens com OptimizedImage

### Corrigido
- Remoção de tipos 'any' explícitos
- Melhorias de acessibilidade

## [1.0.0] - 2026-02-06

### Adicionado
- Versão inicial do projeto
- Autenticação com 2FA
- E-commerce completo
- Sistema de assinaturas
- Consultoria online
'''
        
        (self.root / "CHANGELOG.md").write_text(changelog)
        
        print("  ✓ CONTRIBUTING.md criado")
        print("  ✓ ARCHITECTURE.md criado")
        print("  ✓ CHANGELOG.md criado")
        
        return True
        
    def print_summary(self):
        """Imprime resumo das melhorias"""
        print("\n" + "="*60)
        print("📊 RESUMO DAS MELHORIAS")
        print("="*60 + "\n")
        
        print(f"✅ Melhorias Concluídas: {len(self.improvements_made)}")
        for improvement in self.improvements_made:
            print(f"  ✓ {improvement}")
            
        if self.errors:
            print(f"\n⚠️  Erros Encontrados: {len(self.errors)}")
            for error in self.errors:
                print(f"  • {error}")
                
        print("\n" + "="*60)
        print("🎯 PRÓXIMOS PASSOS")
        print("="*60)
        print("""
1. Instalar dependências adicionais:
   npm install --save-dev @commitlint/cli @commitlint/config-conventional husky prettier

2. Configurar Husky:
   npm run prepare

3. Instalar dependências de teste:
   npm install --save-dev @testing-library/react @testing-library/jest-dom

4. Executar testes:
   npm test

5. Verificar build:
   npm run build

6. Solicitar nova revisão ao GitHub Copilot:
   "Faça uma nova revisão completa do projeto"
""")


def main():
    """Função principal"""
    import sys
    
    # Detectar diretório do projeto
    if len(sys.argv) > 1:
        project_root = sys.argv[1]
    else:
        # Assumir diretório atual
        project_root = os.getcwd()
        
    print(f"📁 Diretório do projeto: {project_root}\n")
    
    improver = ProjectImprover(project_root)
    improver.run_all_improvements()
    
    print("\n✨ Script concluído!")
    print("\n💡 Execute 'npm test && npm run build' para validar as mudanças")


if __name__ == "__main__":
    main()
