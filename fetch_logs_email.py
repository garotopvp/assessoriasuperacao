import requests
import json

url = "https://tdzdureusnszdzvsoomr.supabase.co/rest/v1/debug_logs?select=created_at,source,message,details&source=eq.send-order-email&order=created_at.desc&limit=20"
headers = {
    "apikey": "sb_publishable_V_3gNz5TWpeZ6MSxidwgtQ_nP4HPK5g",
    "Authorization": "Bearer sb_publishable_V_3gNz5TWpeZ6MSxidwgtQ_nP4HPK5g"
}

response = requests.get(url, headers=headers)
if response.status_code == 200:
    logs = response.json()
    print(f"Found {len(logs)} logs from send-order-email.")
    for log in logs:
        print(f"[{log['created_at']}] {log['message']}")
        if log['details']:
             try:
                details = log['details']
                if isinstance(details, str):
                    print(f"Details: {details}") 
                else:
                    print(f"Details: {json.dumps(details)}")
             except:
                pass
        print("-" * 40)
else:
    print(f"Error: {response.status_code}")
