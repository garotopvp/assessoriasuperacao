import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/common/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ShieldCheck,
  Zap,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  ShoppingBag,
  Plus,
  Minus,
  MessageCircle,
  Clock,
  Shirt,
  Info,
  ArrowRight,
} from "lucide-react";
import { SITE_CONFIG } from "@/config/site";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const UNIT_PRICE = 62.99;
const SIZES = ["PP", "P", "M", "G", "GG", "XG", "XXG"] as const;
type SizeType = (typeof SIZES)[number];

const SIZE_GUIDE: Record<SizeType, string> = {
  PP: "Tórax: 88-92cm | Comprimento: 66cm",
  P: "Tórax: 92-96cm | Comprimento: 68cm",
  M: "Tórax: 96-102cm | Comprimento: 70cm",
  G: "Tórax: 102-108cm | Comprimento: 73cm",
  GG: "Tórax: 108-116cm | Comprimento: 76cm",
  XG: "Tórax: 116-124cm | Comprimento: 79cm",
  XXG: "Tórax: 124-132cm | Comprimento: 82cm",
};

const PIX_KEY = SITE_CONFIG.contacts.email; // prof.paulovitor@hotmail.com
const PIX_HOLDER = "Paulo Vitor - Superação Assessoria";
const WHATSAPP_NUMBER = SITE_CONFIG.contacts.whatsapp; // 5513974098493

