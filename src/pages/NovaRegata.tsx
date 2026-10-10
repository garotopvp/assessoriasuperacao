import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { SEO } from "@/components/common/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  CheckCircle2,
  Copy,
  Check,
  Plus,
  Minus,
  MessageCircle,
  AlertCircle
} from "lucide-react";
import { SITE_CONFIG } from "@/config/site";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const UNIT_PRICE = 60.00;
const SIZES = ["PP", "P", "M", "G", "GG", "X1", "X2", "X3"] as const;
type SizeType = (typeof SIZES)[number];

const SIZE_GUIDE: Record<SizeType, string> = {
  PP: "Masc: 48x68cm | Fem: 39x54cm",
  P: "Masc: 50x70cm | Fem: 41x56cm",
  M: "Masc: 53x72cm | Fem: 43x58cm",
  G: "Masc: 55x74cm | Fem: 46x60cm",
  GG: "Masc: 56x75cm | Fem: 49x62cm",
  X1: "Masc: 58x76cm | Fem: 51x64cm",
  X2: "Masc: 60x77cm | Fem: 53x66cm (+ R$15)",
  X3: "Masc: 62x78cm | Fem: 55x68cm (+ R$15)",
};

const PIX_KEY = "rinaldopedroso@gmail.com";
const PIX_HOLDER = "Rinaldo Demétrio Pedroso";
const WHATSAPP_NUMBER = SITE_CONFIG.contacts.whatsapp;

