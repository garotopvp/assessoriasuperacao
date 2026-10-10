import { useState, useEffect, useCallback, useRef } from "react";
import dagre from "dagre";
import {
  ReactFlow,
  Background,
  Controls,
  Panel,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  MarkerType,
  Handle,
  Position,
  Connection,
  addEdge,
  MiniMap,
  OnConnect,
  useReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Save,
  RefreshCw,
  MessageSquare,
  ArrowRight,
  Maximize2,
  Minimize2,
  X,
  Sparkles,
  SpellCheck,
  Loader2,
  PlayCircle,
  Search,
  Tag,
  Palette,
  Plus,
  Trash2,
  Copy,
  ChevronRight,
  AlertCircle,
  LayoutDashboard,
  MousePointer2,
  TrendingUp,
  Smartphone,
  CheckCircle2,
  Info,
  Wand2,
  Navigation,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Custom Node for Bot Flow
const BotNode = ({ data }: any) => {
  const isStart = data.node_key === "START" || data.node_key === "INICIO";

  // Cores por categoria
  const categoryColors: Record<string, string> = {
    venda: "border-amber-400 bg-amber-50/30",
    suporte: "border-blue-400 bg-blue-50/30",
    conteudo: "border-purple-400 bg-purple-50/30",
    pagamento: "border-emerald-400 bg-emerald-50/30",
    padrao: "border-primary/50 bg-card",
  };

  const currentTheme = categoryColors[data.category || "padrao"];

  return (
    <div
      className={cn(
        "px-4 py-3 shadow-xl rounded-xl border-2 transition-all min-w-[280px] group relative",
        isStart ? "border-emerald-500 ring-4 ring-emerald-50 bg-card" : currentTheme,
        data.isSearchResult ? "ring-4 ring-yellow-400 scale-110 z-[100]" : ""
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-primary border-2 border-white"
      />

      {!isStart && (
        <div className="absolute -top-2 -right-2 z-50 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 cursor-pointer">
          <div
            className="bg-red-500 hover:bg-red-600 text-white h-6 w-6 rounded-full shadow-lg border-2 border-white flex items-center justify-center nodrag nopan"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("X clicked for node:", data);
              if (data.onDelete) {
                data.onDelete(data);
              } else {
                console.error("onDelete function missing on node data:", data);
                toast.error("Erro: Função de excluir não encontrada neste nó");
              }
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
            }}
          >
            <X className="w-3 h-3 pointer-events-none" />
          </div>
        </div>
      )}

      <div className="absolute -top-2 -left-2 z-50 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100 cursor-pointer">
        <div
          className="bg-indigo-600 hover:bg-indigo-700 text-white h-6 w-6 rounded-full shadow-lg border-2 border-white flex items-center justify-center nodrag nopan"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (data.onAiAssist) {
              data.onAiAssist(data);
            } else {
              toast.error("Função AI indisponível. Recarregue a página.");
            }
          }}
          onMouseDown={(e) => e.stopPropagation()}
          title="Criar com IA a partir deste nó"
        >
          <Sparkles className="w-3 h-3 pointer-events-none" />
        </div>
      </div>

      {isStart && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5 animate-bounce-subtle">
          <PlayCircle className="w-3 h-3" />
          START
        </div>
      )}

      <div className="flex items-center gap-2 mb-3 border-b border-primary/10 pb-2">
        <div className={cn("p-1.5 rounded-lg", isStart ? "bg-emerald-100" : "bg-primary/10")}>
          <MessageSquare className={cn("w-4 h-4", isStart ? "text-emerald-600" : "text-primary")} />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-[11px] truncate max-w-[140px] uppercase tracking-tight">
            {data.title}
          </span>
          <span className="text-[9px] font-mono text-muted-foreground">{data.node_key}</span>
        </div>
        <Badge
          variant="secondary"
          className="text-[8px] ml-auto font-mono bg-primary/5 text-primary border-primary/20 italic"
        >
          {data.options?.length || 0} opts
        </Badge>
      </div>

      <div className="text-[10px] text-muted-foreground line-clamp-4 mb-4 whitespace-pre-wrap italic bg-muted/30 p-2 rounded-lg leading-relaxed relative overflow-hidden">
        <div
          className={cn(
            "absolute top-0 left-0 w-1 h-full",
            isStart ? "bg-emerald-500/30" : "bg-primary/20"
          )}
        />
        "{data.content}"
      </div>

      <div className="space-y-1.5">
        {data.options?.map((opt: any, i: number) => (
          <div
            key={i}
            className="flex items-center justify-between bg-white border border-border p-2 rounded-lg text-[10px] shadow-sm relative group/opt"
          >
            <span className="truncate pr-4 font-medium">
              {i + 1}. {opt.label}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <ArrowRight className="w-3 h-3 text-primary opacity-50 group-hover/opt:opacity-100 transition-opacity" />
              <Handle
                type="source"
                position={Position.Right}
                id={`opt-${i}`}
                className="!w-6 !h-6 !bg-primary !border-4 !border-white !rounded-full !shadow-xl !-right-3 !top-1/2 !-translate-y-1/2 cursor-crosshair hover:!scale-125 transition-transform"
              />
            </div>
            {opt.next_node && (
              <div className="absolute -top-1.5 -right-1.5 text-[7px] bg-primary text-white px-1.5 rounded-full font-black uppercase tracking-widest leading-none py-0.5 shadow-sm ring-1 ring-white">
                Link
              </div>
            )}
          </div>
        ))}

        {(!data.options || data.options.length === 0) && (
          <div className="flex items-center justify-center py-2 text-[9px] text-muted-foreground border-dashed border-2 rounded-lg bg-muted/10 relative overflow-visible">
            Ponto Final / Resposta Livre
            <Handle
              type="source"
              position={Position.Bottom}
              className="!w-5 !h-5 !bg-orange-400 !border-2 !border-white !-bottom-2.5 shadow-lg hover:!scale-125 transition-transform"
            />
          </div>
        )}
      </div>
    </div>
  );
};

