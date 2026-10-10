import asyncio
from playwright.async_api import async_playwright

async def get_html():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        print("Logando...")
        await page.goto("https://appsisrun.com.br/sisrun/login.xhtml?assessoria=boracorrerclub")
        await page.get_by_placeholder("E-mail").fill("rinaldopedroso@gmail.com")
        await page.get_by_placeholder("Senha").fill("Demetrio17!")
        await page.get_by_role("button", name="Entrar").click()
        await page.wait_for_load_state("networkidle")
        
        print("Indo pro form...")
        await page.goto("https://appsisrun.com.br/sisrun/pages/aluno/formAluno.xhtml")
        await page.wait_for_load_state("domcontentloaded")
        await page.wait_for_selector("text=Dados Pessoais")
        
        with open('output_html.txt', 'w', encoding='utf-8') as f:
            try:
                html_celular = page.locator("tr", has_text="Celular").first
                f.write("--- HTML Celular ---\n")
                f.write(await html_celular.inner_html() + "\n")
            except Exception as e:
                f.write(f"Erro celular: {e}\n")
                
            try:
                html_turma = page.locator("tr", has_text="Turma").first
                f.write("\n--- HTML Turma ---\n")
                f.write(await html_turma.inner_html() + "\n")
            except Exception as e:
                f.write(f"Erro turma: {e}\n")
            
        await browser.close()

asyncio.run(get_html())
