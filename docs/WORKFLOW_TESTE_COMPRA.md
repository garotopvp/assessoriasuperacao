---
description: Como testar o fluxo completo de compra e o painel admin
---

Este workflow deve ser executado para garantir que o site está funcional para os usuários finais.

1. **Acesso e Login**:
   - Navegar para `https://boracorrerclub.com.br/login`.
   - Usar as credenciais fornecidas pelo usuário.
   - Verificar se o redirecionamento para o dashboard/perfil ocorre sem erros.

2. **Fluxo de Loja**:
   - Navegar para `/roupas`.
   - Clicar em um produto (ex: Camiseta Bora Correr).
   - Adicionar ao carrinho e iniciar checkout.
   - Preencher dados de CPF/Endereço se solicitado.
   - **IMPORTANTE**: Parar na tela de seleção de pagamento (PIX/Cartão).
   - Verificar se o botão de PIX gera o QR Code corretamente.

3. **Verificação Admin**:
   - Navegar para `/admin`.
   - Verificar se a lista de "Meus Pedidos" ou "Gerenciar Pedidos" carrega sem erros 403.
   - Confirmar se o pedido "Pendente" iniciado no passo anterior aparece na lista.

4. **Relatório**:
   - Informar ao usuário se todos os passos foram concluídos com sucesso ou capturar prints de erros se algo falhar.
