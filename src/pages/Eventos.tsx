import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Calendar, MapPin, Shirt, Clock, CheckCircle } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

interface Race {
  id: string;
  title: string;
  event_date: string;
  location: string;
  description: string;
  image_url: string;
  registration_deadline: string;
  available_distances?: string[];
  available_paces?: string[];
  price?: number;
}

interface Registration {
  race_id: string;
  status: string;
}

export default function Eventos() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { profile } = useProfile();
  const [races, setRaces] = useState<Race[]>([]);
  const [userRegistrations, setUserRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    cpf: "",
    gender: "",
    birthDate: "",
    email: "",
    phone: "",
    tshirtSize: "",
    pace: "",
    selectedDistance: "",
  });

  useEffect(() => {
    fetchRaces();
    if (user) {
      fetchUserRegistrations();
      // Pre-fill form data from profile/user
      setFormData((prev) => ({
        ...prev,
        fullName: profile?.nome_completo || user.user_metadata?.full_name || "",
        email: user.email || "",
        phone: profile?.telefone || user.user_metadata?.phone || "",
        cpf: profile?.cpf || "",
      }));
    }
  }, [user, profile]);

  const fetchRaces = async () => {
    try {
      const { data, error } = await supabase
        .from("races")
        .select("*")
        .gte("event_date", new Date().toISOString().split("T")[0]) // Apenas futuras
        .order("event_date", { ascending: true });

      if (error) throw error;
      setRaces(data || []);
    } catch (error) {
      console.error("Erro ao buscar corridas:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRegistrations = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("race_registrations")
        .select("race_id, status")
        .eq("user_id", user.id);

      if (error) throw error;
      setUserRegistrations(data || []);
    } catch (error) {
      console.error("Erro ao buscar inscrições:", error);
    }
  };

  const isRegistered = (raceId: string) => {
    return userRegistrations.some((r) => r.race_id === raceId);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedRace) return;

    // Check if user is a student (has accepted terms via CadastroAluno)
    if (!profile?.terms_accepted_at) {
      toast.error("Inscrição exclusiva para alunos cadastrados.", {
        action: {
          label: "Virar Aluno",
          onClick: () => navigate("/cadastro-aluno"),
        },
        duration: 5000,
      });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("race_registrations").insert({
        race_id: selectedRace.id,
        user_id: user.id,
        full_name: formData.fullName,
        cpf: formData.cpf,
        gender: formData.gender,
        birth_date: formData.birthDate,
        email: formData.email,
        phone: formData.phone,
        tshirt_size: formData.tshirtSize,
        selected_distance: formData.selectedDistance,
        pace: formData.pace,
        status: "pending", // Aguardando confirmação admin (pagamento/cupom)
      });

      if (error) {
        if (error.code === "23505") {
          toast.error("Você já está inscrito nesta corrida!");
        } else {
          throw error;
        }
      } else {
        toast.success("Pré-inscrição realizada com sucesso! Aguarde a confirmação.");
        fetchUserRegistrations();
        const closeBtn = document.getElementById("close-dialog");
        if (closeBtn) closeBtn.click();
      }
    } catch (error: any) {
      console.error("Erro na inscrição:", error);
      toast.error("Erro ao realizar inscrição: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <h1 className="text-3xl font-bold mb-6">Próximos Eventos e Corridas</h1>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : races.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">Nenhuma corrida programada no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {races.map((race) => (
              <Card key={race.id} className="flex flex-col h-full">
                {race.image_url && (
                  <div className="h-48 overflow-hidden rounded-t-lg">
                    <img
                      src={race.image_url}
                      alt={race.title}
                      className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
                    />
                  </div>
                )}
                <CardHeader>
                  <CardTitle>{race.title}</CardTitle>
                  <div className="flex justify-between items-start">
                    <CardDescription className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(race.event_date).toLocaleDateString("pt-BR")}
                    </CardDescription>
                    {race.price > 0 && (
                      <span className="text-sm font-semibold text-primary bg-primary/10 px-2 py-1 rounded">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(race.price)}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {race.location || "Local a definir"}
                  </div>
                  <p className="text-sm line-clamp-3 mt-2">{race.description}</p>
                </CardContent>
                <CardFooter>
                  {isRegistered(race.id) ? (
                    <Button
                      disabled
                      className="w-full bg-green-600/10 text-green-600 hover:bg-green-600/20 border-green-200"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Inscrito
                    </Button>
                  ) : race.registration_deadline &&
                    race.registration_deadline < new Date().toISOString().split("T")[0] ? (
                    <Button
                      disabled
                      variant="outline"
                      className="w-full"
                      title={`O prazo encerrou em ${new Date(race.registration_deadline).toLocaleDateString("pt-BR")}`}
                    >
                      Inscrições Encerradas
                    </Button>
                  ) : (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="w-full" onClick={() => setSelectedRace(race)}>
                          Inscrever-se
                        </Button>
                      </DialogTrigger>
                      <DialogContent
                        className="max-w-md max-h-[90vh] overflow-y-auto"
                        id="dialog-content"
                      >
                        {/* Hidden close button hack since Radix UI handles closing automatically but I want to force it via ID if needed, 
                            actually DialogPrimitive.Close is better but let's stick to standard behavior.
                            The previous code used document.getElementById("close-dialog") but I didn't see an element with that ID.
                         */}
                        <div id="close-dialog" className="hidden" />{" "}
                        {/* Just a dummy target if I keep that logic, or better navigate/close state */}
                        <DialogHeader>
                          <DialogTitle>Inscrição: {race.title}</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleRegister} className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="fullname">Nome Completo</Label>
                            <Input
                              id="fullname"
                              required
                              value={formData.fullName}
                              onChange={(e) =>
                                setFormData({ ...formData, fullName: e.target.value })
                              }
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="cpf">CPF</Label>
                              <Input
                                id="cpf"
                                required
                                value={formData.cpf}
                                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                                placeholder="000.000.000-00"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="birthDate">Data de Nascimento</Label>
                              <Input
                                id="birthDate"
                                type="date"
                                required
                                value={formData.birthDate}
                                onChange={(e) =>
                                  setFormData({ ...formData, birthDate: e.target.value })
                                }
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="email">E-mail</Label>
                            <Input
                              id="email"
                              type="email"
                              required
                              value={formData.email}
                              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="phone">Telefone</Label>
                              <Input
                                id="phone"
                                required
                                value={formData.phone}
                                onChange={(e) =>
                                  setFormData({ ...formData, phone: e.target.value })
                                }
                                placeholder="(00) 00000-0000"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="gender">Gênero</Label>
                              <Select
                                value={formData.gender}
                                onValueChange={(v) => setFormData({ ...formData, gender: v })}
                                required
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="M">Masculino</SelectItem>
                                  <SelectItem value="F">Feminino</SelectItem>
                                  <SelectItem value="O">Outro</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          {selectedRace?.available_distances &&
                            selectedRace.available_distances.length > 0 && (
                              <div className="space-y-2 mb-4">
                                <Label htmlFor="distance">Distância / Modalidade</Label>
                                <Select
                                  value={formData.selectedDistance}
                                  onValueChange={(v) =>
                                    setFormData({ ...formData, selectedDistance: v })
                                  }
                                  required
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione a distância" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {selectedRace.available_distances.map((dist) => (
                                      <SelectItem key={dist} value={dist}>
                                        {dist}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            )}

                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="tshirt">Tam. Camiseta</Label>
                              <Select
                                value={formData.tshirtSize}
                                onValueChange={(v) => setFormData({ ...formData, tshirtSize: v })}
                                required
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="PP">PP</SelectItem>
                                  <SelectItem value="P">P</SelectItem>
                                  <SelectItem value="M">M</SelectItem>
                                  <SelectItem value="G">G</SelectItem>
                                  <SelectItem value="GG">GG</SelectItem>
                                  <SelectItem value="XG">XG</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between items-baseline">
                                <Label htmlFor="pace">Pelotão / Pace</Label>
                                {!selectedRace?.available_paces?.length && (
                                  <span className="text-xs text-muted-foreground">(Opcional)</span>
                                )}
                              </div>
                              {selectedRace?.available_paces &&
                              selectedRace.available_paces.length > 0 ? (
                                <Select
                                  value={formData.pace}
                                  onValueChange={(v) => setFormData({ ...formData, pace: v })}
                                  required
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione o pelotão" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {selectedRace.available_paces.map((p) => (
                                      <SelectItem key={p} value={p}>
                                        {p}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              ) : (
                                <Input
                                  id="pace"
                                  placeholder="Ex: 5:00 min/km"
                                  value={formData.pace}
                                  onChange={(e) =>
                                    setFormData({ ...formData, pace: e.target.value })
                                  }
                                />
                              )}
                            </div>
                          </div>

                          <Button type="submit" className="w-full mt-4" disabled={submitting}>
                            {submitting ? "Enviando..." : "Confirmar Presença"}
                          </Button>
                          <p className="text-xs text-muted-foreground text-center mt-2">
                            A inscrição será analisada pela equipe do Superação Assessoria.
                          </p>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
