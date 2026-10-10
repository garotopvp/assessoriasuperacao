from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
import asyncio
from typing import Optional, List
from bot import cadastrar_aluno_sisrun

app = FastAPI(title="SisRUN Bot API")

class EnderecoModel(BaseModel):
    cep: Optional[str] = None
    rua: Optional[str] = None
    numero: Optional[str] = None

class AlunoModel(BaseModel):
    nome: str
    email: str
    telefone: Optional[str] = None
    data_nascimento: Optional[str] = None
    senha: Optional[str] = None
    instagram: Optional[str] = None
    objetivo_principal: Optional[str] = None
    endereco: Optional[EnderecoModel] = None
    dias_treino: Optional[List[str]] = None
    user_id: Optional[str] = None

@app.api_route("/", methods=["GET", "HEAD"])
def health_check():
    """Endpoint de verificação — o Render usa isso pra saber se o serviço está vivo.
    Aceita HEAD (UptimeRobot free) e GET."""
    return {"status": "online", "servico": "SisRUN Bot 🤖"}

def rodar_cadastro_em_background(dados: dict):
    """Executa o bot de forma assíncrona em background task."""
    import asyncio
    asyncio.run(cadastrar_aluno_sisrun(dados))

@app.post("/webhook/novo-aluno")
async def receiver_novo_aluno(aluno: AlunoModel, background_tasks: BackgroundTasks):
    """
    Recebe os dados do novo aluno via webhook e aciona o robô em background.
    Retorna imediatamente para não causar timeout no Stripe. 
    """
    print(f"📩 Novo webhook recebido para o aluno: {aluno.nome}")
    dados = aluno.model_dump()
    
    # Dispara o robô em segundo plano e retorna imediatamente
    # Assim o Stripe/Supabase não sofre timeout esperando o robô terminar
    background_tasks.add_task(rodar_cadastro_em_background, dados)
    
    return {
        "message": f"✅ Cadastro do aluno '{aluno.nome}' iniciado em background com sucesso!",
        "status": "processando"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