export default function PedidoRegata() {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [paymentMode, setPaymentMode] = useState<"integral" | "metade">("integral");

  const [sizeQuantities, setSizeQuantities] = useState<Record<SizeType, number>>({
    PP: 0, P: 0, M: 0, G: 0, GG: 0, X1: 0, X2: 0, X3: 0,
  });

  const [copiedPix, setCopiedPix] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<{
    orderId: string;
    totalAmount: number;
    pixAmount: number;
    paymentMode: string;
    totalPieces: number;
    itemsSummary: string;
  } | null>(null);

  const totalPieces = useMemo(() => {
    return Object.values(sizeQuantities).reduce((acc, qty) => acc + qty, 0);
  }, [sizeQuantities]);

  const totalAmount = useMemo(() => {
    return Object.entries(sizeQuantities).reduce((acc, [size, qty]) => {
      const price = (size === "X2" || size === "X3") ? UNIT_PRICE + 15 : UNIT_PRICE;
      return acc + (qty * price);
    }, 0);
  }, [sizeQuantities]);

  const pixAmount = paymentMode === "metade" ? totalAmount / 2 : totalAmount;

  const handleQuantityChange = (size: SizeType, delta: number) => {
    setSizeQuantities((prev) => {
      const current = prev[size] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [size]: next };
    });
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
    toast.success("Chave PIX copiada!");
    setTimeout(() => setCopiedPix(false), 3000);
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      toast.error("Por favor, preencha seu nome completo.");
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      toast.error("Por favor, preencha um WhatsApp válido.");
      return;
    }

    if (totalPieces <= 0) {
      toast.error("Escolha pelo menos 1 regata.");
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedItems = Object.entries(sizeQuantities)
        .filter(([_, qty]) => qty > 0)
        .map(([size, qty]) => ({
          name: "Regata Cavada Superação",
          size,
          quantity: qty,
          price: (size === "X2" || size === "X3") ? UNIT_PRICE + 15 : UNIT_PRICE,
          total: qty * ((size === "X2" || size === "X3") ? UNIT_PRICE + 15 : UNIT_PRICE),
        }));

      const itemsText = selectedItems
        .map((i) => `${i.quantity}x Tam. ${i.size}`)
        .join(", ");

      const orderPayload = {
        customer_name: customerName.trim(),
        customer_email: `${cleanPhone}@superacao.com.br`,
        total: totalAmount,
        total_amount: totalAmount,
        status: "pending",
        payment_method: paymentMode === "metade" ? "pix_50_percent" : "pix_integral",
        payment_status: "pending",
        items: selectedItems,
        shipping_address: {
          phone: customerPhone,
          notes: null,
          category: "lote_regata_nova",
          product: "Regata Cavada Superação",
          unit_price: UNIT_PRICE,
          total_pieces: totalPieces,
          pix_amount_paid: pixAmount
        },
      };

      const { data, error } = await supabase
        .from("orders")
        .insert(orderPayload)
        .select()
        .single();

      if (error) {
        console.warn("Aviso ao salvar no Supabase (fallback local ativo):", error);
      }

      const orderId = data?.id || `REG-${Date.now().toString().slice(-6)}`;

      setOrderSuccess({
        orderId,
        totalAmount,
        pixAmount,
        paymentMode,
        totalPieces,
        itemsSummary: itemsText,
      });

      toast.success("Pedido gerado com sucesso!");

      const waMessage = encodeURIComponent(
        `*NOVO PEDIDO - REGATA SUPERAÇÃO*\n\n` +
          `👤 *Nome:* ${customerName.trim()}\n` +
          `📱 *WhatsApp:* ${customerPhone}\n\n` +
          `🎽 *Tamanhos:*\n${itemsText}\n\n` +
          `📦 *Total de Peças:* ${totalPieces} un.\n` +
          `💰 *Valor Total:* R$ ${totalAmount.toFixed(2).replace(".", ",")}\n` +
          `💳 *Pagamento Escolhido:* ${paymentMode === "metade" ? "50% Agora e 50% na Entrega" : "Valor Integral Agora"}\n` +
          `💸 *Valor do PIX Transferido Agora:* R$ ${pixAmount.toFixed(2).replace(".", ",")}\n\n` +
          `_Segue o comprovante do PIX em anexo:_`
      );

      setTimeout(() => {
        window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`, "_blank");
      }, 1000);
    } catch (error: any) {
      console.error("Erro ao registrar:", error);
      toast.error("Ocorreu um erro ao processar seu pedido.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <SEO title="Fazer Pedido - Regata Superação" description="Faça o pedido da sua Regata." />

      <div className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8 font-sans">
        <div className="max-w-3xl mx-auto space-y-8">
          
          <div className="text-center space-y-4">
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
              Pedido da Nova Regata
            </h1>
            <p className="text-slate-600 text-lg sm:text-xl font-medium">
              Preencha o formulário abaixo de forma simples.
            </p>
            <div className="pt-6 pb-2 flex justify-center">
              <img 
                src="/images/nova-regata-exemplo.jpg" 
                alt="Exemplo da Regata Superação" 
                className="w-full max-w-2xl rounded-2xl shadow-xl border-4 border-white"
              />
            </div>
          </div>

          {orderSuccess ? (
            <Card className="bg-white border-green-200 shadow-2xl overflow-hidden rounded-2xl">
              <div className="p-8 sm:p-12 text-center space-y-8">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 shadow-sm">
                  <CheckCircle2 className="w-14 h-14" />
                </div>

                <div className="space-y-3">
                  <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
                    Tudo Certo!
                  </h2>
                  <p className="text-slate-600 text-xl font-medium">
                    Seu pedido foi registrado. Só falta o comprovante.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 max-w-lg mx-auto text-left space-y-5 text-lg">
                  <div className="flex justify-between border-b border-slate-200 pb-3">
                    <span className="text-slate-600 font-medium">Total de Peças:</span>
                    <span className="font-bold text-slate-900">{orderSuccess.totalPieces} unidades</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-3">
                    <span className="text-slate-600 font-medium">Tamanhos:</span>
                    <span className="font-bold text-slate-900 text-right">{orderSuccess.itemsSummary}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-200 pb-3">
                    <span className="text-slate-600 font-medium">Valor Total:</span>
                    <span className="font-bold text-slate-900">R$ {orderSuccess.totalAmount.toFixed(2).replace(".", ",")}</span>
                  </div>
                  <div className="flex justify-between pt-3 items-center">
                    <span className="font-bold text-slate-900 text-xl">VOCÊ VAI PAGAR AGORA:</span>
                    <span className="font-black text-green-600 text-3xl">
                      R$ {orderSuccess.pixAmount.toFixed(2).replace(".", ",")}
                    </span>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 sm:p-8 max-w-lg mx-auto space-y-5">
                  <h3 className="font-bold text-blue-900 text-2xl">Enviar Comprovante</h3>
                  <p className="text-slate-700 text-lg">
                    Clique no botão verde para abrir o WhatsApp e nos enviar o comprovante do PIX.
                  </p>
                  <Button
                    asChild
                    className="w-full bg-[#25D366] hover:bg-[#20BD5A] text-white font-black h-20 text-2xl shadow-xl rounded-xl transition-transform hover:scale-105"
                  >
                    <a
                      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
                        `Olá! Acabei de fazer meu pedido da Regata! Segue o comprovante do Pix no valor de R$ ${orderSuccess.pixAmount.toFixed(2).replace(".", ",")}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="w-8 h-8 mr-3" />
                      ABRIR WHATSAPP
                    </a>
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <form onSubmit={handleSubmitOrder} className="space-y-10">
              
              <Card className="bg-white border-slate-200 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-100 pb-5 border-b border-slate-200">
                  <CardTitle className="text-2xl sm:text-3xl font-black text-slate-800 flex items-center gap-4">
                    <span className="w-10 h-10 rounded-full bg-blue-600 text-white text-xl flex items-center justify-center">1</span>
                    Seus Dados
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 sm:p-8 space-y-8">
                  <div className="space-y-4">
                    <Label htmlFor="name" className="text-slate-800 text-xl font-bold">
                      Qual é o seu Nome Completo? <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      required
                      placeholder="Ex: João da Silva"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="h-16 text-xl border-2 border-slate-300 rounded-xl px-5 focus-visible:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-4">
                    <Label htmlFor="phone" className="text-slate-800 text-xl font-bold">
                      Seu Número de WhatsApp <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="phone"
                      required
                      type="tel"
                      placeholder="(13) 99999-9999"
                      value={customerPhone}
                      onChange={handlePhoneChange}
                      className="h-16 text-xl border-2 border-slate-300 rounded-xl px-5 focus-visible:ring-blue-500"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-100 pb-5 border-b border-slate-200">
                  <CardTitle className="text-2xl sm:text-3xl font-black text-slate-800 flex items-center gap-4">
                    <span className="w-10 h-10 rounded-full bg-blue-600 text-white text-xl flex items-center justify-center">2</span>
                    Escolha os Tamanhos
                  </CardTitle>
                  <CardDescription className="text-slate-700 text-lg mt-3 font-medium">
                    Cada regata custa <strong className="text-blue-700 text-xl">R$ 60,00</strong>.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 sm:p-8 space-y-6">
                  
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5 mb-8 flex gap-4 text-blue-900 text-lg font-medium shadow-sm items-start">
                    <AlertCircle className="w-7 h-7 shrink-0 text-blue-700" />
                    <p><strong>Atenção:</strong> Os tamanhos especiais <strong>X2</strong> e <strong>X3</strong> custam <strong className="text-red-600">R$ 75,00</strong> devido ao custo maior de tecido.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {SIZES.map((size) => {
                      const qty = sizeQuantities[size] || 0;
                      const hasExtraCharge = size === "X2" || size === "X3";
                      const price = hasExtraCharge ? UNIT_PRICE + 15 : UNIT_PRICE;
                      
                      return (
                        <div
                          key={size}
                          className={`p-5 rounded-2xl border-2 transition-all flex items-center justify-between ${
                            qty > 0
                              ? "bg-blue-50 border-blue-500 shadow-md scale-[1.02]"
                              : "bg-white border-slate-300"
                          }`}
                        >
                          <div>
                            <div className="font-black text-3xl text-slate-900">{size}</div>
                            <div className="text-lg text-slate-600 font-bold mt-1">
                              {hasExtraCharge ? (
                                <span className="text-red-600">R$ {price.toFixed(2).replace(".", ",")}</span>
                              ) : (
                                <span>R$ {price.toFixed(2).replace(".", ",")}</span>
                              )}
                            </div>
                            <div className="text-sm text-slate-400 font-medium mt-1">
                              {SIZE_GUIDE[size].split("(")[0]}
                            </div>
                          </div>

                          <div className="flex items-center gap-4 bg-slate-100 p-2 rounded-full border border-slate-200">
                            <Button
                              type="button"
                              variant="outline"
                              disabled={qty === 0}
                              onClick={() => handleQuantityChange(size, -1)}
                              className="h-12 w-12 rounded-full border-none shadow-sm bg-white text-slate-700 hover:bg-slate-200"
                            >
                              <Minus className="w-7 h-7" />
                            </Button>

                            <span className="w-8 text-center font-black text-2xl text-slate-900">
                              {qty}
                            </span>

                            <Button
                              type="button"
                              onClick={() => handleQuantityChange(size, 1)}
                              className="h-12 w-12 rounded-full border-none shadow-sm bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              <Plus className="w-7 h-7" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-100 pb-5 border-b border-slate-200">
                  <CardTitle className="text-2xl sm:text-3xl font-black text-slate-800 flex items-center gap-4">
                    <span className="w-10 h-10 rounded-full bg-blue-600 text-white text-xl flex items-center justify-center">3</span>
                    Como prefere pagar?
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 sm:p-8">
                  <RadioGroup 
                    value={paymentMode} 
                    onValueChange={(val) => setPaymentMode(val as "integral" | "metade")}
                    className="space-y-5"
                  >
                    <div 
                      className={`flex items-start space-x-5 border-2 p-6 rounded-2xl cursor-pointer transition-all ${paymentMode === "integral" ? "border-blue-600 bg-blue-50 shadow-md scale-[1.02]" : "border-slate-300 hover:bg-slate-50"}`} 
                      onClick={() => setPaymentMode("integral")}
                    >
                      <RadioGroupItem value="integral" id="r1" className="w-7 h-7 mt-1 border-slate-400 text-blue-600" />
                      <Label htmlFor="r1" className="cursor-pointer w-full">
                        <div className="text-2xl font-black text-slate-900 mb-2">Pagar o Valor Integral Agora</div>
                        <div className="text-slate-600 text-lg font-medium">Você paga 100% do pedido hoje via PIX.</div>
                      </Label>
                    </div>
                    
                    <div 
                      className={`flex items-start space-x-5 border-2 p-6 rounded-2xl cursor-pointer transition-all ${paymentMode === "metade" ? "border-blue-600 bg-blue-50 shadow-md scale-[1.02]" : "border-slate-300 hover:bg-slate-50"}`} 
                      onClick={() => setPaymentMode("metade")}
                    >
                      <RadioGroupItem value="metade" id="r2" className="w-7 h-7 mt-1 border-slate-400 text-blue-600" />
                      <Label htmlFor="r2" className="cursor-pointer w-full">
                        <div className="text-2xl font-black text-slate-900 mb-2">Pagar Metade (50%) Agora</div>
                        <div className="text-slate-600 text-lg font-medium">Você paga 50% hoje (como sinal) e os outros 50% apenas no dia que receber a regata.</div>
                      </Label>
                    </div>
                  </RadioGroup>
                </CardContent>
              </Card>

              <Card className="bg-white border-slate-200 shadow-xl rounded-2xl overflow-hidden">
                <CardHeader className="bg-slate-100 pb-5 border-b border-slate-200">
                  <CardTitle className="text-2xl sm:text-3xl font-black text-slate-800 flex items-center gap-4">
                    <span className="w-10 h-10 rounded-full bg-blue-600 text-white text-xl flex items-center justify-center">4</span>
                    Fazer o PIX e Finalizar
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 sm:p-8 space-y-8">
                  
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4">
                    <div className="flex justify-between items-center text-xl">
                      <span className="text-slate-700 font-medium">Total de Camisetas:</span>
                      <span className="font-black text-slate-900 text-2xl">{totalPieces} un.</span>
                    </div>
                    <div className="flex justify-between items-center text-xl">
                      <span className="text-slate-700 font-medium">Valor Total:</span>
                      <span className="font-black text-slate-900 text-2xl">R$ {totalAmount.toFixed(2).replace(".", ",")}</span>
                    </div>
                    <Separator className="my-5 border-slate-300" />
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <span className="font-black text-slate-900 text-2xl uppercase">Você precisa pagar AGORA:</span>
                      <span className="font-black text-green-600 text-4xl sm:text-5xl tracking-tight">
                        R$ {pixAmount.toFixed(2).replace(".", ",")}
                      </span>
                    </div>
                  </div>

                  <div className="border-4 border-green-200 bg-green-50/50 rounded-2xl p-6 sm:p-8 text-center space-y-6">
                    <h3 className="font-black text-green-800 text-2xl uppercase">Dados para o PIX:</h3>
                    
                    <div className="bg-white border-2 border-green-300 p-6 rounded-xl inline-block text-left w-full max-w-md shadow-sm">
                      <p className="text-lg text-slate-600 font-medium mb-1">Chave E-mail:</p>
                      <p className="font-black text-2xl sm:text-3xl text-slate-900 mb-4 select-all break-words">{PIX_KEY}</p>
                      <p className="text-lg text-slate-600 font-medium">Nome: <strong className="text-slate-900">{PIX_HOLDER}</strong></p>
                    </div>

                    <Button
                      type="button"
                      onClick={handleCopyPix}
                      variant="outline"
                      className="w-full max-w-md mx-auto h-16 text-xl border-2 border-green-600 text-green-700 hover:bg-green-100 font-black uppercase rounded-xl"
                    >
                      {copiedPix ? (
                        <><Check className="w-6 h-6 mr-3" /> Copiado! Cole no banco</>
                      ) : (
                        <><Copy className="w-6 h-6 mr-3" /> Copiar Chave PIX</>
                      )}
                    </Button>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting || totalPieces === 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black h-20 text-2xl sm:text-3xl shadow-xl rounded-2xl transition-transform hover:scale-105"
                  >
                    {isSubmitting ? "Enviando..." : "CONCLUIR MEU PEDIDO"}
                  </Button>

                </CardContent>
              </Card>

            </form>
          )}
        </div>
      </div>
    </Layout>
  );
}
EOF
