import requests
import json

url = "https://tdzdureusnszdzvsoomr.supabase.co/rest/v1/orders?correlation_id=eq.user_e37430d7-72f8-44f4-8ad5-0a395241682c_cart_1770820293701&select=*"
headers = {
    "apikey": "sb_publishable_V_3gNz5TWpeZ6MSxidwgtQ_nP4HPK5g",
    "Authorization": "Bearer sb_publishable_V_3gNz5TWpeZ6MSxidwgtQ_nP4HPK5g"
}

response = requests.get(url, headers=headers)
if response.status_code == 200:
    order = response.json()
    print(json.dumps(order, indent=2))
else:
    print(f"Error: {response.status_code}")