export default function PedidoRegata() {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [sizeQuantities, setSizeQuantities] = useState<Record<SizeType, number>>({
    PP: 0,
    P: 0,
    M: 0,
    G: 0,
    GG: 0,
    XG: 0,
    XXG: 0,
  });

  const [copiedPix, setCopiedPix] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{
    orderId: string;
    totalAmount: number;
    totalPieces: number;
    itemsSummary: string;
  } | null>(null);

  const totalPieces = useMemo(() => {
    return Object.values(sizeQuantities).reduce((acc, qty) => acc + qty, 0);
  }, [sizeQuantities]);

  const totalAmount = useMemo(() => {
    return totalPieces * UNIT_PRICE;
  }, [totalPieces]);

  const handleQuantityChange = (size: SizeType, delta: number) => {
    setSizeQuantities((prev) => {
      const current = prev[size] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [size]: next };
    });
  };

  const handleSetQuantity = (size: SizeType, value: number) => {
    const valid = Math.max(0, isNaN(value) ? 0 : value);
    setSizeQuantities((prev) => ({ ...prev, [size]: valid }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 11) val = val.slice(0, 11);
    if (val.length > 6) {
      val = `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`;
    } else if (val.length > 2) {
      val = `(${val.slice(0, 2)}) ${val.slice(2)}`;
    }
    setCustomerPhone(val);
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(PIX_KEY);
    setCopiedPix(true);
    toast.success("Chave PIX copiada com sucesso!");
    setTimeout(() => setCopiedPix(false), 3000);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      toast.error("Por favor, informe seu nome completo.");
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      toast.error("Por favor, informe um WhatsApp válido com DDD.");
      return;
    }

    if (totalPieces <= 0) {
      toast.error("Selecione pelo menos 1 regata para fazer o pedido.");
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedItems = Object.entries(sizeQuantities)
        .filter(([_, qty]) => qty > 0)
        .map(([size, qty]) => ({
          name: "Regata Cavada Superação (Z-NINE)",
          size,
          quantity: qty,
          price: UNIT_PRICE,
          total: qty * UNIT_PRICE,
        }));

      const itemsText = selectedItems
        .map((i) => `${i.quantity}x Tam. ${i.size}`)
        .join(", ");

      const orderPayload = {
        customer_name: customerName.trim(),
        customer_email: customerEmail.trim() || `${cleanPhone}@superacao.com.br`,
        total: totalAmount,
        total_amount: totalAmount,
        status: "pending",
        payment_method: "pix_manual",
        payment_status: "pending",
        items: selectedItems,
        shipping_address: {
          phone: customerPhone,
          notes: notes.trim() || null,
          category: "lote_regata_znine",
          product: "Regata Cavada Superação - Z-NINE",
          unit_price: UNIT_PRICE,
          total_pieces: totalPieces,
        },
      };

      // Inserir na tabela de orders do Supabase
      const { data, error } = await supabase
        .from("orders")
        .insert(orderPayload)
        .select()
        .single();

      if (error) {
        console.warn("Aviso ao salvar no Supabase (fallback local ativo):", error);
      }

      const orderId = data?.id || `REG-${Date.now().toString().slice(-6)}`;

      // Salvar também em backup no localStorage para sincronia e listagem local
      try {
        const existingLocal = JSON.parse(localStorage.getItem("regata_orders_backup") || "[]");
        existingLocal.unshift({
          id: orderId,
          created_at: new Date().toISOString(),
          customer_name: customerName.trim(),
          customer_phone: customerPhone,
          customer_email: customerEmail.trim(),
          items: selectedItems,
          total_pieces: totalPieces,
          total_amount: totalAmount,
          notes: notes.trim(),
          status: "pending",
        });
        localStorage.setItem("regata_orders_backup", JSON.stringify(existingLocal));
      } catch (err) {
        console.error("Local storage error:", err);
      }

      setOrderSuccess({
        orderId,
        totalAmount,
        totalPieces,
        itemsSummary: itemsText,
      });

      toast.success("Pedido realizado com sucesso!");

      // Montar mensagem para o WhatsApp da assessoria
      const waMessage = encodeURIComponent(
        `*NOVO PEDIDO - REGATA SUPERAÇÃO (Z-NINE)*\n` +
          `----------------------------------------\n` +
          `🆔 *Pedido:* #${orderId.slice(0, 8)}\n` +
          `👤 *Nome:* ${customerName.trim()}\n` +
          `📱 *WhatsApp:* ${customerPhone}\n` +
          `🎽 *Itens:* ${itemsText}\n` +
          `📦 *Total de Peças:* ${totalPieces} unidade(s)\n` +
          `💰 *Valor Total:* R$ ${totalAmount.toFixed(2).replace(".", ",")}\n` +
          (notes.trim() ? `📝 *Obs:* ${notes.trim()}\n` : "") +
          `----------------------------------------\n` +
          `💳 *Pagamento:* Feito via PIX (${PIX_KEY})\n\n` +
          `_Segue o comprovante do PIX em anexo:_`
      );

      // Abrir WhatsApp após pequeno delay
      setTimeout(() => {
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`, "_blank");
      }, 800);
    } catch (error: any) {
      console.error("Erro ao registrar pedido:", error);
      toast.error("Ocorreu um erro ao processar seu pedido. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <SEO
        title="Pedido Oficial da Nova Regata Superação (Z-NINE)"
        description="Garanta a nova Regata Cavada Oficial da Equipe Superação com Proteção UV 50+ e Tecnologia Dry fabricada pela Z-NINE."
      />

      <div className="min-h-screen bg-neutral-950 text-white py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header da Página */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Lote Oficial de Lançamento
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
              Nova Regata Cavada <span className="text-orange-500">Superação</span>
            </h1>
            <p className="text-neutral-400 max-w-2xl mx-auto text-sm sm:text-base">
              Desenvolvida em parceria com a <strong className="text-neutral-200">Z-NINE Sports</strong>.
              Tecnologia de ponta para seus treinos e provas com o máximo de conforto, ventilação e estilo.
            </p>
          </div>

          {orderSuccess ? (
            /* Tela de Sucesso */
            <Card className="bg-neutral-900 border-neutral-800 text-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
              <div className="p-8 sm:p-12 text-center space-y-6">
                <div className="w-16 h-16 bg-green-500/20 border border-green-500/40 rounded-full flex items-center justify-center mx-auto text-green-400">
                  <CheckCircle2 className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">
                    Pedido Registrado com Sucesso!
                  </h2>
                  <p className="text-neutral-400 text-sm sm:text-base">
                    Seu pedido <strong className="text-white">#{orderSuccess.orderId.slice(0, 8)}</strong> foi registrado na grade de produção.
                  </p>
                </div>

                <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-5 max-w-md mx-auto text-left space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Peças:</span>
                    <span className="font-semibold text-white">{orderSuccess.itemsSummary}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Quantidade Total:</span>
                    <span className="font-semibold text-white">{orderSuccess.totalPieces} unidade(s)</span>
                  </div>
                  <Separator className="bg-neutral-800" />
                  <div className="flex justify-between text-base">
                    <span className="font-bold text-neutral-300">Total a pagar:</span>
                    <span className="font-bold text-orange-400">
                      R$ {orderSuccess.totalAmount.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                </div>

                {/* Box de Instruções do PIX */}
                <div className="bg-orange-950/30 border border-orange-500/30 rounded-xl p-5 max-w-md mx-auto text-left space-y-3">
                  <div className="flex items-center gap-2 text-orange-400 font-semibold text-sm">
                    <Zap className="w-4 h-4" />
                    Envie o comprovante para confirmar:
                  </div>
                  <p className="text-xs text-neutral-300">
                    Caso o WhatsApp não tenha aberto automaticamente, clique no botão abaixo para enviar o comprovante do PIX:
                  </p>
                  <Button
                    asChild
                    className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-bold h-12 shadow-lg"
                  >
                    <a
                      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                        `Olá! Realizei o pedido da Regata Superação #${orderSuccess.orderId.slice(
                          0,
                          8
                        )} (${orderSuccess.itemsSummary}). Segue o comprovante do Pix!`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      Enviar Comprovante no WhatsApp
                    </a>
                  </Button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setOrderSuccess(null);
                      setSizeQuantities({
                        PP: 0,
                        P: 0,
                        M: 0,
                        G: 0,
                        GG: 0,
                        XG: 0,
                        XXG: 0,
                      });
                      setNotes("");
                    }}
                    className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                  >
                    Fazer Outro Pedido
                  </Button>
                  <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white">
                    <Link to="/roupas">Voltar para a Loja</Link>
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Coluna Esquerda: Mockup e Detalhes Técnicos */}
              <div className="lg:col-span-5 space-y-6">
                <Card className="bg-neutral-900 border-neutral-800 text-white overflow-hidden shadow-xl sticky top-24">
                  <div className="relative aspect-4/3 sm:aspect-square bg-neutral-950 flex items-center justify-center p-2 group overflow-hidden">
                    <img
                      src="/images/regata-cavada-superacao.png"
                      alt="Nova Regata Cavada Equipe Superação - Z-NINE"
                      className="w-full h-full object-contain rounded-lg transition-transform duration-300 group-hover:scale-105"
                      loading="eager"
                    />
                    <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                      <Badge className="bg-orange-500 text-black font-extrabold border-none">
                        R$ {UNIT_PRICE.toFixed(2).replace(".", ",")}
                      </Badge>
                      <Badge className="bg-neutral-950/80 backdrop-blur-md text-white border border-neutral-700">
                        Z-NINE Sports
                      </Badge>
                    </div>
                  </div>

                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-1">
                      <h2 className="text-xl font-bold text-white">
                        Regata Cavada Equipe Superação
                      </h2>
                      <p className="text-xs text-neutral-400">
                        Design exclusivo com corte cavado para corrida, ciclismo e treinos intensos.
                      </p>
                    </div>

                    {/* Destaques Técnicos */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-lg p-3 flex items-start gap-2.5">
                        <ShieldCheck className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-bold text-white">UV Protection 50+</div>
                          <div className="text-[11px] text-neutral-400">Proteção solar máxima</div>
                        </div>
                      </div>
                      <div className="bg-neutral-950/60 border border-neutral-800/80 rounded-lg p-3 flex items-start gap-2.5">
                        <Zap className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-xs font-bold text-white">Tecnologia DRY</div>
                          <div className="text-[11px] text-neutral-400">Secagem ultra rápida</div>
                        </div>
                      </div>
                    </div>

                    {/* Guia de Medidas Rápido */}
                    <div className="pt-2">
                      <div className="text-xs font-bold text-neutral-300 mb-2 flex items-center gap-1.5">
                        <Shirt className="w-4 h-4 text-orange-400" />
                        Referência de Tamanhos:
                      </div>
                      <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs space-y-1.5 text-neutral-400">
                        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
                          {SIZES.map((size) => (
                            <div key={size} className="flex justify-between border-b border-neutral-800/50 pb-0.5">
                              <span className="font-bold text-neutral-300">{size}:</span>
                              <span className="text-[11px]">{SIZE_GUIDE[size].split("|")[0]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Coluna Direita: Formulário de Pedido */}
              <div className="lg:col-span-7 space-y-6">
                <form onSubmit={handleSubmitOrder} className="space-y-6">
                  {/* Card 1: Dados Pessoais */}
                  <Card className="bg-neutral-900 border-neutral-800 text-white shadow-xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-orange-500 text-black text-xs font-bold flex items-center justify-center">
                          1
                        </span>
                        Seus Dados de Contato
                      </CardTitle>
                      <CardDescription className="text-neutral-400 text-xs">
                        Usaremos estes dados para identificar seu pedido e avisar quando as peças chegarem.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-neutral-200 text-sm">
                          Nome Completo <span className="text-orange-500">*</span>
                        </Label>
                        <Input
                          id="name"
                          required
                          placeholder="Ex: João da Silva"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          className="bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-500 focus:border-orange-500 h-11"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-neutral-200 text-sm">
                            WhatsApp com DDD <span className="text-orange-500">*</span>
                          </Label>
                          <Input
                            id="phone"
                            required
                            placeholder="(13) 99999-9999"
                            value={customerPhone}
                            onChange={handlePhoneChange}
                            className="bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-500 focus:border-orange-500 h-11"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-neutral-200 text-sm">
                            E-mail (Opcional)
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="seuemail@exemplo.com"
                            value={customerEmail}
                            onChange={(e) => setCustomerEmail(e.target.value)}
                            className="bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-500 focus:border-orange-500 h-11"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Card 2: Escolha de Tamanhos e Quantidades */}
                  <Card className="bg-neutral-900 border-neutral-800 text-white shadow-xl">
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg font-bold flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-orange-500 text-black text-xs font-bold flex items-center justify-center">
                              2
                            </span>
                            Escolha a Grade de Tamanhos
                          </CardTitle>
                          <CardDescription className="text-neutral-400 text-xs">
                            Selecione a quantidade de peças para cada tamanho desejado (R$ {UNIT_PRICE.toFixed(2).replace(".", ",")} cada).
                          </CardDescription>
                        </div>
                        {totalPieces > 0 && (
                          <Badge className="bg-orange-500 text-black font-bold">
                            {totalPieces} {totalPieces === 1 ? "peça" : "peças"}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {SIZES.map((size) => {
                          const qty = sizeQuantities[size] || 0;
                          return (
                            <div
                              key={size}
                              className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                                qty > 0
                                  ? "bg-orange-500/10 border-orange-500/50 shadow-inner"
                                  : "bg-neutral-950/60 border-neutral-800 hover:border-neutral-700"
                              }`}
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-extrabold text-base text-white">{size}</span>
                                  {qty > 0 && (
                                    <span className="text-xs font-semibold text-orange-400">
                                      (R$ {(qty * UNIT_PRICE).toFixed(2).replace(".", ",")})
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-neutral-400">{SIZE_GUIDE[size].split("|")[0]}</div>
                              </div>

                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  disabled={qty === 0}
                                  onClick={() => handleQuantityChange(size, -1)}
                                  className="h-8 w-8 rounded-lg border-neutral-700 bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-30"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </Button>

                                <input
                                  type="number"
                                  min="0"
                                  max="99"
                                  value={qty}
                                  onChange={(e) => handleSetQuantity(size, parseInt(e.target.value) || 0)}
                                  className="w-10 text-center font-bold text-sm bg-transparent border-none text-white focus:outline-none"
                                />

                                <Button
                                  type="button"
                                  variant="outline"
                                  size="icon"
                                  onClick={() => handleQuantityChange(size, 1)}
                                  className="h-8 w-8 rounded-lg border-neutral-700 bg-neutral-900 text-white hover:bg-orange-500 hover:text-black hover:border-orange-500 transition-colors"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="space-y-2 pt-2">
                        <Label htmlFor="notes" className="text-neutral-200 text-xs font-medium">
                          Observações ou local de entrega preferido (Opcional)
                        </Label>
                        <Textarea
                          id="notes"
                          rows={2}
                          placeholder="Ex: Entregar no treino das 19h na Praia das Pitangueiras / Tombo..."
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          className="bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-500 focus:border-orange-500 text-xs"
                        />
                      </div>
                    </CardContent>
                  </Card>

                  {/* Card 3: Pagamento via PIX e Resumo */}
                  <Card className="bg-neutral-900 border-neutral-800 text-white shadow-xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-orange-500 text-black text-xs font-bold flex items-center justify-center">
                          3
                        </span>
                        Pagamento via PIX
                      </CardTitle>
                      <CardDescription className="text-neutral-400 text-xs">
                        Faça o PIX do valor total e clique em confirmar para enviar o comprovante.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-5">
                      {/* Box PIX */}
                      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 sm:p-5 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="text-xs text-neutral-400">Chave PIX (E-mail):</div>
                            <div className="font-mono font-bold text-white text-sm sm:text-base select-all">
                              {PIX_KEY}
                            </div>
                            <div className="text-xs text-neutral-400 mt-0.5">Beneficiário: {PIX_HOLDER}</div>
                          </div>
                          <Button
                            type="button"
                            onClick={handleCopyPix}
                            className="bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 shrink-0 h-10 px-4"
                          >
                            {copiedPix ? (
                              <>
                                <Check className="w-4 h-4 mr-2 text-green-400" />
                                Copiado!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 mr-2" />
                                Copiar Chave PIX
                              </>
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Resumo do Pedido */}
                      <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 space-y-2">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-neutral-300">Total de Regatas:</span>
                          <span className="font-bold text-white">{totalPieces} unidade(s)</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-neutral-300">Valor Unitário:</span>
                          <span className="text-neutral-300">R$ {UNIT_PRICE.toFixed(2).replace(".", ",")}</span>
                        </div>
                        <Separator className="bg-orange-500/20 my-1" />
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-base text-white">Valor Total do Pedido:</span>
                          <span className="font-extrabold text-2xl text-orange-400">
                            R$ {totalAmount.toFixed(2).replace(".", ",")}
                          </span>
                        </div>
                      </div>

                      {/* Botão de Ação Principal */}
                      <Button
                        type="submit"
                        disabled={isSubmitting || totalPieces === 0}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-black font-extrabold h-14 text-base sm:text-lg shadow-xl hover:shadow-orange-500/20 transition-all"
                      >
                        {isSubmitting ? (
                          "Processando Pedido..."
                        ) : totalPieces === 0 ? (
                          "Selecione ao menos 1 tamanho acima"
                        ) : (
                          <>
                            Confirmar Pedido e Enviar Comprovante
                            <ArrowRight className="w-5 h-5 ml-2" />
                          </>
                        )}
                      </Button>

                      <div className="flex items-center justify-center gap-2 text-xs text-neutral-400 text-center">
                        <ShieldCheck className="w-4 h-4 text-green-400 shrink-0" />
                        <span>Seu pedido é enviado diretamente para a coordenação da Equipe Superação.</span>
                      </div>
                    </CardContent>
                  </Card>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
