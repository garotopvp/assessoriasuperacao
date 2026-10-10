import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

console.log("Função 'sentry-webhook-handler' v3 (com Gemini) inicializada.");

// --- Configuração das APIs ---
const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GITHUB_REPO_OWNER = "rinal";
const GITHUB_REPO_NAME = "boracorrerclub";
const GITHUB_API_BASE_URL = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}`;
// --------------------------

// Função para chamar a API do Gemini
async function getGeminiFix(
  filePath: string,
  fileContent: string,
  errorMessage: string
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("A variável de ambiente GEMINI_API_KEY não foi configurada.");
  }
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`;

  const prompt = `
    O seguinte arquivo de código, localizado em '${filePath}', produziu um erro no Sentry.

    Mensagem de Erro:
    \`\`\`
    ${errorMessage}
    \`\`\`

    Conteúdo do Arquivo Original:
    \`\`\`typescript
    ${fileContent}
    \`\`\`

    Sua tarefa é corrigir o bug neste arquivo. Analise o erro e o código, e retorne APENAS o conteúdo do arquivo completo e corrigido, dentro de um bloco de código markdown (ex: \`\`\`typescript ...código corrigido... \`\`\`). Não inclua nenhuma outra explicação ou texto antes ou depois do bloco de código.
  `;

  const response = await fetch(GEMINI_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Falha ao chamar a API do Gemini: ${response.status} ${errorBody}`);
  }

  const data = await response.json();
  const fix = data.candidates[0]?.content.parts[0]?.text;
  if (!fix) {
    throw new Error("A resposta da API do Gemini não continha uma sugestão de correção.");
  }

  // Extrai o código de dentro do bloco markdown
  const codeBlockRegex = /```(?:\w*\n)?([\s\S]*?)```/;
  const match = fix.match(codeBlockRegex);
  if (match && match[1]) {
    return match[1].trim();
  }

  throw new Error("Não foi possível extrair o bloco de código da resposta do Gemini.");
}

// --- Funções da API do GitHub ---

async function callGitHubAPI(endpoint: string, method: string, body?: object) {
  if (!GITHUB_TOKEN) {
    throw new Error("A variável de ambiente GITHUB_TOKEN não foi configurada.");
  }
  const url = endpoint.startsWith("https://") ? endpoint : `${GITHUB_API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Falha na API do GitHub (${method} ${url}): ${response.status} ${errorBody}`);
  }
  return response.status === 204 ? {} : await response.json();
}

async function createGitHubIssue(title: string, body: string): Promise<any> {
  return await callGitHubAPI("/issues", "POST", {
    title: `[Sentry Bug]: ${title}`,
    body,
    labels: ["bug", "sentry-autocreated"],
  });
}

async function getFileContent(filePath: string): Promise<{ content: string; sha: string }> {
  const data = await callGitHubAPI(`/contents/${filePath}`, "GET");
  const content = atob(data.content); // Decodifica de base64
  return { content, sha: data.sha };
}

async function createBranch(newBranchName: string): Promise<void> {
  const mainBranch = await callGitHubAPI("/git/ref/heads/main", "GET");
  await callGitHubAPI("/git/refs", "POST", {
    ref: `refs/heads/${newBranchName}`,
    sha: mainBranch.object.sha,
  });
}

async function commitFile(
  branchName: string,
  filePath: string,
  newContent: string,
  oldFileSha: string,
  commitMessage: string
): Promise<void> {
  await callGitHubAPI(`/contents/${filePath}`, "PUT", {
    message: commitMessage,
    content: btoa(newContent), // Codifica para base64
    sha: oldFileSha,
    branch: branchName,
  });
}

async function createPullRequest(
  branchName: string,
  issueNumber: number,
  title: string
): Promise<any> {
  return await callGitHubAPI("/pulls", "POST", {
    title: `[Auto-Fix]: ${title}`,
    head: branchName,
    base: "main",
    body: `Correção automática para o bug reportado na Issue #${issueNumber}. Este PR foi gerado pela IA.`,
  });
}

function getFilePathFromStacktrace(stacktrace: any): string | null {
  if (!stacktrace?.frames) return null;
  // Pega o último frame, que geralmente é o código da aplicação
  const frame = stacktrace.frames[stacktrace.frames.length - 1];
  if (frame && frame.abs_path) {
    // Transforma a URL do arquivo em um caminho relativo
    const path = frame.abs_path.split("src/")[1];
    if (path) return `src/${path}`;
  }
  return null;
}

// --- Servidor Principal ---

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { action, event, url } = payload;

    if (action === "created" && event) {
      console.log(`✅ Novo problema detectado: "${event.title}"`);

      // 1. Criar a Issue no GitHub para rastreamento
      const issueBody = `
## 🐞 Novo Erro Detectado pelo Sentry
**Título:** ${event.title}
**➡️ [Ver no Sentry](${url})**
---
_Esta issue foi criada automaticamente. Tentando gerar correção com IA..._`;
      const issue = await createGitHubIssue(event.title, issueBody);
      console.log(`✅ Issue #${issue.number} criada no GitHub.`);

      // 2. Encontrar o caminho do arquivo e obter seu conteúdo
      const filePath = getFilePathFromStacktrace(event.stacktrace);
      if (!filePath)
        throw new Error("Não foi possível extrair o caminho do arquivo do stacktrace.");
      console.log(`📂 Arquivo do erro: ${filePath}`);

      const { content: originalContent, sha: originalFileSha } = await getFileContent(filePath);

      // 3. Chamar o Gemini para obter a correção
      console.log("🤖 Chamando a IA do Gemini para sugerir uma correção...");
      const fixedCode = await getGeminiFix(filePath, originalContent, event.title);
      console.log("🤖 Correção recebida do Gemini.");

      // 4. Criar nova branch, comitar e abrir Pull Request
      const branchName = `fix/sentry-issue-${issue.number}`;
      const commitMessage = `fix: Correção automática para o bug da Issue #${issue.number}\n\n${event.title}`;

      await createBranch(branchName);
      console.log(`🌿 Branch '${branchName}' criada.`);

      await commitFile(branchName, filePath, fixedCode, originalFileSha, commitMessage);
      console.log(`💾 Arquivo '${filePath}' corrigido e comitado na nova branch.`);

      const pr = await createPullRequest(branchName, issue.number, event.title);
      console.log(`🚀 Pull Request #${pr.number} criado: ${pr.html_url}`);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Pull Request criado com sucesso!",
          pullRequestUrl: pr.html_url,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      return new Response(JSON.stringify({ success: true, message: "Evento ignorado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }
  } catch (error) {
    console.error("❌ Erro fatal no processamento do webhook:", error.message);
    return new Response(JSON.stringify({ success: false, message: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