const WhatsAppPreview = ({
  node,
  nodes,
  onNavigate,
}: {
  node: any;
  nodes: any[];
  onNavigate: (nodeId: string) => void;
}) => {
  const [simulatorMode, setSimulatorMode] = useState(false);

  const handleButtonClick = (option: any) => {
    if (!simulatorMode || !option.next_node) return;

    const targetNode = nodes.find((n) => n.data.node_key === option.next_node);
    if (targetNode) {
      onNavigate(targetNode.id);
      toast.success(`Navegando para: ${targetNode.data.title}`);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-black flex items-center text-slate-500 uppercase tracking-widest bg-slate-200/50 rounded-md px-3 py-1.5">
          <Smartphone className="w-4 h-4 mr-2" /> WhatsApp Preview
        </label>
        <Button
          size="sm"
          variant={simulatorMode ? "default" : "outline"}
          onClick={() => setSimulatorMode(!simulatorMode)}
          className="text-xs h-7"
        >
          <Navigation className="w-3 h-3 mr-1.5" />
          {simulatorMode ? "Modo Ativo" : "Ativar Simulador"}
        </Button>
      </div>

      <div className="w-full max-w-[280px] mx-auto bg-[#efeae2] rounded-[32px] overflow-hidden border-[8px] border-slate-800 shadow-2xl relative">
        {simulatorMode && (
          <div className="absolute top-2 right-2 z-10 bg-green-500 text-white text-[8px] font-black px-2 py-1 rounded-full animate-pulse">
            SIMULADOR ATIVO
          </div>
        )}

        {/* Top Bar */}
        <div className="bg-[#075e54] p-3 pt-6 flex items-center gap-2 text-white">
          <div className="w-8 h-8 rounded-full bg-slate-200/20 flex items-center justify-center">
            <Smartphone className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold">Superação Assessoria</span>
            <span className="text-[8px] opacity-70">online</span>
          </div>
        </div>

        {/* Chat Content */}
        <div className="p-3 space-y-3 min-h-[300px] flex flex-col">
          {/* Bubble */}
          <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm relative self-start max-w-[90%]">
            <p className="text-[11px] leading-relaxed whitespace-pre-wrap text-slate-800">
              {node.content || "Olá! Como posso ajudar hoje?"}
            </p>
            <div className="flex items-center justify-end gap-1 mt-1">
              <span className="text-[8px] text-slate-400">12:00</span>
              <CheckCircle2 className="w-2.5 h-2.5 text-blue-500" />
            </div>
          </div>

          {/* Buttons (WhatsApp Style) */}
          <div className="space-y-1.5 pt-2">
            {node.options &&
              node.options.map((opt: any, i: number) => (
                <div
                  key={i}
                  className={cn(
                    "bg-white border text-[#00a884] py-2 px-4 rounded-lg flex items-center justify-center text-[10px] font-bold shadow-sm transition-all",
                    simulatorMode && opt.next_node
                      ? "cursor-pointer hover:bg-green-50 hover:scale-105 active:scale-95"
                      : "cursor-default hover:bg-slate-50"
                  )}
                  onClick={() => handleButtonClick(opt)}
                >
                  {opt.label}
                  {simulatorMode && opt.next_node && <ChevronRight className="w-3 h-3 ml-1" />}
                </div>
              ))}
          </div>
        </div>

        {/* Bottom Input bar */}
        <div className="bg-[#f0f2f5] p-2 flex items-center gap-2">
          <div className="bg-white rounded-full flex-1 h-8 px-3 flex items-center">
            <span className="text-[9px] text-slate-400">Mensagem...</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#00a884] flex items-center justify-center text-white">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
};

const nodeTypes = {
  botNode: BotNode,
};

export function BotFlowManager() {
  return (
    <ReactFlowProvider>
      <BotFlowManagerContent />
    </ReactFlowProvider>
  );
}

function BotFlowManagerContent() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [nodeToDelete, setNodeToDelete] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [aiArchitectOpen, setAiArchitectOpen] = useState(false);
  const [aiArchitectPrompt, setAiArchitectPrompt] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const { setCenter, screenToFlowPosition, fitView } = useReactFlow();

  // -- AI Micro Chat State --
  const [aiMicroChatOpen, setAiMicroChatOpen] = useState(false);
  const [aiChatPrompt, setAiChatPrompt] = useState("");
  const [aiGenerateFlow, setAiGenerateFlow] = useState(false);

  const handleAIChatSubmit = async () => {
    if (!selectedNode || !aiChatPrompt.trim()) return;

    setAiLoading(true);
    try {
      const action = aiGenerateFlow ? "generate-flow" : "command";

      let promptText = aiChatPrompt;
      if (aiGenerateFlow && selectedNode) {
        promptText += `\n\n[CONTEXTO DO NÓ PAI]
            Conteúdo: "${selectedNode.content}"
            Opções Disponíveis: ${selectedNode.options ? selectedNode.options.map((o: any, i: number) => `Index ${i}: "${o.label}"`).join("; ") : "Nenhuma"}
            ID: ${selectedNode.id}
            `;
      }

      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: { action, text: promptText },
      });

      if (error) throw error;

      if (data.error) throw new Error(data.error);
      if (!data.result) throw new Error("A IA não retornou resultado.");

      if (aiGenerateFlow) {
        // Process generated flow
        try {
          const parsed = JSON.parse(data.result);
          // Handle both array (legacy) and object wrapping
          const steps = Array.isArray(parsed) ? parsed : parsed.steps;
          const targetOptionIdx = Array.isArray(parsed)
            ? null
            : parsed.targetOptionIndex !== undefined
              ? parsed.targetOptionIndex
              : null;

          if (!Array.isArray(steps)) throw new Error("Formato de fluxo inválido.");

          let newNodes: Node[] = [];
          let newEdges: Edge[] = [];
          let currentY = selectedNode.position.y + 250;
          // Offset X lightly if branching from an option
          let currentX =
            selectedNode.position.x + (targetOptionIdx !== null ? targetOptionIdx * 100 : 0);

          // Create nodes for each step
          steps.forEach((step: any, index: number) => {
            // Unique ID
            const nodeId = `node-${Date.now()}-${index}`;

            const newNode: Node = {
              id: nodeId,
              type: "botNode",
              position: { x: selectedNode.position.x, y: currentY },
              data: {
                label: step.label || `Passo ${index + 1}`,
                title: step.label || `Passo ${index + 1}`,
                content: step.content,
                options: step.options
                  ? step.options.map((opt: string) => ({ label: opt, next_node: null }))
                  : [],
                category: "padrao",
                node_key: step.id || nodeId,
                onDelete: (d: any) => confirmDeleteNode(d),
                onAiAssist: (d: any) => handleAiOpen(d),
              },
            };

            newNodes.push(newNode);

            // Connect previous node to this one
            // If it's the first new node, connect to the selectedNode
            // However, we need to know WHICH option of the selectedNode connects to this.
            // For simplicity, if we are "extending" a node, we might be replacing its content OR adding a child.
            // Let's assume we are appending to the flow.

            // Actually, the user asked to create a flow FROM a node.
            // So we should probably just create the nodes and let the user link them,
            // OR link them sequentially among themselves.

            if (index > 0) {
              const sourceId = newNodes[index - 1].id;
              newEdges.push({
                id: `e-${sourceId}-${nodeId}`,
                source: sourceId,
                target: nodeId,
                type: "smoothstep",
                animated: true,
                style: { stroke: "#6366f1", strokeWidth: 2 },
              });
            } else {
              // First node: Connect from Selected Node
              const edgeId = `e-${selectedNode.id}-${nodeId}`;
              const newEdge: Edge = {
                id: edgeId,
                source: selectedNode.id,
                target: nodeId,
                type: "smoothstep",
                animated: true,
                style: { stroke: "#6366f1", strokeWidth: 2 },
              };

              if (targetOptionIdx !== null && targetOptionIdx !== undefined) {
                newEdge.sourceHandle = `opt-${targetOptionIdx}`;

                // Also update the selected node data in React Flow state to reflect this link?
                // This is tricky because selectedNode is a local copy. We need to update the actual node in 'nodes'.
                // We will do this via setNodes below.
              }

              newEdges.push(newEdge);
            }

            // Increment position
            currentY += 250;
          });

          // Update nodes state
          setNodes((nds) => {
            // If we attached to a specific option, we must update the parent node's option to point to the new text ID (node_key)
            // Wait, the edge is visual. The logic uses 'next_node' in options.
            // We must update the parent node's option.next_node value.

            let updatedNodes = [...nds];

            if (targetOptionIdx !== null && typeof targetOptionIdx === "number") {
              updatedNodes = updatedNodes.map((n) => {
                if (n.id === selectedNode.id) {
                  const newOptions = [...(n.data.options || [])];
                  if (newOptions[targetOptionIdx]) {
                    newOptions[targetOptionIdx] = {
                      ...newOptions[targetOptionIdx],
                      next_node: newNodes[0].data.node_key, // Point to the KEY of the first new node
                    };
                  }
                  return { ...n, data: { ...n.data, options: newOptions } };
                }
                return n;
              });
            }

            return [...updatedNodes, ...newNodes];
          });

          setEdges((eds) => [...eds, ...newEdges]);
          toast.success(`${newNodes.length} novos passos criados!`);
        } catch (jsonErr) {
          console.error("JSON Parse Error:", jsonErr);
          toast.error("Erro ao processar o fluxo gerado pela IA.");
        }
      } else {
        // Standard single text generation
        setSelectedNode({ ...selectedNode, content: data.result });
        toast.success("Texto gerado com sucesso!");
      }

      setAiMicroChatOpen(false);
      setAiChatPrompt("");
      setAiGenerateFlow(false);
    } catch (err: any) {
      console.error("ERRO COMPLETO IA:", err);
      const errorMsg =
        err?.message || (typeof err === "object" ? JSON.stringify(err) : String(err));
      toast.error(`Erro na IA: ${errorMsg}`, {
        duration: 10000,
        action: {
          label: "Copiar Erro",
          onClick: () => navigator.clipboard.writeText(errorMsg),
        },
      });
    } finally {
      setAiLoading(false);
    }
  };

  // --- Funções de Gerenciamento de Estado e Fluxo ---

  const handleAiOpen = useCallback((nodeData: any) => {
    setSelectedNode(nodeData);
    setAiMicroChatOpen(true);
    setAiGenerateFlow(false);
  }, []);

  // Usamos function para hoisting e evitar erros de inicialização (circular dependecy)
  async function fetchFlow() {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("bot_flow_nodes")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        toast.error("Erro ao carregar fluxo");
        return;
      }

      if (data) {
        const formattedNodes: Node[] = data.map((node: any) => ({
          id: node.id.toString(),
          type: "botNode",
          position: { x: node.position_x || 0, y: node.position_y || 0 },
          data: {
            id: node.id,
            node_key: node.node_key,
            title: node.title,
            content: node.content,
            options: node.options,
            category: (node as any).category || "padrao",
            onDelete: (d: any) => confirmDeleteNode(d),
            onAiAssist: (d: any) => handleAiOpen(d),
          },
        }));

        const formattedEdges: Edge[] = [];
        data.forEach((node: any) => {
          if (node.options && Array.isArray(node.options)) {
            node.options.forEach((opt: any, index: number) => {
              if (opt.next_node) {
                const targetNode = data.find((n: any) => n.node_key === opt.next_node);
                if (targetNode) {
                  formattedEdges.push({
                    id: `e-${node.id}-${targetNode.id}-${index}`,
                    source: node.id.toString(),
                    sourceHandle: `opt-${index}`,
                    target: targetNode.id.toString(),
                    type: "smoothstep",
                    interactionWidth: 20,
                    label: opt.label,
                    labelStyle: { fill: "#6b3d16", fontWeight: 900, fontSize: 10 },
                    labelBgStyle: { fill: "#fff", fillOpacity: 0.9, rx: 6, ry: 6 },
                    labelBgPadding: [6, 4],
                  } as any);

                  const mockClicks = Math.floor(Math.random() * 100);
                  if (mockClicks > 0) {
                    formattedEdges[formattedEdges.length - 1].data = { clicks: mockClicks };
                    formattedEdges[formattedEdges.length - 1].label =
                      `${opt.label} [${mockClicks} 📈]`;
                  }
                }
              }
            });
          }
        });

        setNodes(formattedNodes);
        setEdges(formattedEdges);
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro inesperado ao carregar fluxo");
    } finally {
      setLoading(false);
    }
  }

  const handleDeleteNode = async (targetOverride?: any) => {
    const targetNode = targetOverride || nodeToDelete || selectedNode;
    if (!targetNode) return;

    try {
      const nodeInFlow = nodes.find(
        (n) =>
          (targetNode.id && n.data?.id === targetNode.id) ||
          (targetNode.node_key && n.data?.node_key === targetNode.node_key)
      );

      const reactFlowId = nodeInFlow ? nodeInFlow.id : targetNode.id ? String(targetNode.id) : null;
      const databaseId = targetNode.id;

      if (!reactFlowId) {
        if (selectedNode?.id === targetNode.id) setSelectedNode(null);
        await fetchFlow();
        return;
      }

      setNodeToDelete(null);
      if (selectedNode?.id === targetNode.id) setSelectedNode(null);

      setNodes((nds) => nds.filter((n) => n.id !== reactFlowId));
      setEdges((eds) => eds.filter((e) => e.source !== reactFlowId && e.target !== reactFlowId));

      if (databaseId) {
        const { error } = await (supabase as any)
          .from("bot_flow_nodes")
          .delete()
          .eq("id", databaseId);

        if (error) {
          toast.error("Erro ao sincronizar com o banco.");
          await fetchFlow();
        } else {
          toast.success("Passo excluído!");
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error("Erro ao processar exclusão.");
    }
  };

  const confirmDeleteNode = (nodeData: any) => {
    console.log("confirmDeleteNode triggered for:", nodeData);
    if (
      window.confirm(
        `Deseja realmente excluir o passo "${nodeData.title || nodeData.node_key}"?\n\nEsta ação é permanente.`
      )
    ) {
      handleDeleteNode(nodeData);
    }
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (!term) {
      setNodes((nds) => nds.map((n) => ({ ...n, data: { ...n.data, isSearchResult: false } })));
      return;
    }

    const lowerTerm = term.toLowerCase();
    const foundNodeIds: string[] = [];

    setNodes((nds) =>
      nds.map((n) => {
        const matches =
          (n.data?.title?.toLowerCase() || "").includes(lowerTerm) ||
          (n.data?.node_key?.toLowerCase() || "").includes(lowerTerm) ||
          (n.data?.content?.toLowerCase() || "").includes(lowerTerm);

        if (matches) foundNodeIds.push(n.id);

        return {
          ...n,
          data: { ...n.data, isSearchResult: matches },
        };
      })
    );

    if (foundNodeIds.length > 0) {
      const firstNode = nodes.find((n) => n.id === foundNodeIds[0]);
      if (firstNode) {
        setCenter(firstNode.position.x + 140, firstNode.position.y + 100, {
          zoom: 1.2,
          duration: 800,
        });
      }
    }
  };

  const onLayout = useCallback(() => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: "LR", nodesep: 100, ranksep: 200 });

    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: 300, height: 200 });
    });

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    const newNodes = nodes.map((node) => {
      const nodeWithPosition = dagreGraph.node(node.id);
      return {
        ...node,
        position: {
          x: nodeWithPosition.x - 150,
          y: nodeWithPosition.y - 100,
        },
      };
    });

    setNodes(newNodes);
    toast.success("Layout organizado!");

    // Fit view after layout with a slight delay
    setTimeout(() => {
      fitView({ duration: 800, padding: 0.2 });
    }, 100);
  }, [nodes, edges, setNodes, fitView]);

  useEffect(() => {
    fetchFlow();
  }, []);

  // Sync selectedNode back to the nodes list in real-time
  useEffect(() => {
    if (selectedNode && selectedNode.id) {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === String(selectedNode.id)) {
            return {
              ...node,
              data: {
                ...node.data,
                ...selectedNode,
                // Ensure onDelete is ALWAYS attached, as selectedNode might come from DB without it
                onDelete: confirmDeleteNode,
              },
            };
          }
          return node;
        })
      );
    }
  }, [selectedNode, setNodes, confirmDeleteNode]);

  const handleNavigateToNode = useCallback(
    (nodeId: string) => {
      const targetNode = nodes.find((n) => n.id === nodeId);
      if (targetNode) {
        setSelectedNode(targetNode.data);
        setCenter(targetNode.position.x + 140, targetNode.position.y + 100, {
          zoom: 1.2,
          duration: 800,
        });
      }
    },
    [nodes, setCenter]
  );

  const handleCloseSidebar = useCallback(() => {
    setSelectedNode(null);
    setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
  }, [setNodes]);

  const onNodeDragStop = useCallback(async (event: any, node: any) => {
    // Save position to DB when drag ends
    if (!node.data?.id) return;

    try {
      await (supabase as any)
        .from("bot_flow_nodes")
        .update({
          position_x: Math.round(node.position.x),
          position_y: Math.round(node.position.y),
        })
        .eq("id", node.data.id);
    } catch (err) {
      console.error("Erro ao salvar posição:", err);
    }
  }, []);

  const onPaneClick = useCallback(() => {
    handleCloseSidebar();
  }, [handleCloseSidebar]);

  const onNodeClick = useCallback((e: any, node: any) => {
    // Prevent pane click from firing
    if (e) e.stopPropagation();
    setSelectedNode(node.data);
  }, []);

  const handleUpdateNode = async () => {
    if (!selectedNode) return;

    try {
      const { error } = await (supabase as any)
        .from("bot_flow_nodes")
        .update({
          title: selectedNode.title,
          content: selectedNode.content,
          options: selectedNode.options,
          node_key: selectedNode.node_key,
          category: selectedNode.category || "padrao",
        })
        .eq("id", selectedNode.id);

      if (error) {
        toast.error("Erro ao salvar: " + error.message);
        await fetchFlow();
      } else {
        toast.success("Salvo com sucesso!");
      }
    } catch (e: any) {
      console.error(e);
    }
  };

  const handleCreateNode = async (posX = 100, posY = 100) => {
    const defaultKey = `MENU_${Date.now()}`;
    const tempId = `temp-${Date.now()}`;

    // 1. Optimistic Update
    const newNodeObj: Node = {
      id: tempId,
      type: "botNode",
      position: { x: posX, y: posY },
      data: {
        id: null,
        node_key: defaultKey,
        title: "Novo Passo",
        content: "Olá! Como posso ajudar hoje?",
        options: [],
        category: "padrao",
        onDelete: confirmDeleteNode,
        onAiAssist: handleAiOpen,
      },
    };

    setNodes((nds) => [...nds, newNodeObj]);
    toast.success("Criando novo nó...");

    try {
      const { data, error } = await (supabase as any)
        .from("bot_flow_nodes")
        .insert({
          node_key: defaultKey,
          title: "Novo Passo",
          content: "Olá! Como posso ajudar hoje?",
          position_x: posX,
          position_y: posY,
          options: [],
        })
        .select()
        .single();

      if (error) {
        toast.error("Erro ao salvar no banco: " + error.message);
        setNodes((nds) => nds.filter((n) => n.id !== tempId));
      } else if (data) {
        // Update the temporary node with real database ID
        setNodes((nds) =>
          nds.map((n) =>
            n.id === tempId
              ? {
                  ...n,
                  id: data.id.toString(),
                  data: { ...n.data, id: data.id },
                }
              : n
          )
        );
        setSelectedNode(data);
        toast.success("Nó salvo com sucesso!");
      }
    } catch (err: any) {
      console.error(err);
      setNodes((nds) => nds.filter((n) => n.id !== tempId));
    }
  };

  const handleDuplicateNode = async () => {
    if (!selectedNode) return;

    const { data, error } = await (supabase as any)
      .from("bot_flow_nodes")
      .insert({
        node_key: `${selectedNode.node_key}_COPIA_${Date.now()}`,
        title: `${selectedNode.title} (Cópia)`,
        content: selectedNode.content,
        options: selectedNode.options,
        category: selectedNode.category || "padrao",
        position_x: (nodes.find((n) => n.id === selectedNode.id.toString())?.position.x || 0) + 250,
        position_y: nodes.find((n) => n.id === selectedNode.id.toString())?.position.y || 100,
      })
      .select()
      .single();

    if (error) {
      toast.error("Erro ao duplicar nó");
    } else {
      toast.success("Nó duplicado!");
      await fetchFlow();
      if (data) setSelectedNode(data);
    }
  };

  const onNodesDelete = useCallback(
    async (deletedNodes: Node[]) => {
      try {
        const idsToDelete = deletedNodes
          .map((n) => n.data?.id)
          .filter((id) => id !== null && id !== undefined);

        if (idsToDelete.length === 0) return;

        console.log("Deletando via Backspace/Delete key:", idsToDelete);

        // Visual nodes are already removed by React Flow at this point

        const { error } = await (supabase as any)
          .from("bot_flow_nodes")
          .delete()
          .in("id", idsToDelete);

        if (error) {
          console.error("Erro ao deletar nós (backspace):", error);
          toast.error("Erro ao sincronizar exclusão no banco");
          await fetchFlow();
        } else {
          // Se o nó selecionado foi deletado, limpa a seleção
          if (selectedNode && idsToDelete.includes(selectedNode.id)) {
            setSelectedNode(null);
          }
          toast.success("Nós removidos!");
        }
      } catch (err) {
        console.error("Delete sync error:", err);
      }
    },
    [selectedNode, fetchFlow]
  );

  const onConnect: OnConnect = useCallback(
    async (params) => {
      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);

      if (!sourceNode || !targetNode) return;

      const handleId = params.sourceHandle;
      if (!handleId?.startsWith("opt-")) {
        toast.error("Para conectar, arraste a partir de uma opção específica");
        return;
      }

      const optIndex = parseInt(handleId.replace("opt-", ""));
      const newOptions = [...(sourceNode.data.options || [])];

      if (newOptions[optIndex]) {
        newOptions[optIndex].next_node = targetNode.data.node_key;

        const { error } = await (supabase as any)
          .from("bot_flow_nodes")
          .update({ options: newOptions })
          .eq("id", sourceNode.data.id);

        if (error) {
          toast.error("Erro ao atualizar conexão");
        } else {
          toast.success(`Conectado a ${targetNode.data.node_key}`);
          fetchFlow();
        }
      }
    },
    [nodes]
  );

  const onConnectEnd = useCallback(
    (event: any, connectionState: any) => {
      if (!connectionState.isValid) {
        const id = `NODE_${Date.now()}`;
        const { clientX, clientY } = "changedTouches" in event ? event.changedTouches[0] : event;
        const position = screenToFlowPosition({
          x: clientX,
          y: clientY,
        });

        handleCreateNode(position.x, position.y).then(() => {
          // Após criar, poderíamos conectar automaticamente, mas handleCreateNode
          // recarrega o fluxo. Seria melhor passar os parâmetros de conexão.
        });
      }
    },
    [screenToFlowPosition]
  );

  const saveLayout = async () => {
    if (nodes.length === 0) return;
    setLoading(true);
    try {
      const updates = nodes.map((node) => ({
        id: node.data.id,
        position_x: Math.round(node.position.x),
        position_y: Math.round(node.position.y),
        category: node.data.category || "padrao",
      }));

      const promises = updates.map((u) =>
        (supabase as any)
          .from("bot_flow_nodes")
          .update({
            position_x: u.position_x,
            position_y: u.position_y,
            category: u.category,
          })
          .eq("id", u.id)
      );

      const results = await Promise.all(promises);
      const errors = results.filter((r) => r.error);

      if (errors.length > 0) {
        toast.error(`Erro ao salvar ${errors.length} posições`);
      } else {
        toast.success("Layout salvo com sucesso!");
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro inesperado ao salvar layout");
    } finally {
      setLoading(false);
    }
  };

  const handleAIAction = async (action: "improve" | "spellcheck") => {
    if (!selectedNode || !selectedNode.content) return;

    setAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: { action, text: selectedNode.content },
      });

      if (error) {
        console.error("Erro Invoke:", error);
        throw new Error(error.message || "Erro na função AI");
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data?.result) {
        throw new Error("A IA retornou uma resposta vazia. Detalhes: " + JSON.stringify(data));
      }

      setSelectedNode({ ...selectedNode, content: data.result });
      toast.success(
        action === "improve" ? "Mensagem melhorada com Gemini!" : "Texto revisado com sucesso!"
      );
    } catch (e: any) {
      console.error(e);
      toast.error(`Erro no Gemini: ${e.message || "Falha na comunicação"}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiArchitect = async () => {
    if (!aiArchitectPrompt.trim()) {
      toast.error("Digite uma descrição do fluxo que deseja criar");
      return;
    }

    setAiLoading(true);
    try {
      const systemPrompt = `Você é um arquiteto de fluxos conversacionais para WhatsApp. Crie um fluxo de conversa estruturado baseado na solicitação do usuário.

Retorne APENAS um JSON válido no seguinte formato:
{
  "nodes": [
    {
      "node_key": "START",
      "title": "Início",
      "content": "Mensagem inicial",
      "options": [
        {"label": "Opção 1", "next_node": "NODE_2"},
        {"label": "Opção 2", "next_node": "NODE_3"}
      ],
      "category": "padrao"
    }
  ]
}

Regras:
- Sempre comece com node_key "START"
- Use node_keys descritivos em MAIÚSCULAS (ex: VENDA_PLANO, SUPORTE_DUVIDA)
- Categorias disponíveis: padrao, venda, suporte, conteudo, pagamento
- Crie entre 3-7 nós para um fluxo completo
- Mensagens devem ser naturais e conversacionais
- Sempre ofereça opções claras ao usuário`;

      const { data, error } = await (supabase as any).functions.invoke("gemini-text", {
        body: {
          prompt: `${systemPrompt}\n\nSolicitação do usuário: ${aiArchitectPrompt}`,
          temperature: 0.7,
        },
      });

      if (error) {
        console.error("Gemini API Error:", error);
        throw new Error(error.message || "Erro na chamada da API");
      }

      if (!data) {
        throw new Error("Resposta vazia da API");
      }

      console.log("Gemini Response:", data);

      if (!data.result) {
        throw new Error("Campo 'result' não encontrado na resposta");
      }

      // Parse the JSON response
      let flowData;
      try {
        const cleanedResult = data.result.replace(/```json\n?|```/g, "").trim();
        flowData = JSON.parse(cleanedResult);
      } catch (parseError: any) {
        console.error("JSON Parse Error:", parseError);
        console.error("Raw result:", data.result);
        throw new Error(`Erro ao processar JSON: ${parseError.message}`);
      }

      if (!flowData.nodes || !Array.isArray(flowData.nodes)) {
        throw new Error("Formato de resposta inválido - 'nodes' não é um array");
      }

      if (flowData.nodes.length === 0) {
        throw new Error("Nenhum nó foi gerado pela IA");
      }

      // Create nodes in database
      const createdNodes = [];
      for (let i = 0; i < flowData.nodes.length; i++) {
        const nodeData = flowData.nodes[i];
        const { data: newNode, error: createError } = await (supabase as any)
          .from("bot_flow_nodes")
          .insert({
            node_key: nodeData.node_key,
            title: nodeData.title,
            content: nodeData.content,
            options: nodeData.options || [],
            category: nodeData.category || "padrao",
            position_x: 100 + i * 350,
            position_y: 100 + Math.floor(i / 3) * 250,
          })
          .select()
          .single();

        if (createError) {
          console.error(`Error creating node ${i}:`, createError);
          throw new Error(`Erro ao criar nó ${nodeData.title}: ${createError.message}`);
        }
        createdNodes.push(newNode);
      }

      toast.success(`🎉 Fluxo criado! ${createdNodes.length} nós gerados pela IA`);
      setAiArchitectOpen(false);
      setAiArchitectPrompt("");
      await fetchFlow();

      // Auto-organize the new flow
      setTimeout(() => onLayout(), 500);
    } catch (e: any) {
      console.error("AI Architect Error:", e);
      toast.error(`Erro no Arquiteto AI: ${e.message || "Falha na geração"}`);
    } finally {
      setAiLoading(false);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    // Force a small resize trigger to React Flow
    setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
      fitView({ duration: 400 });
    }, 100);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "border rounded-xl bg-background relative flex flex-col md:flex-row transition-all duration-500 shadow-2xl ring-1 ring-border",
        isFullscreen ? "fixed inset-0 z-[9999] rounded-none h-screen w-screen" : "h-[800px] w-full"
      )}
    >
      <div className="flex-1 relative h-[500px] md:h-full overflow-hidden bg-slate-50/50">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onNodeDragStop={onNodeDragStop}
          onPaneClick={onPaneClick}
          onConnect={onConnect}
          onNodesDelete={onNodesDelete}
          onConnectEnd={onConnectEnd}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.5 }}
          defaultEdgeOptions={
            {
              type: "smoothstep",
              animated: true,
              style: { strokeWidth: 4, stroke: "#f97316" },
              markerEnd: { type: MarkerType.ArrowClosed, color: "#f97316" },
              pathOptions: { borderRadius: 20 },
            } as any
          }
        >
          <Background color="#94a3b8" gap={25} size={1} />
          <Controls />
          <MiniMap
            nodeColor="#f97316"
            maskColor="rgba(0,0,0,0.05)"
            style={{ borderRadius: "12px", border: "1px solid #e2e8f0", bottom: 20, right: 20 }}
            zoomable
            pannable
          />
          <Panel
            position="bottom-left"
            className="bg-white/90 p-2 rounded-lg border shadow-lg backdrop-blur-sm m-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"
          >
            <TrendingUp className="w-3 h-3 text-orange-500" /> Clicks Ativos (Últimas 24h)
          </Panel>
          <Panel position="top-right" className="m-2 md:m-4 flex flex-col gap-2 items-end">
            <div className="flex flex-wrap gap-2 bg-white/95 p-1.5 md:p-2 rounded-2xl border-2 shadow-2xl backdrop-blur-md items-center justify-end max-w-[90vw]">
              <div className="relative group/search flex-1 min-w-[120px] md:min-w-[180px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/search:text-primary transition-colors" />
                <Input
                  placeholder="Buscar..."
                  className="h-9 w-full md:w-48 pl-10 bg-white border-2 border-slate-200 focus:border-primary rounded-xl text-xs transition-all shadow-inner"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>

              <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block" />

              <Button
                size="sm"
                onClick={() => setAiArchitectOpen(true)}
                variant="outline"
                className="shadow-sm border-purple-200 bg-purple-50/50 hover:bg-purple-100 text-purple-700 font-bold rounded-xl h-9 px-3 transition-all"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Arquiteto AI</span>
                <span className="sm:hidden text-[10px]">AI</span>
              </Button>

              <Button
                size="sm"
                onClick={onLayout}
                variant="outline"
                className="shadow-sm border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 text-indigo-700 rounded-xl h-9 px-3 font-bold transition-all"
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Organizar</span>
                <span className="sm:hidden text-[10px]">Layout</span>
              </Button>

              <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block" />

              <Button
                size="sm"
                onClick={() => handleCreateNode()}
                className="shadow-xl bg-emerald-600 hover:bg-emerald-700 transition-all hover:scale-105 active:scale-95 h-9 rounded-xl px-4 font-black text-white ring-2 ring-emerald-50"
              >
                <Plus className="w-4 h-4 mr-1 md:mr-2" />
                <span>Novo Nó</span>
              </Button>

              <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 rounded-lg hover:bg-white shadow-sm"
                  onClick={toggleFullscreen}
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 rounded-lg hover:bg-white shadow-sm"
                  onClick={fetchFlow}
                  disabled={loading}
                >
                  <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 rounded-lg hover:bg-white shadow-sm text-primary hover:text-primary"
                  onClick={saveLayout}
                  disabled={loading}
                >
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <Badge
                variant="outline"
                className="bg-white/80 backdrop-blur-sm shadow-sm text-[9px] uppercase font-black tracking-widest text-slate-500 py-1 px-3 border-2 rounded-full border-slate-200"
              >
                {nodes.length} Passos
              </Badge>
              <Badge
                variant="outline"
                className="bg-white/80 backdrop-blur-sm shadow-sm text-[9px] uppercase font-black tracking-widest text-slate-500 py-1 px-3 border-2 rounded-full border-slate-200"
              >
                {edges.length} Conexões
              </Badge>
            </div>
          </Panel>
          <Panel position="bottom-center" className="mb-4">
            <div className="flex flex-col gap-1.5 pointer-events-none">
              <Badge
                variant="secondary"
                className="bg-white/90 backdrop-blur-md text-primary border-primary/20 shadow-xl py-2 px-6 animate-in fade-in slide-in-from-bottom-4 duration-700 rounded-full border-2"
              >
                <Info className="w-3.5 h-3.5 mr-2 text-primary" /> Arraste os pontos laranjas para
                conectar os passos
              </Badge>
            </div>
          </Panel>
        </ReactFlow>
      </div>

      {selectedNode && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "border-l bg-card overflow-y-auto animate-in slide-in-from-right duration-300 relative pointer-events-auto",
            isFullscreen
              ? "fixed right-0 top-0 bottom-0 z-[10000] w-full md:w-[450px] shadow-[-20px_0_60px_rgba(0,0,0,0.3)]"
              : "z-50 w-full md:w-96 max-h-[600px] md:max-h-full border-l-2 shadow-xl"
          )}
        >
          <div className="sticky top-0 bg-card/95 backdrop-blur-md z-[101] px-6 py-5 border-b flex items-center justify-between shadow-sm">
            <div className="flex flex-col gap-1.5 flex-1 pr-4">
              <h3 className="font-extrabold flex items-center gap-3 text-xl tracking-tight text-slate-800">
                <div className="bg-primary p-2 rounded-xl text-white shadow-lg shadow-primary/20">
                  <MessageSquare className="w-5 h-5" />
                </div>
                {selectedNode.title || "Editar Passo"}
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground uppercase font-black font-mono bg-slate-100 px-2 py-0.5 rounded tracking-tighter">
                  KEY: {selectedNode.node_key}
                </span>
                <button
                  type="button"
                  className="text-[9px] font-bold text-primary hover:underline flex items-center gap-1 bg-primary/5 px-2 py-0.5 rounded-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDuplicateNode();
                  }}
                >
                  <Copy className="w-2.5 h-2.5" /> Clonar
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                handleCloseSidebar();
              }}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-100 hover:bg-red-500 hover:text-white text-slate-500 transition-all active:scale-90 shadow-sm border border-slate-200"
              title="Fechar Painel"
              style={{ cursor: "pointer", pointerEvents: "auto" }}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="px-6 py-6 space-y-8 pb-32">
            <div>
              <label className="text-[11px] font-black mb-2 flex items-center text-slate-500 uppercase tracking-widest bg-slate-100 rounded-md px-2 py-1 w-fit">
                Chave de Sistema
              </label>
              <div className="space-y-3">
                <Input
                  value={selectedNode.node_key}
                  className="font-mono text-xs bg-slate-50 border-2 border-slate-200 focus:border-primary transition-all h-10"
                  onChange={(e) =>
                    setSelectedNode({
                      ...selectedNode,
                      node_key: e.target.value.toUpperCase().replace(/\s/g, "_"),
                    })
                  }
                  placeholder="EX: PLANO_INFOS"
                />
                <Button
                  type="button"
                  size="sm"
                  className={cn(
                    "w-full h-8 text-[10px] font-black border-2 gap-2 rounded-lg transition-all",
                    selectedNode.node_key === "START"
                      ? "bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600 shadow-md shadow-emerald-100"
                      : "bg-white text-emerald-600 border-emerald-100 hover:bg-emerald-50 hover:border-emerald-200"
                  )}
                  onClick={() => setSelectedNode({ ...selectedNode, node_key: "START" })}
                >
                  <PlayCircle className="w-3.5 h-3.5" />
                  {selectedNode.node_key === "START"
                    ? "MENSAGEM INICIAL DO BOT"
                    : "TORNAR MENSAGEM INICIAL"}
                </Button>
                <p className="text-[9px] text-amber-600 flex items-center gap-1 font-medium bg-amber-50 p-2 rounded-lg border border-amber-100">
                  <Info className="w-3 h-3 shrink-0" /> Chave única para o bot disparar esta
                  mensagem.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[11px] font-black mb-2 flex items-center text-slate-500 uppercase tracking-widest bg-slate-100 rounded-md px-2 py-1 w-fit">
                Categoria / Intenção
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "padrao", label: "Padrão", color: "bg-slate-400" },
                  { id: "venda", label: "Venda", color: "bg-amber-400" },
                  { id: "suporte", label: "Suporte", color: "bg-blue-400" },
                  { id: "conteudo", label: "Conteúdo", color: "bg-purple-400" },
                  { id: "pagamento", label: "Checkout", color: "bg-emerald-400" },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedNode({ ...selectedNode, category: cat.id })}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-[10px] font-bold transition-all",
                      selectedNode.category === cat.id
                        ? "border-primary bg-primary/5 shadow-inner"
                        : "border-slate-100 hover:border-slate-300 bg-slate-50"
                    )}
                  >
                    <div className={cn("w-2 h-2 rounded-full", cat.color)} />
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[11px] font-black mb-2 flex items-center text-slate-500 uppercase tracking-widest bg-slate-100 rounded-md px-2 py-1 w-fit">
                Título do Passo
              </label>
              <Input
                value={selectedNode.title}
                className="h-10 text-sm font-semibold border-2 focus:ring-0"
                onChange={(e) => setSelectedNode({ ...selectedNode, title: e.target.value })}
                placeholder="Ex: Confirmação de Horário"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-black flex items-center text-slate-500 uppercase tracking-widest bg-slate-100 rounded-md px-2 py-1 w-fit">
                  Texto da Mensagem
                </label>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-[11px] gap-1.5 px-3 border-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all font-bold"
                    onClick={() => handleAIAction("spellcheck")}
                    disabled={aiLoading}
                  >
                    {aiLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <SpellCheck className="w-3.5 h-3.5 text-blue-500" />
                    )}
                    Polir Texto
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 text-[11px] gap-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100 font-bold"
                    onClick={() => {
                      console.log("Abrindo chat IA");
                      setAiChatPrompt(selectedNode.content || "");
                      setAiMicroChatOpen(true);
                    }}
                    disabled={aiLoading}
                  >
                    {aiLoading ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    Criar com IA
                  </Button>
                </div>
              </div>
              <Textarea
                value={selectedNode.content}
                rows={isFullscreen ? 18 : 10}
                spellCheck={true}
                onChange={(e) => setSelectedNode({ ...selectedNode, content: e.target.value })}
                placeholder="Escreva como o bot deve falar..."
                className="resize-none shadow-sm border-2 focus:border-indigo-400 text-sm leading-relaxed p-4 rounded-xl bg-indigo-50/20"
              />
              <div className="flex flex-wrap gap-1.5 mt-3">
                <span className="text-[10px] font-bold text-muted-foreground mr-1 uppercase py-1">
                  Tags:
                </span>
                {[
                  { l: "{name}", t: "Nome do Aluno" },
                  { l: "{goal}", t: "Objetivo" },
                  { l: "{day}", t: "Dia" },
                  { l: "{time}", t: "Hora" },
                ].map((v) => (
                  <Badge
                    key={v.l}
                    variant="outline"
                    className="text-[10px] cursor-pointer hover:bg-primary hover:text-white hover:border-primary transition-all py-1 px-2 border-slate-300 bg-white"
                    onClick={() =>
                      setSelectedNode({ ...selectedNode, content: selectedNode.content + v.l })
                    }
                  >
                    {v.l}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-100 p-2 rounded-xl">
                <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">
                  Opções e Botões
                </label>
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 text-[10px] px-3 font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 shadow-sm"
                  onClick={() => {
                    const newOpts = [...(selectedNode.options || [])];
                    newOpts.push({ label: "Escolha uma opção", next_node: "" });
                    setSelectedNode({ ...selectedNode, options: newOpts });
                  }}
                >
                  <Plus className="w-3 h-3 mr-1.5" /> Adicionar
                </Button>
              </div>

              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-3 custom-scrollbar p-1">
                {selectedNode.options?.map((opt: any, i: number) => (
                  <Card
                    key={i}
                    className="border-2 border-slate-100 hover:border-primary/20 transition-all shadow-none rounded-xl overflow-hidden bg-white group/opt-card"
                  >
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-full bg-slate-100 text-[10px] flex items-center justify-center font-bold text-slate-500 shrink-0 border border-slate-200">
                          {i + 1}
                        </div>
                        <Input
                          value={opt.label}
                          className="h-9 text-xs flex-1 font-bold border-slate-200 focus:border-primary"
                          placeholder="O que o usuário vai clicar/digitar?"
                          onChange={(e) => {
                            const newOpts = [...selectedNode.options];
                            newOpts[i].label = e.target.value;
                            setSelectedNode({ ...selectedNode, options: newOpts });
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-all rounded-lg"
                          onClick={() => {
                            const newOpts = selectedNode.options.filter(
                              (_: any, idx: number) => idx !== i
                            );
                            setSelectedNode({ ...selectedNode, options: newOpts });
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex flex-col gap-1.5 pl-9">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                          <ChevronRight className="w-3 h-3 text-primary" /> Próximo Passo
                        </div>
                        <select
                          title="Selecione o próximo passo"
                          className="flex h-9 w-full rounded-lg border-2 border-slate-100 bg-slate-50 px-3 py-1 text-[11px] font-bold ring-offset-background outline-none transition-all focus:border-primary cursor-pointer"
                          value={opt.next_node}
                          onChange={(e) => {
                            const newOpts = [...selectedNode.options];
                            newOpts[i].next_node = e.target.value;
                            setSelectedNode({ ...selectedNode, options: newOpts });
                          }}
                        >
                          <option value="">⏹️ FIM DO FLUXO (Esperar Admin)</option>
                          {nodes
                            .filter((n) => n.id !== String(selectedNode.id))
                            .map((n) => (
                              <option key={n.id} value={n.data.node_key}>
                                👉 {n.data.node_key} - {n.data.title}
                              </option>
                            ))}
                        </select>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(!selectedNode.options || selectedNode.options.length === 0) && (
                  <div className="text-[10px] text-center text-muted-foreground py-10 border-dashed border-2 rounded-2xl bg-muted/20 flex flex-col items-center gap-2">
                    <MessageSquare className="w-6 h-6 opacity-20" />
                    <span>Sem botões. O usuário enviará texto livre.</span>
                  </div>
                )}
              </div>
              <div className="bg-slate-50 md:bg-white rounded-[40px] p-2 md:p-8 space-y-4 shadow-inner border">
                <WhatsAppPreview
                  node={selectedNode}
                  nodes={nodes}
                  onNavigate={handleNavigateToNode}
                />
              </div>
            </div>

            <div className="pt-8 sticky bottom-0 bg-card/95 backdrop-blur-md border-t-2 space-y-4 pb-4 z-20">
              <Button
                className="w-full h-14 font-black shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all text-lg rounded-2xl"
                onClick={handleUpdateNode}
                disabled={aiLoading || loading}
              >
                <Save className="w-5 h-5 mr-3" />
                SALVAR PASSO
              </Button>

              <div className="flex gap-3">
                <button
                  type="button"
                  className="flex-1 h-12 text-red-600 hover:bg-red-50 border-2 border-red-100 hover:border-red-200 text-xs font-black rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="w-4 h-4" /> EXCLUIR ESTE PASSO
                </button>

                <button
                  type="button"
                  className="flex-1 h-12 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCloseSidebar();
                  }}
                >
                  FECHAR
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Micro Chat Dialog */}
      <AlertDialog open={aiMicroChatOpen} onOpenChange={setAiMicroChatOpen}>
        <AlertDialogContent className="rounded-2xl border-2 max-w-lg bg-white shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-indigo-700 flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Criar com IA
            </AlertDialogTitle>
            <AlertDialogDescription>
              Gere textos criativos para seus flows automaticamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center justify-between mb-2 absolute top-4 right-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAiMicroChatOpen(false)}
              className="h-8 w-8 p-0 rounded-full"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-4">
            <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 text-xs text-indigo-800">
              <p className="font-bold mb-1">Diga o que você precisa:</p>
              <ul className="list-disc pl-4 space-y-1 opacity-80">
                <li>"Crie uma mensagem de boas-vindas animada"</li>
                <li>"Explique o plano trimestral de forma resumida"</li>
                <li>"Pergunte o nome do aluno e seu objetivo"</li>
              </ul>
            </div>

            <Textarea
              placeholder="Digite seu comando para a IA..."
              value={aiChatPrompt}
              onChange={(e) => setAiChatPrompt(e.target.value)}
              className="min-h-[100px] text-sm border-2 border-indigo-100 focus:border-indigo-400 rounded-xl resize-none p-3"
            />

            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="flow-mode"
                checked={aiGenerateFlow}
                onChange={(e) => setAiGenerateFlow(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <label
                htmlFor="flow-mode"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-slate-700"
              >
                Criar uma sequência de passos (Fluxograma)
              </label>
            </div>
            {aiGenerateFlow && (
              <p className="text-[10px] text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-200">
                ⚠️ A IA criará múltiplos nós conectados abaixo do nó atual.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setAiMicroChatOpen(false)}
              className="rounded-xl font-bold border-2"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAIChatSubmit}
              disabled={aiLoading || !aiChatPrompt.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-6 shadow-lg shadow-indigo-200 transition-all hover:scale-105 active:scale-95"
            >
              {aiLoading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Wand2 className="w-4 h-4 mr-2" />
              )}
              Gerar Texto
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* AI Architect Dialog */}
      <AlertDialog open={aiArchitectOpen} onOpenChange={setAiArchitectOpen}>
        <AlertDialogContent className="rounded-2xl border-2 max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black tracking-tight text-purple-600 flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-xl">
                <Wand2 className="w-6 h-6" />
              </div>
              Arquiteto AI - Crie Fluxos Completos
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-medium space-y-3 pt-4">
              <p>
                Descreva o fluxo conversacional que você deseja criar e a IA vai gerar todos os nós,
                mensagens e conexões automaticamente.
              </p>
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                <p className="text-xs font-bold text-purple-900 mb-2">💡 Exemplos de prompts:</p>
                <ul className="text-xs text-purple-800 space-y-1 list-disc list-inside">
                  <li>"Crie um funil de vendas em 3 passos para o plano trimestral de corrida"</li>
                  <li>"Fluxo de boas-vindas para novos alunos com apresentação do clube"</li>
                  <li>"Suporte para dúvidas sobre treinos e planos de pagamento"</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Ex: Crie um fluxo de vendas para o plano mensal, com apresentação dos benefícios, opção de pagamento e confirmação..."
              value={aiArchitectPrompt}
              onChange={(e) => setAiArchitectPrompt(e.target.value)}
              className="min-h-[120px] text-sm border-2 border-purple-100 focus:border-purple-300 rounded-xl"
            />
          </div>

          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel
              className="font-black rounded-xl border-2 border-slate-200"
              disabled={aiLoading}
            >
              CANCELAR
            </AlertDialogCancel>
            <Button
              onClick={handleAiArchitect}
              disabled={aiLoading || !aiArchitectPrompt.trim()}
              className="bg-purple-600 text-white hover:bg-purple-700 font-extrabold rounded-xl px-8 shadow-lg shadow-purple-200"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  GERANDO...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  CRIAR FLUXO COM IA
                </>
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {loading && !nodes.length && (
        <div className="absolute inset-0 bg-white/90 backdrop-blur-md flex items-center justify-center z-[200]">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="animate-spin rounded-full h-24 w-24 border-b-4 border-primary border-t-4 opacity-50"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin-reverse" />
              </div>
            </div>
            <div className="text-center">
              <span className="text-2xl font-black text-slate-800 tracking-tighter block mb-1">
                BORACORRER
              </span>
              <span className="text-sm font-bold text-primary tracking-widest uppercase animate-pulse">
                Construindo Fluxograma...
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
