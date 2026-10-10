import asyncio
from playwright.async_api import async_playwright
import os
import httpx

# ATENÇÃO: Nunca suba senhas reais no git, use variáveis de ambiente (.env)
# Login do treinador "Bora Correr Club" no SisRUN
SISRUN_LOGIN = os.getenv("SISRUN_LOGIN", "boracorrerclub@gmail.com")
SISRUN_SENHA = os.getenv("SISRUN_SENHA", "Demetrio17!")

# No servidor (Render) roda sem interface gráfica. Localmente, mostra o navegador.
HEADLESS = os.getenv("RENDER", None) is not None  # True no Render, False no seu computador

# Z-API para envio de WhatsApp (mesmos nomes de variáveis do Supabase)
ZAPI_URL = os.getenv("ZAPI_URL", "")             # Ex: https://api.z-api.io/instances/SEU_ID
ZAPI_CLIENT_TOKEN = os.getenv("ZAPI_CLIENT_TOKEN", "")
ZAPI_ADMIN_TOKEN = os.getenv("ZAPI_ADMIN_TOKEN", "")

async def enviar_whatsapp_credenciais(telefone: str, nome: str, email: str, senha: str):
    """Envia as credenciais de acesso ao SisRUN via WhatsApp usando Z-API."""
    if not ZAPI_URL or not ZAPI_CLIENT_TOKEN:
        print("⚠️ Z-API não configurada. Pulando envio de WhatsApp.")
        return

    telefone_limpo = "".join(filter(str.isdigit, telefone))
    if not telefone_limpo.startswith("55"):
        telefone_limpo = "55" + telefone_limpo

    mensagem = (
        f"🎉 Olá, {nome.split()[0]}! Seja bem-vindo(a) ao *Bora Correr Club*!\n\n"
        f"Sua conta no *SisRUN* (app de treinos) foi criada com sucesso! 🏃\n\n"
        f"📧 *Login:* {email}\n"
        f"🔑 *Senha:* {senha}\n\n"
        f"Acesse agora pelo link: https://appsisrun.com.br\n\n"
        f"_Recomendamos que você altere sua senha após o primeiro acesso._ 🔒"
    )

    url = f"{ZAPI_URL}/token/{ZAPI_CLIENT_TOKEN}/send-text"
    headers = {"Client-Token": ZAPI_ADMIN_TOKEN or ZAPI_CLIENT_TOKEN, "Content-Type": "application/json"}
    body = {"phone": telefone_limpo, "message": mensagem}

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(url, json=body, headers=headers, timeout=10)
            if resp.status_code == 200:
                print(f"✅ WhatsApp enviado para {telefone_limpo}")
            else:
                print(f"⚠️ Falha ao enviar WhatsApp: {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"⚠️ Erro ao enviar WhatsApp: {e}")


async def cadastrar_aluno_sisrun(dados_aluno: dict):
    """
    Função principal que o robô executará para abrir e cadastrar no painel SisRUN.
    """
    print(f"🤖 [ROBÔ] Iniciando cadastro no SisRUN para: {dados_aluno['nome']}")
    
    # Inicia o motor do navegador (Playwright)
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=HEADLESS)
        context = await browser.new_context()
        page = await context.new_page()

        try:
            # 1. ACESSAR A PÁGINA DE LOGIN DO SISRUN
            print("➡️ Acessando página de Login do SisRUN...")
            await page.goto("https://appsisrun.com.br/sisrun/login.xhtml?assessoria=boracorrerclub")
            
            # PREENCHER LOGIN
            print("➡️ Preenchendo credenciais...")
            # Pelo print, os campos têm placeholder visíveis "E-mail" e "Senha", e um botão que tem o texto "Entrar"
            await page.get_by_placeholder("E-mail").fill(SISRUN_LOGIN)
            await page.get_by_placeholder("Senha").fill(SISRUN_SENHA)
            await page.get_by_role("button", name="Entrar").click()
            
            # Aguardar carregar a tela principal
            await page.wait_for_load_state("networkidle")
            print("✅ Login realizado com sucesso!")

            # 2. NAVEGAR ATÉ A TELA DE ADICIONAR NOVO ALUNO
            print("➡️ Acessando área de novos alunos...")
            # Com base no seu print, a URL exata do formulário é essa:
            await page.goto("https://appsisrun.com.br/sisrun/pages/aluno/formAluno.xhtml")
            
            await page.wait_for_load_state("domcontentloaded")
            await page.wait_for_selector("text=Dados Pessoais") # Garantir que a aba central carregou

            # 3. PREENCHER OS DADOS DO ALUNO NO FORMULÁRIO (Aba: Dados Pessoais)
            print("➡️ Preenchendo a aba Dados Pessoais...")
            
            # Como a tela usa tabelas JSF, o jeito mais seguro de achar os campos dinâmicos 
            # é buscar a linha (tr) que contém o título, e preencher o Input (input de texto) que fica ao lado.
            await page.locator("tr").filter(has_text="Nome").locator("input[type='text']").first.fill(dados_aluno["nome"])
            
            if "telefone" in dados_aluno:
                print("➡️ Preenchendo DDD e Celular...")
                telefone = dados_aluno["telefone"].replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
                
                ddd = telefone[:2] if len(telefone) >= 10 else "11"
                numero = telefone[2:] if len(telefone) >= 10 else telefone

                # O SisRUN tem campos separados para DDD e Celular
                # Usar selectores pelo final do ID é a forma mais segura no JSF
                linha_celular = page.locator("tr", has_text="Celular")
                input_ddd = linha_celular.locator("input[id$=':ddd']")
                input_numero = linha_celular.locator("input[id$=':telefone']")
                
                if await input_ddd.count() > 0:
                    await input_ddd.fill(ddd)
                if await input_numero.count() > 0:
                    await input_numero.fill(numero)
                
            if "data_nascimento" in dados_aluno:
                # Campo Data de Nascimento
                await page.locator("tr").filter(has_text="Data de Nascimento").locator("input[type='text']").first.fill(dados_aluno["data_nascimento"])

            # Selecionar Turma (Campo Obrigatório vindo na mensagem de erro)
            print("➡️ Tentando selecionar a Turma (obrigatório)...")
            try:
                # JSF Autocomplete para a Turma (é um auto-complete e não um select)
                linha_turma = page.locator("tr", has_text="Turma")
                botao_dropdown = linha_turma.locator("button.ui-autocomplete-dropdown").first
                
                if await botao_dropdown.count() > 0:
                    await botao_dropdown.click()
                    await page.wait_for_timeout(1000) # Esperar a lista aparecer
                    
                    # Clica no primeiro item gerado pelo autocomplete
                    # Esse menu de autocomplete do Primefaces gera elementos com a classe ui-autocomplete-item
                    itens_lista = page.locator("li.ui-autocomplete-item:visible")
                    
                    if await itens_lista.count() > 0:
                        await itens_lista.first.click()
                else:
                    # Fallback caso ele mude para select padrão
                    select_html = linha_turma.locator("select").first
                    if await select_html.count() > 0:
                        await select_html.select_option(index=1)
            except Exception as e:
                print("Aviso: Falha ao tentar marcar turma automaticamente:", e)

            # 4. PREENCHER E-MAIL E SENHA (Aba: Login e Permissões)
            print("➡️ Acessando a aba Login e Permissões...")
            await page.get_by_text("Login e Permissões", exact=True).first.click()
            
            # Conforme os novos prints, o campo se chama "E-mail de login"
            try:
                await page.locator("tr").filter(has_text="E-mail de login").locator("input").first.fill(dados_aluno["email"])
            except:
                print("Aviso: Campo de e-mail não encontrado pelo texto padrao.")

            # Você pode escolher gerar uma senha padrão para o aluno ou usar o CPF dele
            if "senha" in dados_aluno:
                await page.locator("tr").filter(has_text="Senha de acesso").locator("input[type='password']").first.fill(dados_aluno["senha"])
            else:
                # Senha padrão se não for enviada
                await page.locator("tr").filter(has_text="Senha de acesso").locator("input[type='password']").first.fill("mudar123")

            # 5. PREENCHER ENDEREÇO (Aba: Endereço)
            if "endereco" in dados_aluno:
                print("➡️ Acessando a aba Endereço...")
                await page.get_by_text("Endereço", exact=True).first.click()
                addr = dados_aluno["endereco"]
                if "cep" in addr:
                    await page.locator("tr").filter(has_text="CEP").locator("input[type='text']").first.fill(addr["cep"])
                if "rua" in addr:
                    await page.locator("tr").filter(has_text="Endereço").locator("input[type='text']").first.fill(addr["rua"])
                if "numero" in addr:
                    await page.locator("tr").filter(has_text="Número").locator("input[type='text']").first.fill(addr["numero"])

            # 6. INFORMAÇÕES COMPLEMENTARES (Aba: Inf. Complementares)
            print("➡️ Acessando a aba Inf. Complementares...")
            await page.get_by_text("Inf. Complementares", exact=True).first.click()
            
            # Preenche o Instagram do Aluno (conforme apareceço print "ID no Instagram")
            if "instagram" in dados_aluno:
                try:
                    await page.locator("tr").filter(has_text="ID no Instagram").locator("input[type='text']").first.fill(dados_aluno["instagram"])
                except:
                    pass
            
            # Preenche os Objetivos vindos da Anamnese (É um Textarea no print)
            if "objetivo_principal" in dados_aluno:
                try:
                    await page.locator("tr").filter(has_text="Objetivos").locator("textarea").first.fill(dados_aluno["objetivo_principal"])
                except:
                    pass

            # 7. DADOS DE TREINOS (Aba: Dados de Treinos)
            if "dias_treino" in dados_aluno:
                print("➡️ Acessando a aba Dados de Treinos...")
                await page.get_by_text("Dados de Treinos", exact=True).first.click()
                
                # A lista 'dias_treino' deve conter strings como ["Seg", "Qua", "Sex"]
                dias = dados_aluno["dias_treino"]
                for dia in dias:
                    try:
                        # Procura o rótulo do dia (ex: "Seg") e clica no checkbox ao lado dele
                        # Como é um checkbox do JSF, o layout costuma envolver o label. 
                        # Vamos usar o click do Playwright atrelado ao texto exato da label.
                        await page.locator("label").filter(has_text=dia).click()
                    except:
                        pass

            # 8. SALVAR O CADASTRO
            print("➡️ Finalizando e salvando cadastro...")
            await page.get_by_role("button", name="Salvar").click()
            
            print("⏳ Aguardando resposta do servidor do SisRUN...")
            await asyncio.sleep(5)
            
            await page.screenshot(path="resultado_salvar.png", full_page=True)
            print(f"🎉 Aluno {dados_aluno['nome']} cadastrado! -> VEJA O ARQUIVO 'resultado_salvar.png'")
            
            # 9. ENVIAR CREDENCIAIS VIA WHATSAPP
            if dados_aluno.get("telefone") and dados_aluno.get("senha"):
                print("📱 Enviando credenciais de acesso via WhatsApp...")
                await enviar_whatsapp_credenciais(
                    telefone=dados_aluno["telefone"],
                    nome=dados_aluno["nome"],
                    email=dados_aluno["email"],
                    senha=dados_aluno["senha"]
                )
            
            # 10. REPORTAR SUCESSO DE VOLTA AO SUPABASE
            if "user_id" in dados_aluno and dados_aluno["user_id"]:
                try:
                    print("🔄 Atualizando status do bot no Supabase (Sucesso)...")
                    callback_url = "https://tdzdureusnszdzvsoomr.supabase.co/functions/v1/sisrun-callback"
                    payload = {
                        "user_id": dados_aluno["user_id"],
                        "status": "success",
                        "error_msg": "",
                        "secret": "boracorrer_callback_super_secret_123"
                    }
                    async with httpx.AsyncClient() as client:
                        await client.post(callback_url, json=payload)
                except Exception as ex:
                    print(f"Aviso: Falha ao reportar sucesso do bot: {ex}")

            await asyncio.sleep(3)
            return {"status": "sucesso", "mensagem": "Cadastrado no SisRUN e credenciais enviadas via WhatsApp."}


        except Exception as e:
            print(f"❌ Erro na automação: {e}")
            # REPORTAR ERRO DE VOLTA AO SUPABASE
            if "user_id" in dados_aluno and dados_aluno["user_id"]:
                try:
                    print("🔄 Atualizando status do bot no Supabase (Erro)...")
                    callback_url = "https://tdzdureusnszdzvsoomr.supabase.co/functions/v1/sisrun-callback"
                    payload = {
                        "user_id": dados_aluno["user_id"],
                        "status": "error",
                        "error_msg": str(e),
                        "secret": "boracorrer_callback_super_secret_123"
                    }
                    async with httpx.AsyncClient() as client:
                        await client.post(callback_url, json=payload)
                except Exception as ex:
                    print(f"Aviso: Falha ao reportar erro do bot: {ex}")

            return {"status": "erro", "mensagem": str(e)}

        finally:
            await context.close()
            await browser.close()

# TESTE LOCAL EXECUTANDO O ARQUIVO DIRETO
if __name__ == "__main__":
    import time
    # Usa timestamp para garantir email único a cada teste
    email_teste = f"joao_teste_{int(time.time())}@email.com"
    
    aluno_teste = {
        "nome": "João Teste do Robô",
        "email": email_teste,
        "telefone": "11999999999",
        "data_nascimento": "01/01/1990",
        "senha": "senha_segura_123",
        "instagram": "@joaoteste",
        "objetivo_principal": "Correr minha primeira meia maratona (21km) sem dores no joelho.",
        "endereco": {
            "cep": "01001-000",
            "rua": "Praça da Sé",
            "numero": "1"
        },
        "dias_treino": ["Seg", "Qua", "Sex"]
    }
    print(f"📧 Email de teste: {email_teste}")
    asyncio.run(cadastrar_aluno_sisrun(aluno_teste))

