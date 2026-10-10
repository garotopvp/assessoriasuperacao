import { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { SEO } from "@/components/common/SEO";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Timer, Route as RouteIcon, Activity, ArrowRight, Zap, Target, TrendingUp, HeartPulse, CheckCircle2, ChevronDown, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const theme = {
  bgMain: "bg-[#F0F0EB]",
  textMain: "text-black",
  textMuted: "text-neutral-700",
  card: "bg-white border-[3px] border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] rounded-none",
  cardSide: "bg-black border-l-[3px] border-black text-white",
  cardSideText: "text-white",
  cardSideMuted: "text-neutral-400",
  inputBg: "bg-white border-2 border-black text-black rounded-none focus-visible:ring-0 focus-visible:border-primary focus-visible:border-b-[4px]",
  button: "bg-primary hover:bg-black text-white rounded-none border-[3px] border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all uppercase font-black",
  tabList: "bg-white border-2 border-black p-0",
  tabActive: "bg-black text-white rounded-none",
  tabInactive: "text-black hover:bg-black/5 rounded-none",
  pillActive: "border-2 border-black bg-primary text-white rounded-none",
  pillInactive: "border-2 border-black text-black hover:bg-white rounded-none",
  tableBg: "bg-white border-[3px] border-black shadow-[6px_6px_0_0_rgba(0,0,0,1)] rounded-none",
  tableHead: "bg-white border-b-[3px] border-black text-black font-black uppercase tracking-widest text-xs",
  tableRowHover: "hover:bg-black/5 text-black border-b border-black/20",
  tableActiveRow: "bg-primary/20 border-l-[6px] border-black font-bold text-black",
  container: "max-w-full px-4 lg:px-12"
};

// --- LOGIC ---
type CalcMode = "pace" | "tempo" | "distancia";

const distanciasPredefinidas = [
  { label: "1 km", value: 1 },
  { label: "3 km", value: 3 },
  { label: "5 km", value: 5 },
  { label: "10 km", value: 10 },
  { label: "15 km", value: 15 },
  { label: "Meia (21.1)", value: 21.097 },
  { label: "Maratona", value: 42.195 },
];

const distanciasParaGrafico = [
  { label: "1 km", value: 1 },
  { label: "3 km", value: 3 },
  { label: "5 km", value: 5 },
  { label: "10 km", value: 10 },
  { label: "15 km", value: 15 },
  { label: "10 Milhas", value: 16.09 },
  { label: "Meia", value: 21.097 },
  { label: "Maratona", value: 42.195 },
];

const paceTableRows = Array.from({ length: 36 }, (_, i) => {
  const secs = 180 + (i * 15);
  const pMin = Math.floor(secs / 60);
  const pSec = secs % 60;
  const speed = (3600 / secs).toFixed(1);
  
  let tag = "";
  let tagClass = "";
  if (secs < 240) { tag = "Elite"; tagClass = "bg-purple-100 text-purple-700 border-purple-200"; }
  else if (secs <= 300) { tag = "Forte"; tagClass = "bg-blue-100 text-blue-700 border-blue-200"; }
  else if (secs <= 390) { tag = "Avançado"; tagClass = "bg-green-100 text-green-700 border-green-200"; }
  else if (secs <= 480) { tag = "Intermediário"; tagClass = "bg-yellow-100 text-yellow-700 border-yellow-200"; }
  else if (secs <= 570) { tag = "Trote Leve"; tagClass = "bg-orange-100 text-orange-700 border-orange-200"; }
  else { tag = "Caminhada"; tagClass = "bg-neutral-200 text-neutral-600 border-neutral-300"; }
  
  return { label: `${pMin}:${pSec.toString().padStart(2, "0")}`, speed, secs, tag, tagClass };
});


export default function Calculadora() {

  const [modo, setModo] = useState<CalcMode>("pace");

  // Inputs
  const [distancia, setDistancia] = useState<string>("5");
  const [horas, setHoras] = useState<string>("0");
  const [minutos, setMinutos] = useState<string>("25");
  const [segundos, setSegundos] = useState<string>("0");
  const [paceMinutos, setPaceMinutos] = useState<string>("5");
  const [paceSegundos, setPaceSegundos] = useState<string>("0");
  const [idade, setIdade] = useState<string>("30");

  const [resultado, setResultado] = useState<string | null>(null);
  const [labelResultado, setLabelResultado] = useState<string>("");
  const [paceCalculado, setPaceCalculado] = useState<number | null>(null);
  const [customPaces, setCustomPaces] = useState<Record<number, number>>({});

  const adjustPace = (km: number, secondsDelta: number) => {
    setCustomPaces(prev => {
      const currentPace = prev[km] !== undefined ? prev[km] : (paceCalculado || 0);
      const newPace = Math.max(1, currentPace + secondsDelta);
      return { ...prev, [km]: newPace };
    });
  };

  const format2Digits = (num: number) => num.toString().padStart(2, "0");

  const parseNum = (val: string) => {
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 0 : parsed;
  };

  const calcular = () => {
    setCustomPaces({});
    const d = parseNum(distancia);
    const tSegundos = parseNum(horas) * 3600 + parseNum(minutos) * 60 + parseNum(segundos);
    const pSegundos = parseNum(paceMinutos) * 60 + parseNum(paceSegundos);

    if (modo === "pace") {
      if (d <= 0 || tSegundos <= 0) {
        setResultado("Valores inválidos");
        setPaceCalculado(null);
        return;
      }
      const paceReal = tSegundos / d;
      const pMin = Math.floor(paceReal / 60);
      const pSec = Math.round(paceReal % 60);
      setResultado(`${format2Digits(pMin)}:${format2Digits(pSec)} min/km`);
      setLabelResultado("SEU PACE É");
      setPaceCalculado(paceReal);
    } else if (modo === "tempo") {
      if (d <= 0 || pSegundos <= 0) {
        setResultado("Valores inválidos");
        setPaceCalculado(null);
        return;
      }
      const tempoTotalSegundos = d * pSegundos;
      const tHoras = Math.floor(tempoTotalSegundos / 3600);
      const tMinutos = Math.floor((tempoTotalSegundos % 3600) / 60);
      const tSecs = Math.round(tempoTotalSegundos % 60);
      
      let res = "";
      if (tHoras > 0) res += `${format2Digits(tHoras)}h `;
      res += `${format2Digits(tMinutos)}m ${format2Digits(tSecs)}s`;
      setResultado(res.trim());
      setLabelResultado("SEU TEMPO TOTAL É");
      setPaceCalculado(pSegundos);
    } else if (modo === "distancia") {
      if (tSegundos <= 0 || pSegundos <= 0) {
        setResultado("Valores inválidos");
        setPaceCalculado(null);
        return;
      }
      const distCalculada = tSegundos / pSegundos;
      setResultado(`${distCalculada.toFixed(2)} km`);
      setLabelResultado("SUA DISTÂNCIA É");
      setPaceCalculado(pSegundos);
    }
  };

  const formataTempo = (totSegundos: number) => {
    const h = Math.floor(totSegundos / 3600);
    const m = Math.floor((totSegundos % 3600) / 60);
    const s = Math.round(totSegundos % 60);
    let str = "";
    if (h > 0) str += `${format2Digits(h)}:`;
    else str += "00:";
    str += `${format2Digits(m)}:${format2Digits(s)}`;
    return str;
  }

  return (
    <div className={cn("min-h-screen flex flex-col relative transition-colors duration-500", theme.bgMain)}>
      <SEO
        title="Calculadora de Pace Completa - Superação Assessoria"
        description="A calculadora mais completa de Pace, distâncias e zonas de treinamento."
      />
      <Header />



      <main className={cn("flex-1 container mx-auto px-4 py-8 md:py-16 relative z-10 flex flex-col gap-16 transition-all duration-500", theme.container, theme.textMain)}>
        
        {/* === SECTION: HEADER & CALCULADORA === */}
        <section>
          <div className="text-center mb-10">
            <span className={cn("inline-flex items-center gap-2 font-bold uppercase tracking-widest text-xs px-3 py-1 rounded-full mb-4", "border-2 border-black bg-white shadow-[2px_2px_0_0_rgba(0,0,0,1)]")}>
              <Activity className="w-4 h-4" /> Ferramenta Gratuita
            </span>
            <h1 className={cn("text-4xl md:text-5xl lg:text-6xl font-heading font-black uppercase tracking-tighter mb-4", theme.textMain)}>
              Calculadora de <span className={cn("bg-primary text-white px-2 uppercase shadow-[4px_4px_0_0_rgba(0,0,0,1)] border-2 border-black ml-1 inline-block")}>Pace</span>
            </h1>
            <p className={cn("max-w-2xl mx-auto text-base md:text-lg leading-relaxed", theme.textMuted)}>
              Descubra seu ritmo de corrida ideal, preveja seus tempos de chegada ou calcule a distância correta para o seu treino com extrema precisão.
            </p>
          </div>

          <div className={cn("flex flex-col lg:flex-row overflow-hidden transition-all duration-500", theme.card)}>
            {/* Lado Esquerdo - Controles */}
            <div className="p-8 md:p-12 lg:w-[60%] flex flex-col gap-10">
              <div className="space-y-4">
                <Label className={cn("text-xs font-bold uppercase tracking-widest", theme.textMuted)}>O que você quer calcular?</Label>
                <div className={cn("grid grid-cols-3 gap-2", theme.tabList)}>
                  {["pace", "tempo", "distancia"].map((m) => (
                    <button
                      key={m}
                      onClick={() => { setModo(m as CalcMode); setResultado(null); setPaceCalculado(null); }}
                      className={cn(
                        "flex flex-col items-center justify-center py-4 px-2 font-bold uppercase text-xs tracking-wider transition-all",
                        modo === m ? theme.tabActive : theme.tabInactive
                      )}
                    >
                      {m === "pace" && <Activity className="w-6 h-6 mb-2" />}
                      {m === "tempo" && <Timer className="w-6 h-6 mb-2" />}
                      {m === "distancia" && <RouteIcon className="w-6 h-6 mb-2" />}
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-8">
                {modo !== "distancia" && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <Label className={cn("text-xs font-bold uppercase tracking-widest", theme.textMuted)}>Distância (KM)</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={distancia}
                        onChange={(e) => setDistancia(e.target.value)}
                        className={cn("text-2xl h-16 font-black pl-6 pr-16 border transition-colors", theme.inputBg)}
                        placeholder="0.00" min="0" step="0.01"
                      />
                      <span className={cn("absolute right-6 top-1/2 -translate-y-1/2 font-bold", theme.textMuted)}>km</span>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {distanciasPredefinidas.map((d) => (
                        <button
                          key={d.value}
                          onClick={() => setDistancia(d.value.toString())}
                          className={cn(
                            "px-4 py-2 text-[11px] uppercase tracking-wider font-bold transition-all border",
                            parseFloat(distancia) === d.value ? theme.pillActive : theme.pillInactive
                          )}
                        >
                          {d.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {modo !== "tempo" && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <Label className={cn("text-xs font-bold uppercase tracking-widest", theme.textMuted)}>Tempo Total de Prova</Label>
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1">
                        <Input type="number" value={horas} onChange={(e) => setHoras(e.target.value.slice(0, 2))} className={cn("text-2xl h-16 w-full font-black text-center border transition-colors", theme.inputBg)} min="0" />
                        <label className={cn("absolute -bottom-6 left-0 w-full text-center text-[10px] uppercase font-bold", theme.textMuted)}>Horas</label>
                      </div>
                      <span className="text-2xl font-black mb-4 opacity-50">:</span>
                      <div className="relative flex-1">
                        <Input type="number" value={minutos} onChange={(e) => {
                          let v = e.target.value.slice(0, 2);
                          if (Number(v) > 59) v = "59";
                          setMinutos(v);
                        }} className={cn("text-2xl h-16 w-full font-black text-center border transition-colors", theme.inputBg)} min="0" max="59" />
                        <label className={cn("absolute -bottom-6 left-0 w-full text-center text-[10px] uppercase font-bold", theme.textMuted)}>Mins</label>
                      </div>
                      <span className="text-2xl font-black mb-4 opacity-50">:</span>
                      <div className="relative flex-1">
                        <Input type="number" value={segundos} onChange={(e) => {
                          let v = e.target.value.slice(0, 2);
                          if (Number(v) > 59) v = "59";
                          setSegundos(v);
                        }} className={cn("text-2xl h-16 w-full font-black text-center border transition-colors", theme.inputBg)} min="0" max="59" />
                        <label className={cn("absolute -bottom-6 left-0 w-full text-center text-[10px] uppercase font-bold", theme.textMuted)}>Segs</label>
                      </div>
                    </div>
                  </div>
                )}

                {modo !== "pace" && (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <Label className={cn("text-xs font-bold uppercase tracking-widest", theme.textMuted)}>Ritmo Mantido (Pace)</Label>
                    <div className="flex items-center gap-3 w-[80%] md:w-2/3">
                      <div className="relative flex-1">
                        <Input type="number" value={paceMinutos} onChange={(e) => setPaceMinutos(e.target.value.slice(0, 2))} className={cn("text-2xl h-16 font-black w-full text-center border transition-colors", theme.inputBg)} min="0" />
                        <label className={cn("absolute -bottom-6 left-0 w-full text-center text-[10px] uppercase font-bold", theme.textMuted)}>Mins</label>
                      </div>
                      <span className="text-2xl font-black mb-4 opacity-50">:</span>
                      <div className="relative flex-1">
                        <Input type="number" value={paceSegundos} onChange={(e) => {
                          let v = e.target.value.slice(0, 2);
                          if (Number(v) > 59) v = "59";
                          setPaceSegundos(v);
                        }} className={cn("text-2xl h-16 font-black w-full text-center border transition-colors", theme.inputBg)} min="0" max="59" />
                        <label className={cn("absolute -bottom-6 left-0 w-full text-center text-[10px] uppercase font-bold", theme.textMuted)}>Segs</label>
                      </div>
                      <span className={cn("text-sm font-bold mb-4 ml-3 uppercase tracking-wider", theme.textMuted)}>/ KM</span>
                    </div>
                  </div>
                )}
              </div>

              <Button onClick={calcular} className={cn("w-full h-16 mt-6 text-lg font-bold font-heading uppercase tracking-widest", theme.button)}>
                Calcular Resultado <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>

            {/* Lado Direito - Resultado */}
            <div className={cn("lg:w-[40%] p-8 md:p-12 flex flex-col items-center justify-center text-center relative overflow-hidden transition-all duration-500", theme.cardSide)}>

              
              <div className="relative z-10 w-full">
                {resultado ? (
                  <div className="animate-in zoom-in-95 duration-500">
                    <span className={cn("font-bold uppercase tracking-widest text-sm mb-4 block text-primary")}>
                      {labelResultado}
                    </span>
                    <div className={cn("p-10 mb-6 relative border-[3px] border-white shadow-[6px_6px_0_0_rgba(255,255,255,1)] bg-neutral-900")}>
                      <span className={cn("text-4xl sm:text-5xl lg:text-6xl font-heading font-black tracking-tighter block break-words drop-shadow-sm", theme.cardSideText)}>
                        {resultado}
                      </span>
                    </div>
                    {modo === "pace" && <p className={cn("text-sm max-w-sm mx-auto leading-relaxed", theme.cardSideMuted)}>Para completar {distancia}km no tempo selecionado, sua média deve ser rigorosamente esta. Seu desempenho projetado nas provas está calculado na tabela abaixo.</p>}
                    {modo === "tempo" && <p className={cn("text-sm max-w-sm mx-auto leading-relaxed", theme.cardSideMuted)}>Correndo no ritmo de {paceMinutos}:{paceSegundos} min/km sem pausas, este seria seu tempo oficial de pórtico nesta quilometragem.</p>}
                    {modo === "distancia" && <p className={cn("text-sm max-w-sm mx-auto leading-relaxed", theme.cardSideMuted)}>Mantendo o ritmo estipulado de {paceMinutos}:{paceSegundos}/km ao longo de todo este tempo ininterrupto, esta seria a sua cobertura do trajeto.</p>}
                    
                    {paceCalculado && (
                      <div className="mt-6 p-4 border-[3px] border-black bg-white shadow-[4px_4px_0_0_rgba(0,0,0,1)] flex items-center gap-4 text-left">
                        <div className="bg-primary p-3 border-2 border-black">
                          <Zap className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <p className="text-[10px] font-bold uppercase text-neutral-500 tracking-widest">Velocidade na Esteira</p>
                          <p className="text-xl font-black font-heading tracking-tighter text-black">{(3600 / paceCalculado).toFixed(1)} km/h</p>
                        </div>
                      </div>
                    )}
                    
                    {resultado && paceCalculado && (
                      <a 
                        href={`https://wa.me/?text=${encodeURIComponent(`Minha meta na Superação é bater ${modo === "distancia" ? resultado : distancia}km em ${modo === "tempo" ? resultado : ((parseFloat(horas)||0)*60 + (parseFloat(minutos)||0) > 0 ? horas + "h " + minutos + "m" : "")}! Média de ${format2Digits(Math.floor(paceCalculado/60))}:${format2Digits(Math.round(paceCalculado%60))} /km! Bora treinar! 🚀`)}`}
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className={cn("mt-6 w-full flex items-center justify-center gap-2 h-14 text-sm font-bold uppercase tracking-widest bg-[#25D366] hover:bg-[#1ebd5b] text-white border-[3px] border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all")}
                      >
                        <Share2 className="w-5 h-5" /> Compartilhar Meta no Zap
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="opacity-70 flex flex-col items-center">
                    <div className={cn("w-24 h-24 rounded-full flex items-center justify-center mb-6 border-[3px] border-white")}>
                      <Target className="w-10 h-10" />
                    </div>
                    <p className="font-bold uppercase tracking-widest text-sm">Aguardando dados...</p>
                    <p className={cn("text-xs mt-3 max-w-[200px] leading-relaxed", theme.cardSideMuted)}>Insira as informações acima para gerar seu resultado e tabela preditiva.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* === SECTION: PROJEÇÃO PARCIAL E GRÁFICO === */}
        {paceCalculado && (
          <section className="animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <div className={cn("p-6 md:p-10 transition-all duration-500", theme.tableBg)}>
              <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center mb-10 border-b border-current/10 pb-8">
                <div>
                  <h3 className={cn("text-2xl font-heading font-bold uppercase", theme.textMain)}>Testes Preditivos (Riegel)</h3>
                  <p className={cn("mt-2 text-sm leading-relaxed max-w-md", theme.textMuted)}>Projeção científica de tempos equivalentes para outras provas. Baseado no Pace de <strong className={cn("font-bold text-black border-2 border-black bg-primary px-2 py-0.5 ml-1 mt-1 inline-block")}>{format2Digits(Math.floor(paceCalculado / 60))}:{format2Digits(Math.round(paceCalculado % 60))} /km</strong>.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 divide-x divide-current/10">
                {distanciasParaGrafico.slice(2, 6).map((dp, idx) => {
                  const baseDist = modo === "distancia" ? parseNum(resultado || "0") : parseNum(distancia) || 1;
                  const t1 = paceCalculado * baseDist;
                  const rTime = t1 * Math.pow(dp.value / baseDist, 1.06);
                  return (
                    <div key={idx} className="flex flex-col items-center md:items-start text-center md:text-left px-2 md:pl-6 first:pl-0 first:border-l-0">
                      <span className={cn("text-[11px] font-bold uppercase tracking-widest mb-2", theme.textMuted)}>{dp.label}</span>
                      <span className={cn("text-2xl md:text-3xl font-heading font-black tracking-tighter", theme.textMain)}>
                        {formataTempo(rTime)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* === SECTION: EXTRAS (ZONAS E PASSAGENS) === */}
        {paceCalculado && (
          <section className="animate-in fade-in slide-in-from-bottom-12 duration-1000 grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Zonas Cardíacas */}
            <div className={cn("p-6 md:p-10 transition-all duration-500", theme.tableBg)}>
              <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center mb-8 border-b-4 border-black pb-8">
                <div>
                  <h3 className={cn("text-2xl font-heading font-black uppercase text-black")}>Zonas Cardíacas <HeartPulse className="inline w-6 h-6 text-primary" /></h3>
                  <p className={cn("mt-2 text-sm leading-relaxed max-w-sm", theme.textMuted)}>Descubra seus batimentos (BPM) para cada tipo de treinamento.</p>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                  <Label className="text-[10px] font-black uppercase shrink-0 text-black">Sua Idade</Label>
                  <Input type="number" value={idade} onChange={(e) => setIdade(e.target.value.slice(0,2))} className={cn("bg-white text-black w-16 h-12 text-center text-xl font-black rounded-none border-[3px] border-black focus-visible:ring-0")} />
                </div>
              </div>
              
              <div className="space-y-3">
                {(() => {
                  const maxHr = 220 - (parseInt(idade) || 30);
                  const zones = [
                    { z: "Z1", name: "Recuperação",  pct: "50-60%", min: maxHr*0.5, max: maxHr*0.6, color: "bg-white text-black" },
                    { z: "Z2", name: "Aeróbico Leve", pct: "60-70%", min: maxHr*0.6, max: maxHr*0.7, color: "bg-blue-100 text-black" },
                    { z: "Z3", name: "Tempo Run",     pct: "70-80%", min: maxHr*0.7, max: maxHr*0.8, color: "bg-green-100 text-black" },
                    { z: "Z4", name: "Limiar", pct: "80-90%", min: maxHr*0.8, max: maxHr*0.9, color: "bg-orange-100 text-black" },
                    { z: "Z5", name: "Máximo", pct: "90-100%", min: maxHr*0.9, max: maxHr*1.0, color: "bg-primary/20 text-black" },
                  ];
                  return zones.map(z => (
                    <div key={z.z} className={cn("flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 border-[3px] border-black transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0_0_rgba(0,0,0,1)]", z.color)}>
                      <div className="flex items-center gap-3 w-full sm:w-auto mb-2 sm:mb-0">
                        <span className="font-black border-2 border-black bg-white px-2 py-1 text-xs">{z.z}</span>
                        <span className="font-bold text-sm uppercase truncate">{z.name}</span>
                      </div>
                      <div className="text-left sm:text-right w-full sm:w-auto bg-white/50 sm:bg-transparent px-2 py-1 sm:p-0">
                        <span className="block font-black text-lg">{Math.round(z.min)} - {Math.round(z.max)} <span className="text-[10px] uppercase font-bold text-neutral-600">BPM</span></span>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
            
            {/* Passagens (Splits) */}
            <div className={cn("p-6 md:p-10 transition-all duration-500 flex flex-col relative", theme.tableBg)}>
              <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center mb-8 border-b-4 border-black pb-8">
                <div>
                  <h3 className={cn("text-2xl font-heading font-black uppercase text-black")}>Suas Passagens <Timer className="inline w-6 h-6 text-primary" /></h3>
                  <p className={cn("mt-2 text-sm leading-relaxed max-w-sm", theme.textMuted)}>Mude o pace de cada quilômetro para planejar sua prova.</p>
                </div>
              </div>
              
              <div className="h-[340px] overflow-y-auto pr-4 space-y-3 custom-scrollbar">
                {(() => {
                  const distFinalStr = modo === "distancia" ? (resultado || "5") : (distancia || "0");
                  const distTotal = parseFloat(distFinalStr) || 0;
                  const maxKms = Math.max(1, Math.min(Math.ceil(distTotal), 100));
                  let tempoAcumulado = 0;
                  
                  return Array.from({ length: maxKms }, (_, i) => {
                    const km = i + 1;
                    const isLastLap = (km === maxKms && distTotal !== Math.floor(distTotal));
                    const kmFraction = isLastLap ? distTotal - (maxKms - 1) : 1;

                    const currentPace = customPaces[km] !== undefined ? customPaces[km] : paceCalculado;
                    const tempoThisLap = currentPace * kmFraction;
                    tempoAcumulado += tempoThisLap;

                    return (
                      <div key={km} className="flex flex-row justify-between items-center p-3 border-b-[3px] border-black border-dashed hover:bg-black/5 transition-colors">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="font-black font-heading text-lg">
                            {isLastLap ? `KM ${distTotal.toFixed(2)}` : `KM ${format2Digits(km)}`}
                          </span>
                          <div className="flex items-center gap-2">
                            <button onClick={() => adjustPace(km, -1)} className="w-5 h-5 flex flex-col items-center justify-center bg-black text-white hover:bg-primary text-xs leading-none font-black pt-0.5 rounded-sm" title="Mais rápido (-1s)">-</button>
                            <span className="text-xs font-bold font-mono tracking-widest w-[40px] text-center text-neutral-600">
                              {Math.floor(currentPace / 60)}:{format2Digits(Math.round(currentPace % 60))}
                            </span>
                            <button onClick={() => adjustPace(km, 1)} className="w-5 h-5 flex flex-col items-center justify-center bg-black text-white hover:bg-primary text-xs leading-none font-black pt-0.5 rounded-sm" title="Mais lento (+1s)">+</button>
                          </div>
                        </div>
                        <span className="font-bold text-2xl font-mono">{formataTempo(tempoAcumulado)}</span>
                      </div>
                    );
                  });
                })()}
              </div>
              
              {Object.keys(customPaces).length > 0 && (
                <div className="absolute top-6 right-6 md:top-10 md:right-10 flex items-center justify-end">
                  <button onClick={() => setCustomPaces({})} className="px-3 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-widest hover:bg-primary transition-colors border-2 border-transparent shadow-[2px_2px_0_0_rgba(0,0,0,0.3)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5">
                    Desfazer Plano
                  </button>
                </div>
              )}
            </div>
            
          </section>
        )}

        {/* === SECTION: TABELA COMPLETA DE PACE === */}
        <section className="flex flex-col">
          <div className="mb-8">
            <h2 className={cn("text-3xl md:text-4xl font-heading font-black uppercase tracking-tighter", theme.textMain)}>
              Tabela Completa de <span className={cn("bg-primary text-white px-2 mt-2 inline-block border-2 border-black shadow-[4px_4px_0_0_rgba(0,0,0,1)]")}>Tempos</span>
            </h2>
            <p className={cn("mt-2", theme.textMuted)}>Visão geral mostrando velocidades e projeções de chegada.</p>
          </div>
          
          <div className={cn("overflow-hidden transition-all duration-500", theme.tableBg)}>
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className={cn("font-bold uppercase tracking-widest text-[10px]", theme.tableHead)}>
                    <th className="px-6 py-5 whitespace-nowrap">Pace (min/km)</th>
                    <th className="px-6 py-5 whitespace-nowrap text-center">KM/H</th>
                    <th className="px-6 py-5 whitespace-nowrap">Prova 5k</th>
                    <th className="px-6 py-5 whitespace-nowrap">Prova 10k</th>
                    <th className="px-6 py-5 whitespace-nowrap">Meia (21k)</th>
                    <th className="px-6 py-5 whitespace-nowrap">Maratona (42k)</th>
                    <th className="px-6 py-5 whitespace-nowrap text-right">Esforço</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-current/5">
                  {paceTableRows.map((row, idx) => {
                    const isActive = paceCalculado && String(row.secs) === String(Math.round(paceCalculado));
                    return (
                      <tr 
                        key={idx} 
                        className={cn("transition-colors duration-200 cursor-default", theme.tableRowHover, isActive ? theme.tableActiveRow : "")}
                      >
                        <td className="px-6 py-4">
                          <span className={cn("font-heading text-lg font-bold", theme.textMain)}>{row.label}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-sm font-semibold opacity-60">{row.speed}</span>
                        </td>
                        <td className="px-6 py-4 font-mono text-sm opacity-80">{formataTempo(row.secs * 5)}</td>
                        <td className="px-6 py-4 font-mono text-sm opacity-80">{formataTempo(row.secs * 10)}</td>
                        <td className="px-6 py-4 font-mono text-sm font-semibold opacity-90">{formataTempo(row.secs * 21.097)}</td>
                        <td className={cn("px-6 py-4 font-mono text-sm font-black")}>{formataTempo(row.secs * 42.195)}</td>
                        <td className="px-6 py-4 text-right">
                          <span className={cn("inline-block px-3 py-1 text-[10px] uppercase font-bold tracking-widest border border-black", row.tagClass, "rounded-none shadow-[2px_2px_0_0_rgba(0,0,0,1)]")}>
                            {row.tag}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
