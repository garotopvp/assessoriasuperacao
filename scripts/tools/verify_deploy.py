import requests
import sys
import json

def test_site_health(url):
    print(f"🔍 Verificando saúde do site: {url}")
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            print("✅ Site está ONLINE.")
            return True
        else:
            print(f"❌ Site retornou erro: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Erro de conexão: {e}")
        return False

def test_edge_functions(supabase_url):
    # Lista de funções críticas para testar saúde básica (GET/OPTIONS)
    functions = ["create-stripe-order", "create-openpix-order", "stripe-webhook"]
    print("\n🔍 Verificando Edge Functions...")
    
    for func in functions:
        url = f"{supabase_url}/functions/v1/{func}"
        try:
            # Testamos com OPTIONS que é o que o navegador faz antes de tudo
            res = requests.options(url, timeout=5)
            if res.status_code in [200, 204]:
                print(f"✅ Função '{func}': PRONTA")
            else:
                print(f"⚠️ Função '{func}': Status inesperado {res.status_code}")
        except Exception:
            print(f"❌ Função '{func}': INACESSÍVEL")

if __name__ == "__main__":
    target_url = "https://boracorrerclub.com.br"
    sb_url = "https://tdzdureusnszdzvsoomr.supabase.co"
    
    if len(sys.argv) > 1:
        target_url = sys.argv[1]
        
    s1 = test_site_health(target_url)
    test_edge_functions(sb_url)
    
    if not s1:
        sys.exit(1)
